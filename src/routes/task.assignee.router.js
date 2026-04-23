const Router = require("express");
const { createTaskAssignee } = require("../controllers/task.assignee.controller");

const taskAssigneeRouter = Router();

taskAssigneeRouter.post("/", createTaskAssignee);

module.exports = taskAssigneeRouter;