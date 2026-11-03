-- ============================================================================
-- FORWARDER 2.0 (eLOGiFreight™) — COMPLETE POSTGRESQL SEED DATA
-- ============================================================================

-- 1. Company Profile
INSERT INTO company_profile (id, company_name, website, gstin, pan, tally_name, finance_map_code, address, gst_doc, pan_doc, incorp_doc)
VALUES (
    'MAIN',
    'SPJ Freight Logistics Pvt Ltd',
    'https://www.spjlogistics.com',
    '09AAACS9182K1Z9',
    'AAACS9182K',
    'SPJ LOGISTICS DEL 2026-27',
    'FIN-SPJ-01',
    'Dadri ICD Complex, Gautam Buddha Nagar, Greater Noida, UP - 201306',
    'GST_Certificate_2026.pdf',
    'Company_PAN.pdf',
    'Incorporation_Certificate_COI.pdf'
) ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

-- 2. Ports Master (UN/LOCODE)
INSERT INTO ports (id, code, name, type, country, custom_ref_import, custom_ref_export, terminal, address)
VALUES
('PRT-001', 'INICD6', 'Dadri ICD', 'DRY_PORT', 'India', 'INICD6', 'INICD6', 'CONCOR ICD Dadri', 'Container Depot, Tilpata, Greater Noida, UP - 201306'),
('PRT-002', 'INNSA1', 'Nhava Sheva (JNPT)', 'SEAPORT', 'India', 'INNSA1', 'INNSA1', 'GTI / BMCT / NSFT / NSICT', 'JNPT Port Trust, Uran, Navi Mumbai, Maharashtra - 400707'),
('PRT-003', 'INMUN1', 'Mundra Port', 'SEAPORT', 'India', 'INMUN1', 'INMUN1', 'APSEZ Mundra CT4 / MICT', 'Adani Ports & SEZ, Kutch, Gujarat - 370421'),
('PRT-004', 'AEJEA', 'Jebel Ali Port', 'SEAPORT', 'United Arab Emirates', 'AEJEA', 'AEJEA', 'DP World Terminal 1 & 2', 'Jebel Ali Free Zone, Dubai, UAE'),
('PRT-005', 'NLRTM', 'Rotterdam Port', 'SEAPORT', 'Netherlands', 'NLRTM', 'NLRTM', 'ECT Delta Terminal / APM Maasvlakte', 'Port of Rotterdam, Haven 2000, Netherlands'),
('PRT-006', 'SGSIN', 'Singapore Port', 'SEAPORT', 'Singapore', 'SGSIN', 'SGSIN', 'PSA Pasir Panjang Terminal', 'PSA Horizon, 1 Harbour Drive, Singapore - 098656')
ON CONFLICT (code) DO NOTHING;

