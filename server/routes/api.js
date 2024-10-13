const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const designController = require("../controllers/designController");
const projectController = require("../controllers/projectController");

// User routes
router.get("/user/:userId", userController.fetchUserData);
router.post("/logout", userController.handleLogout);
router.post("/settings", userController.handleSettings);

// Design routes
router.get("/designs/:userId", designController.fetchDesigns);
router.post("/designs", designController.handleCreateDesign);
router.delete("/designs/:designId", designController.handleDeleteDesign);

// Project routes
router.get("/projects/:userId", projectController.fetchProjects);
router.post("/projects", projectController.handleCreateProject);
router.delete("/projects/:projectId", projectController.handleDeleteProject);

module.exports = router;
