const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET Empty Depot Inventory
router.get('/inventory', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM empty_depot_inventory ORDER BY id ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching empty inventory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Empty Pickup Orders
router.get('/orders', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM empty_pickup_orders ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching empty pickup orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Create Empty Pickup Order
router.post('/orders', async (req, res) => {
  try {
    const o = req.body;
    const countRes = await db.query('SELECT COUNT(*) FROM empty_pickup_orders');
    const seq = String(Number(countRes.rows[0].count) + 1).padStart(4, '0');
    const orderNo = o.orderNo || ('EPO-2026-' + seq);
    const id = 'EPO-' + orderNo;

    const query = `
      INSERT INTO empty_pickup_orders (
        id, order_no, shipping_line, depot_location, booking_ref,
        container_count, size_type, transporter, valid_until, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      id,
      orderNo,
      o.shippingLine || 'Maersk Line',
      o.depotLocation || 'Dadri CONCOR ICD Depot',
      o.bookingRef || ('MSK-DEL-' + Math.floor(100000 + Math.random() * 900000)),
      Number(o.containerCount) || 1,
      o.sizeType || '40HC',
      o.transporter || 'Dadri Express Logistics',
      o.validUntil || new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
      'ACTIVE'
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error creating empty pickup order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
