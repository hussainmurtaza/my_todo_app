const { pool } = require("../../config/db");
const { addSoftDeleteCondition } = require("../helpers/query.helper");

class ProjectMembersRepository {
    static async bulkInsert(userIds, projectId, connection = pool) {
        const values = userIds.map(userId => [projectId, userId]);
        const query = `INSERT INTO project_members (project_id, user_id) VALUES ?`;
        const [result] = await connection.query(query, [values]);
        return result.affectedRows;
    }
    static async bulkRemoveProjectMembers(userIds, projectId) {
        const query = `DELETE FROM project_members WHERE project_id = ? AND user_id IN (?)`;
        const [result] = await pool.query(query, [projectId, userIds]);
        return result.affectedRows;
    }
    static async getProjectMembers(project_id) {
        const query = `SELECT pm.*, u.first_name, u.last_name, u.email FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ? AND ${addSoftDeleteCondition('u')}`;

        const [result] = await pool.query(query, [project_id]);
        const formatted = this.formatProjectMembers(result);
        return formatted;
    }
    static async getMembersByProjectIds(projectIds) {
        const ids = Array.isArray(projectIds) ? projectIds.filter(Boolean) : [];
        if (ids.length === 0) return new Map();

        const query = `
            SELECT pm.*, u.first_name, u.last_name, u.email
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id IN (?) AND ${addSoftDeleteCondition("u")}
            ORDER BY pm.project_id ASC, pm.id DESC
        `;

        const [rows] = await pool.query(query, [ids]);
        const byProject = new Map();
        for (const row of rows) {
            const formatted = this.formatProjectMember(row);
            const list = byProject.get(formatted.projectId) || [];
            list.push(formatted);
            byProject.set(formatted.projectId, list);
        }
        return byProject;
    }
    static formatProjectMembers(project_members) {
        return project_members.map(project_member => this.formatProjectMember(project_member));
    }
    static formatProjectMember(project_member) {
        const firstName = project_member?.first_name || "";
        const lastName = project_member?.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || null;
        return {
            id: project_member.id,
            userDetails: {
                id: project_member.user_id,
                name: fullName || null,
                email: project_member?.email || null,
            },
            role: project_member?.role || "viewer",
            projectId: project_member.project_id,
            createdAt: project_member.created_at,
            updatedAt: project_member.updated_at,
        };
    }
}

module.exports = ProjectMembersRepository;