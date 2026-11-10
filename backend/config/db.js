const { Pool } = require('pg');

// Robust configuration supporting discrete PG* vars and connection string
const poolConfig = {
  host: process.env.PGHOST || '103.197.76.251',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'SPJ#Secured!2026@Database',
  database: process.env.PGDATABASE || 'forwarder_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false
};

// If discrete password not supplied but DATABASE_URL exists, fallback to connectionString
if (!process.env.PGPASSWORD && process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  // console.log('Connected to PostgreSQL Database (forwarder_db)');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL Pool Error:', err);
});

// Auto-ensure required columns exist in production
(async () => {
  try {
    await pool.query('ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS equipment_breakdown JSONB;');
    await pool.query('ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS jo_date DATE;');
    await pool.query('ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS commodity VARCHAR(255);');
    await pool.query('ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS handover_location VARCHAR(255);');
  } catch (e) {}
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
