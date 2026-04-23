const { Router } = require("express");
const { createProject, getProjectById, getAllProjects, getProjectsByOwnerId } = require("../controllers/project.controller");
const authenticateUser = require("../middlewares/auth.middleware");

const projectRouter = Router();

projectRouter.post("/", authenticateUser, createProject);
projectRouter.get("/", authenticateUser, getAllProjects);
projectRouter.get("/owner", authenticateUser, getProjectsByOwnerId);
projectRouter.get("/:id", authenticateUser, getProjectById);

module.exports = projectRouter;