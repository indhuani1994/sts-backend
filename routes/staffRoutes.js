const express = require('express');
const { getAllStaff, UpdateStaff, addStaff, deleteStaff, getStaffById } = require('../controller/staffsController');
const routerStaff = express.Router();
const upload = require('../middleware/upload');
const { authenticate, authorizeRoles } = require('../middleware/auth');


const fieldUpload = upload.fields([{name: 'staffImage', maxCount: 1}, {name: 'staffAadharImage', maxCount: 1}]);


routerStaff.get('/', authenticate, authorizeRoles('admin'), getAllStaff);
routerStaff.post('/', authenticate, authorizeRoles('admin'), fieldUpload, addStaff);
routerStaff.put('/:id', authenticate, authorizeRoles('admin'), fieldUpload, UpdateStaff);
routerStaff.delete('/:id', authenticate, authorizeRoles('admin'), deleteStaff);
routerStaff.get('/:id', authenticate, authorizeRoles('admin'), getStaffById);

module.exports = routerStaff;
