const { Router } = require("express");
const { addProjectMembers, removeProjectMembers, getProjectMembers } = require("../controllers/project.members.controller");
const authenticateUser = require("../middlewares/auth.middleware");

const projectMemberRouter = Router();

projectMemberRouter.post("/", authenticateUser, addProjectMembers);
projectMemberRouter.delete("/", authenticateUser, removeProjectMembers);
projectMemberRouter.get("/:projectId", authenticateUser, getProjectMembers);

module.exports = projectMemberRouter;