const mongoose = require('mongoose');

const staffSchema = mongoose.Schema(
  {
    staffName: { type: String, required: true, trim: true },
    staffMobile: { type: String, required: true, trim: true, index: true },
    staffMail: { type: String, required: true, trim: true, lowercase: true, index: true },
    staffQualification: [{ type: String, trim: true }],
    staffExperience: [{ type: String, trim: true }],
    staffAddress: { type: String, trim: true },
    staffImage: { type: String, default: '' },
    staffAadharImage: { type: String, default: '' },
    staffRole: { type: String, trim: true, index: true },
    hrCommissionPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

staffSchema.index({ staffName: 'text', staffMail: 'text', staffMobile: 'text' });
staffSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Staff', staffSchema);
