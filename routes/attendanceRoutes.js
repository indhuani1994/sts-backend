// const express = require('express');
// const router = express.Router();
// const attendanceController = require('../controller/attendanceController');

// // Student marks attendance
// router.post('/mark', attendanceController.markAttendance);

// // Admin views pending requests
// router.get('/pending', attendanceController.getPendingAttendance);
// router.get('/all',attendanceController.getallattend)

// // Admin updates status
// router.post('/update', attendanceController.updateAttendanceStatus);

// router.delete('/delete/:id', attendanceController.deleteAttendance)

// module.exports = router;



const express = require("express");
const router = express.Router();
const controller = require("../controller/attendanceController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// Admin Routes
router.post("/admin-mark", authenticate, authorizeRoles("admin"), controller.markAttendance);
router.put("/admin-update", authenticate, authorizeRoles("admin"), controller.adminUpdateToday);
// NEW: Route for the mass update feature we built in React
router.put("/bulk-update", authenticate, authorizeRoles("admin"), controller.adminBulkUpdate);

// Staff/Admin Routes
router.post("/mark", authenticate, authorizeRoles("staff", "admin"), controller.bulkMarkAttendance);
router.get("/report", authenticate, authorizeRoles("admin", "staff", "student"), controller.getAttendanceReport);

module.exports = router;
