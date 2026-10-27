# Prototype Capability Inventory

The inventory below is based on the current repository structure, UI files, server routes, domain packages, and tests. “Partial” means the prototype contains useful workflow or domain behavior but does not yet satisfy the enterprise FRD lifecycle.

| Capability | Current evidence | Classification |
|---|---|---|
| Customers and suppliers | `src/commercial/Customers.jsx`, `src/commercial/Suppliers.jsx`, server CRUD routes | Partial |
| Sales contracts and delivery requests | `src/commercial/SalesContracts.jsx`, `src/commercial/DeliveryRequests.jsx` | Partial |
| Purchase contracts and direct purchases | `src/commercial/PurchaseContracts.jsx`, `server/purchaseContracts.js`, `server/purchases.js` | Partial |
| FFB receiving | `src/receiving/FFBReceiving.jsx`, server receiving routes | Partial |
| Grading and second weighing | `src/receiving/FFBGrading.jsx`, `SecondWeighingFormDrawer.jsx` | Partial |
| Receiving slips and attachments | `src/receiving/ReceivingSlip.jsx`, attachment components | Partial |
| Items and storage areas | `src/inventory/Items.jsx`, `src/inventory/StorageAreas.jsx` | Partial |
| Production lines, stations, machines, routes | `server/production.js`, `apps/api/production.js`, `src/production/ProductionSystem.jsx` | Partial |
| Production runs and stages | production server APIs and UI | Partial |
| Production quality checkpoints | `src/quality/*`, `packages/quality/*`, `server/productionQuality.js` | Partial |
| Machine health monitoring | `src/maintenance/MachineMonitoringRequests.jsx`, tests | Partial |
| Dispatch and loading plans | `server/dispatch.js`, `src/logistics/LoadingPlans.jsx` | Partial |
| Sales invoices and payments | `server/salesInvoices.js`, `server/payments.js` | Partial |
| Permission helper | `packages/security/permissions.js`, `src/security/permissions.js` | Prototype-only / requires server enforcement |
| OpenAPI/Swagger documentation | `core/contracts/openapi.json`, `/api/docs` | Initial foundation |
| Sustainability management | No dedicated module identified | Missing |
| Reporting module | No dedicated module identified | Missing |
| Tenant provisioning and administration | Schema concepts exist, full lifecycle absent | Missing |
| Workflow, document, notification, import/export platforms | Partial isolated features only | Missing enterprise platform |

## Prototype constraints

The prototype is a functional reference, not the target product definition. Existing screens, seed data, default mill values, local storage behavior, SQLite startup schema creation, and demo permissions must not be treated as enterprise requirements without validation.
