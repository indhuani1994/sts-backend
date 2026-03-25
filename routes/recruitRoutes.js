const express = require('express');
const router = express.Router();
const controller = require('../controller/recruitEnquiryController');
const upload = require('../middleware/upload');

router.get('/', controller.getJobEnquiry);
router.get('/:id', controller.getRecruitById);
router.post('/', upload.single('resume'), controller.createRecruit);
router.put('/:id', upload.single('resume'), controller.updateRecruit);
router.delete('/:id', controller.deleteRecruit);

module.exports = router;
