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
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS party_address TEXT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pos_state_code VARCHAR(10);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ack_no VARCHAR(100);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ack_date DATE;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qr_data TEXT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS origin VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pod VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vessel VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS voyage VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bl_no VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sb_no VARCHAR(255);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sb_date DATE;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS container_count INTEGER DEFAULT 1;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS container_nos TEXT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS remarks TEXT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS service_id VARCHAR(100);
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS service_code VARCHAR(100);
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_head_id VARCHAR(100);
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS uom VARCHAR(50);
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(15,2) DEFAULT 0;
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(15,2) DEFAULT 0;
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(15,2) DEFAULT 0;
      ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2) DEFAULT 0;
    `);
  } catch (e) {}
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
