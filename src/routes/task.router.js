const express = require("express");
const { createTask, getTaskById, updateTask, deleteTask, getAllTasks } = require("../controllers/task.controller");

const taskRouter = express.Router();

taskRouter.post("/", createTask);
taskRouter.get("/:id", getTaskById);
taskRouter.put("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);
taskRouter.get("/", getAllTasks);

module.exports = taskRouter;