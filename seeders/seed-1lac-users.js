const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
require("dotenv").config();

const TOTAL_USERS = 100000;
const BATCH_SIZE = 5000;

async function seedUsers() {
  console.time("Seeding Time", process.env.ENV);

  if (process.env.ENV !== "development") {
    console.log("Seeding blocked in production");
    process.exit();
  }

  const password = await bcrypt.hash("123456", 10);

  let inserted = 0;

  while (inserted < TOTAL_USERS) {
    const users = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const id = inserted + i + 1;

      users.push([
        `User${id}`,
        "Test",
        `user${id}@test.com`,
        password,
        new Date(),
        new Date(),
        id % 10 === 0 ? new Date() : null, // 10% deleted
      ]);
    }

    const query = `
      INSERT INTO users 
      (first_name, last_name, email, password_hash, created_at, updated_at, deleted_at)
      VALUES ?
    `;

    await pool.query(query, [users]);

    inserted += BATCH_SIZE;

    console.log(`Inserted: ${inserted}/${TOTAL_USERS}`);
  }

  console.timeEnd("Seeding Time");
}

seedUsers().catch(console.error);
