const express = require('express');
const router = express.Router();
const studentRegCtrl = require('../controller/studentRegisterController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Routes
router.get('/', authenticate, authorizeRoles('admin', 'staff', 'student'), studentRegCtrl.getAllStudentRegisters);
router.get('/staff/:staffId', authenticate, authorizeRoles('admin', 'staff'), studentRegCtrl.getStudentsByStaffId);
router.get('/:id', authenticate, studentRegCtrl.getStudentRegisterById);
router.post(
  '/',
  authenticate,
  authorizeRoles('admin', 'staff'),
  validate([
    { field: 'studentId', required: true },
    { field: 'courseId', required: true },
    { field: 'staffId', required: true },
    { field: 'courseFees', required: false, type: 'number' },
    { field: 'amountReceived', required: false, type: 'number' },      
  ]),
  studentRegCtrl.addStudentRegister
);
router.post(
  '/bulk',
  authenticate,
  authorizeRoles('admin'),
  studentRegCtrl.bulkRegisterStudents
);
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'staff'),
  validate([
    { field: 'courseFees', required: false, type: 'number' },
    { field: 'amountReceived', required: false, type: 'number' },
  ]),
  studentRegCtrl.updateStudentRegister
);
router.delete('/:id', authenticate, authorizeRoles('admin'), studentRegCtrl.deleteStudentRegister);
router.get("/student/:studentId", studentRegCtrl.getStudentRegistrationsByStudentId);

module.exports = router;
