const ApiResponse = require("../helpers/response.helper");
const ProjectMembersRepository = require("../repositories/project.members.repository");
const ProjectRepository = require("../repositories/project.repository");

const addProjectMembers = async (req, res) => {
    try {
        const { projectId, userIds } = req.body;
        const ownerId = req.user.userId;

        if (!projectId || !Array.isArray(userIds) || userIds.length === 0) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }

        if (project.ownerDetails?.id !== ownerId) {
            return ApiResponse.error(res, "You are not the owner of this project");
        }

        const projectMembers = await ProjectMembersRepository.getProjectMembers(projectId);
        const existingMemberIds = new Set(
            projectMembers.map(m => m.userDetails?.id)
        );

        const validInserts = [];
        const errors = [];

        for (const userId of userIds) {
            if (userId === ownerId) {
                errors.push({ userId, message: "You cannot add yourself" });
                continue;
            }

            if (existingMemberIds.has(userId)) {
                errors.push({ userId, message: "Already a project member" });
                continue;
            }
            validInserts.push(userId);
        }
        let inserted = [];
        if (validInserts.length > 0) {
            inserted = await ProjectMembersRepository.bulkInsert(validInserts, projectId);
        }

        return ApiResponse.success(res, "Members processed successfully", {
            added: inserted,
            errors,
        });

    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
};
const removeProjectMembers = async (req, res) => {
    try {
        const { projectId, userIds } = req.body;
        const ownerId = req.user.userId;
        if (!projectId || !Array.isArray(userIds) || userIds.length === 0) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        if (+project.ownerDetails?.id !== +ownerId) {
            return ApiResponse.error(res, "You are not the owner of this project");
        }
        const validUserIds = userIds.filter(userId => +userId !== +ownerId);
        if (validUserIds.length === 0) {
            return ApiResponse.error(res, "You cannot remove yourself as a project member");
        }
        const removed = await ProjectMembersRepository.bulkRemoveProjectMembers(validUserIds, projectId);
        return ApiResponse.success(res, "Members removed successfully", removed);
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
        return ApiResponse.success(res, "Members fetched successfully", {
            members: projectMembers,
            totalCount: projectMembers.length,
        });
    } catch (error) {
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}

module.exports = {
    addProjectMembers,
    removeProjectMembers,
    getProjectMembers,
}