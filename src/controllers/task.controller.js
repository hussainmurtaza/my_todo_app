const TaskRepository = require("../repositories/task.repository");
const ApiResponse = require("../helpers/response.helper");
const ProjectRepository = require("../repositories/project.repository");

const createTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId, title, description, status, priority, dueDate } = req.body;
        if (!projectId || !title) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        if (+project.ownerDetails.id !== +userId) {
            return ApiResponse.error(res, "You are not authorized to create a task for this project");
        }
        const taskId = await TaskRepository.createTask(projectId, title, description, status, priority, dueDate, userId);
        return ApiResponse.success(res, "Task created successfully", taskId);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await TaskRepository.getTaskById(id);
        return ApiResponse.success(res, "Task fetched successfully", task);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, dueDate } = req.body;
        const task = await TaskRepository.updateTask(id, title, description, status, priority, dueDate);
        return ApiResponse.success(res, "Task updated successfully", task);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await TaskRepository.deleteTask(id);
        return ApiResponse.success(res, "Task deleted successfully", task);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}
const getAllTasks = async (req, res) => {
    try {
        const { projectId, page = 1, limit = 20, status, priority, search, assigneeName, sortBy, sortOrder } = req.query;
        if (!projectId) {
            return ApiResponse.validationError(res, "Project ID is required");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        const tasks = await TaskRepository.getAllTasks({ projectId, page, limit, status, priority, search, assigneeName, sortBy, sortOrder });
        return ApiResponse.success(res, "Tasks fetched successfully", tasks);
    } catch (error) {
        console.log(error);
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}

module.exports = {
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    getAllTasks,
}