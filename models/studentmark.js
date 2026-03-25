// models/studentMarks.js
const mongoose = require('mongoose');

const studentMarksSchema = new mongoose.Schema(
  {
    studentRegister: {
      // Direct link to StudentRegister
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentRegister',
      required: true,
      index: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    syllabusName: {
      type: String,
      required: true,
      trim: true,
    },
    testMark: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    teacherRemark: {
      type: String,
      trim: true,
      default: '',
    },
    history: [
      {
        updatedAt: { type: Date, default: Date.now },
        updatedByRole: { type: String, enum: ['admin', 'staff'], required: true },
        updatedById: { type: mongoose.Schema.Types.ObjectId, required: true },
        previous: {
          syllabusName: String,
          testMark: Number,
          teacherRemark: String,
        },
        next: {
          syllabusName: String,
          testMark: Number,
          teacherRemark: String,
        },
      },
    ],
  },
  { timestamps: true }
);

studentMarksSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StudentMark', studentMarksSchema);
