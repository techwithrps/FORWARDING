const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET Trip Pendency: Booked containers pending GR generation
router.get('/trip-pendency', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, c.job_id, c.container_number, c.size_type, c.tare_weight, c.gross_weight,
        c.cargo_weight, c.seal_number, c.gr_number, c.gr_date, c.truck_number,
        c.driver_name, c.driver_mobile, c.current_status,
        j.job_number, j.booking_no, j.customer_name, j.shipping_line_name,
        j.origin_port_name, j.pod_port_name, j.vessel_name, j.commodity
      FROM job_containers c
      JOIN job_orders j ON c.job_id = j.id
      WHERE c.gr_number IS NULL OR c.current_status = 'ALLOTTED'
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await db.query(query);
    const formatted = rows.map(r => ({
      id: r.id,
      containerNo: r.container_number,
      sizeType: r.size_type,
      jobNo: r.job_number,
      bookingNo: r.booking_no,
      shipper: r.customer_name,
      shippingLine: r.shipping_line_name,
      origin: r.origin_port_name,
      destination: r.pod_port_name,
      vessel: r.vessel_name,
      commodity: r.commodity,
      truckNo: r.truck_number || '',
      driverName: r.driver_name || '',
      driverMobile: r.driver_mobile || '',
      status: 'AWAITING_GR'
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('Error fetching trip pendency:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Generate GR for a pending container
router.post('/generate-gr', async (req, res) => {
  try {
    const { containerId, truckNo, driverName, driverMobile } = req.body;
    if (!containerId) {
      return res.status(400).json({ success: false, message: 'containerId is required' });
    }

    const countRes = await db.query('SELECT COUNT(*) FROM job_containers WHERE gr_number IS NOT NULL');
    const grSeq = String(Number(countRes.rows[0].count) + 1).padStart(4, '0');
    const grNumber = 'GR-2026-' + grSeq;
    const grDate = new Date().toISOString().split('T')[0];

    const updateQuery = `
      UPDATE job_containers SET
        gr_number = $1,
        gr_date = $2,
        truck_number = COALESCE($3, truck_number),
        driver_name = COALESCE($4, driver_name),
        driver_mobile = COALESCE($5, driver_mobile),
        current_status = 'STUFFED',
        milestone_dates = jsonb_set(
          COALESCE(milestone_dates, '{}'::jsonb),
          '{STUFFED}',
          to_jsonb(NOW()::text)
        ),
        updated_at = NOW()
      WHERE id = $6 OR container_number = $6
      RETURNING *;
    `;
    const values = [grNumber, grDate, truckNo, driverName, driverMobile, containerId];
    const { rows } = await db.query(updateQuery, values);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Container not found' });
    }

    const updated = rows[0];

    // Update parent job status if needed
    await db.query("UPDATE job_orders SET status = 'STUFFED', updated_at = NOW() WHERE id = $1", [updated.job_id]);

    res.json({
      success: true,
      grNumber,
      grDate,
      data: updated
    });
  } catch (err) {
    console.error('Error generating GR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Advance Shipment Milestone
router.post('/advance-milestone', async (req, res) => {
  try {
    const { containerId, nextMilestone } = req.body;
    if (!containerId || !nextMilestone) {
      return res.status(400).json({ success: false, message: 'containerId and nextMilestone are required' });
    }

    const updateQuery = `
      UPDATE job_containers SET
        current_status = $1,
        milestone_dates = jsonb_set(
          COALESCE(milestone_dates, '{}'::jsonb),
          ARRAY[$1],
          to_jsonb(NOW()::text)
        ),
        updated_at = NOW()
      WHERE id = $2 OR container_number = $2
      RETURNING *;
    `;
    const { rows } = await db.query(updateQuery, [nextMilestone, containerId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Container not found' });
    }

    const updated = rows[0];
    await db.query("UPDATE job_orders SET status = $1, updated_at = NOW() WHERE id = $2", [nextMilestone, updated.job_id]);

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error advancing milestone:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Documentation Update (Shipping Bill, Party Invoice, BL, Telex)
router.get('/update-docs', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/update-docs', async (req, res) => {
  try {
    const { jobId, sbNo, sbDate, partyInvoiceNo, partyInvoiceDate, blNo, telexReleased } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

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
    const values = [sbNo, sbDate || null, partyInvoiceNo, partyInvoiceDate || null, blNo, telexReleased, jobId];
    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job order not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating documentation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Helper to fetch lifecycle container list with joined job orders
async function getLifecycleRows(extraWhere = '1=1') {
  const query = `
    SELECT 
      c.id, c.job_id, c.container_number, c.size_type, c.tare_weight, c.gross_weight,
      c.cargo_weight, c.seal_number, c.gr_number, c.gr_date, c.truck_number,
      c.driver_name, c.driver_mobile, c.current_status,
      c.current_location, c.running_status, c.pod_received_by, c.trip_close_date,
      c.edi_sb_status, c.edi_filing_date, c.train_no, c.wagon_no, c.rake_out_date,
      c.feeder_vessel, c.cut_off_date, c.berthing_date, c.sob_date, c.bl_stage,
      c.telex_released, c.telex_release_date, c.tr_no, c.tr_status, c.tr_date,
      c.handover_status, c.handover_date, c.egm_no, c.egm_date, c.discharge_date,
      c.delivered_to_consignee_date, c.empty_returned_depot_date,
      j.job_number, j.booking_no, j.customer_name, j.shipping_line_name,
      j.origin_port_name, j.pod_port_name, j.vessel_name, j.commodity
    FROM job_containers c
    JOIN job_orders j ON c.job_id = j.id
    WHERE ${extraWhere}
    ORDER BY c.created_at DESC;
  `;
  const { rows } = await db.query(query);
  return rows.map(r => ({
    id: r.id,
    containerNo: r.container_number,
    sizeType: r.size_type,
    tareWeight: Number(r.tare_weight) || 0,
    grossWeight: Number(r.gross_weight) || 0,
    cargoWeight: Number(r.cargo_weight) || 0,
    jobNo: r.job_number,
    bookingNo: r.booking_no,
    shipper: r.customer_name,
    customer: r.customer_name,
    shippingLine: r.shipping_line_name,
    origin: r.origin_port_name,
    destination: r.pod_port_name,
    vessel: r.vessel_name,
    commodity: r.commodity,
    truckNo: r.truck_number || '',
    driverName: r.driver_name || '',
    driverMobile: r.driver_mobile || '',
    currentLocation: r.current_location || 'En-Route ICD to Gateway Port',
    runningStatus: r.running_status || 'IN_TRANSIT',
    podReceivedBy: r.pod_received_by || '',
    tripCloseDate: r.trip_close_date || null,
    ediSbStatus: r.edi_sb_status || 'LEO_GENERATED',
    ediFilingDate: r.edi_filing_date || null,
    trainNo: r.train_no || '',
    wagonNo: r.wagon_no || '',
    rakeOutDate: r.rake_out_date || null,
    feederVessel: r.feeder_vessel || r.vessel_name || '',
    cutOffDate: r.cut_off_date || null,
    berthingDate: r.berthing_date || null,
    sobDate: r.sob_date || null,
    blStage: r.bl_stage || 'CHECKLIST_SENT',
    telexReleased: r.telex_released || false,
    trNo: r.tr_no || '',
    trStatus: r.tr_status || 'APPROVED',
    handoverStatus: r.handover_status || 'COMPLETED',
    egmNo: r.egm_no || '',
    dischargeDate: r.discharge_date || null,
    status: r.current_status || 'ALLOTTED'
  }));
}

// 5. VEHICLE RUNNING POSITION
router.get('/running-position', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/running-position', async (req, res) => {
  try {
    const { containerId, currentLocation, runningStatus, gpsLat, gpsLng } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         current_location = COALESCE($1, current_location),
         running_status = COALESCE($2, running_status),
         gps_lat = COALESCE($3, gps_lat),
         gps_lng = COALESCE($4, gps_lng),
         updated_at = NOW()
       WHERE id = $5 OR container_number = $5 RETURNING *`,
      [currentLocation, runningStatus, gpsLat, gpsLng, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. TRIP CLOSE
router.get('/trip-close', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/trip-close', async (req, res) => {
  try {
    const { containerId, podReceivedBy } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         running_status = 'COMPLETED',
         trip_close_date = CURRENT_DATE,
         pod_received_by = COALESCE($1, pod_received_by),
         updated_at = NOW()
       WHERE id = $2 OR container_number = $2 RETURNING *`,
      [podReceivedBy || 'ICD Gate Officer', containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. EDI UPDATE
router.get('/edi-update', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/edi-update', async (req, res) => {
  try {
    const { containerId, ediSbStatus } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         edi_sb_status = COALESCE($1, edi_sb_status),
         edi_filing_date = CURRENT_DATE,
         updated_at = NOW()
       WHERE id = $2 OR container_number = $2 RETURNING *`,
      [ediSbStatus || 'LEO_PASSED', containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. RAIL OUT STATUS
router.get('/rail-out', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/rail-out', async (req, res) => {
  try {
    const { containerId, trainNo, wagonNo, rakeOutDate } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         train_no = COALESCE($1, train_no),
         wagon_no = COALESCE($2, wagon_no),
         rake_out_date = COALESCE($3, CURRENT_DATE),
         current_status = 'RAIL_OUT',
         updated_at = NOW()
       WHERE id = $4 OR container_number = $4 RETURNING *`,
      [trainNo, wagonNo, rakeOutDate, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. VESSEL PLAN DETAILS
router.get('/vessel-plan', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/vessel-plan', async (req, res) => {
  try {
    const { containerId, feederVessel, cutOffDate, berthingDate } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         feeder_vessel = COALESCE($1, feeder_vessel),
         cut_off_date = COALESCE($2, cut_off_date),
         berthing_date = COALESCE($3, berthing_date),
         updated_at = NOW()
       WHERE id = $4 OR container_number = $4 RETURNING *`,
      [feederVessel, cutOffDate, berthingDate, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. SOB UPDATE
router.get('/sob-update', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sob-update', async (req, res) => {
  try {
    const { containerId, sobDate } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         sob_date = COALESCE($1, CURRENT_DATE),
         current_status = 'SOB',
         updated_at = NOW()
       WHERE id = $2 OR container_number = $2 RETURNING *`,
      [sobDate, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. BL STATUS UPDATE
router.get('/bl-status', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/bl-status', async (req, res) => {
  try {
    const { containerId, blStage } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         bl_stage = COALESCE($1, bl_stage),
         updated_at = NOW()
       WHERE id = $2 OR container_number = $2 RETURNING *`,
      [blStage, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. TELEX STATUS UPDATE
router.get('/telex-update', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/telex-update', async (req, res) => {
  try {
    const { containerId, telexReleased } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         telex_released = COALESCE($1, true),
         telex_release_date = CURRENT_DATE,
         updated_at = NOW()
       WHERE id = $2 OR container_number = $2 RETURNING *`,
      [telexReleased, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. TR UPDATE (Transshipment Permit)
router.get('/tr-update', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tr-update', async (req, res) => {
  try {
    const { containerId, trNo, trStatus } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         tr_no = COALESCE($1, tr_no),
         tr_status = COALESCE($2, 'APPROVED'),
         tr_date = CURRENT_DATE,
         updated_at = NOW()
       WHERE id = $3 OR container_number = $3 RETURNING *`,
      [trNo, trStatus, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. HANDOVER UPDATE
router.get('/handover-update', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/handover-update', async (req, res) => {
  try {
    const { containerId, handoverStatus } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         handover_status = COALESCE($1, 'COMPLETED'),
         handover_date = CURRENT_DATE,
         updated_at = NOW()
       WHERE id = $2 OR container_number = $2 RETURNING *`,
      [handoverStatus, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. EGM UPDATE
router.get('/egm-update', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/egm-update', async (req, res) => {
  try {
    const { containerId, egmNo } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         egm_no = COALESCE($1, egm_no),
         egm_date = CURRENT_DATE,
         updated_at = NOW()
       WHERE id = $2 OR container_number = $2 RETURNING *`,
      [egmNo, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. SHIPMENT DISCHARGE STATUS
router.get('/discharge-status', async (req, res) => {
  try {
    const data = await getLifecycleRows();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/discharge-status', async (req, res) => {
  try {
    const { containerId, dischargeDate, deliveredDate, emptyReturnedDate } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         discharge_date = COALESCE($1, CURRENT_DATE),
         delivered_to_consignee_date = COALESCE($2, delivered_to_consignee_date),
         empty_returned_depot_date = COALESCE($3, empty_returned_depot_date),
         current_status = 'DELIVERED',
         updated_at = NOW()
       WHERE id = $4 OR container_number = $4 RETURNING *`,
      [dischargeDate, deliveredDate, emptyReturnedDate, containerId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

