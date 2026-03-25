const express = require('express');
const router = express.Router();
const { createCourseUpdate, getCourseUpdates, getCourseUpdatesByStudentId } = require('../controller/courseUpdateController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.post('/', authenticate, authorizeRoles('admin', 'staff'), createCourseUpdate);
router.get('/', authenticate, authorizeRoles('admin', 'staff', 'hr'), getCourseUpdates);
router.get('/:studentId', authenticate, authorizeRoles('admin', 'staff', 'student'), getCourseUpdatesByStudentId);

module.exports = router;
