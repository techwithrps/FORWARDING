const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all job bookings with their containers
router.get('/', async (req, res) => {
  try {
    const jobsRes = await db.query('SELECT * FROM job_orders ORDER BY created_at DESC');
    const jobs = jobsRes.rows;

    const containersRes = await db.query('SELECT * FROM job_containers ORDER BY created_at ASC');
    const allContainers = containersRes.rows;

    // Attach containers to their respective job
    const combined = jobs.map(job => {
      const containers = allContainers
        .filter(c => c.job_id === job.id)
        .map(c => ({
          id: c.id,
          containerNo: c.container_number,
          sizeType: c.size_type,
          tareWeight: Number(c.tare_weight) || 0,
          grossWeight: Number(c.gross_weight) || 0,
          cargoWeight: Number(c.cargo_weight) || 0,
          sealNo: c.seal_number || '',
          agentSeal: c.agent_seal || c.custom_seal || '',
          grNumber: c.gr_number || '',
          grDate: c.gr_date || null,
          truckNo: c.truck_number || '',
          driverName: c.driver_name || '',
          driverMobile: c.driver_mobile || '',
          status: c.current_status || 'ALLOTTED',
          milestoneDates: c.milestone_dates || {}
        }));

      return {
        id: job.id,
        joNo: job.job_number,
        bookingNo: job.booking_no,
        consignor: job.customer_name,
        customerName: job.customer_name,
        shippingLine: job.shipping_line_name,
        shippingLineName: job.shipping_line_name,
        fromLocation: job.origin_port_name || job.origin_port_code,
        toLocation: job.pod_port_name || job.pod_port_code,
        pol: job.origin_port_code,
        pod: job.pod_port_code,
        vessel: job.vessel_name,
        voyage: job.voyage,
        commodity: job.commodity,
        temperature: job.temperature,
        chaName: job.cha_name || '',
        onAccount: job.on_account || '',
        packageType: job.package_type || 'Cartons',
        cartons: Number(job.cartons) || 0,
        cbm: Number(job.cbm) || 0,
        fpod: job.fpod || '',
        boeNo: job.boe_no || '',
        boeDate: job.boe_date || null,
        hblNo: job.hbl_no || '',
        containersCount: containers.length || job.total_containers || 1,
        status: job.status,
        containers: containers,
        sbNo: job.sb_no || '',
        sbDate: job.sb_date || null,
        partyInvoiceNo: job.party_invoice_no || '',
        partyInvoiceDate: job.party_invoice_date || null,
        blNo: job.bl_no || '',
        telexReleased: job.telex_released || false,
        sellFreight: Number(job.sell_freight) || 0,
        buyFreight: Number(job.buy_freight) || 0,
        createdAt: job.created_at
      };
    });

    res.json({ success: true, count: combined.length, data: combined });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Next sequential Job Order number from live DB sequence
router.get('/next-jo', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT COALESCE(MAX("CONT_JO_ID"), 0) + 1 AS next_id FROM spjlive."FLEET_CONT_JO"');
    const nextId = Number(rows[0]?.next_id || 94182);
    res.json({ success: true, nextJoNo: `JO-${nextId}`, rawId: nextId });
  } catch (err) {
    console.error('Error fetching next JO sequence:', err);
    res.json({ success: true, nextJoNo: 'JO-94182', rawId: 94182 });
  }
});

// POST create a new Job Order with atomic container repeater rows
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const b = req.body;
    await client.query('BEGIN');

    // Get live next sequence from DB
    const seqRes = await client.query('SELECT COALESCE(MAX("CONT_JO_ID"), 0) + 1 AS next_id FROM spjlive."FLEET_CONT_JO"');
    const nextSeqId = Number(seqRes.rows[0]?.next_id || 94182);
    const joNo = b.joNo || ('JO-' + nextSeqId);
    const jobId = 'JOB-' + joNo;

    const jobQuery = `
      INSERT INTO job_orders (
        id, job_number, customer_name, shipping_line_name, booking_no,
        origin_port_code, origin_port_name, pod_port_code, pod_port_name,
        vessel_name, voyage, commodity, temperature, total_containers,
        sell_freight, buy_freight, status, remarks,
        cha_name, on_account, package_type, cartons, cbm, fpod, hbl_no, boe_no, boe_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *;
    `;
    const jobValues = [
      jobId,
      joNo,
      b.consignor || b.customerName || 'Fair Exports (India) Pvt Ltd',
      b.shippingLine || b.shippingLineName || 'Maersk Line India Pvt Ltd',
      b.bookingNo || ('BK-' + Date.now()),
      b.pol || 'INICD6',
      b.fromLocation || 'Dadri ICD',
      b.pod || 'AEJEA',
      b.toLocation || 'Jebel Ali Port',
      b.vessel || 'MAERSK COLOMBO',
      b.voyage || '2604W',
      b.commodity || 'FROZEN BUFFALO BONELSS MEAT',
      b.temperature || '-18°C',
      Array.isArray(b.containers) ? b.containers.length : 1,
      b.sellFreight || 135000,
      b.buyFreight || 118000,
      'BOOKED',
      b.remarks || '',
      b.chaName || '',
      b.onAccount || '',
      b.packageType || 'Cartons',
      Number(b.cartons) || 0,
      Number(b.cbm) || 0,
      b.fpod || '',
      b.hblNo || '',
      b.boeNo || '',
      b.boeDate || null
    ];
    const jobRes = await client.query(jobQuery, jobValues);
    const createdJob = jobRes.rows[0];

    // Insert containers
    const containersToInsert = Array.isArray(b.containers) && b.containers.length > 0
      ? b.containers
      : [{
          containerNo: 'MSKU' + Math.floor(1000000 + Math.random() * 9000000),
          sizeType: '40HC',
          tareWeight: 4200,
          grossWeight: 28500,
          cargoWeight: 24300,
          sealNo: 'ML-IN-' + Math.floor(100000 + Math.random() * 900000),
          agentSeal: 'CUST-' + Math.floor(100000 + Math.random() * 900000)
        }];

    const createdContainers = [];
    for (let idx = 0; idx < containersToInsert.length; idx++) {
      const c = containersToInsert[idx];
      const contId = jobId + '-C' + (idx + 1);
      const contQuery = `
        INSERT INTO job_containers (
          id, job_id, container_number, size_type, tare_weight, gross_weight,
          cargo_weight, seal_number, agent_seal, current_status, milestone_dates
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
      const contValues = [
        contId,
        jobId,
        c.containerNo || ('CONT-' + Math.floor(1000000 + Math.random() * 9000000)),
        c.sizeType || '40HC',
        Number(c.tareWeight) || 4200,
        Number(c.grossWeight) || 28500,
        Number(c.cargoWeight) || 24300,
        c.sealNo || ('SL-' + Math.floor(100000 + Math.random() * 900000)),
        c.agentSeal || ('CS-' + Math.floor(100000 + Math.random() * 900000)),
        'ALLOTTED',
        JSON.stringify({ ALLOTTED: new Date().toISOString() })
      ];
      const cRes = await client.query(contQuery, contValues);
      createdContainers.push(cRes.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: createdJob.id,
        joNo: createdJob.job_number,
        bookingNo: createdJob.booking_no,
        consignor: createdJob.customer_name,
        shippingLine: createdJob.shipping_line_name,
        fromLocation: createdJob.origin_port_name,
        toLocation: createdJob.pod_port_name,
        pol: createdJob.origin_port_code,
        pod: createdJob.pod_port_code,
        vessel: createdJob.vessel_name,
        voyage: createdJob.voyage,
        commodity: createdJob.commodity,
        status: createdJob.status,
        containers: createdContainers.map(c => ({
          id: c.id,
          containerNo: c.container_number,
          sizeType: c.size_type,
          tareWeight: Number(c.tare_weight),
          grossWeight: Number(c.gross_weight),
          cargoWeight: Number(c.cargo_weight),
          sealNo: c.seal_number,
          status: c.current_status
        }))
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating job booking:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// PUT update job order documents (Shipping Bill, Party Invoice, BL, Telex)
router.put('/:id/documentation', async (req, res) => {
  try {
    const id = req.params.id;
    const { sbNo, sbDate, partyInvoiceNo, partyInvoiceDate, blNo, telexReleased } = req.body;
    const query = `
      UPDATE job_orders SET
        sb_no = COALESCE($1, sb_no),
        sb_date = COALESCE($2, sb_date),
        party_invoice_no = COALESCE($3, party_invoice_no),
        party_invoice_date = COALESCE($4, party_invoice_date),
        bl_no = COALESCE($5, bl_no),
        telex_released = COALESCE($6, telex_released),
        updated_at = NOW()
      WHERE id = $7 OR job_number = $7
      RETURNING *;
    `;
    const values = [sbNo, sbDate || null, partyInvoiceNo, partyInvoiceDate || null, blNo, telexReleased, id];
    const { rows } = await db.query(query, values);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating documentation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
