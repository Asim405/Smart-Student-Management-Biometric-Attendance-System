const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { profile, listCourses, enroll, attendanceForCourse } = require('../controllers/studentController');

router.use(verifyToken, requireRole('student'));

router.get('/profile', profile);
router.get('/courses', listCourses);
router.post('/enroll', enroll);
router.get('/attendance/:course_id', attendanceForCourse);

module.exports = router;
