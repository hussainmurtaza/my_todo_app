const { pool } = require("../../config/db");

class TaskAssigneeRepository {
    static async createTaskAssignees(taskId, userIds) {
        const values = userIds.map(userId => [taskId, userId]);
        const query = `
            INSERT INTO task_assignees (task_id, user_id)
            VALUES ?
        `;
        const [result] = await pool.query(query, [values]);
        return result.affectedRows;
    }
    static async getTaskAssigneeById(id) {
        const query = `SELECT * FROM task_assignees WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result[0];
    }
    static async getTaskAssigneesByTaskId(taskId) {
        const query = `SELECT * FROM task_assignees WHERE task_id = ?`;
        const [result] = await pool.query(query, [taskId]);
        return result;
    }
    static async getTaskAssigneesByUserId(userId) {
        const query = `SELECT * FROM task_assignees WHERE user_id = ?`;
        const [result] = await pool.query(query, [userId]);
        return result;
    }
    static async deleteTaskAssignee(id) {
        const query = `DELETE FROM task_assignees WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows;
    }
    static async deleteTaskAssigneesByTaskId(taskId) {
        const query = `DELETE FROM task_assignees WHERE task_id = ?`;
        const [result] = await pool.query(query, [taskId]);
        return result.affectedRows;
    }
    static async deleteTaskAssigneesByUserId(userId) {
        const query = `DELETE FROM task_assignees WHERE user_id = ?`;
        const [result] = await pool.query(query, [userId]);
        return result.affectedRows;
    }
    static async getAllTaskAssignees() {
        const query = `SELECT * FROM task_assignees`;
        const [result] = await pool.query(query);
        return result;
    }
}

module.exports = TaskAssigneeRepository;