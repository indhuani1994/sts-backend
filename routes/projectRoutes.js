const express = require("express");
const router = express.Router();
const projectController = require("../controller/projectController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

router.post("/", authenticate, authorizeRoles("admin", "staff"), projectController.createProject);
router.get("/", authenticate, authorizeRoles("admin", "staff"), projectController.getProjects);
router.get("/:id", authenticate, authorizeRoles("admin", "staff"), projectController.getProjectById);
router.put("/:id", authenticate, authorizeRoles("admin", "staff"), projectController.updateProject);
router.delete("/:id", authenticate, authorizeRoles("admin", "staff"), projectController.deleteProject);

module.exports = router;
