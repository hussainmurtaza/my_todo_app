const Router = require("express");
const { createTaskAssignee } = require("../controllers/task.assignee.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const taskAssigneeRouter = Router();

taskAssigneeRouter.post("/", authMiddleware, createTaskAssignee);

module.exports = taskAssigneeRouter;