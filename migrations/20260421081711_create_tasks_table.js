/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("tasks", function (table) {
        table.increments("id").primary();
        table.string("title").notNullable();
        table.string("description").nullable();
        table.enum("status", ["todo", "in_progress", "in_review", "done", "blocked"]).notNullable().defaultTo("todo");
        table.enum("priority", ["low", "medium", "high", "critical"]).notNullable().defaultTo("low");
        table.date("due_date").nullable();
        table.integer("project_id").unsigned().notNullable();
        table.integer("created_by").unsigned().notNullable();
        table.timestamps(true, true); // created_at + updated_at

        table.foreign("project_id").references("id").inTable("projects").onDelete("CASCADE");
        table.foreign("created_by").references("id").inTable("users");

        table.index(["project_id", "status"], "idx_tasks_project_status");
        table.index(["project_id", "priority"], "idx_tasks_project_priority");
        table.index(["project_id", "due_date"], "idx_tasks_project_due_date");
        table.index(["created_by"], "idx_tasks_created_by");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists("tasks");
};
