/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // First, drop the deleted_at column from projects table
    await knex.schema.table("projects", function (table) {
        table.dropColumn("deleted_at");
    });

    return knex.schema.createTable("project_members", function (table) {
        table.increments("id").primary();
        table.integer("project_id").unsigned().notNullable();
        table.integer("user_id").unsigned().notNullable();
        table.enum("role", ["viewer", "admin", "member"]).notNullable().defaultTo("viewer");
        table.timestamps(true, true); // created_at + updated_at

        table.foreign("project_id").references("id").inTable("projects").onDelete("CASCADE");
        table.foreign("user_id").references("id").inTable("users");

        table.unique(["project_id", "user_id"]);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("project_members");
    // Then restore the deleted_at column to projects table
    return knex.schema.table("projects", function (table) {
        table.timestamp("deleted_at").nullable();
    });
};
