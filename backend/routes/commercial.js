const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================================
// 1. INVOICES
// ============================================================================
router.get('/invoices', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT i.*, 
        p.contact_person AS party_contact_person,
        COALESCE(p.mobile, p.contact_no) AS party_mobile,
        COALESCE(p.email_comm, p.email_ops) AS party_email,
        COALESCE(
          (
            SELECT json_agg(it.* ORDER BY it.id ASC)
            FROM invoice_items it 
            WHERE it.invoice_id = i.id
          ),
          '[]'::json
        ) AS items
      FROM invoices i
      LEFT JOIN LATERAL (
        SELECT contact_person, mobile, contact_no, email_comm, email_ops 
        FROM parties p 
        WHERE (i.party_id IS NOT NULL AND i.party_id = p.id) 
           OR LOWER(TRIM(i.party_name)) = LOWER(TRIM(p.name)) 
        LIMIT 1
      ) p ON true
      ORDER BY i.created_at DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invRes = await db.query(`
      SELECT i.*,
        p.contact_person AS party_contact_person,
        COALESCE(p.mobile, p.contact_no) AS party_mobile,
        COALESCE(p.email_comm, p.email_ops) AS party_email
      FROM invoices i
      LEFT JOIN LATERAL (
        SELECT contact_person, mobile, contact_no, email_comm, email_ops 
        FROM parties p 
        WHERE (i.party_id IS NOT NULL AND i.party_id = p.id) 
           OR LOWER(TRIM(i.party_name)) = LOWER(TRIM(p.name)) 
        LIMIT 1
      ) p ON true
      WHERE i.id = $1 OR i.invoice_number = $1
    `, [id]);
    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    const inv = invRes.rows[0];
    const itemsRes = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC', [inv.id]);
    inv.items = itemsRes.rows;
    res.json({ success: true, data: inv });
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/invoices/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { rows } = await db.query(
      'UPDATE invoices SET payment_status = $1 WHERE id = $2 OR invoice_number = $2 RETURNING *',
      [status || 'PAID', id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/invoices/:id', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
    const delRes = await client.query('DELETE FROM invoices WHERE id = $1 OR invoice_number = $1 RETURNING *', [id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Invoice deleted', data: delRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

router.post('/invoices/:id/dispatch-demo', async (req, res) => {
  try {
    const { id } = req.params;
    const { channel, recipient, contactPerson } = req.body;
    const dispatchRecord = {
      channel: channel || 'WHATSAPP',
      recipient: recipient,
      contactPerson: contactPerson,
      sentAt: new Date().toISOString(),
      status: 'DEMO_DELIVERED',
      simulatedGatewayId: channel === 'WHATSAPP' 
        ? `wamid.HBgL${Date.now()}==` 
        : `msg_${Date.now()}@relay.elogisol.internal`
    };

    // Update raw_data on invoice if exists
    await db.query(`
      UPDATE invoices
      SET raw_data = COALESCE(raw_data, '{}'::jsonb) || jsonb_build_object('last_dispatch', $1::jsonb)
      WHERE id = $2 OR invoice_number = $2
    `, [JSON.stringify(dispatchRecord), id]);

    res.json({
      success: true,
      message: `Demo dispatch simulated successfully via ${channel}`,
      data: dispatchRecord
    });
  } catch (err) {
    console.error('Error recording demo dispatch:', err);
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

    const taxable = Number(inv.taxableAmount) || Number(inv.totalTaxable) || 0;
    const cgst = Number(inv.cgstAmount) || 0;
    const sgst = Number(inv.sgstAmount) || 0;
    const igst = Number(inv.igstAmount) || 0;
    const totalTax = cgst + sgst + igst;
    const grandTotal = Number(inv.grandTotal) || (taxable + totalTax);

    const query = `
      INSERT INTO invoices (
        id, invoice_number, invoice_type, invoice_date, job_id, job_number, party_id, party_name,
        party_gstin, party_state, party_address, place_of_supply, pos_state_code,
        is_lut, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_tax, grand_total,
        irn_number, ack_no, ack_date, qr_data, origin, pod, line, vessel, voyage,
        bl_no, sb_no, sb_date, container_count, container_nos, remarks, raw_data,
        payment_status, due_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35, $36,
        $37, $38
      ) RETURNING *;
    `;
    const values = [
      invoiceId,
      invoiceNumber,
      inv.invoiceType || 'TAX INVOICE',
      inv.invoiceDate || new Date().toISOString().split('T')[0],
      inv.jobId || null,
      inv.jobNumber || null,
      inv.partyId || null,
      inv.partyName || 'Customer / Consignor',
      inv.partyGstin || '',
      inv.partyState || '',
      inv.partyAddress || '',
      inv.placeOfSupply || '',
      inv.posStateCode || '',
      inv.isLut === true,
      taxable,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal,
      inv.irnNumber || ('IRN-' + Math.floor(1000000000 + Math.random() * 9000000000)),
      inv.ackNo || ('122610' + Math.floor(10000 + Math.random() * 90000)),
      inv.ackDate || new Date().toISOString().split('T')[0],
      inv.qrData || null,
      inv.origin || '',
      inv.pod || '',
      inv.line || '',
      inv.vessel || '',
      inv.voyage || '',
      inv.blNo || '',
      inv.sbNo || '',
      inv.sbDate || null,
      Number(inv.containerCount) || 1,
      inv.containerNos || '',
      inv.remarks || '',
      JSON.stringify(inv.rawData || inv),
      inv.paymentStatus || 'UNPAID',
      inv.dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
    ];
    const { rows } = await client.query(query, values);
    const createdInv = rows[0];

    // If items provided, insert into invoice_items
    if (Array.isArray(inv.items) && inv.items.length > 0) {
      let idx = 1;
      for (const item of inv.items) {
        const itemTaxable = Number(item.amount) || (Number(item.rate || 0) * Number(item.quantity || item.qty || 1));
        const itemCgst = Number(item.cgstAmount) || 0;
        const itemSgst = Number(item.sgstAmount) || 0;
        const itemIgst = Number(item.igstAmount) || 0;
        const itemTotal = Number(item.totalAmount) || (itemTaxable + itemCgst + itemSgst + itemIgst);

        await client.query(`
          INSERT INTO invoice_items (
            id, invoice_id, service_id, service_code, tax_head_id, charge_name,
            sac_code, rate, quantity, uom, amount, gst_rate, cgst_amount,
            sgst_amount, igst_amount, total_amount, is_lut
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
        `, [
          invoiceId + '-' + String(idx++).padStart(3, '0'),
          invoiceId,
          item.serviceId || null,
          item.serviceCode || null,
          item.taxHeadId || null,
          item.chargeName || item.head || 'Service Charge',
          item.sacCode || item.sac || '996511',
          Number(item.rate) || 0,
          Number(item.quantity || item.qty) || 1,
          item.uom || 'UNIT',
          itemTaxable,
          Number(item.gstRate || item.taxRate) || 0,
          itemCgst,
          itemSgst,
          itemIgst,
          itemTotal,
          inv.isLut === true
        ]);
      }
    }

    await client.query('COMMIT');

    // Fetch complete created invoice with items
    const fullItems = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC', [invoiceId]);
    createdInv.items = fullItems.rows;

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
