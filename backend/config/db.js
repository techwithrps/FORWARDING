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
    await pool.query(`
      ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS equipment_breakdown JSONB;
      ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS jo_date DATE;
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS commodity VARCHAR(255);
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS handover_location VARCHAR(255);
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS deck_tier VARCHAR(20) DEFAULT 'LOWER';
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS sb_no VARCHAR(100);
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS sb_date DATE;
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(100);
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS invoice_date DATE;
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS consignee_name VARCHAR(255);
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS item_description TEXT;
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS customs_dossier JSONB;
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS net_weight NUMERIC;
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS dbk_code VARCHAR(50);
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS trade_scheme VARCHAR(100);
      ALTER TABLE job_containers ADD COLUMN IF NOT EXISTS producer_plant VARCHAR(255);
      ALTER TABLE parties ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE company_profile ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE company_profile ADD COLUMN IF NOT EXISTS logo_doc TEXT;
      ALTER TABLE company_profile ADD COLUMN IF NOT EXISTS msme_doc TEXT;
    `);
  } catch (e) {}
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
