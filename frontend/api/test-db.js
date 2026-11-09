import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || '103.197.76.251',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'SPJ#Secured!2026@Database',
  database: process.env.PGDATABASE || 'forwarder_db',
  connectionTimeoutMillis: 5000,
  ssl: false
});

export default async function handler(req, res) {
  try {
    const start = Date.now();
    const result = await pool.query("SELECT NOW() as db_time, count(*) as tables FROM information_schema.tables WHERE table_schema = 'spjlive'");
    const elapsed = Date.now() - start;
    return res.status(200).json({
      success: true,
      message: 'Direct Vercel Serverless to Postgres SUCCESSFUL!',
      latency: `${elapsed}ms`,
      time: result.rows[0].db_time,
      tables: result.rows[0].tables
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      source: 'Vercel Serverless',
      error: err.message
    });
  }
}

