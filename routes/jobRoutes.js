const express = require("express");
const router = express.Router();
const jobController = require("../controller/jobController");

// CRUD routes
router.post("/", jobController.createJob);        // Create
router.get("/", jobController.getJobs);          // Get all / filter by type
router.get("/:id", jobController.getJobById);   // Get single job
router.put("/:id", jobController.updateJob);    // Update job
router.delete("/:id", jobController.deleteJob); // Delete job

module.exports = router;
