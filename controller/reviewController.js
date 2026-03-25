const Review = require('../models/review');
const { deleteCloudinaryByUrl } = require('../utils/cloudinaryHelpers');

exports.getReview = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    console.error('Fetch Review Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { stuId, review, rate } = req.body;

    const stuImage = req.file ? req.file.path : '';

    const newReview = new Review({
      stuId,
      review,
      rate,
      stuImage,
    });

    const savedReview = await newReview.save();
    res.json(savedReview);
  } catch (err) {
    console.error('Create Review Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { stuId, review, rate } = req.body;

    const updateData = {
      stuId,
      review,
      rate,
    };

    if (req.file) {
      const existing = await Review.findById(req.params.id);
      if (existing?.stuImage) {
        await deleteCloudinaryByUrl(existing.stuImage, 'reviewImage');
      }
      updateData.stuImage = req.file.path;
    }

    const updated = await Review.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await deleteCloudinaryByUrl(review.stuImage, 'reviewImage');
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
