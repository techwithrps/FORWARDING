const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================================
// 1. INVOICES
// ============================================================================
router.get('/invoices', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/invoices', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const inv = req.body;
    await client.query('BEGIN');

    const countRes = await client.query('SELECT COUNT(*) FROM invoices');
    const invSeq = String(Number(countRes.rows[0].count) + 1).padStart(4, '0');
    const invoiceNumber = inv.invoiceNumber || ('INV-2026-' + invSeq);
    const invoiceId = 'INV-' + invoiceNumber;

    const taxable = Number(inv.taxableAmount) || Number(inv.totalTaxable) || 125000;
    const cgst = Number(inv.cgstAmount) || 0;
    const sgst = Number(inv.sgstAmount) || 0;
    const igst = Number(inv.igstAmount) || 0;
    const totalTax = cgst + sgst + igst;
    const grandTotal = taxable + totalTax;

    const query = `
      INSERT INTO invoices (
        id, invoice_number, invoice_type, job_id, job_number, party_name,
        party_gstin, party_state, is_lut, taxable_amount, cgst_amount,
        sgst_amount, igst_amount, total_tax, grand_total, irn_number,
        payment_status, due_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *;
    `;
    const values = [
      invoiceId,
      invoiceNumber,
      inv.invoiceType || 'SALES',
      inv.jobId || null,
      inv.jobNumber || 'JO-2026-0001',
      inv.partyName || 'Fair Exports (India) Pvt Ltd',
      inv.partyGstin || '07AAACF3489K1Z5',
      inv.partyState || 'Delhi',
      inv.isLut === true,
      taxable,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal,
      inv.irnNumber || ('IRN-' + Math.floor(1000000000 + Math.random() * 9000000000)),
      'UNPAID',
      inv.dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
    ];
    const { rows } = await client.query(query, values);
    const createdInv = rows[0];

    // If items provided, insert into invoice_items
    if (Array.isArray(inv.items) && inv.items.length > 0) {
      for (const item of inv.items) {
        await client.query(`
          INSERT INTO invoice_items (id, invoice_id, charge_name, sac_code, rate, quantity, amount, gst_rate, is_lut)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          invoiceId + '-' + Math.floor(1000 + Math.random() * 9000),
          invoiceId,
          item.chargeName || 'Ocean Freight',
          item.sacCode || '996511',
          Number(item.rate) || 0,
          Number(item.quantity) || 1,
          Number(item.amount) || 0,
          Number(item.gstRate) || 18,
          inv.isLut === true
        ]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: createdInv });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// 2. CREDIT & DEBIT NOTES (GST SECTION 34)
// ============================================================================
router.get('/notes', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM credit_debit_notes ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching credit/debit notes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/notes', async (req, res) => {
  try {
    const n = req.body;
    const prefix = n.noteType === 'CREDIT' ? 'CN-2026-' : 'DN-2026-';
    const countRes = await db.query('SELECT COUNT(*) FROM credit_debit_notes WHERE note_type = $1', [n.noteType || 'CREDIT']);
    const seq = String(Number(countRes.rows[0].count) + 1).padStart(4, '0');
    const noteNumber = n.noteNumber || (prefix + seq);
    const noteId = 'NOTE-' + noteNumber;

    const taxable = Number(n.taxableAmount) || 5000;
    const tax = Number(n.totalTax) || 900;
    const grandTotal = taxable + tax;

    const query = `
      INSERT INTO credit_debit_notes (
        id, note_number, note_type, original_invoice_no, original_invoice_date,
        job_number, party_name, party_gstin, reason_code, taxable_amount,
        total_tax, grand_total, status, remarks
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *;
    `;
    const values = [
      noteId,
      noteNumber,
      n.noteType || 'CREDIT',
      n.originalInvoiceNo || 'INV-2026-0001',
      n.originalInvoiceDate || new Date().toISOString().split('T')[0],
      n.jobNumber || 'JO-2026-0001',
      n.partyName || 'Fair Exports (India) Pvt Ltd',
      n.partyGstin || '07AAACF3489K1Z5',
      n.reasonCode || 'RATE_CORRECTION',
      taxable,
      tax,
      grandTotal,
      'ISSUED',
      n.remarks || ''
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error creating credit/debit note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. COMMERCIAL FINANCIAL REPORTS (P&L, AGING, GSTR-1)
// ============================================================================
router.get('/reports', async (req, res) => {
  try {
    const jobsRes = await db.query('SELECT * FROM job_orders ORDER BY created_at DESC');
    const invRes = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');

    const totalSales = jobsRes.rows.reduce((sum, j) => sum + (Number(j.sell_freight) || 0), 0);
    const totalCost = jobsRes.rows.reduce((sum, j) => sum + (Number(j.buy_freight) || 0), 0);
    const netProfit = totalSales - totalCost;
    const marginPct = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

    res.json({
      success: true,
      summary: {
        totalSales,
        totalCost,
        netProfit,
        marginPct
      },
      jobs: jobsRes.rows,
      invoices: invRes.rows
    });
  } catch (err) {
    console.error('Error generating commercial reports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
