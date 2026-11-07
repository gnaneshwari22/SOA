-- ====================================================================
-- RENEWABLE CERTIFICATE RETIREMENT SYSTEM - DATABASE ISOLATION SCHEMAS
-- CO3: Each microservice owns its isolated database.
-- ====================================================================

-- 1. AUTH SERVICE DATABASE
\connect auth_db;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed demo credentials (BCrypt hashed 'password')
INSERT INTO users (id, username, email, password, role, organization)
VALUES
('usr-101', 'officer_jane', 'officer@registry.org', '$2a$10$wE0vj4tP.f8e.cK5Q8K7Ie1Qz3k6.Jv.3oP2j/z2B6eR4L5lX7z2q', 'registryOfficer', 'Global Clean Energy Registry'),
('usr-102', 'helios_admin', 'solar@helios-power.com', '$2a$10$wE0vj4tP.f8e.cK5Q8K7Ie1Qz3k6.Jv.3oP2j/z2B6eR4L5lX7z2q', 'certificateOwner', 'Helios Solar Energy Corp'),
('usr-103', 'boreas_trader', 'wind@boreas-wind.com', '$2a$10$wE0vj4tP.f8e.cK5Q8K7Ie1Qz3k6.Jv.3oP2j/z2B6eR4L5lX7z2q', 'certificateOwner', 'Boreas Wind Parks LLC'),
('usr-104', 'ecotech_lead', 'corporate@eco-tech.com', '$2a$10$wE0vj4tP.f8e.cK5Q8K7Ie1Qz3k6.Jv.3oP2j/z2B6eR4L5lX7z2q', 'certificateOwner', 'EcoTech Industries Inc')
ON CONFLICT (email) DO NOTHING;

-- 2. CERTIFICATE SERVICE DATABASE
\connect certificate_db;

CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(36) PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    energy_source VARCHAR(50) NOT NULL,
    energy_quantity_mwh DOUBLE PRECISION NOT NULL CHECK (energy_quantity_mwh > 0),
    issuing_organization VARCHAR(150) NOT NULL,
    current_owner_organization VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    facility_name VARCHAR(150),
    grid_region VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cert_serial ON certificates (serial_number);
CREATE INDEX IF NOT EXISTS idx_cert_owner ON certificates (current_owner_organization);
CREATE INDEX IF NOT EXISTS idx_cert_status ON certificates (status);

-- Seed initial demonstration certificates
INSERT INTO certificates (id, serial_number, energy_source, energy_quantity_mwh, issuing_organization, current_owner_organization, issue_date, status, facility_name, grid_region)
VALUES
('cert-101', 'REC101', 'Solar', 500, 'Global Clean Energy Registry', 'Helios Solar Energy Corp', '2026-03-01', 'ACTIVE', 'Mojave Solar Array IV', 'US-CAISO'),
('cert-102', 'REC-2026-WIND-088', 'Wind', 1200, 'Global Clean Energy Registry', 'Boreas Wind Parks LLC', '2026-02-15', 'ACTIVE', 'North Sea Wind Array B', 'EU-NORDPOOL'),
('cert-103', 'REC-2026-HYDRO-045', 'Hydro', 850, 'Global Clean Energy Registry', 'EcoTech Industries Inc', '2026-01-20', 'RETIRED', 'Columbia River Cascade 2', 'US-BPA')
ON CONFLICT (serial_number) DO NOTHING;

-- 3. OWNERSHIP SERVICE DATABASE
\connect ownership_db;

CREATE TABLE IF NOT EXISTS ownership_transfers (
    id VARCHAR(36) PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL,
    previous_owner VARCHAR(150) NOT NULL,
    new_owner VARCHAR(150) NOT NULL,
    transferred_by VARCHAR(150) NOT NULL,
    notes TEXT,
    transferred_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ownership_locks (
    serial_number VARCHAR(100) PRIMARY KEY,
    locked_reason VARCHAR(50) DEFAULT 'RETIRED' NOT NULL,
    kafka_event_id VARCHAR(100) NOT NULL,
    locked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trn_serial ON ownership_transfers (serial_number);

-- 4. RETIREMENT SERVICE DATABASE
\connect retirement_db;

CREATE TABLE IF NOT EXISTS retirements (
    id VARCHAR(36) PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE, -- GUARANTEES EXACTLY ONE RETIREMENT PER CERTIFICATE
    claim_reference VARCHAR(100) NOT NULL,
    claimant_organization VARCHAR(150) NOT NULL,
    retired_by VARCHAR(150) NOT NULL,
    purpose TEXT,
    energy_quantity_mwh DOUBLE PRECISION NOT NULL,
    energy_source VARCHAR(50) NOT NULL,
    verification_hash VARCHAR(64) NOT NULL,
    retirement_timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id VARCHAR(36) PRIMARY KEY,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    schema_version VARCHAR(20) NOT NULL,
    payload_json TEXT NOT NULL,
    topic VARCHAR(150) NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    published BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_retire_serial ON retirements (serial_number);
