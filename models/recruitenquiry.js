const mongoose = require('mongoose');

const recruitEnquirySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: String, // keep as string for flexibility
  email: { type: String, lowercase: true },
  joiningDate: { type: Date }, // proper date
  currentCTC: { type: Number },
  expectedCTC: { type: Number },
  shift: String,
  experience: String,
  position: String,
  source: String,
  reason: String,
  resume: String, // full URL to uploaded file
}, { timestamps: true });

module.exports = mongoose.model('RecruitEnquiry', recruitEnquirySchema);
