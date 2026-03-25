const express = require('express');
const router = express.Router();
const {
    createReview,
    getAllReviews,
    getReviewById
} = require('../controller/reviews');

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Public
router.post('/', createReview);

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get('/', getAllReviews);

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', getReviewById);

module.exports = router;
