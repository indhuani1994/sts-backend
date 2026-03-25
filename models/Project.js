const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectCode: { type: String, required: true, unique: true },
  projectTitle: { type: String, required: true },
  technology: { type: String, required: true },
  category: { type: String, required: true },
  algorithm: { type: String, required: true },
  projectCost: { type: Number, required: true },
  link: { type: String, required: true },
  abstract: { type: String, required: true },
  video: { type: String, required: true },
  existing: { type: String, required: true },
  proposed: { type: String, required: true },
  systemRequirements: { type: String, required: true },

}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
