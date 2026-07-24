const db = require('../config/db');

// Weighting used to compute total_percentage from raw component scores.
// Kept in one place so the tier thresholds and totals stay consistent
// across the dashboard, roster, and marks endpoints.
const WEIGHTS = { quiz: 0.10, assignment: 0.10, mid: 0.30, final: 0.50 };
// These assume quiz/assignment out of 10, mid out of 30, final out of 50 —
// i.e. the raw scores already ARE the weighted points. Adjust if your
// grading scale differs.
function computeTotal({ quiz, assignment, mid, final }) {
  return Number(quiz) + Number(assignment) + Number(mid) + Number(final);
}

function tierFor(percentage) {
  if (percentage >= 80) return 'top';
  if (percentage >= 50) return 'mid';
  return 'lower';
}

// GET /api/teacher/dashboard
// Returns enrolled counts, class averages, and tier distribution across
// all courses this teacher owns.
async function dashboard(req, res) {
  try {
    const teacherId = req.user.id;

    const coursesResult = await db.query(
      `SELECT c.id, c.course_code, c.title, c.seat_limit,
              COUNT(e.student_id)::int AS enrolled_count
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.teacher_id = $1
       GROUP BY c.id
       ORDER BY c.course_code`,
      [teacherId]
    );

    const marksResult = await db.query(
      `SELECT m.student_id, m.course_id, m.total_percentage
       FROM marks m
       JOIN courses c ON c.id = m.course_id
       WHERE c.teacher_id = $1`,
      [teacherId]
    );

    const tierCounts = { top: 0, mid: 0, lower: 0 };
    let sum = 0;
    marksResult.rows.forEach((row) => {
      tierCounts[tierFor(Number(row.total_percentage))]++;
      sum += Number(row.total_percentage);
    });
    const classAverage = marksResult.rows.length
      ? Number((sum / marksResult.rows.length).toFixed(2))
      : 0;

    const devicesResult = await db.query(
      `SELECT id, device_key, room_label, course_id, status, last_seen_at
       FROM biometric_devices
       WHERE course_id IN (SELECT id FROM courses WHERE teacher_id = $1)`,
      [teacherId]
    );

    res.json({
      courses: coursesResult.rows,
      total_students: [...new Set(marksResult.rows.map(r => r.student_id))].length,
      class_average: classAverage,
      tier_distribution: tierCounts,
      devices: devicesResult.rows,
    });
  } catch (err) {
    console.error('teacher dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/teacher/roster?course_id=1
// Lists enrolled students + their current marks for a given course.
async function roster(req, res) {
  try {
    const { course_id } = req.query;
    if (!course_id) return res.status(400).json({ error: 'course_id query param required' });

    const result = await db.query(
      `SELECT u.id AS student_id, u.name, u.student_code,
              m.quiz, m.assignment, m.mid, m.final, m.total_percentage
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       LEFT JOIN marks m ON m.student_id = u.id AND m.course_id = e.course_id
       WHERE e.course_id = $1
       ORDER BY u.name`,
      [course_id]
    );

    const roster = result.rows.map((r) => ({
      ...r,
      tier: r.total_percentage != null ? tierFor(Number(r.total_percentage)) : null,
    }));

    res.json({ course_id: Number(course_id), roster });
  } catch (err) {
    console.error('roster error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/teacher/marks
// body: { student_id, course_id, quiz, assignment, mid, final }
// Upserts marks and recomputes total_percentage server-side (never trust
// a client-supplied total).
async function upsertMarks(req, res) {
  try {
    const { student_id, course_id, quiz, assignment, mid, final } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ error: 'student_id and course_id are required' });
    }

    const total_percentage = computeTotal({
      quiz: quiz || 0, assignment: assignment || 0, mid: mid || 0, final: final || 0,
    });

    const result = await db.query(
      `INSERT INTO marks (student_id, course_id, quiz, assignment, mid, final, total_percentage, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_TIMESTAMP)
       ON CONFLICT (student_id, course_id)
       DO UPDATE SET quiz = $3, assignment = $4, mid = $5, final = $6,
                     total_percentage = $7, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [student_id, course_id, quiz || 0, assignment || 0, mid || 0, final || 0, total_percentage]
    );

    res.json({ marks: result.rows[0], tier: tierFor(total_percentage) });
  } catch (err) {
    console.error('upsertMarks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { dashboard, roster, upsertMarks, tierFor, computeTotal, WEIGHTS };
