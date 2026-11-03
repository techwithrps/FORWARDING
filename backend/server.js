const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const mastersRouter = require('./routes/masters');
const bookingsRouter = require('./routes/bookings');
const operationsRouter = require('./routes/operations');
const commercialRouter = require('./routes/commercial');
const emptyRouter = require('./routes/empty');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  // console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbRes = await db.query('SELECT NOW() as db_time');
    res.json({
      status: 'UP',
      service: 'Forwarder 2.0 (eLOGiFreight™) PostgreSQL Backend',
      dbConnected: true,
      dbTime: dbRes.rows[0].db_time
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Forwarder 2.0 (eLOGiFreight™) Core API Engine',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      masters: '/api/v1/masters',
      bookings: '/api/v1/bookings',
      operations: '/api/v1/operations',
      commercial: '/api/v1/commercial',
      empty: '/api/v1/empty'
    }
  });
});

// Mount Routes
app.use('/api/v1/masters', mastersRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/operations', operationsRouter);
app.use('/api/v1/commercial', commercialRouter);
app.use('/api/v1/empty', emptyRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Forwarder 2.0 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Connected to PostgreSQL (forwarder_db)`);
  console.log(`=======================================================`);
});
