const { pool } = require("../../config/db");
const redis = require("../../config/redis");
const { addSoftDeleteCondition } = require("../helpers/query.helper");

const PROJECT_CACHE_TTL_SECONDS = 60 * 5; // 5 min
const OWNER_PROJECTS_CACHE_TTL_SECONDS = 60 * 2; // 2 min

function projectVersionKey(projectId) {
    return `project:${projectId}:v`;
}

function ownerProjectsVersionKey(ownerId) {
    return `owner:${ownerId}:projects:v`;
}

async function getOrInitVersion(key) {
    const current = await redis.get(key);
    if (current) return current;
    // Initialize once; ok if raced (SETNX)
    await redis.set(key, "1", "NX", "EX", 60 * 60 * 24 * 30);
    return (await redis.get(key)) || "1";
}

async function bumpVersion(key) {
    // Ensure it exists, then bump; keep around to avoid key churn
    await redis.set(key, "1", "NX", "EX", 60 * 60 * 24 * 30);
    await redis.incr(key);
    await redis.expire(key, 60 * 60 * 24 * 30);
}

async function cacheProjectKey(projectId) {
    const v = await getOrInitVersion(projectVersionKey(projectId));
    return `project:${projectId}:v${v}`;
}

async function cacheOwnerProjectsKey(ownerId) {
    const v = await getOrInitVersion(ownerProjectsVersionKey(ownerId));
    return `owner:${ownerId}:projects:v${v}`;
}

async function invalidateProject(projectId) {
    await bumpVersion(projectVersionKey(projectId));
}

async function invalidateOwnerProjects(ownerId) {
    await bumpVersion(ownerProjectsVersionKey(ownerId));
}

class ProjectRepository {
    static async createProject(name, description, owner_id) {
        const query = `INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)`;
        const [result] = await pool.query(query, [name, description, owner_id]);
        const projectId = result.insertId;
        if (!projectId) return null;

        // Invalidate owner list cache (new project appears)
        await invalidateOwnerProjects(owner_id);
        await this.getProjectById(projectId);
        return projectId;
    }
    static async getProjectById(id) {
        const key = await cacheProjectKey(id);
        const cachedProject = await redis.get(key);
        if (cachedProject) {
            return JSON.parse(cachedProject);
        }
        const query = `SELECT p.*, u.first_name, u.last_name, u.email FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ? AND ${addSoftDeleteCondition('u')}`;
        const [result] = await pool.query(query, [id]);
        if (result[0]) {
            const formatted = this.formatProject(result[0]);
            await redis.set(key, JSON.stringify(formatted), "EX", PROJECT_CACHE_TTL_SECONDS);
            return formatted;
        }
        return null;
    }
    static async updateProject(id, name, description) {
        const oldProject = await this.getProjectById(id);
        if (!oldProject) {
            return 0;
        }
        const query = `UPDATE projects SET name = ?, description = ? WHERE id = ?`;
        const [result] = await pool.query(query, [name, description, id]);
        if (result.affectedRows > 0) {
            await invalidateProject(id);
            await invalidateOwnerProjects(oldProject.ownerDetails?.id);
        }
        return result.affectedRows;
    }
    static async deleteProject(id) {
        const oldProject = await this.getProjectById(id);
        if (!oldProject) {
            return 0;
        }
        const query = `DELETE FROM projects WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        if (result.affectedRows > 0) {
            await invalidateProject(id);
            await invalidateOwnerProjects(oldProject.ownerDetails?.id);
            return 1;
        }
        return 0;
    }
    static async getProjectsByOwnerId(owner_id) {
        const key = await cacheOwnerProjectsKey(owner_id);
        const cachedProjects = await redis.get(key);
        if (cachedProjects) {
            return JSON.parse(cachedProjects);
        }
        const query = `
            SELECT p.*, u.first_name, u.last_name, u.email
            FROM projects p
            LEFT JOIN users u ON p.owner_id = u.id 
            WHERE p.owner_id = ?
            AND ${addSoftDeleteCondition('u')}
            ORDER BY p.id DESC
        `;
        const [rows] = await pool.query(query, [owner_id]);
        const formatted = this.formatProjects(rows);
        await redis.set(key, JSON.stringify(formatted), "EX", OWNER_PROJECTS_CACHE_TTL_SECONDS);
        return formatted;
    }
    static async getAllProjects({
        search,
        page,
        limit,
    } = {}) {
        const offset = (page - 1) * limit;

        // Build a valid query base: WHERE 1=1 lets us append `AND ...`
        let baseQuery = `FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE 1=1 AND ${addSoftDeleteCondition('u')}`;
        let conditions = [];
        let values = [];

        // Search
        if (search) {
            conditions.push(`p.name LIKE ?`);
            values.push(`%${search}%`);
        }

        // Apply conditions
        if (conditions.length > 0) {
            baseQuery += ` AND ${conditions.join(" AND ")}`;
        }

        //Total count query
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const [countResult] = await pool.query(countQuery, values);
        const total = countResult[0].total;

        // Data query
        const dataQuery = `
          SELECT p.*, u.first_name, u.last_name, u.email
          ${baseQuery}
          ORDER BY p.id DESC
          LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query(dataQuery, [...values, limit, offset]);
        return {
            projects: this.formatProjects(rows),
            totalCount: total,
        };
    }

    static formatProject(project) {
        if (project && typeof project === "object" && project.ownerDetails) {
            return project;
        }

        const firstName = project?.first_name || "";
        const lastName = project?.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || null;
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            ownerDetails: {
                id: project.owner_id,
                name: fullName,
                email: project?.email || null,
            },
            createdAt: project.created_at,
            updatedAt: project.updated_at,
        };
    }

    static formatProjects(projects) {
        return projects.map(project => this.formatProject(project));
    }
}

module.exports = ProjectRepository;