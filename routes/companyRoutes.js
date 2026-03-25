const express = require('express');
const router = express.Router();
const controller = require('../controller/companyController');
const upload = require('../middleware/upload');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Routes
router.get('/', authenticate, authorizeRoles('admin'), controller.getAllCompanies);
router.get('/:id', authenticate, authorizeRoles('admin'), controller.getCompanyById);
router.post('/', authenticate, authorizeRoles('admin'), upload.single('companyImage'), controller.createCompany);
router.put('/:id', authenticate, authorizeRoles('admin'), upload.single('companyImage'), controller.updateCompany);
router.delete('/:id', authenticate, authorizeRoles('admin'), controller.deleteCompany);

module.exports = router;
