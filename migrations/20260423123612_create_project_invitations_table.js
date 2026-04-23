/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("project_invitations", function (table) {
        table.increments("id").primary();
        table.integer("project_id").unsigned().notNullable();
        table.integer("invited_user_id").unsigned().notNullable();
        table.integer("invited_by").unsigned().notNullable();
        table.enum("status", ["pending", "accepted", "rejected"]).defaultTo("pending");
        table.string("token", 255).notNullable().unique();
        table.timestamps(true, true); // created_at + updated_at

        table.foreign("project_id").references("id").inTable("projects").onDelete("CASCADE");
        table.foreign("invited_user_id").references("id").inTable("users");
        table.foreign("invited_by").references("id").inTable("users");

        table.unique(["project_id", "invited_user_id"]);

        table.index(["invited_user_id"], "idx_project_invitations_invited_user_id");
        table.index(["invited_by"], "idx_project_invitations_invited_by");
        table.index(["project_id"], "idx_project_invitations_project_id");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists("project_invitations");
};
