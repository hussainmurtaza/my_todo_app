/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("projects", function (table) {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("description").nullable();
        table.integer("owner_id").unsigned().notNullable();
        table.timestamps(true, true); // created_at + updated_at
        table.timestamp("deleted_at").nullable();

        table.foreign("owner_id").references("id").inTable("users");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists("projects");
};
