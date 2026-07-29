const express = require('express');
const router = express.Router();
const { verifyToken, verifyDeviceSecret } = require('../middleware/auth');
const { markBiometric, deviceStatus } = require('../controllers/attendanceController');

// Called by the ESP32 — authenticated via shared secret, not a user JWT.

router.post('/mark-biometric', verifyDeviceSecret, markBiometric);

// Called by the mobile app (teacher's Biometric Hub) — normal JWT auth.
router.get('/devices', verifyToken, deviceStatus);

module.exports = router;
