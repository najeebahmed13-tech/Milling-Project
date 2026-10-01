-- ROCKEYE ERP + MES Data Contracts
-- Multi-tenant schema with mandatory tenant_id, mill_id, relational integrity, and audit columns.

CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mills (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS weighbridge_tickets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    mill_id TEXT NOT NULL REFERENCES mills(id),
    ticket_number TEXT NOT NULL,
    vehicle_number TEXT NOT NULL,
    driver_name TEXT,
    gross_weight_kg REAL NOT NULL DEFAULT 0,
    tare_weight_kg REAL NOT NULL DEFAULT 0,
    net_weight_kg REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING_SECOND_WEIGHING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, mill_id, ticket_number)
);

CREATE TABLE IF NOT EXISTS ffb_receipts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    mill_id TEXT NOT NULL REFERENCES mills(id),
    receipt_number TEXT NOT NULL,
    weighbridge_ticket_id TEXT NOT NULL REFERENCES weighbridge_tickets(id),
    supplier_id TEXT NOT NULL,
    purchase_contract_id TEXT,
    net_weight_kg REAL NOT NULL,
    accepted_weight_kg REAL NOT NULL DEFAULT 0,
    rejected_weight_kg REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, GRADED, POSTED, REVERSED
    posted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, mill_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS material_ledger (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    mill_id TEXT NOT NULL REFERENCES mills(id),
    movement_type TEXT NOT NULL, -- INBOUND_RECEIPT, REJECTION, CONSUMPTION, PRODUCTION_OUTPUT, TRANSFER, DISPATCH
    material_id TEXT NOT NULL,
    storage_location_id TEXT NOT NULL,
    lot_id TEXT,
    quantity REAL NOT NULL,
    uom TEXT NOT NULL,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    posted_by TEXT NOT NULL,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    mill_id TEXT,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchasing contract: implementation migration lives in server/purchases.js.
-- Direct purchases and invoices are tenant/mill scoped and invoice lines retain item master references.
CREATE TABLE IF NOT EXISTS purchase_invoices_contract (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    mill_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type = 'DIRECT_PURCHASE'),
    source_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('DRAFT', 'POSTED', 'VOIDED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, mill_id, invoice_number)
);

