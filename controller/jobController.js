const JobPosting = require("../models/jobPosting");

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const job = new JobPosting(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all jobs (optionally filter by type)
exports.getJobs = async (req, res) => {
  try {
    const { type } = req.query;
    let filter = {};
    if (type) filter.type = type;
    const jobs = await JobPosting.find(filter).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.status(200).json(job);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
