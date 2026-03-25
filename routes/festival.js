// routes/festival.routes.js
const express = require("express");
const router = express.Router();
const {
  getActiveFestival,
  createOrUpdateFestival,
  getAllFestivals,
} = require("../controller/festival");

// Public route (client side will call this)
router.get("/", getActiveFestival);

// Admin routes
router.post("/", createOrUpdateFestival);
router.get("/all", getAllFestivals);

module.exports = router;
