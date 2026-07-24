const db = require('../config/db');

// GET /api/student/profile
async function profile(req, res) {
  try {
    const studentId = req.user.id;
    const result = await db.query(
      `SELECT id, name, email, student_code, cgpa, earned_credits, remaining_credits
       FROM users WHERE id = $1 AND role = 'student'`,
      [studentId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Student not found' });

    // Current-term SGPA approximated from this term's course percentages
    // converted to a 4.0 scale (simple linear mapping — swap in your
    // institution's real grading table if it differs).
    const marksResult = await db.query(
      `SELECT m.total_percentage, c.credit_hours
       FROM marks m JOIN courses c ON c.id = m.course_id
       WHERE m.student_id = $1`,
      [studentId]
    );
    let qualityPoints = 0, creditSum = 0;
    marksResult.rows.forEach((r) => {
      const gpa4 = Math.max(0, Math.min(4, (Number(r.total_percentage) / 100) * 4));
      qualityPoints += gpa4 * r.credit_hours;
      creditSum += r.credit_hours;
    });
    const sgpa = creditSum ? Number((qualityPoints / creditSum).toFixed(2)) : 0;

    res.json({ ...result.rows[0], sgpa });
  } catch (err) {
    console.error('profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/student/courses
// Returns all courses with seat availability and whether this student
// is already enrolled.
async function listCourses(req, res) {
  try {
    const studentId = req.user.id;
    const result = await db.query(
      `SELECT c.id, c.course_code, c.title, c.credit_hours, c.seat_limit,
              COUNT(e.student_id)::int AS enrolled_count,
              BOOL_OR(e.student_id = $1) AS is_enrolled
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       GROUP BY c.id
       ORDER BY c.course_code`,
      [studentId]
    );
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('listCourses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/student/enroll  body: { course_id }
async function enroll(req, res) {
  try {
    const studentId = req.user.id;
    const { course_id } = req.body;
    if (!course_id) return res.status(400).json({ error: 'course_id is required' });

    const course = await db.query(
      `SELECT c.seat_limit, COUNT(e.student_id)::int AS enrolled_count
       FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.id = $1 GROUP BY c.id`,
      [course_id]
    );
    if (!course.rows[0]) return res.status(404).json({ error: 'Course not found' });
    if (course.rows[0].enrolled_count >= course.rows[0].seat_limit) {
      return res.status(409).json({ error: 'Course is full' });
    }

    const result = await db.query(
      `INSERT INTO enrollments (student_id, course_id) VALUES ($1,$2)
       ON CONFLICT (student_id, course_id) DO NOTHING
       RETURNING *`,
      [studentId, course_id]
    );
    if (!result.rows[0]) return res.status(409).json({ error: 'Already enrolled' });

    res.status(201).json({ enrollment: result.rows[0] });
  } catch (err) {
    console.error('enroll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/student/attendance/:course_id
// Attendance % for a given course, used for the 75% warning indicator.
async function attendanceForCourse(req, res) {
  try {
    const studentId = req.user.id;
    const { course_id } = req.params;

    // Naive session count: distinct calendar days a device logged
    // attendance for this course. A real deployment would track
    // scheduled sessions separately from ad-hoc scans.
    const totalSessions = await db.query(
      `SELECT COUNT(DISTINCT DATE(scanned_at))::int AS total
       FROM attendance_logs WHERE course_id = $1`,
      [course_id]
    );
    const attended = await db.query(
      `SELECT COUNT(DISTINCT DATE(scanned_at))::int AS attended
       FROM attendance_logs WHERE course_id = $1 AND student_id = $2`,
      [course_id, studentId]
    );

    const total = totalSessions.rows[0].total || 0;
    const present = attended.rows[0].attended || 0;
    const percentage = total ? Number(((present / total) * 100).toFixed(1)) : 100;

    res.json({ course_id: Number(course_id), total_sessions: total, attended: present, percentage, below_threshold: percentage < 75 });
  } catch (err) {
    console.error('attendanceForCourse error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { profile, listCourses, enroll, attendanceForCourse };
