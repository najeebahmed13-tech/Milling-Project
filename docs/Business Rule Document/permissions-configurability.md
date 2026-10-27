# Permission, Override, and Configurability Matrix

## Action matrix

| Action | Default separation | Override rule |
|---|---|---|
| View | scoped read permission | no access outside principal scope |
| Create/Edit draft | functional create/update permission | draft only; active masters required |
| Submit | submit permission | validates completeness and state |
| Approve | approve permission | SoD and authority matrix apply |
| Reject/Send back | workflow decision permission | reason required |
| Post/Release | post/release permission | all business gates and holds apply |
| Reverse/Adjust | reverse/adjust permission | reason, source reference, approval, compensating record |
| Print/Download | document permission | tenant-scope and file access audit |
| Export | report/export permission | scope, row/file limits, audit, secure expiry |
| Configure | master/configuration permission | effective date, version, approval, audit |
| Platform support | explicit support permission | time-limited, tenant-approved/audited access |

## Configurable versus fixed

| Rule area | Configurable by scope | Fixed platform control |
|---|---|---|
| Routes, stations, machines, shifts, capacities | mill/line/effective date | no cross-tenant reference |
| Quality limits, sampling, methods, release | product/process/mill/version | original result and audit cannot be deleted |
| Tolerances, loss reasons, output categories | tenant/mill/product/version | server derives authoritative values |
| Approval steps and authority | tenant/company/mill/transaction/value | actor cannot bypass authorization |
| Numbering and document templates | tenant/company/mill/type | uniqueness and audit |
| UOM precision and conversions | material/UOM/country/version | incompatible conversions blocked |
| Notification recipients and escalation | tenant/module/event | secret/provider credentials protected |
| Feature flags and quotas | platform/tenant | tenant isolation and entitlement enforcement |
| Retention and archival period | tenant/regulatory policy | legal hold and audit preservation |
| Auth, encryption, security headers, injection controls | limited platform policy | deny-by-default and security event logging |

## Override requirements

An override must identify the rule, actor, permission, reason, affected record, old/new value, approval, effective expiry, and follow-up action. Overrides cannot modify an immutable source record or bypass tenant isolation.
