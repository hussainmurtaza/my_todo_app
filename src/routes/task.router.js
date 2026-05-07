const express = require("express");
const { createTask, getTaskById, updateTask, deleteTask, getAllTasks } = require("../controllers/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const taskRouter = express.Router();

taskRouter.post("/", authMiddleware, createTask);
taskRouter.get("/:id", getTaskById);
taskRouter.put("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);
taskRouter.get("/", getAllTasks);

module.exports = taskRouter;