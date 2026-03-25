const express = require('express');
const router = express.Router();
const controller = require('../controller/reviewController');
const upload = require('../middleware/upload');


router.get('/', controller.getReview);
router.get('/:id', controller.getReviewById);
router.post('/', upload.single('stuImage'), controller.createReview);
router.put('/:id', upload.single('stuImage'), controller.updateReview);
router.delete('/:id', controller.deleteReview);

module.exports = router;
