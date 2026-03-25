// controllers/festival.controller.js
const Festival = require("../models/festival");

// Get current active festival effect
exports.getActiveFestival = async (req, res) => {
  try {
    const festival = await Festival.findOne({ enabled: true });
    if (!festival) return res.json({ active: false });
    res.json({
      active: true,
      name: festival.name,
      effect: festival.effect,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Create / Update festival
exports.createOrUpdateFestival = async (req, res) => {
  try {
    const { name, date, effect, enabled } = req.body;

    if (enabled) {
      // Disable all other festivals
      await Festival.updateMany({}, { enabled: false });
    }

    const festival = new Festival({ name, date, effect, enabled });
    await festival.save();

    res.json(festival);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get all festivals
exports.getAllFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find();
    res.json(festivals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
