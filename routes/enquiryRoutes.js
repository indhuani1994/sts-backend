const express = require('express');
const router = express.Router();
const controller = require('../controller/enquiryController');
const { authenticate, authorizeRoles } = require('../middleware/auth');


router.post('/', authenticate, authorizeRoles('admin', 'hr'), controller.addEnquiry);
router.get('/', authenticate, authorizeRoles('admin', 'hr'), controller.getEnquiry);
router.get('/followups', authenticate, authorizeRoles('admin', 'hr'), controller.getFollowup);
router.get('/earnings', authenticate, authorizeRoles('hr'), controller.getHrEarnings);
router.get('/hr-earnings', authenticate, authorizeRoles('admin'), controller.getAdminHrEarnings);
router.patch('/hr-earnings/status', authenticate, authorizeRoles('admin'), controller.updateHrEarningStatus);
router.patch('/:id/register', authenticate, authorizeRoles('admin', 'hr'), controller.registerEnquiry);
router.patch('/:id/link-student', authenticate, authorizeRoles('admin'), controller.linkStudentToEnquiry);
router.patch('/:id/earnings-status', authenticate, authorizeRoles('admin'), controller.updateEarningsStatus);
router.get('/:id', authenticate, authorizeRoles('admin', 'hr'), controller.getSingleEnquiry);
router.put('/:id', authenticate, authorizeRoles('admin', 'hr'), controller.updateSingleEnquiry);
router.delete('/:id', authenticate, authorizeRoles('admin', 'hr'), controller.deleteSingleEnquiry);

module.exports = router;
