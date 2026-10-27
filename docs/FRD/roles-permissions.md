# Roles and Permissions Requirements

## Permission model

Permissions are action-based and configurable. A permission must be evaluated server-side against principal, tenant, company, mill, department, location, record state, and segregation-of-duties policy.

```text
<module>.<resource>.<action>
```

Examples: `receiving.receipt.create`, `receiving.receipt.post`, `quality.lot.release`, `inventory.movement.reverse`, `report.export`.

## Required dimensions

- users, service accounts, roles, permission bundles, role assignment validity;
- module, screen, record, field, company, mill, department, location, and action scope;
- view/create/edit/delete, submit, approve, reject, send back, post, reverse, print, export, administer;
- temporary delegation, expiry, emergency access, and support access;
- segregation of duties for preparation, approval, posting, reversal, and master-data administration.

## Baseline role templates

Templates may be supplied but must be configurable: Tenant Administrator, Mill Administrator, Commercial User, Procurement User, Receiving Clerk, Weighbridge Operator, Production Planner, Production Operator, Quality Analyst, Quality Approver, Inventory Controller, Maintenance Planner, Maintenance Technician, Dispatch Coordinator, Finance User, Auditor, Reporting User, Integration Service.

These are templates, not hard-coded roles. Every assignment requires scope, effective dates, grantor, and audit history.
