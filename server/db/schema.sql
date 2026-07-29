-- AI Invoice Parser — Database Schema
-- Run: psql -U postgres -d invoice_parser -f schema.sql
-- Or: auto-run via docker-compose initdb.d mount

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    vendor_name VARCHAR(255) DEFAULT '',
    invoice_number VARCHAR(100) DEFAULT '',
    invoice_date DATE,
    due_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    raw_text TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'processed',
    ocr_time_ms INTEGER DEFAULT 0,
    model_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) DEFAULT '',
    quantity DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(12,2) DEFAULT 0,
    amount DECIMAL(12,2) DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON invoices(vendor_name);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON line_items(invoice_id);
