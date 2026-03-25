

const resume = require("../models/Resume")

// Upload Resume
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const newResume = new resume({
      studentId: req.body.studentId,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    await newResume.save();

    res.json({ message: "Resume uploaded successfully", resume: newResume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Resume by studentId
exports.getResumeByStudent = async (req, res) => {
  try {
    const resume = await resume.findOne({ studentId: req.params.studentId });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    if (/^https?:\/\//i.test(resume.filePath)) {
      return res.redirect(resume.filePath);
    }
    return res.status(200).json({ url: resume.filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Resume
exports.deleteResume = async (req, res) => {
  try {
    const resume = await resume.findByIdAndDelete(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


