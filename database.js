const mysql = require('mysql2/promise'); // Using mysql2 for promise support
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost', // Default to localhost if not set
  user: process.env.DB_USER || 'root',      // Default to root if not set
  password: process.env.DB_PASS || 12345678,     // Default password if not set
  database: process.env.DB_NAME || 'assignment_db',   // Default database if not set
  
};

let pool = null;         //pool variable to hold the connection pool

async function getPool() {     // Function to get or create the connection pool
  if (!pool) {
    pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// Function to ensure the required database schema exists
async function ensureSchema() {
  const p = await getPool();
  const createSql = `
  CREATE TABLE IF NOT EXISTS mysql_table (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(20) NOT NULL,
    second_name VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number CHAR(10) NOT NULL,
    eircode CHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await p.query(createSql); // Execute the table creation query
}

module.exports = { getPool, ensureSchema }; // Export the functions for use in other modules