const { Router } = require("express");
const { createProjectInvitations, acceptProjectInvitation, rejectProjectInvitation } = require("../controllers/project.invitation.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const projectInvitationRouter = Router();

projectInvitationRouter.post("/:projectId", authMiddleware, createProjectInvitations);
projectInvitationRouter.get("/accept/:token", authMiddleware, acceptProjectInvitation);
projectInvitationRouter.get("/reject/:token", authMiddleware, rejectProjectInvitation);

module.exports = projectInvitationRouter;