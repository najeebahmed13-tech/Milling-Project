# Canonical ERP/MES Naming Dictionary

This dictionary is the shared vocabulary for the tenant/company/mill scoped ERP/MES modules. New UI, frontend state, API DTOs and backend services must use the canonical names below. Database mappings are explicit compatibility boundaries; they are not permission to introduce a second spelling in new code.

## Naming inventory

| Business concept | Canonical UI term | Accepted legacy aliases |
| --- | --- | --- |
| Customer | Customer | Client |
| Supplier | Supplier | Vendor |
| Mill | Mill / Facility | Plant, Factory, Facility |
| Product | Product | Item, Material |
| Machine | Machine | Equipment, Asset |
| Storage | Storage Location | Warehouse Location, Bin |
| Production plan | Production Plan | Monthly Plan, Weekly Plan |
| Production order | Production Order | Work Order, Manufacturing Order |
| FFB plan input | Planned FFB Quantity | Planned FFB, FFB Plan |
| Unit | Unit of Measure | UOM, Unit |

## Production Planning cross-layer contract

| Business concept | UI label | Frontend / API field | Backend field | Database field | Compatibility note |
| --- | --- | --- | --- | --- | --- |
| Plan identifier | Production Plan No. | `productionPlanNo` | `productionPlanNo` | `plan_no` | Existing column retained |
| Order identifier | Production Order No. | `productionOrderNo` | `productionOrderNo` | `order_no` | Existing column retained |
| Operating site | Mill / Facility | `millId` | `millId` | `mill_id` | Canonical |
| Product reference | Product | `productId` | `productId` | `product` | Existing text reference retained until master-ID migration |
| Planning window start/end | Period From / Period To | `periodFrom` / `periodTo` | `periodFrom` / `periodTo` | `period_from` / `period_to` | Canonical |
| Output quantity | Planned Production Quantity | `plannedProductionQuantity` | `plannedProductionQuantity` | `planned_quantity` | Canonical |
| FFB input quantity | Planned FFB Quantity | `plannedFfbQuantity` | `plannedFfbQuantity` | `planned_ffb_quantity` | Canonical |
| Inventory available | Current Stock Quantity | `currentStockQuantity` | `currentStockQuantity` | `available_inventory` | Existing semantic mapping |
| Inventory reserved | Reserved Stock Quantity | `reservedStockQuantity` | `reservedStockQuantity` | `reserved_inventory` | Existing semantic mapping |
| Requirement | Net Production Requirement | `netProductionRequirement` | `netProductionRequirement` | `net_requirement` | Canonical |
| Unit | Unit of Measure | `uom` | `uom` | `uom` | Canonical |

## Refactoring policy

- New code imports `packages/shared/canonicalDomain.js` for labels, aliases and cross-layer field definitions.
- Existing API/database names remain readable for backward compatibility. DTO adapters should map them to canonical camelCase at module boundaries when an endpoint is modernized.
- No destructive database rename is included in this change. Renames require a versioned migration, backfill, compatibility window, and contract-test update.
- Production Planning keeps a single register/workspace vocabulary. “Monthly Plan” and “Weekly Plan” are period views, not separate modules or routes.

## Remaining exceptions

The repository still contains legacy snake_case reads in older screens and SQL statements, plus historical product text references. These are intentional compatibility exceptions and should be migrated module-by-module behind DTO adapters rather than replaced with broad search-and-replace edits.

