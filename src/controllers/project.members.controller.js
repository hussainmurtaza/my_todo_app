const ApiResponse = require("../helpers/response.helper");
const ProjectMembersRepository = require("../repositories/project.members.repository");
const ProjectRepository = require("../repositories/project.repository");
const UserRepository = require("../repositories/user.repository");

const addProjectMember = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.userId;
        if (!projectId || !userId) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            return ApiResponse.error(res, "User not found");
        }
        if (project.ownerDetails?.id === userId) {
            return ApiResponse.error(res, "You cannot add yourself as a project member");
        }
        const projectMembers = await ProjectMembersRepository.getProjectMembers(projectId);
        if (projectMembers.some(member => member.userDetails?.id === userId)) {
            return ApiResponse.error(res, "User is already a project member");
        }
        const projectMember = await ProjectMembersRepository.addProjectMember(projectId, userId);
        return ApiResponse.success(res, "Member added successfully", projectMember);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }

}
const removeProjectMember = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.userId;
        if (!projectId || !userId) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            return ApiResponse.error(res, "User not found");
        }
        if (project.ownerDetails?.id === userId) {
            return ApiResponse.error(res, "You cannot remove yourself as a project member");
        }
        const removed = await ProjectMembersRepository.removeProjectMember(projectId, userId);
        if (!removed) {
            return ApiResponse.error(res, "User is not a member of this project", 404);
        }
        return ApiResponse.success(res, "Member removed successfully", removed);
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}
const getProjectMembers = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        const projectMembers = await ProjectMembersRepository.getProjectMembers(projectId);
        console.log(projectMembers, "projectMembers");
        return ApiResponse.success(res, "Members fetched successfully", {
            members: projectMembers,
            totalCount: projectMembers.length,
        });
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}

module.exports = {
    addProjectMember,
    removeProjectMember,
    getProjectMembers,
}