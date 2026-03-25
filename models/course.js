const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, trim: true, index: true },
    courseName: { type: String, required: true, trim: true, index: true },
    fees: { type: Number, default: 0, min: 0 },
    duration: { type: String, trim: true },
    prerequire: { type: String, trim: true },
    syllabus: [{ type: String, trim: true }],
    image: { type: String, default: '' },
    description: { type: String, trim: true },
    type: { type: String, trim: true, index: true },
    offer: { type: String, trim: true },
    drivelink: { type: String, trim: true },
  },
  { timestamps: true }
);

courseSchema.index({ courseName: 'text', courseCode: 'text' });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
