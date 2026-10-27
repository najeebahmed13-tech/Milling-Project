# Prototype Gap Analysis

| Gap ID | Area | Gap | Classification | Required target response |
|---|---|---|---|---|
| GAP-001 | SaaS | No complete tenant provisioning, lifecycle, plan, feature, or quota management | Enterprise Requirement | Platform tenant service and administration |
| GAP-002 | Security | Authentication and server-side RBAC are incomplete; demo context/default headers remain | Prototype Gap | Identity, policy enforcement, and isolation middleware |
| GAP-003 | Data | SQLite/local startup schema and mixed JSON fields are not the production relational contract | Prototype Gap | PostgreSQL schema, migrations, constraints, indexes |
| GAP-004 | Inventory | No complete immutable ledger, reservation, transfer, genealogy, and reversal flow | Enterprise Requirement | Inventory posting service and ledger |
| GAP-005 | Quality | No complete specification, hold/release, deviation, laboratory, and release lifecycle | Enterprise Requirement | Quality configuration and evaluation services |
| GAP-006 | Production | Route snapshot, mass balance, outputs, losses, and inventory posting are incomplete | Enterprise Requirement | Transactional production execution |
| GAP-007 | Sustainability | Certification, mass balance, due diligence, and regulatory evidence are absent | Enterprise Requirement | Sustainability module and traceability projections |
| GAP-008 | Reporting | No governed KPI registry, read model, scheduled export, or report versioning | Enterprise Requirement | Reporting platform |
| GAP-009 | Integrations | Weighbridge, lab, accounting, SCADA/PLC, sensor, and notification adapters are incomplete | Enterprise Requirement | Integration ports, outbox, retries, monitoring |
| GAP-010 | Operations | Backup, disaster recovery, offline buffering, observability, and release rollback are incomplete | Enterprise Requirement | Operations repository runbooks and production controls |
| GAP-011 | API | OpenAPI foundation exists, but not every route has a complete DTO/schema/error contract | Prototype Gap | Complete contract coverage and contract tests |
| GAP-012 | UI | Prototype contains screens but lacks complete enterprise empty/loading/error, accessibility, and mobile workflow coverage | Enterprise Requirement | Shared UI standards and workflow-specific acceptance criteria |

## Classification rules

- **Prototype Gap:** current behavior conflicts with the enterprise architecture or control requirement.
- **Enterprise Requirement:** capability required for the target product but not visible in the prototype.
- **Future Enhancement:** valuable capability deliberately deferred after an approved decision.
- **Requires Redesign:** the prototype idea is useful but its data, workflow, or ownership boundary must change.
