/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("user_sessions", function (table) {
        table.increments("id").primary();
        table.integer("user_id").unsigned().notNullable();
        table.string("session_id", 36).notNullable().unique();
        table.string("refresh_token_hash", 255).notNullable().unique();
        table.text("device_info").nullable();
        table.string("ip_address", 45).nullable();
        table.boolean("is_revoked").defaultTo(false);
        table.timestamp("expires_at").nullable();
        table.timestamp("last_used_at").nullable();
        table.timestamp("revoked_at").nullable();
        table.timestamps(true, true); // created_at + updated_at
        table.foreign("user_id").references("id").inTable("users");

        table.index("user_id");
        table.index("expires_at");
        table.index("is_revoked");
        table.index(["user_id", "is_revoked"]);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists("user_sessions");
};
