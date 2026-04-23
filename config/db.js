const mysql = require("mysql2/promise");
require("dotenv").config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   port: Number(process.env.DB_PORT),
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: process.env.DB_POOL_LIMIT || 10,
//   queueLimit: 0,
// });

const pool = mysql.createPool(process.env.DATABASE_URL);

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connected successfully");
    conn.release();
  } catch (err) {
    console.error("MySQL connection failed:", err.message);
  }
}

module.exports = {
  pool,
  testConnection,
};
