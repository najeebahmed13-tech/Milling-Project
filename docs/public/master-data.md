# Phase 4 — Master Data Matrix

All records below are currently represented by explicit frontend master definitions and demo persistence. Production scope enforcement and database foreign keys will be added with the backend foundation.

| Master | Owner scope | Code unique by | Referenced by | Deactivation | Permission |
|---|---|---|---|---|---|
| UOM | Tenant | Tenant + code | Materials, quantities | Preserve history; prevent new use | `configuration.manage` |
| Material | Tenant | Tenant + code | Lots, movements, contracts, quality, dispatch | Preserve history; prevent inappropriate new use | `configuration.manage` |
| Customer | Tenant | Tenant + code | Sales contracts, dispatch | Inactive only | `customer.manage` |
| Supplier Type | System/Tenant | Scope + code | Suppliers | Preserve history | `supplier.manage` |
| Supplier | Tenant | Tenant + code | Purchase contracts, deliveries, FFB receipts | Inactive only | `supplier.manage` |
| Transporter | Tenant | Tenant + code | Vehicles, weighbridge | Inactive only | `master.manage` |
| Vehicle | Tenant | Tenant + registration number | Weighbridge, dispatch | Inactive only | `master.manage` |
| Storage Location | Mill | Mill + code | Inventory balances, tanks/silos | Inactive if unused by active config | `storage.manage` |
| Tank/Storage Unit | Mill | Mill + code | Material lots, quality, dispatch | Inactive; historical references remain | `storage.manage` |
| Production Line | Mill | Mill + code | Plans, batches | Inactive/versioned | `production.manage` |
| Process Definition | Tenant/Mill | Scope + code + version | Routes, operations | Supersede; never reinterpret history | `production.manage` |
| Quality Parameter | Tenant | Tenant + code | Specifications, samples | Inactive; historical results remain | `quality.manage` |
| Sampling Plan | Mill | Mill + code + effective version | Scheduled samples | Supersede/effective date | `quality.manage` |
| Grading Parameter | Tenant | Tenant + code | Grading rules/results | Inactive only | `quality.manage` |
| Grading Rule | Tenant/Mill | Scope + code + version | FFB grading | Supersede/effective date | `quality.manage` |
| Rejection Reason | Tenant | Tenant + code | Rejections, grading, quality | Inactive only | `quality.manage` |
| Numbering Sequence | Tenant/Company/Mill | Scope + document type + period | Business identifiers | Do not mutate posted history | `configuration.manage` |

## Dependency Order

`Tenant → Company → Mill → UOM → Material → Customer/Supplier/Transporter → Vehicle → Storage → Production → Quality → Numbering`

## Scope Rules

- Tenant/company/mill IDs are system-derived; users never enter them in forms.
- Mill-owned configuration must reference a mill in the same tenant/company hierarchy.
- Historical records resolve inactive masters; active transactional lookups default to active values.
- Deactivation must be dependency-aware and return a business error such as `MASTER_IN_USE` rather than a raw foreign-key error.
