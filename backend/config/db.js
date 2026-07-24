const { Pool } = require('pg');
require('dotenv').config();

// Single shared connection pool. All controllers import `query` from here
// instead of opening their own client, so connections are reused properly.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
