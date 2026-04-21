/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable("task_comments", function (table) {
        table.increments("id").primary();
        table.integer("task_id").unsigned().notNullable();
        table.integer("user_id").unsigned().notNullable();
        table.text("comment").notNullable();
        table.timestamps(true, true); // created_at + updated_at

        table.foreign("task_id").references("id").inTable("tasks").onDelete("CASCADE");
        table.foreign("user_id").references("id").inTable("users");

        table.index(["task_id"], "idx_task_comments_task_id");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists("task_comments");
};
