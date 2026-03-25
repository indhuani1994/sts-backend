const express = require('express');
const { 
    adminLogin, 
    getManagedUsers,
    createUser, 
    loginStudentOrStaff, 
    getStudentsForDropdown, 
    getStaffForDropdown,
    getUserProfile, 
    updateUserAccount,
    deleteUserAccount,
    toggleUserStatus,
    getUserStatus
} = require('../controller/user');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Admin routes
router.post('/admin-login', adminLogin);
router.get('/admin/users', authenticate, authorizeRoles('admin'), getManagedUsers);
router.post('/create-user', authenticate, authorizeRoles('admin'), createUser);
router.get('/students-dropdown', authenticate, authorizeRoles('admin'), getStudentsForDropdown);
router.get('/staff-dropdown', authenticate, authorizeRoles('admin'), getStaffForDropdown);
router.get('/user-status/:userId', authenticate, authorizeRoles('admin'), getUserStatus);


// User routes
router.post('/login', loginStudentOrStaff);
router.get('/profile/:userId', authenticate, getUserProfile);
router.put('/admin/user/:userId', authenticate, authorizeRoles('admin'), updateUserAccount);   // Edit user
router.delete('/admin/user/:userId', authenticate, authorizeRoles('admin'), deleteUserAccount); // Delete user
router.patch('/admin/toggle-user/:userId', authenticate, authorizeRoles('admin'), toggleUserStatus);

module.exports = router;
