const express = require("express");
const router = express.Router();
const jobController = require("../controller/jobController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// CRUD routes
router.post("/", authenticate, authorizeRoles("admin"), jobController.createJob);        // Create (admin only)
router.get("/", jobController.getJobs);          // Get all / filter by type
router.get("/:id", jobController.getJobById);   // Get single job
router.put("/:id", authenticate, authorizeRoles("admin"), jobController.updateJob);    // Update (admin only)
router.delete("/:id", authenticate, authorizeRoles("admin"), jobController.deleteJob); // Delete (admin only)

module.exports = router;
