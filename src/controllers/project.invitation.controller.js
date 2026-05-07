const ProjectInvitationRepository = require("../repositories/project.invitation.repository");
const ProjectRepository = require("../repositories/project.repository");
const ProjectMembersRepository = require("../repositories/project.members.repository");
const ApiResponse = require("../helpers/response.helper");
const { pool } = require("../../config/db");
const emailQueue = require("../queues/emailQueue");

const createProjectInvitations = async (req, res) => {
    try {
        const { invitedUsers } = req.body;
        const { projectId } = req.params;
        const invitedBy = req.user.userId;
        if (!projectId || !Array.isArray(invitedUsers) || invitedUsers.length === 0) {
            return ApiResponse.validationError(res, "Missing required fields");
        }
        if (invitedUsers.length > 50) {
            return ApiResponse.error(res, "You can only invite up to 50 users at a time");
        }
        const project = await ProjectRepository.getProjectById(projectId);
        if (!project) {
            return ApiResponse.error(res, "Project not found");
        }
        if (+project.ownerDetails.id !== +invitedBy) {
            return ApiResponse.error(res, "You are not the owner of the project");
        }
        const { insertedCount, invitations } = await ProjectInvitationRepository.createProjectInvitations({
            projectId,
            invitedUsers,
            invitedBy,
        });
        if (!insertedCount) {
            return ApiResponse.error(res, "Failed to create project invitations", 400);
        }
        //  Send Email to invited users
        const jobs = invitations.map(user => ({
            name: "project-invitation",
            data: {
                to: user.email,
                projectName: project.name,
                invitationLink: `${process.env.BASE_URL}/accept-invite?token=${user.token}`
            }
        }));
        await emailQueue.addBulk(jobs);
        return ApiResponse.success(res, "Project invitations created successfully");
    }
    catch (error) {
        console.log("error", error);
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
};

const acceptProjectInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.userId;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const invitation =
                await ProjectInvitationRepository.getProjectInvitationByToken(
                    token,
                    userId,
                    connection
                );

            if (!invitation) {
                await connection.rollback();
                return ApiResponse.error(
                    res,
                    "Invitation not found or already accepted",
                    404
                );
            }

            // 1. update status
            await ProjectInvitationRepository.updateProjectInvitationStatus(
                invitation.id,
                "accepted",
                connection
            );

            // 2. insert into members
            await ProjectMembersRepository.bulkInsert(
                [invitation.userId],
                invitation.projectId,
                connection
            );

            await connection.commit();

            return ApiResponse.success(res, "Invitation accepted successfully");
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
    catch (error) {
        console.log("error", error);
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}

const rejectProjectInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user.userId;
        const invitation =
            await ProjectInvitationRepository.getProjectInvitationByToken(
                token,
                userId
            )
        if (!invitation) {
            return ApiResponse.error(res, "Invitation not found or already accepted", 404);
        }
        await ProjectInvitationRepository.updateProjectInvitationStatus(invitation.id, "rejected");
        return ApiResponse.success(res, "Invitation rejected successfully");
    } catch (error) {
        console.log("error", error);
        return ApiResponse.error(res, "Internal server error", 500, error.message);
    }
}

module.exports = { createProjectInvitations, acceptProjectInvitation, rejectProjectInvitation };