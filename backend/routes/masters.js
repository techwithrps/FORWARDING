const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. CUSTOMERS MASTER
router.get('/customers', async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM parties WHERE party_type IN ('SHIPPER', 'CONSIGNEE', 'FORWARDER', 'CHA') ORDER BY name ASC"
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const c = req.body;
    const id = c.code || ('CUST-' + String(Date.now()).slice(-4));
    const query = `
      INSERT INTO parties (
        id, code, name, party_type, contact_person, contact_no, mobile,
        email_comm, email_ops, address, city, state, country, pin,
        gstin, pan, tan, tally_tpt_name, tally_frt_name, map_code,
        payment_terms, credit_limit, credit_period, is_export, is_import, is_domestic, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *;
    `;
    const values = [
      id, c.code || id, c.name, c.type || 'SHIPPER', c.contactPerson || '', c.contactNo || '', c.mobile || '',
      c.emailComm || '', c.emailOps || '', c.address || '', c.city || '', c.state || '', c.country || 'India', c.pin || '',
      c.gstin || '', c.pan || '', c.tan || '', c.tallyTptName || '', c.tallyFrtName || '', c.mapCode || '',
      c.paymentTerms || '30 Days', c.creditLimit || '10,00,000', c.creditPeriod || '30',
      c.isExport !== false, c.isImport === true, c.isDomestic !== false, c.status || 'ACTIVE'
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const c = req.body;
    const query = `
      UPDATE parties SET
        name = COALESCE($1, name),
        party_type = COALESCE($2, party_type),
        contact_person = COALESCE($3, contact_person),
        contact_no = COALESCE($4, contact_no),
        mobile = COALESCE($5, mobile),
        email_comm = COALESCE($6, email_comm),
        email_ops = COALESCE($7, email_ops),
        address = COALESCE($8, address),
        city = COALESCE($9, city),
        state = COALESCE($10, state),
        pin = COALESCE($11, pin),
        gstin = COALESCE($12, gstin),
        pan = COALESCE($13, pan),
        tan = COALESCE($14, tan),
        tally_tpt_name = COALESCE($15, tally_tpt_name),
        tally_frt_name = COALESCE($16, tally_frt_name),
        map_code = COALESCE($17, map_code),
        payment_terms = COALESCE($18, payment_terms),
        credit_limit = COALESCE($19, credit_limit),
        credit_period = COALESCE($20, credit_period),
        is_export = COALESCE($21, is_export),
        is_import = COALESCE($22, is_import),
        is_domestic = COALESCE($23, is_domestic),
        status = COALESCE($24, status),
        updated_at = NOW()
      WHERE id = $25 OR code = $25
      RETURNING *;
    `;
    const values = [
      c.name, c.type, c.contactPerson, c.contactNo, c.mobile,
      c.emailComm, c.emailOps, c.address, c.city, c.state, c.pin,
      c.gstin, c.pan, c.tan, c.tallyTptName, c.tallyFrtName, c.mapCode,
      c.paymentTerms, c.creditLimit, c.creditPeriod, c.isExport, c.isImport, c.isDomestic,
      c.status, id
    ];
    const { rows } = await db.query(query, values);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM parties WHERE id = $1 OR code = $1', [id]);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. DRIVER MASTER (AFTO/OCPL)
router.get('/drivers', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT ON (UPPER(TRIM(name)))
        id, name, vehicle, dl_no, validity, mobile, transporter, status
      FROM (
        SELECT 
          'DRV-' || "DRIVER_ID" AS id,
          TRIM("DRIVER_NAME") AS name,
          COALESCE(UPPER(TRIM("VEHICLE_NO")), '') AS vehicle,
          COALESCE("DL_NO", '') AS dl_no,
          TO_CHAR("DL_RENEWABLE_DATE", 'YYYY-MM-DD') AS validity,
          COALESCE("MOBILE_NO", "CONTACT_NO", '') AS mobile,
          'Dadri Express Logistics' AS transporter,
          'ACTIVE' AS status
        FROM spjlive."FLEET_DRIVER_MASTER"
        WHERE "DRIVER_NAME" IS NOT NULL AND TRIM("DRIVER_NAME") != ''
        UNION ALL
        SELECT id, name, vehicle, dl_no, validity::text, mobile, transporter, status
        FROM public.drivers
      ) all_drv
      ORDER BY UPPER(TRIM(name)) ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/drivers', async (req, res) => {
  try {
    const d = req.body;
    const id = d.id || ('DRV-' + String(Date.now()).slice(-4));
    const query = `
      INSERT INTO drivers (
        id, name, vehicle, dl_no, validity, mobile, personal_contact,
        emergency, blood, email, joining, salary, transporter, address, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *;
    `;
    const values = [
      id, d.name, d.vehicle || '', d.dlNo, d.validity || null, d.mobile,
      d.personalContact || '', d.emergency || '', d.blood || 'B+', d.email || '',
      d.joining || new Date().toISOString().split('T')[0], d.salary || '28,000',
      d.transporter || 'Dadri Express Logistics', d.address || '', d.status || 'ACTIVE'
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error creating driver:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/drivers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const d = req.body;
    const query = `
      UPDATE drivers SET
        name = COALESCE($1, name),
        vehicle = COALESCE($2, vehicle),
        dl_no = COALESCE($3, dl_no),
        validity = COALESCE($4, validity),
        mobile = COALESCE($5, mobile),
        personal_contact = COALESCE($6, personal_contact),
        emergency = COALESCE($7, emergency),
        blood = COALESCE($8, blood),
        email = COALESCE($9, email),
        salary = COALESCE($10, salary),
        transporter = COALESCE($11, transporter),
        address = COALESCE($12, address),
        status = COALESCE($13, status),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *;
    `;
    const values = [
      d.name, d.vehicle, d.dlNo, d.validity || null, d.mobile,
      d.personalContact, d.emergency, d.blood, d.email, d.salary,
      d.transporter, d.address, d.status, id
    ];
    const { rows } = await db.query(query, values);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating driver:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/drivers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM drivers WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('Error deleting driver:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. VEHICLE MASTER
router.get('/vehicles', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT ON (UPPER(TRIM(truck_no)))
        id, truck_no, type, model, transporter, status, driver_name, driver_mobile, license_validity
      FROM (
        SELECT 
          'VEH-' || EM."EQUIPMENT_ID" AS id,
          UPPER(TRIM(EM."EQUIPMENT_NO")) AS truck_no,
          COALESCE(EM."EQUIPMENT_TYPE", 'T40') AS type,
          COALESCE(EM."MODEL", 'Trailer') AS model,
          'Dadri Express Logistics' AS transporter,
          'ACTIVE' AS status,
          TRIM(DM."DRIVER_NAME") AS driver_name,
          COALESCE(DM."MOBILE_NO", DM."CONTACT_NO", '') AS driver_mobile,
          TO_CHAR(DM."DL_RENEWABLE_DATE", 'YYYY-MM-DD') AS license_validity
        FROM spjlive."FLEET_EQUIPMENT_MASTER" EM
        LEFT JOIN spjlive."FLEET_DRIVER_MASTER" DM 
          ON UPPER(TRIM(DM."VEHICLE_NO")) = UPPER(TRIM(EM."EQUIPMENT_NO"))
        WHERE EM."EQUIPMENT_NO" IS NOT NULL 
          AND LENGTH(TRIM(EM."EQUIPMENT_NO")) >= 6
          AND (EM."EQUIPMENT_TYPE" IN ('T20', 'T40') OR EM."EQUIPMENT_TYPE" IS NULL)
          AND (EM."STATUS" IN ('Y', 'B', 'O') OR EM."STATUS" IS NULL)
        UNION ALL
        SELECT 
          id, truck_no, type, model, transporter, status,
          NULL as driver_name, '' as driver_mobile, NULL as license_validity
        FROM public.vehicles
      ) all_veh
      ORDER BY UPPER(TRIM(truck_no)) ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const v = req.body;
    const id = v.id || ('VEH-' + String(Date.now()).slice(-4));
    const query = `
      INSERT INTO vehicles (
        id, truck_no, type, model, year, engine_no, vin_no,
        license_plate, tare_weight, gross_weight, changeable_bed,
        condition, fuel_type, fuel_card_no, fitness_expiry, transporter, terminal, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *;
    `;
    const values = [
      id, v.truckNo, v.type || '40FT Trailer', v.model, v.year || '2023',
      v.engineNo || '', v.vinNo || '', v.licensePlate || v.truckNo,
      v.tareWeight || '12500', v.grossWeight || '44500', v.changeableBed || 'YES',
      v.condition || 'Excellent', v.fuelType || 'Diesel', v.fuelCardNo || '',
      v.fitnessExpiry || null, v.transporter || 'Dadri Express Logistics',
      v.terminal || 'Dadri ICD (INICD6)', v.status || 'ACTIVE'
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const v = req.body;
    const query = `
      UPDATE vehicles SET
        truck_no = COALESCE($1, truck_no),
        type = COALESCE($2, type),
        model = COALESCE($3, model),
        year = COALESCE($4, year),
        engine_no = COALESCE($5, engine_no),
        vin_no = COALESCE($6, vin_no),
        tare_weight = COALESCE($7, tare_weight),
        gross_weight = COALESCE($8, gross_weight),
        changeable_bed = COALESCE($9, changeable_bed),
        condition = COALESCE($10, condition),
        fuel_card_no = COALESCE($11, fuel_card_no),
        fitness_expiry = COALESCE($12, fitness_expiry),
        transporter = COALESCE($13, transporter),
        terminal = COALESCE($14, terminal),
        status = COALESCE($15, status),
        updated_at = NOW()
      WHERE id = $16 OR truck_no = $16
      RETURNING *;
    `;
    const values = [
      v.truckNo, v.type, v.model, v.year, v.engineNo, v.vinNo,
      v.tareWeight, v.grossWeight, v.changeableBed, v.condition,
      v.fuelCardNo, v.fitnessExpiry || null, v.transporter, v.terminal, v.status, id
    ];
    const { rows } = await db.query(query, values);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vehicles WHERE id = $1 OR truck_no = $1', [req.params.id]);
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PORT MASTER (UN/LOCODE)
router.get('/ports', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM ports ORDER BY code ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching ports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ports', async (req, res) => {
  try {
    const p = req.body;
    const id = p.id || ('PRT-' + String(Date.now()).slice(-4));
    const query = `
      INSERT INTO ports (
        id, code, name, type, country, custom_ref_import, custom_ref_export, terminal, address, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      id, p.code.toUpperCase(), p.name, p.type || 'SEAPORT', p.country || 'India',
      p.customRefImport || p.code, p.customRefExport || p.code, p.terminal || '',
      p.address || '', p.status || 'ACTIVE'
    ];
    const { rows } = await db.query(query, values);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error creating port:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/ports/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const p = req.body;
    const query = `
      UPDATE ports SET
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        type = COALESCE($3, type),
        country = COALESCE($4, country),
        custom_ref_import = COALESCE($5, custom_ref_import),
        custom_ref_export = COALESCE($6, custom_ref_export),
        terminal = COALESCE($7, terminal),
        address = COALESCE($8, address),
        status = COALESCE($9, status)
      WHERE id = $10 OR code = $10
      RETURNING *;
    `;
    const values = [
      p.code, p.name, p.type, p.country, p.customRefImport,
      p.customRefExport, p.terminal, p.address, p.status, id
    ];
    const { rows } = await db.query(query, values);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Port not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating port:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/ports/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ports WHERE id = $1 OR code = $1', [req.params.id]);
    res.json({ success: true, message: 'Port deleted successfully' });
  } catch (err) {
    console.error('Error deleting port:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. COMPANY PROFILE & SERVICES
router.get('/company', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM company_profile LIMIT 1');
    res.json({ success: true, data: rows[0] || {} });
  } catch (err) {
    console.error('Error fetching company profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/company', async (req, res) => {
  try {
    const c = req.body;
    const query = `
      UPDATE company_profile SET
        company_name = COALESCE($1, company_name),
        website = COALESCE($2, website),
        gstin = COALESCE($3, gstin),
        pan = COALESCE($4, pan),
        tally_name = COALESCE($5, tally_name),
        finance_map_code = COALESCE($6, finance_map_code),
        address = COALESCE($7, address),
        updated_at = NOW()
      WHERE id = 'MAIN'
      RETURNING *;
    `;
    const values = [c.name, c.website, c.gstin, c.pan, c.tallyName, c.financeMapCode, c.address];
    const { rows } = await db.query(query, values);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error updating company profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/services', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM charge_heads WHERE is_active = TRUE ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// 6. TAX HEAD GROUPS & TAX HEADS
router.get('/tax-head-groups', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tax_head_groups ORDER BY created_at ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tax-head-groups', async (req, res) => {
  try {
    const g = req.body;
    const id = g.id || ('THG-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      'INSERT INTO tax_head_groups (id, group_name, description, gst_category, is_exempt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, g.groupName, g.description, g.gstCategory || 'STANDARD_SERVICES', g.isExempt || false]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/tax-heads', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT th.*, thg.group_name 
      FROM tax_heads th 
      LEFT JOIN tax_head_groups thg ON th.group_id = thg.id 
      ORDER BY th.created_at ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tax-heads', async (req, res) => {
  try {
    const t = req.body;
    const id = t.id || ('TH-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      'INSERT INTO tax_heads (id, group_id, head_name, hsn_sac_code, cgst_rate, sgst_rate, igst_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, t.groupId, t.headName, t.hsnSacCode || '996511', t.cgstRate || 0, t.sgstRate || 0, t.igstRate || 0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. SERVICE MASTER
router.get('/service-master', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM service_master ORDER BY service_code ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/service-master', async (req, res) => {
  try {
    const s = req.body;
    const id = s.id || ('SRV-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      `INSERT INTO service_master (id, service_code, service_name, category, sac_code, default_buy_rate, default_sell_rate, uom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, s.serviceCode.toUpperCase(), s.serviceName, s.category || 'FREIGHT', s.sacCode || '996511', s.defaultBuyRate || 0, s.defaultSellRate || 0, s.uom || 'CONTAINER']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. TERMINALS
router.get('/terminals', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM terminals ORDER BY code ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/terminals', async (req, res) => {
  try {
    const t = req.body;
    const id = t.id || ('TERM-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      `INSERT INTO terminals (id, code, name, type, state, city, operator, rail_connected, un_locode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, t.code.toUpperCase(), t.name, t.type || 'ICD', t.state || '', t.city || '', t.operator || 'CONCOR', t.railConnected !== false, t.unLocode || t.code]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. UOM MASTER
router.get('/uom', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM uom_master ORDER BY uom_code ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/uom', async (req, res) => {
  try {
    const u = req.body;
    const id = u.id || ('UOM-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      'INSERT INTO uom_master (id, uom_code, uom_name, category, conversion_factor, base_unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, u.uomCode.toUpperCase(), u.uomName, u.category || 'CONTAINER', u.conversionFactor || 1.0, u.baseUnit || 'UNIT']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. COMMODITY MASTER
router.get('/commodities', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM commodities ORDER BY name ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/commodities', async (req, res) => {
  try {
    const c = req.body;
    const id = c.id || ('CMD-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      `INSERT INTO commodities (id, code, name, hsn_code, requires_reefer, standard_temp, humidity_req, hazardous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, c.code.toUpperCase(), c.name, c.hsnCode || '', c.requiresReefer || false, c.standardTemp || 'Ambient', c.humidityReq || '', c.hazardous || false]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. BANK MASTER
router.get('/banks', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM bank_accounts ORDER BY is_default DESC, bank_name ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/banks', async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || ('BANK-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      `INSERT INTO bank_accounts (id, bank_name, account_name, account_number, ifsc_code, branch_name, swift_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, b.bankName, b.accountName, b.accountNumber, b.ifscCode.toUpperCase(), b.branchName || '', b.swiftCode || '', b.isDefault || false]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. RATE TARIFF & APPROVALS
router.get('/tariffs', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM rate_tariffs ORDER BY created_at DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tariffs', async (req, res) => {
  try {
    const t = req.body;
    const id = t.id || ('TRF-' + String(Date.now()).slice(-4));
    const { rows } = await db.query(
      `INSERT INTO rate_tariffs (id, tariff_code, origin, destination, container_size, commodity, buy_rate, sell_rate, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, t.tariffCode || id, t.origin, t.destination, t.containerSize || '40HC', t.commodity || 'GENERAL', t.buyRate, t.sellRate, 'PENDING_APPROVAL']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/tariffs/:id/approve', async (req, res) => {
  try {
    const id = req.params.id;
    const { approvedBy, status } = req.body;
    const { rows } = await db.query(
      'UPDATE rate_tariffs SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 RETURNING *',
      [status || 'APPROVED', approvedBy || 'Commercial Director', id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. OIL VENDORS (SPJ Fleet Fuel Vendor Master)
router.get('/oil-vendors', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT VM."VENDOR_ID" AS id, TRIM(VM."VENDOR_NAME") AS name 
      FROM spjlive."VENDOR_MASTER" VM
      JOIN spjlive."VENDOR_TYPE_DETAILS" VD ON VD."VENDOR_ID" = VM."VENDOR_ID"
      WHERE VD."VENDER_TYPE_CODE" = 'P'
      ORDER BY VM."VENDOR_NAME" ASC
    `);
    const defaultVendors = [
      { id: '99', name: 'BP PUMP PADGHA' },
      { id: '100', name: 'GANGA SHREE PETROLEUM' },
      { id: '103', name: 'HINDUSTAN DOCKYARD PVT. LTD.' },
      { id: '98', name: 'RAGHUNANDAN PRASAD AND SONS' }
    ];
    res.json({ success: true, count: rows.length || defaultVendors.length, data: rows.length ? rows : defaultVendors });
  } catch (err) {
    console.error('Error fetching oil vendors:', err);
    res.json({
      success: true,
      data: [
        { id: '99', name: 'BP PUMP PADGHA' },
        { id: '100', name: 'GANGA SHREE PETROLEUM' },
        { id: '103', name: 'HINDUSTAN DOCKYARD PVT. LTD.' },
        { id: '98', name: 'RAGHUNANDAN PRASAD AND SONS' }
      ]
    });
  }
});

// 14. WORKSHOPS (SPJ Fleet Workshop Master)
router.get('/workshops', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT "WR_ID" AS id, TRIM("WR_NAME") AS name 
      FROM spjlive."WORKSHOP_MASTER" 
      ORDER BY "WR_NAME" ASC
    `);
    const defaultWorkshops = [
      { id: '1', name: 'EICHER' },
      { id: '2', name: 'ASHOK LEYLAND' },
      { id: '5', name: 'MAHINDRA' },
      { id: '4', name: 'PVT' },
      { id: '6', name: 'TATA MOTORS' }
    ];
    res.json({ success: true, count: rows.length || defaultWorkshops.length, data: rows.length ? rows : defaultWorkshops });
  } catch (err) {
    console.error('Error fetching workshops:', err);
    res.json({
      success: true,
      data: [
        { id: '1', name: 'EICHER' },
        { id: '2', name: 'ASHOK LEYLAND' },
        { id: '5', name: 'MAHINDRA' },
        { id: '4', name: 'PVT' },
        { id: '6', name: 'TATA MOTORS' }
      ]
    });
  }
});

// 15. LOCATIONS MASTER (Categorized into From, To, Handover from SPJ Database)
router.get('/locations', async (req, res) => {
  try {
    // 1. FROM LOCATIONS (Depots / Yards / Inland Container Terminals)
    const fromRes = await db.query(`
      SELECT DISTINCT loc FROM (
        SELECT TRIM("FROM_LOCATION") as loc FROM spjlive."FLEET_GR_MAPPING" 
        WHERE "FROM_LOCATION" IS NOT NULL AND TRIM("FROM_LOCATION") != '' AND LENGTH(TRIM("FROM_LOCATION")) > 1
        UNION
        SELECT TRIM("TERMINAL_NAME") as loc FROM spjlive."TERMINAL_MASTER" 
        WHERE "TERMINAL_NAME" IS NOT NULL AND TRIM("TERMINAL_NAME") != ''
      ) u
      WHERE loc NOT LIKE '%.%' 
        AND loc NOT LIKE 'aTRANSWORLD%' 
        AND loc NOT LIKE '%TO CONCOR%'
        AND loc NOT LIKE 'TO %'
        AND LENGTH(loc) >= 3
      ORDER BY loc ASC
    `);

    // 2. TO LOCATIONS (Factory, Stuffing Plants, Destination Cities)
    const toRes = await db.query(`
      SELECT DISTINCT loc FROM (
        SELECT TRIM("TO_LOCATION") as loc FROM spjlive."FLEET_GR_MAPPING" 
        WHERE "TO_LOCATION" IS NOT NULL AND TRIM("TO_LOCATION") != '' AND LENGTH(TRIM("TO_LOCATION")) > 1
        UNION
        SELECT TRIM("LOCATION_NAME") as loc FROM spjlive."TERMINAL_LOCATION_MASTER" 
        WHERE "LOCATION_NAME" IS NOT NULL AND TRIM("LOCATION_NAME") != '' 
          AND "LOCATION_NAME" NOT LIKE '% TO %'
          AND "LOCATION_NAME" NOT LIKE '%-%'
      ) u
      WHERE loc NOT LIKE '% TO %'
        AND LENGTH(loc) >= 3
        AND loc NOT LIKE '%.%'
      ORDER BY loc ASC
    `);

    // 3. HANDOVER LOCATIONS (Port Terminals, ICD Gateways)
    const handRes = await db.query(`
      SELECT DISTINCT loc FROM (
        SELECT TRIM("FACTORY_LOCATION") as loc FROM spjlive."FLEET_GR_MAPPING" 
        WHERE "FACTORY_LOCATION" IS NOT NULL AND TRIM("FACTORY_LOCATION") != '' AND LENGTH(TRIM("FACTORY_LOCATION")) > 1
        UNION
        SELECT TRIM("TERMINAL_NAME") as loc FROM spjlive."TERMINAL_MASTER" 
        WHERE "TERMINAL_NAME" IS NOT NULL AND TRIM("TERMINAL_NAME") != ''
      ) u
      WHERE loc NOT LIKE '%.%' 
        AND loc NOT LIKE 'aTRANSWORLD%' 
        AND loc NOT LIKE '%TO CONCOR%'
        AND loc NOT LIKE 'TO %'
        AND LENGTH(loc) >= 3
      ORDER BY loc ASC
    `);

    const fromLocations = fromRes.rows.map(r => r.loc);
    const toLocations = toRes.rows.map(r => r.loc);
    const handoverLocations = handRes.rows.map(r => r.loc);

    res.json({
      success: true,
      data: {
        fromLocations,
        toLocations,
        handoverLocations,
        allLocations: Array.from(new Set([...fromLocations, ...toLocations, ...handoverLocations]))
      }
    });
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. CONSIGNORS (SPJ Customer / Shipper Master)
router.get('/consignors', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT TRIM("CUSTOMER_NAME") as name
      FROM spjlive."CUSTOMER_MASTER"
      WHERE "CUSTOMER_NAME" IS NOT NULL 
        AND ("CUSTOMER_TYPE" IN ('E', 'R', 'C') 
             OR "CUSTOMER_ID" IN (SELECT DISTINCT "CUSTOMER_ID" FROM spjlive."FLEET_CONT_JO" WHERE "CUSTOMER_ID" > 0))
      ORDER BY name ASC
    `);
    const names = rows.map(r => r.name).filter(Boolean);
    res.json({ success: true, count: names.length, data: names });
  } catch (err) {
    console.error('Error fetching consignors:', err);
    res.json({
      success: true,
      data: [
        'Fair Exports (India) Pvt Ltd',
        'SPJ CARGO PVT LTD.',
        'HMA FOOD EXPORT PVT LTD',
        'HMA AGRO INDUSTRIES LTD',
        'Marhaba Frozen Foods',
        'Allanasons Private Limited',
        'Al Sameer Exports Pvt Ltd',
        'Deepmala Foods',
        'Deccan Edibles Pvt Ltd',
        'UNITED FARM PRODUCT PRIVATE LIMITED',
        'S. J. CARGO MOVERS'
      ]
    });
  }
});

// 17. CONSIGNEES (SPJ Buyer / Consignee / Delivery Master)
router.get('/consignees', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT TRIM("CUSTOMER_NAME") as name
      FROM spjlive."CUSTOMER_MASTER"
      WHERE "CUSTOMER_NAME" IS NOT NULL 
        AND ("CUSTOMER_ID" IN (SELECT DISTINCT "CONSIGNEE_ID" FROM spjlive."FLEET_CONT_JO" WHERE "CONSIGNEE_ID" > 0)
             OR "CUSTOMER_TYPE" IN ('E', 'I', 'C'))
      ORDER BY name ASC
    `);
    const names = rows.map(r => r.name).filter(Boolean);
    res.json({ success: true, count: names.length, data: names });
  } catch (err) {
    console.error('Error fetching consignees:', err);
    res.json({
      success: true,
      data: [
        'FAIR EXPORTS (INDIA) PVT LTD',
        'HMA AGRO INDUSTRIES LTD',
        'IFF INDIA FROZEN FOODS PRIVATE LIMITED',
        'RUSTAM FOODS PVT.LTD.',
        'MARHABA FROZEN FOODS',
        'AL AMMAR FROZEN FOOD EXPORTS PVT LTD',
        'AL-NASIR EXPORTS PVT LTD',
        'INTERNATIONAL AGRO FOODS',
        'INDIA FROZEN FOODS',
        'MIRHA EXPORTS PVT. LTD.',
        'MASH AGRO FOODS LTD',
        'ASIAN PERAL MYANMAR CO. LTD.',
        'Al Maya Trading LLC (Dubai, UAE)'
      ]
    });
  }
});

// 18. TRANSPORTERS (SPJ Transport Vendor Master)
router.get('/transporters', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT TRIM(VM."VENDOR_NAME") as name
      FROM spjlive."VENDOR_MASTER" VM
      WHERE VM."VENDOR_NAME" IS NOT NULL
        AND (VM."VENDOR_ID" IN (
              SELECT "VENDOR_ID" FROM spjlive."VENDOR_TYPE_DETAILS" WHERE "VENDER_TYPE_CODE" = 'T'
             )
             OR VM."VENDOR_ID" IN (
              SELECT DISTINCT "TRANSPORTER_ID" FROM spjlive."FLEET_CONT_JO" WHERE "TRANSPORTER_ID" > 0
             ))
      ORDER BY name ASC
    `);
    const names = rows.map(r => r.name).filter(Boolean);
    res.json({ success: true, count: names.length, data: names });
  } catch (err) {
    console.error('Error fetching transporters:', err);
    res.json({
      success: true,
      data: [
        'AJINKYA TRANSPORT',
        'SPJ CARGO PVT. LTD',
        'S.J. CARGO MOVERS',
        'Shipper\'s Transportation',
        'GREEN INDIA CARGO MOVERS',
        'CONSIGNEE TRANSPORT',
        'ASHIRVAD TRANSPORT',
        'AVINASH CARGO PVT LTD',
        'BK LOGISTIC',
        'CONCOR CORPORTATION',
        'DASHMESH BULK CARRIERS',
        'DK TRANSPORT',
        'FUTURE LOGISTICS',
        'GLOBAL EXPRESS MULTILOGISTICS PVT LTD',
        'HARINDRA KUMAR',
        'HIND CARRIERS PVT. LTD.',
        'IILPL',
        'J P REFFER LOGISTICS AND SERVICES',
        'JBM Cargo Movers',
        'K B CARGO MOVERS',
        'KUNDA EXPRESS PVT LTD',
        'MAHALAXMI TRANS-LIFT',
        'MV Trans India',
        'NITIN ROADWAYS',
        'OM SAI RAM ROADWAYS',
        'PRABHU LOGISTICS PVT LTD',
        'VS Transport Co',
        'XPERT TRANSLINE'
      ]
    });
  }
});

module.exports = router;

