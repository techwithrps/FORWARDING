const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET Trip Pendency: Booked containers pending GR generation
router.get('/trip-pendency', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, c.job_id, c.container_number, c.size_type, c.tare_weight, c.gross_weight,
        c.cargo_weight, c.seal_number, c.agent_seal, c.gr_number, c.gr_date, c.truck_number,
        c.driver_name, c.driver_mobile, c.current_status,
        j.job_number, j.booking_no, j.customer_name, j.consignee_name, j.shipping_line_name,
        j.origin_port_name, j.pod_port_name, j.vessel_name, j.commodity, j.transporter,
        j.handover_location, j.empty_pickup_location,
        j.booking_date, j.created_at as jo_created_at
      FROM job_containers c
      JOIN job_orders j ON c.job_id = j.id
      WHERE c.gr_number IS NULL OR c.gr_number = '' OR c.current_status = 'ALLOTTED'
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await db.query(query);
    const formatted = rows.map(r => ({
      id: r.id,
      containerNo: r.container_number,
      sizeType: r.size_type,
      jobNo: r.job_number,
      joDate: r.booking_date || (r.jo_created_at ? new Date(r.jo_created_at).toISOString().split('T')[0] : '') || '',
      bookingNo: r.booking_no,
      shipper: r.customer_name || 'Fair Exports (India) Pvt Ltd',
      consignee: r.consignee_name || 'ASIAN PERAL MYANMAR CO. LTD.',
      shippingLine: r.shipping_line_name || 'Maersk Line India Pvt Ltd',
      transporter: r.transporter || 'AJINKYA TRANSPORT',
      origin: r.origin_port_name || 'TRANSWORLD-DADRI',
      destination: r.pod_port_name || 'ADANI-PATLI',
      handoverLocation: r.handover_location || 'ADANI-PATLI',
      vessel: r.vessel_name || 'MAERSK COLOMBO',
      commodity: r.commodity || 'FROZEN BUFFALO BONELESS MEAT',
      sealNo: r.seal_number || '',
      agentSeal: r.agent_seal || '',
      cargoWeight: Number(r.cargo_weight) || 24000,
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
          COALESCE(NULLIF(c.cargo_weight::text, '0'), NULLIF(c.gross_weight::text, '0'), '24500') AS weight,
          j.job_number AS jo_no,
          TO_CHAR(COALESCE(j.jo_date, j.created_at), 'YYYY-MM-DD') AS jo_date,
          COALESCE(NULLIF(j.customer_name, ''), 'Fair Exports (India) Pvt Ltd') AS consignor,
          COALESCE(NULLIF(j.consignee_name, ''), 'ASIAN PERAL MYANMAR CO. LTD.') AS consignee,
          COALESCE(NULLIF(j.transporter, ''), 'AJINKYA TRANSPORT') AS transporter,
          COALESCE(NULLIF(c.from_location, ''), NULLIF(j.origin_port_name, ''), 'TRANSWORLD-DADRI') AS from_location,
          COALESCE(NULLIF(c.to_location, ''), NULLIF(j.pod_port_name, ''), 'ADANI-PATLI') AS to_location,
          COALESCE(NULLIF(c.handover_location, ''), NULLIF(j.handover_location, ''), 'ADANI-PATLI') AS handover_location,
          COALESCE(NULLIF(c.commodity, ''), NULLIF(j.commodity, ''), 'FROZEN BUFFALO BONELESS MEAT') AS commodity,
          COALESCE(c.truck_number, '') AS vehicle_no,
          COALESCE(c.driver_name, '') AS driver,
          COALESCE(c.driver_mobile, '') AS driver_contact_no,
          COALESCE(j.shipping_line_name, '') AS shipping_line
        FROM job_containers c
        JOIN job_orders j ON c.job_id = j.id
        WHERE (c.gr_number IS NULL OR c.gr_number = '')
        ORDER BY c.created_at DESC
        LIMIT 100;
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

// Helper to safely parse dates in various formats (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY) to ISO YYYY-MM-DD
function parseSafeIsoDate(val) {
  if (!val) return null;
  val = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const parts = val.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const year = parts[2];
      if (p0 > 12) {
        return `${year}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
      }
      if (p1 > 12) {
        return `${year}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
      // Default Indian standard DD/MM/YYYY
      return `${year}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

// GET Search GR records (aligned with SPJ 2 LogiPark FleetVehicleSearch)
router.get('/search-gr', async (req, res) => {
  try {
    const { fromDate, toDate, vehicleNo } = req.query;

    const parsedFrom = parseSafeIsoDate(fromDate);
    const parsedTo = parseSafeIsoDate(toDate);
    const cleanVeh = vehicleNo ? vehicleNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

    let conditions = ['GM."CANCEL_STATUS" IS NULL', 'GM."GR_NO" IS NOT NULL'];
    let params = [];
    let paramIndex = 1;

    if (parsedFrom) {
      conditions.push(`GM."GR_DATE"::date >= $${paramIndex}::date`);
      params.push(parsedFrom);
      paramIndex++;
    }

    if (parsedTo) {
      conditions.push(`GM."GR_DATE"::date <= $${paramIndex}::date`);
      params.push(parsedTo);
      paramIndex++;
    }

    if (cleanVeh) {
      conditions.push(`REGEXP_REPLACE(UPPER(TRIM(GM."VEHICLE_NO"::text)), '[^A-Z0-9]', '', 'g') LIKE '%' || $${paramIndex} || '%'`);
      params.push(cleanVeh);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const spjQuery = `
      SELECT 
        GM."GR_ID"::text as gr_id,
        GM."CONT_JO_ID"::text as cont_jo_id,
        TRIM(GM."VEHICLE_NO"::text) as vehicle_no,
        COALESCE(EM."EQUIPMENT_TYPE", 'T40') as vh_type,
        COALESCE(GM."CONT_SIZE", '40') as vh_size,
        GM."GR_NO"::text as gr_no,
        TO_CHAR(GM."GR_DATE", 'YYYY-MM-DD') as gr_date_iso,
        TO_CHAR(GM."GR_DATE", 'DD/MM/YYYY') as gr_date,
        TRIM(SPLIT_PART(GM."CONT_NO"::text, '-', 1)) as cont_no,
        COALESCE(GM."CONT_SIZE", '40') as cont_size,
        COALESCE(GM."CONT_TYPE", 'HC') as cont_type,
        COALESCE(TRIM(GM."FROM_LOCATION"::text), '') as from_location,
        COALESCE(TRIM(GM."TO_LOCATION"::text), '') as to_location,
        COALESCE(TRIM(GM."FACTORY_LOCATION"::text), '') as factory_location,
        COALESCE(TRIM(CUST."CUSTOMER_NAME"::text), 'Fair Exports (India) Pvt Ltd') as customer,
        TO_CHAR(GM."CLOSE_DATE", 'DD/MM/YYYY') as close_date,
        COALESCE(GM."ADVANCE"::text, '0') as advance,
        COALESCE(GM."OIL_ADVANCE"::text, '0') as oil_advance,
        COALESCE(GM."OTHER_AMT"::text, '0') as other_advance,
        COALESCE(TRIM(GM."OTHER_REASON"::text), '') as other_advance_reason,
        COALESCE(TRIM(GM."OTHER_REASON"::text), '') as other_reason,
        COALESCE(TRIM(FCJ."CLR_BY"::text), '') as survey_by,
        COALESCE(GM."C_GR"::text, '') as c_gr,
        COALESCE(TRIM(GM."SLIP_NO"::text), '') as slip_no,
        COALESCE(TRIM(GM."GR_REMARK"::text), '') as remarks,
        COALESCE(TRIM(DM."DRIVER_NAME"::text), '') as driver_name,
        COALESCE(TRIM(DM."MOBILE_NO"::text), '') as driver_mobile,
        TO_CHAR(DM."DL_RENEWABLE_DATE", 'YYYY-MM-DD') as license_validity,
        COALESCE(TRIM(VM."VENDOR_NAME"::text), '') as oil_vendor,
        COALESCE(TRIM(FCJ."CONT_JO_NO"::text), GM."CONT_JO_ID"::text, '') as jo_no,
        TO_CHAR(GM."CREATED_ON", 'YYYY-MM-DD') as jo_date,
        COALESCE(TRIM(FCJ."COMMODITY"::text), 'FROZEN BUFFALO BONELESS MEAT') as commodity,
        COALESCE(TRIM(GM."REMARK"::text), 'EICHER') as workshop
      FROM spjlive."FLEET_GR_MAPPING" GM
      LEFT JOIN spjlive."FLEET_EQUIPMENT_MASTER" EM 
        ON UPPER(TRIM(EM."EQUIPMENT_NO"::text)) = UPPER(TRIM(GM."VEHICLE_NO"::text))
      LEFT JOIN spjlive."CUSTOMER_MASTER" CUST 
        ON CUST."CUSTOMER_ID" = GM."CUSTOMER_ID"
      LEFT JOIN spjlive."FLEET_DRIVER_MASTER" DM
        ON DM."DRIVER_ID" = GM."DRIVER_ID"
      LEFT JOIN spjlive."VENDOR_MASTER" VM
        ON VM."VENDOR_ID" = GM."PETROL_VENDOR"
      LEFT JOIN spjlive."FLEET_CONT_JO" FCJ
        ON FCJ."CONT_JO_ID" = GM."CONT_JO_ID"
      ${whereClause}
      ORDER BY GM."GR_ID" DESC
      LIMIT 500;
    `;

    let { rows: spjRows } = await db.query(spjQuery, params);

    // If searching for a specific vehicle returned 0 results in date range, search vehicle across all dates!
    if (spjRows.length === 0 && cleanVeh) {
      const fallbackQuery = `
        SELECT 
          GM."GR_ID"::text as gr_id,
          GM."CONT_JO_ID"::text as cont_jo_id,
          TRIM(GM."VEHICLE_NO"::text) as vehicle_no,
          COALESCE(EM."EQUIPMENT_TYPE", 'T40') as vh_type,
          COALESCE(GM."CONT_SIZE", '40') as vh_size,
          GM."GR_NO"::text as gr_no,
          TO_CHAR(GM."GR_DATE", 'YYYY-MM-DD') as gr_date_iso,
          TO_CHAR(GM."GR_DATE", 'DD/MM/YYYY') as gr_date,
          TRIM(SPLIT_PART(GM."CONT_NO"::text, '-', 1)) as cont_no,
          COALESCE(GM."CONT_SIZE", '40') as cont_size,
          COALESCE(GM."CONT_TYPE", 'HC') as cont_type,
          COALESCE(TRIM(GM."FROM_LOCATION"::text), '') as from_location,
          COALESCE(TRIM(GM."TO_LOCATION"::text), '') as to_location,
          COALESCE(TRIM(GM."FACTORY_LOCATION"::text), '') as factory_location,
          COALESCE(TRIM(CUST."CUSTOMER_NAME"::text), 'Fair Exports (India) Pvt Ltd') as customer,
          TO_CHAR(GM."CLOSE_DATE", 'DD/MM/YYYY') as close_date,
          COALESCE(GM."ADVANCE"::text, '0') as advance,
          COALESCE(GM."OIL_ADVANCE"::text, '0') as oil_advance,
          COALESCE(GM."OTHER_AMT"::text, '0') as other_advance,
          COALESCE(TRIM(GM."OTHER_REASON"::text), '') as other_advance_reason,
          COALESCE(TRIM(GM."OTHER_REASON"::text), '') as other_reason,
          COALESCE(TRIM(FCJ."CLR_BY"::text), '') as survey_by,
          COALESCE(GM."C_GR"::text, '') as c_gr,
          COALESCE(TRIM(GM."SLIP_NO"::text), '') as slip_no,
          COALESCE(TRIM(GM."GR_REMARK"::text), '') as remarks,
          COALESCE(TRIM(DM."DRIVER_NAME"::text), '') as driver_name,
          COALESCE(TRIM(DM."MOBILE_NO"::text), '') as driver_mobile,
          TO_CHAR(DM."DL_RENEWABLE_DATE", 'YYYY-MM-DD') as license_validity,
          COALESCE(TRIM(VM."VENDOR_NAME"::text), '') as oil_vendor,
          COALESCE(TRIM(FCJ."CONT_JO_NO"::text), GM."CONT_JO_ID"::text, '') as jo_no,
          TO_CHAR(GM."CREATED_ON", 'YYYY-MM-DD') as jo_date,
          COALESCE(TRIM(FCJ."COMMODITY"::text), 'FROZEN BUFFALO BONELESS MEAT') as commodity,
          COALESCE(TRIM(GM."REMARK"::text), 'EICHER') as workshop
        FROM spjlive."FLEET_GR_MAPPING" GM
        LEFT JOIN spjlive."FLEET_EQUIPMENT_MASTER" EM 
          ON UPPER(TRIM(EM."EQUIPMENT_NO"::text)) = UPPER(TRIM(GM."VEHICLE_NO"::text))
        LEFT JOIN spjlive."CUSTOMER_MASTER" CUST 
          ON CUST."CUSTOMER_ID" = GM."CUSTOMER_ID"
        LEFT JOIN spjlive."FLEET_DRIVER_MASTER" DM
          ON DM."DRIVER_ID" = GM."DRIVER_ID"
        LEFT JOIN spjlive."VENDOR_MASTER" VM
          ON VM."VENDOR_ID" = GM."PETROL_VENDOR"
        LEFT JOIN spjlive."FLEET_CONT_JO" FCJ
          ON FCJ."CONT_JO_ID" = GM."CONT_JO_ID"
        WHERE GM."CANCEL_STATUS" IS NULL AND GM."GR_NO" IS NOT NULL
          AND REGEXP_REPLACE(UPPER(TRIM(GM."VEHICLE_NO"::text)), '[^A-Z0-9]', '', 'g') LIKE '%' || $1 || '%'
        ORDER BY GM."GR_ID" DESC
        LIMIT 100;
      `;
      const fallbackRes = await db.query(fallbackQuery, [cleanVeh]);
      if (fallbackRes.rows.length > 0) {
        spjRows = fallbackRes.rows;
      }
    }

    let localRows = [];
    try {
      let localCond = ["c.gr_number IS NOT NULL AND c.gr_number != ''"];
      let lParams = [];
      let lIdx = 1;
      if (parsedFrom) {
        localCond.push(`COALESCE(c.gr_date, c.created_at::date) >= $${lIdx}::date`);
        lParams.push(parsedFrom);
        lIdx++;
      }
      if (parsedTo) {
        localCond.push(`COALESCE(c.gr_date, c.created_at::date) <= $${lIdx}::date`);
        lParams.push(parsedTo);
        lIdx++;
      }
      if (cleanVeh) {
        localCond.push(`REGEXP_REPLACE(UPPER(TRIM(COALESCE(c.truck_number, '')::text)), '[^A-Z0-9]', '', 'g') LIKE '%' || $${lIdx} || '%'`);
        lParams.push(cleanVeh);
        lIdx++;
      }
      const localQuery = `
        SELECT 
          c.id::text as gr_id,
          c.job_id::text as cont_jo_id,
          COALESCE(TRIM(c.truck_number::text), 'HR55AN2094') as vehicle_no,
          'T40' as vh_type,
          CASE WHEN c.size_type LIKE '%20%' THEN '20' ELSE '40' END as vh_size,
          c.gr_number as gr_no,
          TO_CHAR(COALESCE(c.gr_date, c.created_at::date), 'YYYY-MM-DD') as gr_date_iso,
          TO_CHAR(COALESCE(c.gr_date, c.created_at::date), 'DD/MM/YYYY') as gr_date,
          c.container_number as cont_no,
          CASE WHEN c.size_type LIKE '%20%' THEN '20' ELSE '40' END as cont_size,
          'HC' as cont_type,
          COALESCE(c.from_location, j.origin_port_name, 'TRANSWORLD-DADRI') as from_location,
          COALESCE(c.to_location, j.pod_port_name, 'ADANI-PATLI') as to_location,
          COALESCE(c.handover_location, j.handover_location, 'ADANI-PATLI') as factory_location,
          COALESCE(j.customer_name, 'Fair Exports (India) Pvt Ltd') as customer,
          COALESCE(j.consignee_name, 'ASIAN PERAL MYANMAR CO. LTD.') as consignee,
          TO_CHAR(c.trip_close_date, 'DD/MM/YYYY') as close_date,
          COALESCE(c.advance::text, '0') as advance,
          COALESCE(c.oil_advance::text, '0') as oil_advance,
          COALESCE(c.other_advance::text, '0') as other_advance,
          COALESCE(c.other_reason, '') as other_advance_reason,
          COALESCE(c.other_reason, '') as other_reason,
          COALESCE(c.survey_by, '') as survey_by,
          COALESCE(c.c_gr, '') as c_gr,
          COALESCE(c.slip_no, '') as slip_no,
          COALESCE(c.gr_remarks, '') as remarks,
          COALESCE(c.driver_name, '') as driver_name,
          COALESCE(c.driver_mobile, '') as driver_mobile,
          COALESCE(c.license_validity, '') as license_validity,
          COALESCE(c.oil_vendor, '') as oil_vendor,
          COALESCE(j.job_number, c.job_id::text, '') as jo_no,
          TO_CHAR(c.created_at::date, 'YYYY-MM-DD') as jo_date,
          COALESCE(j.commodity, 'FROZEN BUFFALO BONELESS MEAT') as commodity,
          COALESCE(c.workshop, 'EICHER') as workshop
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

// POST Cancel Goods Receipt
router.post('/cancel-gr', async (req, res) => {
  try {
    const { grId, grNo, contNo, reason } = req.body;
    if (!grId && !grNo && !contNo) {
      return res.status(400).json({ success: false, message: 'GR ID, GR No, or Container No is required for cancellation.' });
    }

    // 1. If in spjlive.FLEET_GR_MAPPING, mark CANCEL_STATUS = 'Y'
    try {
      if (grNo) {
        await db.query(`
          UPDATE spjlive."FLEET_GR_MAPPING" 
          SET "CANCEL_STATUS" = 'Y', "CANCEL_ON" = NOW(), "CANCEL_BY" = 'USER' 
          WHERE "GR_NO"::text = $1
        `, [String(grNo)]);
      } else if (grId) {
        await db.query(`
          UPDATE spjlive."FLEET_GR_MAPPING" 
          SET "CANCEL_STATUS" = 'Y', "CANCEL_ON" = NOW(), "CANCEL_BY" = 'USER' 
          WHERE "GR_ID"::text = $1
        `, [String(grId)]);
      }
    } catch (e) {
      console.warn('Could not cancel in spjlive.FLEET_GR_MAPPING:', e.message);
    }

    // 2. In job_containers, clear gr_number and gr_date so container returns to pending pool
    try {
      if (contNo) {
        await db.query(`
          UPDATE job_containers 
          SET gr_number = NULL, gr_date = NULL, truck_number = NULL, driver_name = NULL, driver_mobile = NULL
          WHERE UPPER(TRIM(container_number::text)) = UPPER(TRIM($1::text))
        `, [contNo]);
      } else if (grNo) {
        await db.query(`
          UPDATE job_containers 
          SET gr_number = NULL, gr_date = NULL, truck_number = NULL, driver_name = NULL, driver_mobile = NULL
          WHERE gr_number = $1
        `, [grNo]);
      }
    } catch (e) {
      console.warn('Could not reset job_containers for cancelled GR:', e.message);
    }

    res.json({
      success: true,
      message: `Goods Receipt ${grNo || grId} cancelled successfully. Container returned to pending list.`
    });
  } catch (err) {
    console.error('Error cancelling GR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST / PUT Update existing Goods Receipt
router.post('/update-gr', async (req, res) => {
  try {
    const {
      grId, grNo, vehicleNo, truckNo, driver, driverName, driverContactNo, driverMobile,
      licenseValidity, fromLocation, toLocation, handoverLocation, workshop, joFor,
      oilVendor, slipNo, remarks, cash, advance, oil, oilAdvance, others, otherAdvance, otherReason,
      surveyBy, cGr
    } = req.body;

    const actualTruck = vehicleNo || truckNo;
    const actualDriver = driver || driverName;
    const actualPhone = driverContactNo || driverMobile;
    const actualCash = parseFloat(cash !== undefined ? cash : advance) || 0;
    const actualOil = parseFloat(oil !== undefined ? oil : oilAdvance) || 0;
    const actualOthers = parseFloat(others !== undefined ? others : otherAdvance) || 0;
    const actualOtherReason = otherReason || otherAdvance || '';

    // Update local job_containers if mapped
    try {
      if (grNo) {
        await db.query(`
          UPDATE job_containers
          SET truck_number = COALESCE($1, truck_number),
              driver_name = COALESCE($2, driver_name),
              driver_mobile = COALESCE($3, driver_mobile),
              advance = $4,
              oil_advance = $5,
              other_advance = $6,
              slip_no = COALESCE($7, slip_no),
              oil_vendor = COALESCE($8, oil_vendor),
              workshop = COALESCE($9, workshop),
              c_gr = COALESCE($10, c_gr),
              gr_remarks = COALESCE($11, gr_remarks),
              handover_location = COALESCE($12, handover_location),
              from_location = COALESCE($13, from_location),
              to_location = COALESCE($14, to_location),
              license_validity = COALESCE($15, license_validity),
              survey_by = COALESCE($16, survey_by),
              other_reason = COALESCE($17, other_reason),
              updated_at = NOW()
          WHERE gr_number = $18
        `, [
          actualTruck, actualDriver, actualPhone, actualCash, actualOil, actualOthers,
          slipNo, oilVendor, workshop, cGr, remarks, handoverLocation, fromLocation, toLocation, licenseValidity,
          surveyBy, actualOtherReason, grNo
        ]);
      }
    } catch (e) {
      console.warn('Could not update job_containers:', e.message);
    }

    // Update spjlive.FLEET_GR_MAPPING if exists
    try {
      if (grNo) {
        await db.query(`
          UPDATE spjlive."FLEET_GR_MAPPING"
          SET "VEHICLE_NO" = COALESCE($1, "VEHICLE_NO"),
              "FROM_LOCATION" = COALESCE($2, "FROM_LOCATION"),
              "TO_LOCATION" = COALESCE($3, "TO_LOCATION"),
              "FACTORY_LOCATION" = COALESCE($4, "FACTORY_LOCATION"),
              "ADVANCE" = COALESCE($5::numeric, "ADVANCE"),
              "OIL_ADVANCE" = COALESCE($6::numeric, "OIL_ADVANCE"),
              "OTHER_AMT" = COALESCE($7::numeric, "OTHER_AMT"),
              "OTHER_REASON" = COALESCE($8, "OTHER_REASON"),
              "SLIP_NO" = COALESCE($9, "SLIP_NO"),
              "GR_REMARK" = COALESCE($10, "GR_REMARK"),
              "REMARK" = COALESCE($11, "REMARK"),
              "C_GR" = COALESCE($12::numeric, "C_GR"),
              "UPDATED_ON" = NOW(),
              "UPDATED_BY" = 'USER'
          WHERE "GR_NO"::text = $13 OR "GR_ID"::text = $14
        `, [
          actualTruck, fromLocation, toLocation, handoverLocation,
          actualCash, actualOil, actualOthers, actualOtherReason,
          slipNo, remarks, workshop, parseFloat(cGr) || null, String(grNo), String(grId || grNo)
        ]);
      }
    } catch (e) {
      console.warn('Could not update spjlive.FLEET_GR_MAPPING:', e.message);
    }

    res.json({
      success: true,
      message: `Goods Receipt ${grNo || grId} updated successfully.`
    });
  } catch (err) {
    console.error('Error updating GR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Generate GR for a pending container
router.post('/generate-gr', async (req, res) => {
  try {
    const {
      containerId, contNo, truckNo, vehicleNo, driverName, driver, driverMobile, driverContactNo,
      grNo, grDate, advance, cash, oilAdvance, oil, otherAdvance, others, otherReason, surveyBy,
      slipNo, oilVendor, workshop, cGr, remarks,
      fromLocation, toLocation, handoverLocation, licenseValidity,
      consignor, consignee, joNo, commodity, size, type, weight
    } = req.body;

    const actualContNo = contNo || containerId;
    if (!actualContNo) {
      return res.status(400).json({ success: false, message: 'containerId/contNo is required' });
    }

    const actualTruck = truckNo || vehicleNo || 'HR55AN2094';
    const actualDriver = driverName || driver || 'Ramesh Kumar';
    const actualPhone = driverMobile || driverContactNo || '9876543210';
    const actualCash = parseFloat(advance !== undefined ? advance : cash) || 0;
    const actualOil = parseFloat(oilAdvance !== undefined ? oilAdvance : oil) || 0;
    const actualOthers = parseFloat(otherAdvance !== undefined ? otherAdvance : others) || 0;
    const actualOtherReason = otherReason || (typeof otherAdvance === 'string' && isNaN(Number(otherAdvance)) ? otherAdvance : '');
    const actualGrDate = grDate || new Date().toISOString().split('T')[0];

    // Get next GR sequence
    let finalGrNo = grNo;
    let finalGrId = null;
    try {
      const maxRes = await db.query('SELECT COALESCE(MAX("GR_ID"), 61709) + 1 AS next_id, COALESCE(MAX("GR_NO"), 61530) + 1 AS next_no FROM spjlive."FLEET_GR_MAPPING"');
      finalGrId = maxRes.rows[0].next_id;
      if (!finalGrNo) {
        finalGrNo = 'GR-' + maxRes.rows[0].next_no;
      }
    } catch (e) {
      finalGrNo = finalGrNo || ('GR-2026-' + Math.floor(1000 + Math.random() * 9000));
      finalGrId = Date.now();
    }

    // 1. Update job_containers if exists
    let updatedContainer = null;
    try {
      const updateQuery = `
        UPDATE job_containers SET
          gr_number = $1,
          gr_date = $2,
          truck_number = COALESCE($3, truck_number),
          driver_name = COALESCE($4, driver_name),
          driver_mobile = COALESCE($5, driver_mobile),
          advance = $6,
          oil_advance = $7,
          other_advance = $8,
          slip_no = $9,
          oil_vendor = $10,
          workshop = $11,
          c_gr = $12,
          gr_remarks = $13,
          handover_location = COALESCE($14, handover_location),
          from_location = COALESCE($15, from_location),
          to_location = COALESCE($16, to_location),
          license_validity = $17,
          survey_by = COALESCE($18, survey_by),
          other_reason = COALESCE($19, other_reason),
          current_status = 'STUFFED',
          milestone_dates = jsonb_set(
            COALESCE(milestone_dates, '{}'::jsonb),
            '{STUFFED}',
            to_jsonb(NOW()::text)
          ),
          updated_at = NOW()
        WHERE id = $20 OR container_number = $20 OR container_number = $21
        RETURNING *;
      `;
      const values = [
        finalGrNo, actualGrDate, actualTruck, actualDriver, actualPhone,
        actualCash, actualOil, actualOthers, slipNo || '', oilVendor || '', workshop || '',
        cGr || '', remarks || '', handoverLocation || '', fromLocation || '', toLocation || '',
        licenseValidity || '', surveyBy || '', actualOtherReason, containerId, actualContNo
      ];
      const { rows } = await db.query(updateQuery, values);
      if (rows.length > 0) {
        updatedContainer = rows[0];
        await db.query("UPDATE job_orders SET status = 'STUFFED', updated_at = NOW() WHERE id = $1", [updatedContainer.job_id]);
      }
    } catch (e) {
      console.warn('Could not update job_containers:', e.message);
    }

    // 2. Insert into spjlive.FLEET_GR_MAPPING
    try {
      const cleanNumericGrNo = parseInt(String(finalGrNo).replace(/[^0-9]/g, ''), 10) || finalGrId;
      await db.query(`
        INSERT INTO spjlive."FLEET_GR_MAPPING" (
          "GR_ID", "GR_NO", "GR_DATE", "CONT_NO", "CONT_SIZE", "CONT_TYPE",
          "VEHICLE_NO", "ADVANCE", "OIL_ADVANCE", "OTHER_AMT",
          "FROM_LOCATION", "TO_LOCATION", "FACTORY_LOCATION",
          "SLIP_NO", "GR_REMARK", "REMARK", "C_GR", "CREATED_ON", "CREATED_BY"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), 'USER')
        ON CONFLICT DO NOTHING;
      `, [
        finalGrId, cleanNumericGrNo, actualGrDate, actualContNo, size || '40', type || 'HC',
        actualTruck, actualCash, actualOil, actualOthers,
        fromLocation || 'TRANSWORLD-DADRI', toLocation || 'ADANI-PATLI', handoverLocation || 'ADANI-PATLI',
        slipNo || '', remarks || '', workshop || '', cGr || null
      ]);

      // Link to FLEET_CONT_JO_DTLS if exists
      await db.query(`
        UPDATE spjlive."FLEET_CONT_JO_DTLS"
        SET "GR_ID" = $1
        WHERE TRIM("CONT_NO"::text) = TRIM($2::text) AND COALESCE("GR_ID", 0) = 0
      `, [finalGrId, actualContNo]);
    } catch (e) {
      console.warn('Could not insert spjlive.FLEET_GR_MAPPING:', e.message);
    }

    res.json({
      success: true,
      grNumber: finalGrNo,
      grId: finalGrId,
      grDate: actualGrDate,
      data: updatedContainer || {
        container_number: actualContNo,
        gr_number: finalGrNo,
        truck_number: actualTruck,
        driver_name: actualDriver
      }
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
      c.edi_sb_status, c.edi_filing_date, c.train_no, c.wagon_no, c.deck_tier, c.rake_out_date,
      c.feeder_vessel, c.cut_off_date, c.berthing_date, c.sob_date, c.bl_stage,
      c.telex_released, c.telex_release_date, c.tr_no, c.tr_status, c.tr_date,
      c.handover_status, c.handover_date, c.egm_no, c.egm_date, c.discharge_date,
      c.delivered_to_consignee_date, c.empty_returned_depot_date,
      c.empty_out_date, c.factory_gate_in_date, c.factory_gate_out_date, c.buffer_in_date, c.loaded_icd_in_date,
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
    emptyOutDate: r.empty_out_date ? new Date(r.empty_out_date).toISOString().split('T')[0] : '',
    factoryGateInDate: r.factory_gate_in_date ? new Date(r.factory_gate_in_date).toISOString().split('T')[0] : '',
    factoryGateOutDate: r.factory_gate_out_date ? new Date(r.factory_gate_out_date).toISOString().split('T')[0] : '',
    bufferInDate: r.buffer_in_date ? new Date(r.buffer_in_date).toISOString().split('T')[0] : '',
    loadedIcdInDate: r.loaded_icd_in_date ? new Date(r.loaded_icd_in_date).toISOString().split('T')[0] : '',
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
    const {
      containerId,
      currentLocation,
      runningStatus,
      emptyOutDate,
      factoryGateInDate,
      factoryGateOutDate,
      bufferInDate,
      loadedIcdInDate,
      gpsLat,
      gpsLng
    } = req.body;

    const { rows } = await db.query(
      `UPDATE job_containers SET 
         current_location = COALESCE($1, current_location),
         running_status = COALESCE($2, running_status),
         empty_out_date = COALESCE($3::date, empty_out_date),
         factory_gate_in_date = COALESCE($4::date, factory_gate_in_date),
         factory_gate_out_date = COALESCE($5::date, factory_gate_out_date),
         buffer_in_date = COALESCE($6::date, buffer_in_date),
         loaded_icd_in_date = COALESCE($7::date, loaded_icd_in_date),
         gps_lat = COALESCE($8, gps_lat),
         gps_lng = COALESCE($9, gps_lng),
         updated_at = NOW()
       WHERE id = $10 OR container_number = $10 RETURNING *`,
      [
        currentLocation,
        runningStatus,
        emptyOutDate || null,
        factoryGateInDate || null,
        factoryGateOutDate || null,
        bufferInDate || null,
        loadedIcdInDate || null,
        gpsLat,
        gpsLng,
        containerId
      ]
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
    const { containerId, trainNo, wagonNo, deckTier, rakeOutDate } = req.body;
    const { rows } = await db.query(
      `UPDATE job_containers SET 
         train_no = COALESCE($1, train_no),
         wagon_no = COALESCE($2, wagon_no),
         deck_tier = COALESCE($3, deck_tier),
         rake_out_date = COALESCE($4::date, rake_out_date, CURRENT_DATE),
         current_status = 'RAIL_OUT',
         updated_at = NOW()
       WHERE id = $5 OR container_number = $5 RETURNING *`,
      [trainNo || null, wagonNo || null, deckTier || null, rakeOutDate || null, containerId]
    );

    // Sync to spjlive."ALL_PARTY_ACCOUNT" if matched
    try {
      const wagonNum = wagonNo && !isNaN(wagonNo) ? Number(wagonNo) : null;
      await db.query(`
        UPDATE spjlive."ALL_PARTY_ACCOUNT" SET
          "TRAIN_NO" = COALESCE($1, "TRAIN_NO"),
          "WAGON_NO" = COALESCE($2, "WAGON_NO"),
          "TRAIN_OUT_DATE" = COALESCE($3::timestamp, "TRAIN_OUT_DATE")
        WHERE "CONT_NO" = $4 OR "TRACK_ID"::text = $4
      `, [trainNo || null, wagonNum, rakeOutDate || null, containerId]);
    } catch (e) {}

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

