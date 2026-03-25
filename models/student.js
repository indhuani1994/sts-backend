const mongoose = require('mongoose');

const studentsSchema = mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    studentMobile: { type: String, required: true, trim: true, index: true },
    studentMail: { type: String, required: true, trim: true, lowercase: true, index: true },
    studentEducation: [{ type: String, trim: true }],
    studentCollege: { type: String, trim: true },
    studentCollegeAddress: { type: String, trim: true },
    studentYearOrExperience: { type: String, trim: true },
    studentImage: { type: String, default: '' },
    studentAadharImage: { type: String, default: '' },
    studentAddress: { type: String, trim: true },
    studentStatus: { type: String, trim: true, index: true },
    studentCourse: { type: String, trim: true, index: true },
    studentRedId: { type: String, trim: true, unique: true, sparse: true },
    studentCollegeId: { type: String, trim: true },
  },
  { timestamps: true }
);

studentsSchema.index({ studentName: 'text', studentMail: 'text', studentMobile: 'text' });
studentsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Student', studentsSchema);
