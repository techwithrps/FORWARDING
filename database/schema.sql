-- ============================================================================
-- FORWARDER 2.0 (eLOGiFreight™) — COMPLETE POSTGRESQL PRODUCTION SCHEMA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Company Master Profile
CREATE TABLE IF NOT EXISTS company_profile (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'MAIN',
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    gstin VARCHAR(15) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    tally_name VARCHAR(255),
    finance_map_code VARCHAR(50),
    address TEXT,
    gst_doc VARCHAR(255),
    pan_doc VARCHAR(255),
    incorp_doc VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customer & Stakeholder Master (Parties: Shippers, Consignees, Forwarders, CHA, Shipping Lines, Transporters)
CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    party_type VARCHAR(50) NOT NULL DEFAULT 'SHIPPER', -- 'SHIPPER', 'CONSIGNEE', 'FORWARDER', 'CHA', 'SHIPPING_LINE', 'TRANSPORTER'
    contact_person VARCHAR(150),
    contact_no VARCHAR(50),
    mobile VARCHAR(50),
    email_comm VARCHAR(150),
    email_ops VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pin VARCHAR(20),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    tan VARCHAR(10),
    tally_tpt_name VARCHAR(255),
    tally_frt_name VARCHAR(255),
    map_code VARCHAR(50),
    payment_terms VARCHAR(50) DEFAULT '30 Days',
    credit_limit VARCHAR(50) DEFAULT '10,00,000',
    credit_period VARCHAR(20) DEFAULT '30',
    is_export BOOLEAN DEFAULT TRUE,
    is_import BOOLEAN DEFAULT FALSE,
    is_domestic BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Driver Master (AFTO / OCPL Standard)
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    vehicle VARCHAR(50),
    dl_no VARCHAR(50) NOT NULL UNIQUE,
    validity DATE,
    mobile VARCHAR(50) NOT NULL,
    personal_contact VARCHAR(50),
    emergency VARCHAR(50),
    blood VARCHAR(10) DEFAULT 'B+',
    email VARCHAR(150),
    joining DATE DEFAULT CURRENT_DATE,
    salary VARCHAR(50) DEFAULT '28,000',
    transporter VARCHAR(255) DEFAULT 'Dadri Express Logistics',
    address TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Vehicle Master (Fleet & Trailers)
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    truck_no VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL DEFAULT '40FT Trailer',
    model VARCHAR(100) NOT NULL,
    year VARCHAR(10) DEFAULT '2023',
    engine_no VARCHAR(50),
    vin_no VARCHAR(50),
    license_plate VARCHAR(50),
    tare_weight VARCHAR(50) DEFAULT '12500',
    gross_weight VARCHAR(50) DEFAULT '44500',
    changeable_bed VARCHAR(10) DEFAULT 'YES',
    condition VARCHAR(50) DEFAULT 'Excellent',
    fuel_type VARCHAR(20) DEFAULT 'Diesel',
    fuel_card_no VARCHAR(50),
    fitness_expiry DATE,
    transporter VARCHAR(255) DEFAULT 'Dadri Express Logistics',
    terminal VARCHAR(100) DEFAULT 'Dadri ICD (INICD6)',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Port Master (UN/LOCODE)
CREATE TABLE IF NOT EXISTS ports (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- 'INICD6', 'INNSA1', 'INMUN1', 'AEJEA', 'NLRTM'
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SEAPORT', -- 'SEAPORT', 'DRY_PORT', 'CFS'
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    custom_ref_import VARCHAR(50),
    custom_ref_export VARCHAR(50),
    terminal VARCHAR(150),
    address TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Charge Heads & SAC Master (Billing Codes)
CREATE TABLE IF NOT EXISTS charge_heads (
    id VARCHAR(50) PRIMARY KEY,
    charge_name VARCHAR(150) NOT NULL,
    sac_code VARCHAR(20) NOT NULL, -- '996511', '996719'
    default_gst_rate NUMERIC(5,2) DEFAULT 18.00,
    lut_eligible BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 7. Vessel Schedules (Panvaya Cached Master)
CREATE TABLE IF NOT EXISTS vessel_schedules (
    id VARCHAR(50) PRIMARY KEY,
    shipping_line VARCHAR(100) NOT NULL,
    vessel_name VARCHAR(150) NOT NULL,
    voyage_number VARCHAR(50) NOT NULL,
    origin_port_code VARCHAR(20) NOT NULL,
    dest_port_code VARCHAR(20) NOT NULL,
    si_cutoff TIMESTAMP WITH TIME ZONE,
    gate_cutoff TIMESTAMP WITH TIME ZONE,
    etd TIMESTAMP WITH TIME ZONE NOT NULL,
    eta TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Job Orders (Container Bookings / JO)
CREATE TABLE IF NOT EXISTS job_orders (
    id VARCHAR(50) PRIMARY KEY,
    job_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    consignee_name VARCHAR(255),
    shipping_line_id VARCHAR(50),
    shipping_line_name VARCHAR(255) NOT NULL,
    booking_no VARCHAR(100),
    origin_port_code VARCHAR(50) NOT NULL DEFAULT 'INICD6',
    origin_port_name VARCHAR(150) DEFAULT 'Dadri ICD',
    pod_port_code VARCHAR(50) NOT NULL DEFAULT 'AEJEA',
    pod_port_name VARCHAR(150) DEFAULT 'Jebel Ali Port',
    vessel_name VARCHAR(150) DEFAULT 'MAERSK COLOMBO',
    voyage VARCHAR(50) DEFAULT '2604W',
    commodity VARCHAR(150) DEFAULT 'FROZEN BUFFALO BONELSS MEAT',
    temperature VARCHAR(50) DEFAULT '-18°C',
    humidity VARCHAR(50),
    ventilation VARCHAR(50),
    total_containers INT DEFAULT 1,
    sb_no VARCHAR(100),
    sb_date DATE,
    party_invoice_no VARCHAR(100),
    party_invoice_date DATE,
    bl_no VARCHAR(100),
    telex_released BOOLEAN DEFAULT FALSE,
    sell_freight NUMERIC(15,2) DEFAULT 0,
    buy_freight NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'BOOKED', -- 'BOOKED', 'STUFFED', 'ICD_GATE_IN', 'RAIL_OUT', 'PORT_GATE_IN', 'SOB', 'DISCHARGED', 'INVOICED'
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Job Containers (repBookingContDeatils Repeater)
CREATE TABLE IF NOT EXISTS job_containers (
    id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    container_number VARCHAR(50) NOT NULL,
    size_type VARCHAR(20) NOT NULL DEFAULT '40HC', -- '20GP', '40HC', '40RF'
    seal_number VARCHAR(50),
    custom_seal VARCHAR(50),
    tare_weight NUMERIC(10,2) DEFAULT 0,
    gross_weight NUMERIC(10,2) DEFAULT 0,
    cargo_weight NUMERIC(10,2) DEFAULT 0,
    gr_number VARCHAR(50),
    gr_date DATE,
    truck_number VARCHAR(50),
    driver_name VARCHAR(150),
    driver_mobile VARCHAR(50),
    current_status VARCHAR(50) DEFAULT 'ALLOTTED',
    milestone_dates JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Commercial Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(20) NOT NULL DEFAULT 'SALES', -- 'SALES' or 'PURCHASE'
    job_id VARCHAR(50) REFERENCES job_orders(id),
    job_number VARCHAR(50),
    party_id VARCHAR(50),
    party_name VARCHAR(255) NOT NULL,
    party_gstin VARCHAR(20),
    party_state VARCHAR(100),
    is_lut BOOLEAN DEFAULT FALSE,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    igst_amount NUMERIC(15,2) DEFAULT 0,
    total_tax NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    irn_number VARCHAR(100),
    tally_voucher_no VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'UNPAID',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    charge_name VARCHAR(150) NOT NULL,
    sac_code VARCHAR(20) NOT NULL,
    rate NUMERIC(12,2) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    amount NUMERIC(15,2) NOT NULL,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    is_lut BOOLEAN DEFAULT FALSE
);

-- 12. Credit & Debit Notes (GST Section 34 Compliant)
CREATE TABLE IF NOT EXISTS credit_debit_notes (
    id VARCHAR(50) PRIMARY KEY,
    note_number VARCHAR(50) NOT NULL UNIQUE,
    note_type VARCHAR(20) NOT NULL, -- 'CREDIT' or 'DEBIT'
    original_invoice_no VARCHAR(50) NOT NULL,
    original_invoice_date DATE,
    job_number VARCHAR(50),
    party_name VARCHAR(255) NOT NULL,
    party_gstin VARCHAR(20),
    reason_code VARCHAR(100) NOT NULL,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_tax NUMERIC(15,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ISSUED',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Empty Depot Stock Ledger & Pick-up Orders
CREATE TABLE IF NOT EXISTS empty_depot_inventory (
    id VARCHAR(50) PRIMARY KEY,
    shipping_line VARCHAR(100) NOT NULL,
    depot_location VARCHAR(150) NOT NULL,
    size_type VARCHAR(20) NOT NULL,
    available_free INT DEFAULT 0,
    in_transit INT DEFAULT 0,
    damaged INT DEFAULT 0,
    free_days INT DEFAULT 14,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empty_pickup_orders (
    id VARCHAR(50) PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    shipping_line VARCHAR(100) NOT NULL,
    depot_location VARCHAR(150) NOT NULL,
    booking_ref VARCHAR(100) NOT NULL,
    container_count INT NOT NULL DEFAULT 1,
    size_type VARCHAR(20) NOT NULL DEFAULT '40HC',
    transporter VARCHAR(255) NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- High-speed indexes
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(status);
CREATE INDEX IF NOT EXISTS idx_job_orders_num ON job_orders(job_number);
CREATE INDEX IF NOT EXISTS idx_job_containers_job ON job_containers(job_id);
CREATE INDEX IF NOT EXISTS idx_job_containers_status ON job_containers(current_status);
CREATE INDEX IF NOT EXISTS idx_invoices_num ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_notes_num ON credit_debit_notes(note_number);
