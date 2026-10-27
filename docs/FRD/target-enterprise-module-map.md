# Target Enterprise Module Map

## Domain ownership

| Module | Owns | Depends on | Does not own |
|---|---|---|---|
| Platform | tenants, companies, mills, users, memberships, settings, feature flags | none | operational transactions |
| Identity & Security | authentication, RBAC, policies, sessions, security events | Platform | business approval outcomes |
| Masters | materials, UOM, customers, suppliers, vehicles, locations, equipment, routes, quality masters | Platform | posted transactions |
| Sales | customers, sales contracts, allocations, delivery commitments | Platform, Masters | inventory balances |
| Procurement | suppliers, purchase contracts, direct purchases, commitments | Platform, Masters | receipt posting |
| Weighbridge | devices, tickets, gross/tare/net, device reconciliation | Platform, Masters | supplier grading or stock ledger |
| Receiving | deliveries, FFB receipts, grading, rejection, receipt lifecycle | Procurement, Weighbridge, Inventory | arbitrary stock writes |
| Inventory & Storage | lots, ledger, balances, reservations, locations, tanks | Platform, Masters | production route definition |
| Production Planning | capacity, plans, schedules, batches | Masters, Inventory | quality result ownership |
| Production Execution | operations, inputs, outputs, losses, genealogy | Planning, Inventory, Quality | route master ownership |
| Quality | parameters, specs, samples, observations, evaluation, holds, deviations | Masters, Production, Inventory | physical stock posting |
| Maintenance | equipment, plans, work orders, downtime, reliability | Masters, Production references | production state |
| Dispatch | orders, loading, release checks, outbound movement, POD | Sales, Quality, Inventory, Weighbridge | source inventory ledger |
| Sustainability | certification, claims, traceability evidence, mass balance | all operational read interfaces | source transaction mutation |
| Documents | templates, files, generated documents, signatures | Platform, module references | business status decisions |
| Reporting | KPI definitions, read models, exports, dashboards | all modules via read interfaces/events | transactional mutation |
| Audit & Notifications | audit events, outbox, notification delivery | Platform and all module events | source transaction ownership |

## Boundary rule

An operational module may call another module's application port or consume an event. It must not write another module's tables directly. Every cross-module posting must define transaction ownership, failure recovery, idempotency, correlation ID, and audit behavior.
