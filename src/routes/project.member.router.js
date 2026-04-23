const { Router } = require("express");
const { addProjectMember, removeProjectMember, getProjectMembers } = require("../controllers/project.members.controller");
const authenticateUser = require("../middlewares/auth.middleware");

const projectMemberRouter = Router();

projectMemberRouter.post("/:projectId", addProjectMember);
projectMemberRouter.delete("/:projectId", authenticateUser, removeProjectMember);
projectMemberRouter.get("/:projectId", authenticateUser, getProjectMembers);

module.exports = projectMemberRouter;