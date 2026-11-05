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

// GET Pending GR Containers for GR Generation dropdown (aligned with SPJ 2 LogiPark)
router.get('/pending-gr-containers', async (req, res) => {
  try {
    const spjContainersQuery = `
      SELECT 
        FCJD."MTY_CONT_ID"::text as mty_cont_id,
        (TRIM(FCJD."CONT_NO"::text) || ' - ' || FCJ."CONT_JO_NO"::text) AS display_label,
        TRIM(FCJD."CONT_NO"::text) AS cont_no,
        COALESCE(FCJD."CONT_SIZE"::text, '40') AS size,
        COALESCE(TRIM(FCJD."CONT_TYPE"::text), 'HC') AS type,
        COALESCE(NULLIF(FCJD."WEIGHT"::text, '0'), '24500') AS weight,
        FCJ."CONT_JO_NO"::text AS jo_no,
        TO_CHAR(FCJ."CREATED_ON", 'YYYY-MM-DD') AS jo_date,
        COALESCE(TRIM(CUST."CUSTOMER_NAME"::text), 'Fair Exports (India) Pvt Ltd') AS consignor,
        COALESCE(TRIM(CONS."CUSTOMER_NAME"::text), 'ASIAN PERAL MYANMAR CO. LTD.') AS consignee,
        CASE 
          WHEN FCJ."TRANSPORTER_ID" = 0 OR FCJ."TRANSPORTER_ID" IS NULL THEN 'Self' 
          ELSE COALESCE(TRIM(VEND."VENDOR_NAME"::text), 'AJINKYA TRANSPORT') 
        END AS transporter,
        COALESCE(TRIM(TERM_FROM."TERMINAL_NAME"::text), TRIM(LOC_FROM."LOCATION_NAME"::text), 'TRANSWORLD-DADRI') AS from_location,
        COALESCE(TRIM(LOC_TO."LOCATION_NAME"::text), TRIM(TERM_TO."TERMINAL_NAME"::text), 'ADANI-PATLI') AS to_location,
        COALESCE(TRIM(TERM_HANDOVER."TERMINAL_NAME"::text), TRIM(FCJ."HAND_LOCATION"::text), 'ADANI-PATLI') AS handover_location,
        COALESCE(TRIM(FCJ."COMMODITY"::text), 'FROZEN BUFFALO BONELESS MEAT') AS commodity
      FROM spjlive."FLEET_CONT_JO_DTLS" FCJD
      JOIN spjlive."FLEET_CONT_JO" FCJ ON FCJ."CONT_JO_ID" = FCJD."CONT_JO_ID"
      LEFT JOIN spjlive."CUSTOMER_MASTER" CUST ON CUST."CUSTOMER_ID" = FCJ."CUSTOMER_ID"
      LEFT JOIN spjlive."CUSTOMER_MASTER" CONS ON CONS."CUSTOMER_ID" = FCJ."CONSIGNEE_ID"
      LEFT JOIN spjlive."VENDOR_MASTER" VEND ON VEND."VENDOR_ID" = FCJ."TRANSPORTER_ID"
      LEFT JOIN spjlive."TERMINAL_MASTER" TERM_FROM ON TERM_FROM."TERMINAL_ID" = FCJ."MTY_PICKUP"
      LEFT JOIN spjlive."TERMINAL_LOCATION_MASTER" LOC_FROM ON LOC_FROM."LOCATION_ID" = FCJ."FROM_LOCATION"
      LEFT JOIN spjlive."TERMINAL_LOCATION_MASTER" LOC_TO ON LOC_TO."LOCATION_ID" = FCJ."FROM_LOCATION"
      LEFT JOIN spjlive."TERMINAL_MASTER" TERM_TO ON TERM_TO."TERMINAL_ID" = FCJ."TO_LOCATION_ID"
      LEFT JOIN spjlive."TERMINAL_MASTER" TERM_HANDOVER ON TERM_HANDOVER."TERMINAL_ID" = FCJ."TO_LOCATION_ID"
      WHERE COALESCE(FCJD."GR_ID", 0) = 0
        AND FCJD."CANCEL_STATUS" IS NULL
        AND FCJD."CONT_NO" IS NOT NULL
        AND TRIM(FCJD."CONT_NO"::text) != ''
      ORDER BY FCJ."CONT_JO_ID" DESC
      LIMIT 250;
    `;
    const { rows: spjRows } = await db.query(spjContainersQuery);

    let localRows = [];
    try {
      const localQuery = `
        SELECT 
          c.id::text as mty_cont_id,
          (c.container_number || ' - ' || j.job_number) AS display_label,
          c.container_number AS cont_no,
          CASE WHEN c.size_type LIKE '%20%' THEN '20' ELSE '40' END AS size,
          CASE WHEN c.size_type LIKE '%GP%' THEN 'GP' ELSE 'HC' END AS type,
          COALESCE(c.cargo_weight::text, '24500') AS weight,
          j.job_number AS jo_no,
          TO_CHAR(j.created_at, 'YYYY-MM-DD') AS jo_date,
          COALESCE(j.customer_name, 'Fair Exports (India) Pvt Ltd') AS consignor,
          COALESCE(j.consignee_name, 'ASIAN PERAL MYANMAR CO. LTD.') AS consignee,
          'AJINKYA TRANSPORT' AS transporter,
          COALESCE(j.origin_port_name, 'TRANSWORLD-DADRI') AS from_location,
          COALESCE(j.pod_port_name, 'ADANI-PATLI') AS to_location,
          'ADANI-PATLI' AS handover_location,
          COALESCE(j.commodity, 'FROZEN BUFFALO BONELESS MEAT') AS commodity
        FROM job_containers c
        JOIN job_orders j ON c.job_id = j.id
        WHERE (c.gr_number IS NULL OR c.gr_number = '')
        ORDER BY c.created_at DESC
        LIMIT 50;
      `;
      const resLocal = await db.query(localQuery);
      localRows = resLocal.rows;
    } catch (e) {
      // Ignore if local table is empty
    }

    const seen = new Set();
    const combined = [];
    for (const r of [...localRows, ...spjRows]) {
      const key = (r.cont_no || '').trim().toUpperCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(r);
      }
    }

    res.json({ success: true, count: combined.length, data: combined });
  } catch (err) {
    console.error('Error fetching pending containers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Search GR records (aligned with SPJ 2 LogiPark FleetVehicleSearch)
router.get('/search-gr', async (req, res) => {
  try {
    const { fromDate, toDate, vehicleNo } = req.query;

    let conditions = ['GM."CANCEL_STATUS" IS NULL', 'GM."GR_NO" IS NOT NULL'];
    let params = [];
    let paramIndex = 1;

    if (fromDate) {
      conditions.push(`GM."GR_DATE"::date >= $${paramIndex}::date`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`GM."GR_DATE"::date <= $${paramIndex}::date`);
      params.push(toDate);
      paramIndex++;
    }

    if (vehicleNo && vehicleNo.trim()) {
      conditions.push(`UPPER(TRIM(GM."VEHICLE_NO")) LIKE '%' || UPPER(TRIM($${paramIndex})) || '%'`);
      params.push(vehicleNo.trim());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const spjQuery = `
      SELECT 
        GM."GR_ID"::text as gr_id,
        GM."CONT_JO_ID"::text as cont_jo_id,
        TRIM(GM."VEHICLE_NO") as vehicle_no,
        COALESCE(EM."EQUIPMENT_TYPE", 'T40') as vh_type,
        COALESCE(GM."CONT_SIZE", '40') as vh_size,
        GM."GR_NO"::text as gr_no,
        TO_CHAR(GM."GR_DATE", 'YYYY-MM-DD') as gr_date_iso,
        TO_CHAR(GM."GR_DATE", 'DD/MM/YYYY') as gr_date,
        TRIM(GM."CONT_NO") as cont_no,
        COALESCE(GM."CONT_SIZE", '40') as cont_size,
        COALESCE(TRIM(GM."FROM_LOCATION"), '') as from_location,
        COALESCE(TRIM(GM."TO_LOCATION"), '') as to_location,
        COALESCE(TRIM(GM."FACTORY_LOCATION"), '') as factory_location,
        COALESCE(TRIM(CUST."CUSTOMER_NAME"), 'Fair Exports (India) Pvt Ltd') as customer,
        TO_CHAR(GM."CLOSE_DATE", 'DD/MM/YYYY') as close_date,
        COALESCE(GM."ADVANCE"::text, '0') as advance,
        COALESCE(GM."OIL_ADVANCE"::text, '0') as oil_advance
      FROM spjlive."FLEET_GR_MAPPING" GM
      LEFT JOIN spjlive."FLEET_EQUIPMENT_MASTER" EM 
        ON UPPER(TRIM(EM."EQUIPMENT_NO")) = UPPER(TRIM(GM."VEHICLE_NO"))
      LEFT JOIN spjlive."CUSTOMER_MASTER" CUST 
        ON CUST."CUSTOMER_ID" = GM."CUSTOMER_ID"
      ${whereClause}
      ORDER BY GM."GR_ID" DESC
      LIMIT 500;
    `;

    const { rows: spjRows } = await db.query(spjQuery, params);

    let localRows = [];
    try {
      let localCond = ["c.gr_number IS NOT NULL AND c.gr_number != ''"];
      let lParams = [];
      let lIdx = 1;
      if (fromDate) {
        localCond.push(`COALESCE(c.gr_date, c.created_at::date) >= $${lIdx}::date`);
        lParams.push(fromDate);
        lIdx++;
      }
      if (toDate) {
        localCond.push(`COALESCE(c.gr_date, c.created_at::date) <= $${lIdx}::date`);
        lParams.push(toDate);
        lIdx++;
      }
      if (vehicleNo && vehicleNo.trim()) {
        localCond.push(`UPPER(TRIM(c.truck_number)) LIKE '%' || UPPER(TRIM($${lIdx})) || '%'`);
        lParams.push(vehicleNo.trim());
        lIdx++;
      }
      const localQuery = `
        SELECT 
          c.id::text as gr_id,
          c.job_id::text as cont_jo_id,
          COALESCE(TRIM(c.truck_number), 'HR55AN2094') as vehicle_no,
          'T40' as vh_type,
          CASE WHEN c.size_type LIKE '%20%' THEN '20' ELSE '40' END as vh_size,
          c.gr_number as gr_no,
          TO_CHAR(COALESCE(c.gr_date, c.created_at::date), 'YYYY-MM-DD') as gr_date_iso,
          TO_CHAR(COALESCE(c.gr_date, c.created_at::date), 'DD/MM/YYYY') as gr_date,
          c.container_number as cont_no,
          CASE WHEN c.size_type LIKE '%20%' THEN '20' ELSE '40' END as cont_size,
          COALESCE(j.origin_port_name, 'TRANSWORLD-DADRI') as from_location,
          COALESCE(j.pod_port_name, 'ADANI-PATLI') as to_location,
          'ADANI-PATLI' as factory_location,
          COALESCE(j.customer_name, 'Fair Exports (India) Pvt Ltd') as customer,
          TO_CHAR(c.trip_close_date, 'DD/MM/YYYY') as close_date,
          '0' as advance,
          '0' as oil_advance
        FROM job_containers c
        LEFT JOIN job_orders j ON j.id = c.job_id
        WHERE ${localCond.join(' AND ')}
        ORDER BY c.created_at DESC
        LIMIT 50;
      `;
      const lRes = await db.query(localQuery, lParams);
      localRows = lRes.rows;
    } catch (e) {
      // Ignore
    }

    const seen = new Set();
    const combined = [];
    for (const r of [...localRows, ...spjRows]) {
      const key = `${r.gr_no}-${r.cont_no}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(r);
      }
    }

    res.json({
      success: true,
      reportDate: new Date().toLocaleString('en-GB'),
      count: combined.length,
      data: combined
    });
  } catch (err) {
    console.error('Error in search-gr:', err);
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

