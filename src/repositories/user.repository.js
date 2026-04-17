const { pool } = require("../../config/db");
const redis = require("../../config/redis");
const { addSoftDeleteCondition } = require("../helpers/query.helper");
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days
class UserRepository {
  static async createUser(first_name, last_name, email, password_hash) {
    const query = `INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.query(query, [
      first_name,
      last_name,
      email,
      password_hash,
    ]);
    if (result.insertId) {
      // invalidate cache
      await redis.del(cacheKeyStats());
      return result.insertId;
    }
    return null;
  }
  static async getUserByEmail(email) {
    const cachedUser = await redis.get(cahceKeyEmail(email));
    if (cachedUser) {
      const user = JSON.parse(cachedUser);
      if (!user.deleted_at) {
        return user;
      }
      await redis.del(cahceKeyEmail(email));
      return null;
    }
    const query = `SELECT * FROM users WHERE email = ? AND ${addSoftDeleteCondition()}`;
    const [result] = await pool.query(query, [email]);
    const user = result[0];
    if (user) {
      await redis.set(
        cahceKeyEmail(email),
        JSON.stringify(user),
        "EX",
        CACHE_TTL,
      );
    }
    return user;
  }
  static async getUserById(id) {
    const cachedUser = await redis.get(cahceKeyId(id));
    if (cachedUser) {
      const user = JSON.parse(cachedUser);
      if (!user.deleted_at) {
        return user;
      }
      await redis.del(cahceKeyId(id));
      return null;
    }
    const query = `SELECT * FROM users WHERE id = ? AND ${addSoftDeleteCondition()}`;
    const [result] = await pool.query(query, [id]);
    const user = result[0];
    if (user) {
      await redis.set(cahceKeyId(id), JSON.stringify(user), "EX", CACHE_TTL);
    }
    return user;
  }
  static async updateUser(id, first_name, last_name, email) {
    const query = `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?`;
    const [result] = await pool.query(query, [
      first_name,
      last_name,
      email,
      id,
    ]);
    if (result.affectedRows > 0) {
      // invalidate cache
      await redis.del(cahceKeyId(id));
      await redis.del(cahceKeyEmail(email));
    }

    return result.affectedRows;
  }
  static async deleteUser(id) {
    const oldUser = await this.getUserById(id);
    const query = `UPDATE users SET deleted_at = NOW() WHERE id = ? AND ${addSoftDeleteCondition()}`;
    const [result] = await pool.query(query, [id]);
    if (result.affectedRows > 0) {
      // invalidate cache
      await redis.del(cahceKeyId(id));
      await redis.del(cahceKeyEmail(oldUser.email));
      await redis.del(cacheKeyStats());
    }
    return result.affectedRows;
  }
  //for admin dashboard
  static async getAllUsers({
    status,
    search,
    page,
    limit,
  } = {}) {
    let query = `SELECT * FROM users`;
    let conditions = [];
    let values = [];

    // Status filter
    if (status === "active") {
      conditions.push(addSoftDeleteCondition());
    } else if (status === "deleted") {
      conditions.push("deleted_at IS NOT NULL");
    }

    // Search filter
    if (search) {
      conditions.push(`
        (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
      `);

      const searchValue = `%${search}%`;
      values.push(searchValue, searchValue, searchValue);
    }

    // Apply WHERE
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    values.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, values);

    // Total count (for pagination metadata)
    let countQuery = `SELECT COUNT(*) as total FROM users`;
    let countValues = [];

    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(" AND ")}`;
      countValues = values.slice(0, values.length - 2); // remove limit/offset
    }

    const [countResult] = await pool.query(countQuery, countValues);
    const total = countResult[0].total;

    return {
      data: rows,
      totalCount: total,
    };
  }
  static async getUserStats() {
    const cached = await redis.get(cacheKeyStats());
    if (cached) {
      return JSON.parse(cached);
    }
    const query = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deleted
    FROM users
  `;
    const [result] = await pool.query(query);
    const stats = result[0];
    await redis.set(cacheKeyStats(), JSON.stringify(stats), "EX", CACHE_TTL);
    return stats;
  }
}

function cahceKeyEmail(key) {
  return `user:email:${key}`;
}
function cahceKeyId(key) {
  return `user:id:${key}`;
}
function cacheKeyStats() {
  return `user:stats`;
}

module.exports = UserRepository;
