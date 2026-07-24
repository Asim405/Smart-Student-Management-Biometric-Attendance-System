const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { dashboard, roster, upsertMarks } = require('../controllers/teacherController');

router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', dashboard);
router.get('/roster', roster);
router.post('/marks', upsertMarks);

module.exports = router;
