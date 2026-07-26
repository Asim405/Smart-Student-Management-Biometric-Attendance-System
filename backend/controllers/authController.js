const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
// Registers either a student or admin. In production you'd likely lock
// admin registration behind an invite code / existing-admin action —
// left open here since this is a starter template.
async function register(req, res) {
  try {
    const { name, email, password, role, student_code } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ error: 'role must be "admin" or "student"' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, role, student_code)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, password_hash, role, role === 'student' ? student_code || null : null]
    );

    // Fetch the created user to return it
    const [userRows] = await db.query(
      'SELECT id, name, email, role, student_code FROM users WHERE id = ?',
      [result.insertId]
    );
    const user = userRows[0];
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    delete user.password_hash;

    res.json({ token, user });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login };
