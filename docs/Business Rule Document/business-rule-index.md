# Business Rule Index

| Module | Prefix | Rule range | Related FRD |
|---|---|---:|---|
| Platform Administration | `BR-PLAT-*` | 001–003 baseline | Platform requirements |
| Identity, Users & RBAC | `BR-SEC-*` | 001–003 baseline | Roles and permissions |
| Master Data & Configuration | `BR-MAST-*` | 001–003 baseline | All module FRDs |
| Sales & Customer Management | `BR-SALES-*` | 001–003 baseline | Sales FRD |
| Procurement & Supplier Management | `BR-PROC-*` | 001–003 baseline | Procurement FRD |
| Weighbridge & FFB Receiving | `BR-RECV-*` | 001–003 baseline | Receiving FRD |
| Inventory, Warehouse & Storage | `BR-INV-*` | 001–003 baseline | Inventory FRD |
| Production Planning, Routing & MES | `BR-PROD-*` | 001–004 baseline | Production FRD |
| Quality Management | `BR-QUAL-*` | 001–003 baseline | Quality FRD |
| Sustainability, Mass Balance & Traceability | `BR-SUST-*` | 001–003 baseline | Sustainability FRD |
| Maintenance & OEE | `BR-MAINT-*` | 001–004 baseline | Maintenance FRD |
| Dispatch & Delivery | `BR-DISP-*` | 001–003 baseline | Dispatch FRD |
| Documents & Notifications | `BR-DOC-*` | 001–003 baseline | Platform/dispatch FRDs |
| Reporting & Dashboards | `BR-REPT-*` | 001–003 baseline | Reporting FRD |
| Integration Management | `BR-INT-*` | 001–003 baseline | Integration requirements |
| Finance Interface | `BR-FIN-*` | 001–003 baseline | Sales/procurement FRDs |

## Priority meaning

- **Critical:** violation can corrupt tenant isolation, posted history, stock, production, quality release, compliance, or financial integrity.
- **High:** required for normal controlled enterprise operation.
- **Medium:** important operational control or usability behavior.
- **Low:** enhancement or optimization that does not compromise core integrity.

## Rule classification

Each rule is classified as one or more of: Validation, Calculation, Workflow, Authorization, Status, Configuration, Compliance, Integration, or Data Integrity.
