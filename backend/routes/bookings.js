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
          size: c.size_type?.includes('20') ? '20' : '40',
          type: c.size_type?.includes('GP') ? 'GP' : 'HC',
          tareWeight: Number(c.tare_weight) || 0,
          grossWeight: Number(c.gross_weight) || 0,
          cargoWeight: Number(c.cargo_weight) || 0,
          sealNo: c.seal_number || '',
          agentSeal: c.agent_seal || c.custom_seal || '',
          grNumber: c.gr_number || '',
          grNo: c.gr_number || '',
          grDate: c.gr_date || null,
          truckNo: c.truck_number || '',
          vehicleNo: c.truck_number || '',
          driverName: c.driver_name || '',
          driverMobile: c.driver_mobile || '',
          advance: c.advance || 0,
          oilAdvance: c.oil_advance || 0,
          otherAdvance: c.other_advance || 0,
          slipNo: c.slip_no || '',
          oilVendor: c.oil_vendor || '',
          workshop: c.workshop || '',
          cGr: c.c_gr || '',
          grRemarks: c.gr_remarks || '',
          licenseValidity: c.license_validity || '',
          status: c.current_status || 'ALLOTTED',
          milestoneDates: c.milestone_dates || {}
        }));

      return {
        id: job.id,
        joNo: job.job_number,
        joType: job.jo_type || 'Export FCL',
        modeOfShipment: job.mode_of_shipment || 'Multimodal (Rail + Road)',
        bookingNo: job.booking_no,
        consignor: job.customer_name,
        customerName: job.customer_name,
        customer: job.customer_name,
        consignee: job.consignee_name || '',
        consigneeName: job.consignee_name || '',
        shippingLine: job.shipping_line_name,
        shippingLineName: job.shipping_line_name,
        transporter: job.transporter || 'AJINKYA TRANSPORT',
        fromLocation: job.origin_port_name || job.origin_port_code,
        toLocation: job.pod_port_name || job.pod_port_code,
        emptyPickupLocation: job.empty_pickup_location || '',
        handoverLocation: job.handover_location || '',
        pol: job.origin_port_code,
        pod: job.pod_port_code,
        vessel: job.vessel_name,
        voyage: job.voyage,
        commodity: job.commodity,
        temperature: job.temperature,
        bookingDate: job.booking_date || '',
        bookingValidity: job.booking_validity || '',
        bookingRevalidity: job.booking_revalidity || '',
        etdDate: job.etd_date || '',
        etaDate: job.eta_date || '',
        portCutDate: job.port_cut_date || '',
        siCutDate: job.si_cut_date || '',
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
        sellRate: Number(job.sell_rate) || Number(job.sell_freight) || 0,
        buyRate: Number(job.buy_rate) || Number(job.buy_freight) || 0,
        remarks: job.remarks || '',
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
        id, job_number, customer_name, consignee_name, shipping_line_name, booking_no,
        origin_port_code, origin_port_name, pod_port_code, pod_port_name,
        vessel_name, voyage, commodity, temperature, total_containers,
        sell_freight, buy_freight, status, remarks,
        cha_name, on_account, package_type, cartons, cbm, fpod, hbl_no, boe_no, boe_date,
        jo_type, mode_of_shipment, transporter, booking_date, booking_validity, booking_revalidity,
        empty_pickup_location, handover_location, etd_date, eta_date, si_cut_date, port_cut_date,
        sell_rate, buy_rate
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36,
        $37, $38, $39, $40, $41, $42
      ) RETURNING *;
    `;
    const jobValues = [
      jobId,
      joNo,
      b.consignor || b.customerName || b.customer || 'Fair Exports (India) Pvt Ltd',
      b.consignee || b.consigneeName || 'ASIAN PERAL MYANMAR CO. LTD.',
      b.shippingLine || b.shippingLineName || b.line || 'Maersk Line India Pvt Ltd',
      b.bookingNo || b.lineBookingNo || ('BK-' + Date.now()),
      b.pol || 'INICD6',
      b.fromLocation || b.origin || 'Dadri ICD',
      b.pod || b.podCode || 'AEJEA',
      b.toLocation || 'Jebel Ali Port',
      b.vessel || b.vesselName || 'MAERSK COLOMBO',
      b.voyage || '2604W',
      b.commodity || 'FROZEN BUFFALO BONELSS MEAT',
      b.temperature || '-18°C',
      Array.isArray(b.containers) ? b.containers.length : (Number(b.containersCount) || 1),
      Number(b.sellFreight) || Number(b.sellRate) || 135000,
      Number(b.buyFreight) || Number(b.buyRate) || 118000,
      b.status || 'BOOKED',
      b.remarks || '',
      b.chaName || '',
      b.onAccount || '',
      b.packageType || 'Cartons',
      Number(b.cartons) || 0,
      Number(b.cbm) || 0,
      b.fpod || '',
      b.hblNo || '',
      b.boeNo || '',
      b.boeDate || null,
      b.joType || 'Export FCL',
      b.modeOfShipment || 'Multimodal (Rail + Road)',
      b.transporter || 'AJINKYA TRANSPORT',
      b.bookingDate || b.joDate || null,
      b.bookingValidity || '',
      b.bookingReValidity || b.bookingRevalidity || '',
      b.emptyPickupLocation || 'TRANSWORLD-DADRI',
      b.handoverLocation || 'ADANI-PATLI',
      b.etdDate || '',
      b.etaDate || '',
      b.siCutDate || '',
      b.portCutDate || '',
      Number(b.sellRate) || Number(b.sellFreight) || 0,
      Number(b.buyRate) || Number(b.buyFreight) || 0
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
          cargo_weight, seal_number, agent_seal, current_status, milestone_dates,
          truck_number, driver_name, driver_mobile, gr_number, gr_date,
          advance, oil_advance, other_advance, slip_no, oil_vendor, workshop, c_gr, gr_remarks,
          handover_location, from_location, to_location, license_validity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28
        ) RETURNING *;
      `;
      const contValues = [
        contId,
        jobId,
        c.containerNo || c.contNo || c.no || ('CONT-' + Math.floor(1000000 + Math.random() * 9000000)),
        c.sizeType || (c.size ? `${c.size}${c.type || 'HC'}` : '40HC'),
        Number(c.tareWeight || c.tare) || 4200,
        Number(c.grossWeight || c.gross) || 28500,
        Number(c.cargoWeight || c.cargo) || 24300,
        c.sealNo || c.seal || ('SL-' + Math.floor(100000 + Math.random() * 900000)),
        c.agentSeal || c.customSeal || ('CS-' + Math.floor(100000 + Math.random() * 900000)),
        c.status || 'ALLOTTED',
        JSON.stringify({ ALLOTTED: new Date().toISOString() }),
        c.truckNo || c.vehicleNo || c.truck || null,
        c.driverName || null,
        c.driverMobile || null,
        c.grNo || c.grNumber || c.gr || null,
        c.grDate ? new Date(c.grDate) : null,
        Number(c.advance || c.cash) || 0,
        Number(c.oilAdvance || c.oil) || 0,
        Number(c.otherAdvance || c.others) || 0,
        c.slipNo || '',
        c.oilVendor || '',
        c.workshop || '',
        c.cGr || '',
        c.grRemarks || c.remarks || '',
        c.handoverLocation || b.handoverLocation || '',
        c.fromLocation || b.fromLocation || '',
        c.toLocation || b.toLocation || '',
        c.licenseValidity || ''
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
