const mongoose = require("mongoose");

const reviewsSchema = mongoose.Schema({
    studentid: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    name: { type: String, required: true }, // store name
    src: { type: String }, // store image
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewsSchema);
