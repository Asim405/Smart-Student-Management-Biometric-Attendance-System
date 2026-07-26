const db = require('../config/db');

// POST /api/attendance/mark-biometric
// body: { fingerprint_id, device_key }
// Called directly by the ESP32 over HTTP once the AS608 sensor matches
// a finger locally. Auth is the shared secret (X-Device-Key header,
// checked by middleware) PLUS the device's own device_key row, which
// tells us which course/room this scan belongs to.
async function markBiometric(req, res) {
  try {
    const io = req.app.get('io'); // set once at boot in server.js
    const { fingerprint_id, device_key } = req.body;
    if (fingerprint_id === undefined || !device_key) {
      return res.status(400).json({ error: 'fingerprint_id and device_key are required' });
    }

    const deviceResult = await db.query(
      `SELECT id, course_id, room_label FROM biometric_devices WHERE device_key = ?`,
      [device_key]
    );
    const [deviceRows] = deviceResult;
    const device = deviceRows[0];
    if (!device) return res.status(404).json({ error: 'Unknown device_key' });
    if (!device.course_id) return res.status(409).json({ error: 'Device is not assigned to a course/session' });

    const studentResult = await db.query(
      `SELECT id, name, student_code FROM users WHERE fingerprint_id = ? AND role = 'student'`,
      [fingerprint_id]
    );
    const [studentRows] = studentResult;
    const student = studentRows[0];
    if (!student) return res.status(404).json({ error: 'No student matches this fingerprint_id' });

    const [enrolled] = await db.query(
      `SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ?`,
      [student.id, device.course_id]
    );
    if (!enrolled[0]) {
      return res.status(409).json({ error: 'Student is not enrolled in the course tied to this device' });
    }

    // Mark device online / update heartbeat
    await db.query(
      `UPDATE biometric_devices SET status = 'online', last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [device.id]
    );

    const logResult = await db.query(
      `INSERT INTO attendance_logs (student_id, course_id, device_id, status)
       VALUES (?, ?, ?, 'present')`,
      [student.id, device.course_id, device.id]
    );
    
    const [logRows] = await db.query(
      'SELECT * FROM attendance_logs WHERE id = ?',
      [logResult[0].insertId]
    );

    const payload = {
      student: { id: student.id, name: student.name, student_code: student.student_code },
      course_id: device.course_id,
      device_id: device.id,
      room_label: device.room_label,
      scanned_at: logRows[0].scanned_at,
    };

    // Broadcast to every connected mobile client so the teacher's
    // Biometric Hub and the student's own attendance screen update live.
    if (io) io.emit('attendance:new', payload);

    res.status(201).json({ log: logRows[0], student });
  } catch (err) {
    console.error('markBiometric error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/attendance/devices  — device online/offline status for the Biometric Hub card
async function deviceStatus(req, res) {
  try {
    const [result] = await db.query(
      `SELECT id, device_key, room_label, course_id, status, last_seen_at FROM biometric_devices ORDER BY id`
    );
    res.json({ devices: result });
  } catch (err) {
    console.error('deviceStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { markBiometric, deviceStatus };
