const ProjectRepository = require("../repositories/project.repository");
const ApiResponse = require("../helpers/response.helper");

const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        console.log(req.user, "req.user");
        const owner_id = req.user.userId;
        if (!name || !owner_id) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.createProject(name, description, owner_id);
        if (!project) {
            return ApiResponse.error(res, "Failed to create project");
        }
        return ApiResponse.success(res, "Project created successfully", project);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
};

const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.getProjectById(id);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        return ApiResponse.success(res, "Project fetched successfully", project);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
};

const getAllProjects = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 50 } = req.query;
        const projects = await ProjectRepository.getAllProjects({ search, page, limit });
        return ApiResponse.success(res, "Projects fetched successfully", projects);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
};

const getProjectsByOwnerId = async (req, res) => {
    try {
        const owner_id = req.user.userId;
        if (!owner_id) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const projects = await ProjectRepository.getProjectsByOwnerId(owner_id);
        if (!projects) {
            return ApiResponse.error(res, "Projects not found");
        }
        return ApiResponse.success(res, "Projects fetched successfully", projects);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
};

module.exports = { createProject, getProjectById, getAllProjects, getProjectsByOwnerId };