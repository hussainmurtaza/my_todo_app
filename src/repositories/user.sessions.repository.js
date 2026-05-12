const { pool } = require("../../config/db");
const crypto = require("crypto");

class UserSessionsRepository {
    static hashToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
    static generateSessionId() {
        return crypto.randomUUID();
    }
    static async createSession(userId, ipAddress, deviceInfo) {
        const sessionId = this.generateSessionId();
        const refreshToken = crypto.randomBytes(64).toString("hex");
        const refreshTokenHash = this.hashToken(refreshToken);
        const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        );
        const query = `
        INSERT INTO user_sessions (
            session_id,
            user_id,
            refresh_token_hash,
            ip_address,
            device_info,
            expires_at,
            last_used_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `
        await pool.query(query, [
            sessionId,
            userId,
            refreshTokenHash,
            ipAddress,
            deviceInfo,
            expiresAt,
        ]);

        return {
            sessionId,
            refreshToken,
            expiresAt,
        };
    }
    static async findSessionByRefreshToken(refreshToken) {
        const refreshTokenHash = this.hashToken(refreshToken);

        const query = `
            SELECT *
            FROM user_sessions
            WHERE refresh_token_hash = ?
            AND is_revoked = FALSE
            AND expires_at > NOW()
            LIMIT 1
        `;

        const [rows] = await pool.query(query, [refreshTokenHash]);

        return rows[0] || null;
    }
    static async rotateRefreshToken(sessionId) {
        const newRefreshToken = crypto.randomBytes(64).toString("hex");

        const newRefreshTokenHash =
            this.hashToken(newRefreshToken);

        const newExpiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        );

        const query = `
            UPDATE user_sessions
            SET
                refresh_token_hash = ?,
                expires_at = ?,
                last_used_at = NOW(),
                updated_at = NOW()
            WHERE session_id = ?
        `;

        await pool.query(query, [
            newRefreshTokenHash,
            newExpiresAt,
            sessionId,
        ]);

        return {
            refreshToken: newRefreshToken,
            expiresAt: newExpiresAt,
        };
    }
    static async revokeSession(sessionId) {
        const query = `
            UPDATE user_sessions
            SET
                is_revoked = TRUE,
                revoked_at = NOW(),
                updated_at = NOW()
            WHERE session_id = ?
        `;

        await pool.query(query, [sessionId]);
    }
    static async revokeAllUserSessions(userId) {
        const query = `
            UPDATE user_sessions
            SET
                is_revoked = TRUE,
                revoked_at = NOW(),
                updated_at = NOW()
            WHERE user_id = ?
        `;

        await pool.query(query, [userId]);
    }
    static async updateLastUsed(sessionId) {
        const query = `
            UPDATE user_sessions
            SET
                last_used_at = NOW(),
                updated_at = NOW()
            WHERE session_id = ?
        `;

        await pool.query(query, [sessionId]);
    }
}
module.exports = UserSessionsRepository;