const express = require('express');
const router = express.Router();
const controller = require('../controller/courseController');
const upload = require('../middleware/upload');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticate, authorizeRoles('admin', 'hr', 'staff'), controller.getCourses);
router.get('/assigned', authenticate, authorizeRoles('staff', 'student', 'hr'), controller.getAssignedCourses);
router.get('/:id', authenticate, authorizeRoles('admin'), controller.getCourseById);
router.post('/', authenticate, authorizeRoles('admin'), upload.single('image'), controller.createCourse);
router.put('/:id', authenticate, authorizeRoles('admin'), upload.single('image'), controller.updateCourse);
router.patch('/:id/syllabus', authenticate, authorizeRoles('staff'), controller.updateCourseSyllabus);
router.delete('/:id', authenticate, authorizeRoles('admin'), controller.deleteCourse);

module.exports = router;
