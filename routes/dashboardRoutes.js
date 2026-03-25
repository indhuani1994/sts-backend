const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getAdminDashboard,
  getStaffDashboard,
  getStudentDashboard,
} = require('../controller/dashboardController');

const router = express.Router();

router.get('/admin', authenticate, authorizeRoles('admin'), getAdminDashboard);
router.get('/staff', authenticate, authorizeRoles('staff', 'hr'), getStaffDashboard);
router.get('/student', authenticate, authorizeRoles('student'), getStudentDashboard);

module.exports = router;
