// models/festival.model.js
const mongoose = require("mongoose");

const FestivalSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Diwali, Independence Day
  date: { type: String }, // optional (e.g. "2025-10-20")
  effect: { type: String, required: true }, // fireworks, flag, balloons
  enabled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Festival", FestivalSchema);
