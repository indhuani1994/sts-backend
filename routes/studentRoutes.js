const express = require('express');
const routerStudent = express.Router();
const { getAllStudent, UpdateStudent, addStudent, deleteStudent, getStudent, getStudentAllDetail } = require('../controller/studentsController');
const upload = require('../middleware/upload');
const { authenticate, authorizeRoles } = require('../middleware/auth');


const fieldUpload = upload.fields([{name: 'studentImage', maxCount: 1}, {name: 'studentAadharImage', maxCount: 1}]);


routerStudent.get('/', authenticate, authorizeRoles('admin'), getAllStudent);
routerStudent.post('/', authenticate, authorizeRoles('admin'), fieldUpload, addStudent);
routerStudent.put('/:id', authenticate, authorizeRoles('admin'), fieldUpload, UpdateStudent);
routerStudent.delete('/:id', authenticate, authorizeRoles('admin'), deleteStudent);
routerStudent.get('/:id', authenticate, authorizeRoles('admin'), getStudent);
routerStudent.get('/:id/details', authenticate, authorizeRoles('admin'), getStudentAllDetail);

module.exports = routerStudent;
