# Phase 2 — Permission Architecture

Permissions represent actions, not screens. Roles are tenant-scoped; platform roles are separate from tenant operational roles. A permission check evaluates action + tenant membership + mill access + resource state.

## Permission Families

| Family | Permissions |
|---|---|
| Platform | `tenant.read`, `tenant.configure`, `user.manage`, `role.manage`, `audit.read`, `settings.manage` |
| Master data | `master.read`, `supplier.create`, `supplier.update`, `customer.create`, `customer.update`, `material.manage`, `storage.manage`, `process_definition.manage`, `quality_spec.manage` |
| Commercial | `purchase_contract.create`, `purchase_contract.approve`, `sales_contract.create`, `sales_contract.approve`, `delivery_order.create`, `contract.read` |
| Weighbridge | `weighbridge.record`, `weighbridge.complete`, `weighbridge.override`, `weighbridge.read` |
| Receiving | `ffb_receipt.create`, `ffb_grading.perform`, `ffb_receipt.confirm`, `ffb_receipt.reverse`, `ffb_lot.read` |
| Production | `production_plan.create`, `production_plan.approve`, `production_batch.start`, `production_operation.post`, `production_operation.correct` |
| Quality | `quality_sample.create`, `quality_sample.record`, `quality_result.evaluate`, `quality_result.override`, `quality_release.approve` |
| Inventory | `inventory.read`, `inventory.transfer`, `inventory.adjust`, `inventory.reserve`, `inventory.reverse` |
| Dispatch | `dispatch.create`, `dispatch.approve`, `dispatch.load`, `dispatch.post`, `dispatch.reverse` |
| Documents/reports | `document.generate`, `document.download`, `report.read`, `report.export` |

## Initial Role Mapping

| Role | Typical permissions |
|---|---|
| Tenant Administrator | platform, master, role/user management; no implicit transaction approval unless granted |
| Mill Manager | read all operational data; approve plans/contracts/dispatch; configured override permissions |
| Commercial Manager | customer/supplier/contracts/delivery orders; contract approvals if assigned |
| Weighbridge Operator | weighbridge.record/complete/read; no override or posting approval |
| Receiving Clerk | ffb_receipt.create/read; submit for grading |
| Grader/Quality Inspector | ffb_grading.perform, quality_sample.record, quality_result.evaluate |
| Production Planner | production_plan.create/approve, production_batch.start |
| Production Operator | production_operation.post/read; no correction by default |
| Storekeeper | inventory.read/transfer; adjustment only with separate approval |
| Dispatch Officer | dispatch.create/load/read; post only if explicitly assigned |
| Auditor | read-only reports, traceability, audit; no mutation |

Separation of duties is enforced by permission and workflow policy, not by role-name string checks. The same user may not approve their own high-risk transaction when a tenant policy requires two-person control.
