const { pool } = require("../../config/db");

class TaskRepository {
    static async createTask(projectId, title, description, status = "todo", priority = "low", dueDate, createdBy) {
        const query = `INSERT INTO tasks (title, description, project_id, created_by, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(query, [title, description, projectId, createdBy, status, priority, dueDate]);
        return result.insertId;
    }
    static async getTaskById(id) {
        const query = `SELECT * FROM tasks WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return this.formatTask(result[0]);
    }
    static async updateTask(id, title, description, status, priority, dueDate) {
        const query = `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ?`;
        const [result] = await pool.query(query, [title, description, status, priority, dueDate, id]);
        return result.affectedRows;
    }
    static async deleteTask(id) {
        const query = `DELETE FROM tasks WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows;
    }
    static async getAllTasks({
        projectId,
        page,
        limit,
        status,
        priority,
        search,
        assigneeName,
        sortBy = "t.created_at",
        sortOrder = "DESC"
    }) {
        const offset = (page - 1) * limit;

        const allowedSortFields = [
            "t.created_at",
            "t.updated_at",
            "t.priority",
            "t.status",
            "t.title"
        ];

        if (!allowedSortFields.includes(sortBy)) {
            sortBy = "t.created_at";
        }

        sortOrder = sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

        let conditions = [`t.project_id = ?`];
        let values = [Number(projectId)];

        if (status) {
            conditions.push(`t.status = ?`);
            values.push(status);
        }

        if (priority) {
            conditions.push(`t.priority = ?`);
            values.push(priority);
        }

        if (search) {
            conditions.push(`t.title LIKE ?`);
            values.push(`%${search}%`);
        }

        if (assigneeName) {
            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM task_assignees ta
                    JOIN users u ON u.id = ta.user_id
                    WHERE ta.task_id = t.id
                    AND (
                        u.first_name LIKE ?
                        OR u.last_name LIKE ?
                    )
                )
            `);
            values.push(`%${assigneeName}%`, `%${assigneeName}%`);
        }

        const whereClause = conditions.join(" AND ");

        // Total count query
        const countQuery = `
            SELECT COUNT(*) as total
            FROM tasks t
            WHERE ${whereClause}
        `;

        const [[countResult]] = await pool.query(countQuery, values);
        const total = countResult.total;

        // Task query
        const taskQuery = `
            SELECT 
                t.id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.project_id,
                t.created_at,
                t.updated_at,
    
                creator.id AS creator_id,
                creator.first_name AS creator_first_name,
                creator.last_name AS creator_last_name,
                creator.email AS creator_email
    
            FROM tasks t
            LEFT JOIN users creator ON creator.id = t.created_by
            WHERE ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        const [tasks] = await pool.query(taskQuery, [...values, Number(limit), Number(offset)]);

        if (!tasks.length) {
            return {
                totalCount: 0,
                tasks: []
            };
        }

        const taskIds = tasks.map(task => task.id);

        const assigneeQuery = `
            SELECT 
                ta.task_id,
                u.id,
                u.first_name,
                u.last_name,
                u.email
            FROM task_assignees ta
            JOIN users u ON u.id = ta.user_id
            WHERE ta.task_id IN (?)
        `;

        const [assignees] = await pool.query(assigneeQuery, [taskIds]);

        const assigneeMap = {};

        assignees.forEach(a => {
            if (!assigneeMap[a.task_id]) assigneeMap[a.task_id] = [];
            assigneeMap[a.task_id].push({
                id: a.id,
                firstName: `${a.first_name} ${a.last_name}`,
                email: a.email,
            });
        });

        const formattedTasks = tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.due_date,
            projectId: task.project_id,
            createdBy: {
                id: task.creator_id,
                name: `${task.creator_first_name} ${task.creator_last_name}`,
                email: task.creator_email,
            },
            assignees: assigneeMap[task.id] || [],
            createdAt: task.created_at,
            updatedAt: task.updated_at || task.created_at,
        }));

        return {
            totalCount: total,
            tasks: formattedTasks
        };
    }

    static formatTask(task) {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.due_date,
            projectId: task.project_id,
            createdBy: {
                id: task.created_by.id,
                firstName: `${task.created_by.first_name} ${task.created_by.last_name}`,
                email: task.created_by.email,
            },
            createdAt: task.created_at,
            updatedAt: task.updated_at || task.created_at,
        };
    }
}

module.exports = TaskRepository;