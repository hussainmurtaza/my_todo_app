/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // 1. Add normal indexes using schema builder
    await knex.schema.alterTable("users", (table) => {
      table.index(["email"], "idx_users_email");
  
      table.index(["first_name", "deleted_at"], "idx_users_firstname_deleted");
      table.index(["last_name", "deleted_at"], "idx_users_lastname_deleted");
      table.index(["email", "deleted_at"], "idx_users_email_deleted");
    });
  
    // 2. FULLTEXT index (must use raw)
    await knex.raw(`
      ALTER TABLE users 
      ADD FULLTEXT INDEX ft_users_search (first_name, last_name, email)
    `);
  };
  
  exports.down = async function (knex) {
    // Drop FULLTEXT first
    await knex.raw(`
      ALTER TABLE users 
      DROP INDEX ft_users_search
    `);
  
    // Drop normal indexes
    await knex.schema.alterTable("users", (table) => {
      table.dropIndex(["email"], "idx_users_email");
  
      table.dropIndex(
        ["first_name", "deleted_at"],
        "idx_users_firstname_deleted"
      );
  
      table.dropIndex(
        ["last_name", "deleted_at"],
        "idx_users_lastname_deleted"
      );
  
      table.dropIndex(
        ["email", "deleted_at"],
        "idx_users_email_deleted"
      );
    });
  };