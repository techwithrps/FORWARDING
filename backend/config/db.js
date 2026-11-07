const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://iamrps@localhost:5432/forwarder_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false
});

pool.on('connect', () => {
  // console.log('Connected to PostgreSQL Database (forwarder_db)');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL Pool Error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
