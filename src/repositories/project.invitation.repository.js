const { pool } = require("../../config/db");
const crypto = require("crypto");

class ProjectInvitationRepository {
    static async createProjectInvitations({
        projectId,
        invitedBy,
        invitedUsers = [],
    }) {
        if (!invitedUsers.length) return [];

        const [invitedUserRows] = await pool.query(
            `SELECT id, email FROM users WHERE id IN (?)`,
            [invitedUsers]
        );

        const invitedUserMap = new Map(invitedUserRows.map((u) => [u.id, u.email]));

        const invitations = invitedUsers.map((userId) => ({
            userId,
            email: invitedUserMap.get(userId),
            token: crypto.randomBytes(20).toString("hex"),
        }));

        const values = invitations.map(({ userId, token }) => [
            projectId,
            userId,
            invitedBy,
            "pending",
            token,
        ]);

        const query = `
          INSERT INTO project_invitations
          (project_id, invited_user_id, invited_by, status, token)
          VALUES ?
        `;

        const [result] = await pool.query(query, [values]);

        return {
            insertedCount: result.affectedRows,
            invitations,
        };
    }
    static async getProjectInvitationByToken(token, userId, connection = pool) {
        const query = `SELECT * FROM project_invitations WHERE token = ? AND status = 'pending' AND invited_user_id = ?`;
        const [result] = await connection.query(query, [token, userId]);
        return result.length > 0 ? this.formatProjectInvitation(result[0]) : null;
    }
    static async updateProjectInvitationStatus(id, status, connection = pool) {
        const query = `UPDATE project_invitations SET status = ? WHERE id = ?`;
        const [result] = await connection.query(query, [status, id]);
        return result.affectedRows > 0;
    }
    static formatProjectInvitation(invitation) {
        return {
            id: invitation.id,
            projectId: invitation.project_id,
            userId: invitation.invited_user_id,
            invitedBy: invitation.invited_by,
            status: invitation.status,
            token: invitation.token,
            createdAt: invitation.created_at,
            updatedAt: invitation.updated_at,
        };
    }
}

module.exports = ProjectInvitationRepository;