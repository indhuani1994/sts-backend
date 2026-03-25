const Review = require('../models/reviews');
const Student = require('../models/student');

// @desc    Create a new review with studentName and studentImage stored
// @route   POST /api/reviews
// @access  Public
const createReview = async (req, res) => {
    try {
        const { studentid,rating, review } = req.body;

        if (!studentid || !rating || !review) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Fetch student data
        const studentData = await Student.findById(studentid);
        if (!studentData) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Save review with studentName and studentImage
        const newReview = await Review.create({
            studentid,
            rating,
            review,
            name: studentData.studentName,
            src: studentData.studentImage
        });

        res.status(201).json(newReview);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 }); // newest first
        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get a review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        res.status(200).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    createReview,
    getAllReviews,
    getReviewById
};