-- 3. Parties / Customer Master (Shippers, Lines, Transporters)
INSERT INTO parties (id, code, name, party_type, contact_person, contact_no, mobile, email_comm, email_ops, address, city, state, pin, gstin, pan, tan, tally_tpt_name, tally_frt_name, map_code, payment_terms, credit_limit, credit_period, is_export, is_import, is_domestic, status)
VALUES
('CUST-001', 'CUST-001', 'Fair Exports (India) Pvt Ltd', 'SHIPPER', 'Mohd Aslam', '011-23881122', '9811002233', 'accounts@fairexports.com', 'ops@fairexports.com', 'Plot 42, Okhla Industrial Area Phase III', 'New Delhi', 'Delhi', '110020', '07AAACF3489K1Z5', 'AAACF3489K', 'DELA12345B', 'FAIR EXPORTS TPT', 'FAIR EXPORTS NEW DELHI', 'MAP-FE-01', '30 Days', '25,00,000', '30', TRUE, FALSE, TRUE, 'ACTIVE'),
('CUST-002', 'CUST-002', 'Marhaba Frozen Foods', 'SHIPPER', 'Tariq Khan', '0571-2490111', '9897112233', 'accounts@marhabafoods.com', 'logistics@marhabafoods.com', 'Industrial Area, Bypass Road', 'Aligarh', 'Uttar Pradesh', '202001', '09AABCM1290F1ZX', 'AABCM1290F', 'ALGM99201C', 'MARHABA TPT', 'MARHABA FROZEN ALIGARH', 'MAP-MF-02', '15 Days', '15,00,000', '15', TRUE, FALSE, FALSE, 'ACTIVE'),
('CUST-003', 'CUST-003', 'Allanasons Private Limited', 'SHIPPER', 'Irfan Sheikh', '022-66991100', '9820011223', 'billing@allana.com', 'exports@allana.com', 'Allana Centre, 153 G.J. Bhosale Marg', 'Mumbai', 'Maharashtra', '400021', '27AAACA1299P1Z8', 'AAACA1299P', 'MUMA00192A', 'ALLANA TPT MUMBAI', 'ALLANASONS MUMBAI', 'MAP-AL-03', '45 Days', '50,00,000', '45', TRUE, TRUE, TRUE, 'ACTIVE'),
('LINE-001', 'LINE-001', 'Maersk Line India Pvt Ltd', 'SHIPPING_LINE', 'Rohan Verma', '022-66580000', '9820055443', 'india@maersk.com', 'ops.india@maersk.com', 'One BKC, Bandra Kurla Complex', 'Mumbai', 'Maharashtra', '400051', '27AAACM1290F1ZY', 'AAACM1290F', NULL, 'MAERSK LINE TPT', 'MAERSK LINE INDIA', 'MAP-MSK-01', '15 Days', '1,00,00,000', '15', TRUE, TRUE, FALSE, 'ACTIVE'),
('LINE-002', 'LINE-002', 'Mediterranean Shipping Co (MSC)', 'SHIPPING_LINE', 'Anil Mehta', '022-66378000', '9820066778', 'info@msc.com', 'booking@msc.com', 'MSC House, Andheri Kurla Road', 'Mumbai', 'Maharashtra', '400059', '27AAACM4891K1ZX', 'AAACM4891K', NULL, 'MSC TPT MUMBAI', 'MSC INDIA PVT LTD', 'MAP-MSC-02', '15 Days', '1,00,00,000', '15', TRUE, TRUE, FALSE, 'ACTIVE'),
('LINE-003', 'LINE-003', 'CMA CGM Agencies India', 'SHIPPING_LINE', 'Vikram Singh', '022-66282000', '9820077889', 'booking@cma-cgm.com', 'ops@cma-cgm.com', 'CMA CGM Tower, Powai', 'Mumbai', 'Maharashtra', '400076', '27AAACC4901P1ZW', 'AAACC4901P', NULL, 'CMA CGM TPT', 'CMA CGM AGENCIES', 'MAP-CMA-03', '15 Days', '75,00,000', '15', TRUE, TRUE, FALSE, 'ACTIVE'),
('TPT-001', 'TPT-001', 'Dadri Express Logistics', 'TRANSPORTER', 'Baljit Sharma', '0120-2860111', '9811022334', 'ops@dadriexpress.com', 'fleet@dadriexpress.com', 'Near Concor ICD Gate, Tilpata Road', 'Greater Noida', 'Uttar Pradesh', '201306', '09AAACD4910K1ZZ', 'AAACD4910K', NULL, 'DADRI EXPRESS TPT', 'DADRI EXPRESS LOGISTICS', 'MAP-DX-01', '30 Days', '30,00,000', '30', TRUE, FALSE, TRUE, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Driver Master (AFTO / OCPL)
INSERT INTO drivers (id, name, vehicle, dl_no, validity, mobile, personal_contact, emergency, blood, email, joining, salary, transporter, address, status)
VALUES
('DRV-001', 'Ramesh Kumar', 'UP16BT8821', 'DL-042019008129', '2028-09-15', '9876543210', '9876543211', '9876543299', 'B+', 'ramesh.k@spjlogistics.com', '2022-04-10', '28,000', 'Dadri Express Logistics', 'Village Dadri, Near ICD Gate, Gautam Buddha Nagar, UP - 201306', 'ACTIVE'),
('DRV-002', 'Sukhvinder Singh', 'HR55AN9912', 'PB-102018009211', '2027-11-20', '9811223344', '9811223345', '9811223399', 'O+', 'sukhvinder@punjabtrailer.com', '2021-08-15', '30,000', 'Punjab Trailer Corp', 'GT Road, Amritsar, Punjab - 143001', 'ACTIVE'),
('DRV-003', 'Mukesh Yadav', 'NL01AH4410', 'UP-162020004182', '2029-03-10', '9988776655', '9988776656', '9988776611', 'A+', 'mukesh.y@spjlogistics.com', '2023-01-05', '27,000', 'Dadri Express Logistics', 'Sec 12, Bulandshahr Road, Greater Noida, UP', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Vehicle Master (Fleet Trailers)
INSERT INTO vehicles (id, truck_no, type, model, year, engine_no, vin_no, license_plate, tare_weight, gross_weight, changeable_bed, condition, fuel_type, fuel_card_no, fitness_expiry, transporter, terminal, status)
VALUES
('VEH-001', 'UP16BT8821', '40FT Trailer', 'Tata Signa 4018', '2022', 'ENG-991204', 'VIN-9912048821', 'UP16-BT-8821', '12500', '44500', 'YES', 'Excellent', 'Diesel', 'FASTAG-882109', '2027-08-10', 'Dadri Express Logistics', 'Dadri ICD (INICD6)', 'ACTIVE'),
('VEH-002', 'HR55AN9912', '40FT Multi-Axle', 'BharatBenz 4028T', '2023', 'ENG-881920', 'VIN-8819209912', 'HR55-AN-9912', '13200', '48200', 'YES', 'Good', 'Diesel', 'FASTAG-991288', '2027-12-14', 'Haryana Road Carriers', 'Dadri ICD (INICD6)', 'ACTIVE'),
('VEH-003', 'NL01AH4410', '20FT Trailer', 'Ashok Leyland 4020', '2021', 'ENG-771249', 'VIN-7712494410', 'NL01-AH-4410', '8900', '32900', 'NO', 'Good', 'Diesel', 'FASTAG-441077', '2028-01-20', 'National Freightlines', 'Nhava Sheva (INNSA1)', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 6. Charge Heads & SAC
INSERT INTO charge_heads (id, charge_name, sac_code, default_gst_rate, lut_eligible, is_active)
VALUES
('CH-01', 'Basic Ocean Freight (BOF)', '996511', 5.00, TRUE, TRUE),
('CH-02', 'Terminal Handling Charges (THC)', '996719', 18.00, FALSE, TRUE),
('CH-03', 'Inland Haulage Charges (IHC - Rail)', '996511', 18.00, FALSE, TRUE),
('CH-04', 'Documentation & BL Issuance Fee', '996719', 18.00, FALSE, TRUE),
('CH-05', 'Customs Agency & Clearance Fee', '996719', 18.00, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Vessel Schedules
INSERT INTO vessel_schedules (id, shipping_line, vessel_name, voyage_number, origin_port_code, dest_port_code, si_cutoff, gate_cutoff, etd, eta, status)
VALUES
('VS-01', 'MAERSK', 'MAERSK COLOMBO', '2604W', 'INNSA1', 'AEJEA', NOW() + INTERVAL '2 days', NOW() + INTERVAL '3 days', NOW() + INTERVAL '5 days', NOW() + INTERVAL '10 days', 'SCHEDULED'),
('VS-02', 'MSC', 'MSC RENEE', '441A', 'INNSA1', 'AEJEA', NOW() + INTERVAL '4 days', NOW() + INTERVAL '5 days', NOW() + INTERVAL '7 days', NOW() + INTERVAL '12 days', 'SCHEDULED'),
('VS-03', 'CMA_CGM', 'CMA CGM GEMINI', '0IN21E', 'INNSA1', 'NLRTM', NOW() + INTERVAL '6 days', NOW() + INTERVAL '7 days', NOW() + INTERVAL '10 days', NOW() + INTERVAL '26 days', 'SCHEDULED')
ON CONFLICT (id) DO NOTHING;

-- 8. Empty Depot Inventory
INSERT INTO empty_depot_inventory (id, shipping_line, depot_location, size_type, available_free, in_transit, damaged, free_days)
VALUES
('INV-01', 'Maersk Line', 'Dadri CONCOR ICD Depot', '40HC', 45, 12, 3, 14),
('INV-02', 'MSC Line', 'Dadri ICD Yard B', '40HC', 30, 8, 2, 14),
('INV-03', 'CMA CGM', 'Nhava Sheva BMCT Buffer Depot', '20GP', 25, 6, 1, 10)
ON CONFLICT (id) DO NOTHING;

-- 9. Empty Pickup Orders
INSERT INTO empty_pickup_orders (id, order_no, shipping_line, depot_location, booking_ref, container_count, size_type, transporter, valid_until, status)
VALUES
('EPO-01', 'EPO-2026-0081', 'Maersk Line', 'Dadri CONCOR ICD Depot', 'MSK-DEL-991204', 2, '40HC', 'Dadri Express Logistics', CURRENT_DATE + INTERVAL '5 days', 'ACTIVE'),
('EPO-02', 'EPO-2026-0082', 'MSC Line', 'Dadri ICD Yard B', 'MSC-NDLS-88120', 1, '40HC', 'Punjab Trailer Corp', CURRENT_DATE + INTERVAL '4 days', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
