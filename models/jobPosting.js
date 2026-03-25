const mongoose = require("mongoose");

const JobPostingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ["consultancy", "career"], required: true },
  employmentType: { type: String, enum: ["Full-time", "Part-time", "Internship", "Contract", "Freelance"], required: true },
  workMode: { type: String, enum: ["Onsite", "Remote", "Hybrid"], required: true },
  skills: [{ type: String }],
  experience: { type: String }, // e.g., Fresher, 1-2 yrs
  salary: { type: String }, // e.g., 4-6 LPA
  description: { type: String },
  perks: { type: String },
  applicationLink: { type: String },
  applicationDeadline: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("JobPosting", JobPostingSchema);
