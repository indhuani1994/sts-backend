const express = require('express');
const router = express.Router();
const studentInsCtrl = require('../controller/installmentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');


// Routes
router.get('/', authenticate, studentInsCtrl.getAllStudentInstallments);
router.get('/:id', authenticate, studentInsCtrl.getStudentInstallmentById);
router.post(
  '/',
  authenticate,
  authorizeRoles('admin', 'staff'),
  validate([
    { field: 'registerId', required: false },
    { field: 'register', required: false },
    { field: 'amountReceived', required: false, type: 'number' },
    { field: 'amountPaid', required: false, type: 'number' },
    { field: 'latePenalty', required: false, type: 'number' },
    { field: 'nextIns', required: false, type: 'date' },
    { field: 'dueDate', required: false, type: 'date' },
  ]),
  studentInsCtrl.addStudentInstallment
);
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'staff'),
  validate([
    { field: 'amountReceived', required: false, type: 'number' },
    { field: 'amountPaid', required: false, type: 'number' },
    { field: 'latePenalty', required: false, type: 'number' },
    { field: 'nextIns', required: false, type: 'date' },
    { field: 'dueDate', required: false, type: 'date' },
  ]),
  studentInsCtrl.updateStudentInstallment
);
router.delete('/:id', authenticate, authorizeRoles('admin'), studentInsCtrl.deleteStudentInstallment);

module.exports = router;
