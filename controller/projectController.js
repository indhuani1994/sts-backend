const Project = require("../models/Project");
const Staff = require("../models/staffs");

// Create Project
exports.createProject = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.user?.role === "staff") {
      payload.staffId = req.user.profileId || null;
      if (!payload.staffId) {
        return res.status(400).json({ error: "Staff profile not found" });
      }
      const staff = await Staff.findById(payload.staffId).lean();
      payload.staffName = staff?.staffName || payload.staffName || "";
    } else if (payload.staffId) {
      const staff = await Staff.findById(payload.staffId).lean();
      if (!staff) {
        return res.status(400).json({ error: "Assigned staff not found" });
      }
      payload.staffName = staff.staffName;
    }
    const project = new Project(payload);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get All Projects
exports.getProjects = async (req, res) => {
  try {
    const query = {};
    if (req.user?.role === "staff") {
      query.staffId = req.user.profileId;
    }
    const projects = await Project.find(query);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (req.user?.role === "staff" && String(project.staffId || "") !== String(req.user.profileId || "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Project not found" });
    if (req.user?.role === "staff" && String(existing.staffId || "") !== String(req.user.profileId || "")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const payload = { ...req.body };
    if (req.user?.role === "staff") {
      payload.staffId = existing.staffId;
      payload.staffName = existing.staffName;
    } else if (payload.staffId && String(payload.staffId) !== String(existing.staffId || "")) {
      const staff = await Staff.findById(payload.staffId).lean();
      if (!staff) {
        return res.status(400).json({ error: "Assigned staff not found" });
      }
      payload.staffName = staff.staffName;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Project not found" });
    if (req.user?.role === "staff" && String(existing.staffId || "") !== String(req.user.profileId || "")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
