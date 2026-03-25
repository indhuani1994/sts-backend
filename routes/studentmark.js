const express = require('express');
const studentmark = require('../controller/studentmark');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/my-students', authenticate, authorizeRoles('staff'), studentmark.getMyStudents);

router.get('/marks', authenticate, authorizeRoles('admin', 'staff', 'student', 'hr'), studentmark.getMarksForRole);
router.post('/marks', authenticate, authorizeRoles('staff', 'admin'), studentmark.addStudentMark);
router.put('/marks/:id', authenticate, authorizeRoles('staff', 'admin'), studentmark.updateStudentMark);
router.delete('/marks/:id', authenticate, authorizeRoles('staff', 'admin'), studentmark.deleteStudentMark);

// Backward-compatible endpoints (now secured)
router.post('/add-mark', authenticate, authorizeRoles('staff', 'admin'), studentmark.addStudentMark);
router.get('/student-marks/:studentRegisterId', authenticate, authorizeRoles('admin', 'staff', 'student'), studentmark.getStudentMarks);

router.get('/all-marks', authenticate, authorizeRoles('admin'), studentmark.getAllStudentMarks);

module.exports = router;
