# Item Module Business Rules

## 1. Purpose and scope

The Item module is the controlled master-data boundary for materials, products, by-products, consumables, chemicals, spare parts, packaging, fuel, utilities, and waste used by the ERP + MES platform.

Every Item record is scoped to a tenant and operating mill. The Item master owns item identity and classification. Purchasing, receiving, production, inventory, quality, and sales modules consume Items through stable Item IDs and must not duplicate Item-master rules.

The rules in this document are server-enforced. Frontend validation is an interaction aid only.

## 2. Item fields

| Field | Required | Rule |
|---|---:|---|
| Item Name | Yes | Must be present, trimmed, and non-blank. |
| Item Code | Yes | Must be present, trimmed, and unique within the tenant and mill. It is the business identifier and is separate from the database primary key. |
| Item Short Name | No | Optional trimmed display name. |
| Item Image | No | Optional image attachment. The current UI accepts JPG, PNG, and WebP files up to 2 MB. |
| Item Description | No | Optional descriptive text. It does not replace structured classification fields. |
| Item Category | Yes | Must be exactly one active Item Category reference. |
| Item SKU | No | Optional. When supplied, it must be selected from an active UOM Master value. |
| Item UOM | Yes | Must reference an active UOM Master value. |
| Storage Type | Yes | Must use one of the configured storage classifications. |
| Inventory Controlled | Yes | Explicit boolean. Yes permits Inventory configuration/posting; No means no conventional inventory balance is maintained. |
| Traceability Required | Yes | Explicit boolean controlling whether Traceability Method is enabled. |
| Traceability Method | Optional / Conditional | Remains visible in the form. It is enabled when Traceability Required is Yes; allowed values are None, Lot, Batch, and Serial. It is disabled and internally set to None when Traceability Required is No. |
| Quality Managed | Yes | Explicit boolean value. It determines whether the Item is eligible for quality configuration workflows. |
| Status | Yes | Must be `Active` or `Inactive`. |

## 3. Controlled reference values

### 3.1 Item Categories

The default Item Category reference set is:

- Raw Material
- Intermediate/WIP
- Finished Product
- By-product
- Consumable
- Chemical
- Spare Part
- Packaging
- Fuel & Utility
- Waste

Categories are tenant/mill-scoped reference data. Only active categories may be assigned to an Item.

### 3.2 UOM Master

Item UOM and Item SKU values are validated against the active, tenant/mill-scoped UOM Master.

An inactive UOM cannot be assigned to a new Item or saved on an edited Item. Existing historical records retain their original Item ID and values.

The default configured UOM references are `T`, `KG`, `MT`, `Sets`, and `L`. Additional UOMs must be created through the UOM Master rather than hard-coded in Item logic.

### 3.3 Storage Type

Storage Type must be one of:

- Tank
- Bulk Warehouse
- Silo
- Open Yard
- Covered Warehouse
- Container
- None

Storage Type describes the normal physical storage classification. It is not a physical location, bin, tank number, warehouse, or stock balance.

The Item master does not assign or create a default physical location. Changing Storage Type does not relocate stock.

## 4. Identity and duplicate rules

1. Item Code is required and trimmed before persistence.
2. Item Code must be unique within the tenant and mill.
3. The database primary key is independent from Item Code.
4. Item Code cannot be changed after the Item has posted usage or posted references.
5. Item Code cannot be reused by hard deletion because hard deletion is prohibited.
6. Duplicate detection is policy-driven and may match configured fields such as Item Code, Item Name, Item Short Name, and Item SKU.
7. Item SKU is optional, but a supplied SKU must be an active UOM Master code and must follow the configured SKU uniqueness policy.
8. Item Name, Item Short Name, and Item Description may be updated when the Item is otherwise editable.

## 4.1 Inventory and traceability rules

1. Inventory Controlled is mandatory and must be Yes or No.
2. Inventory Controlled = Yes means the Item is eligible for Inventory configuration and posting.
3. Inventory Controlled = No means no conventional inventory balance is maintained for the Item.
4. Traceability Required is mandatory and must be Yes or No.
5. When Traceability Required = Yes, Traceability Method remains optional and may be selected as None, Lot, Batch, or Serial.
6. When Traceability Required = No, Traceability Method remains visible but disabled in the UI and is persisted internally as None.
7. Changes to traceability settings are protected after posted usage.

## 5. Status and lifecycle rules

1. Only `Active` and `Inactive` are valid statuses.
2. Only Active Items may be selected for new transactions and new configuration references.
3. Deactivation is a controlled status change, not deletion.
4. Deactivation is blocked while the Item has open usage records or active configuration references.
5. Deactivation does not alter historical transactions, posted quantities, audit events, or prior Item values.
6. An Inactive Item cannot be newly configured or selected for new business transactions.
7. Hard deletion is prohibited for all Items.

## 6. Posted-usage protections

After an Item has posted usage:

- Item Category cannot change.
- Item UOM cannot change.
- Item Code cannot change.

The Item ID remains the stable reference in historical records. Corrections to posted operational records must use the owning module's correction or reversal workflow; Item master updates must not silently rewrite transaction history.

## 7. Quality rules

1. Quality Managed is an explicit required boolean.
2. `Quality Managed = Yes` makes the Item eligible for Quality Configuration, Sampling, and Checkpoint workflows.
3. `Quality Managed = No` means the standard Item quality workflow is not applicable.
4. Quality limits, target values, sampling frequency, and checkpoint parameters are not stored inside the Item master.
5. Quality Managed does not automatically trigger an inspection. Inspection is controlled by the Quality module and its configured workflow.
6. Changing Quality Managed must not modify historical quality results or historical transactions.

## 8. Tenant, mill, and organizational scope

1. Item reads, creates, updates, reference validation, audit queries, and lifecycle operations require tenant, mill, and actor context.
2. An Item from another tenant or mill must not be returned, edited, deactivated, or referenced through an Item endpoint.
3. Item Categories, UOM references, duplicate policies, Item audit events, usage records, and configuration references are tenant/mill scoped.
4. Organization applicability must be represented by scope and configuration, not by customer-specific code branches.

## 9. Audit and history rules

The Item module records:

- `ITEM_CREATED` with Created By, Created At, and the created values.
- `ITEM_UPDATED` with Updated By, Updated At, and changed values.
- `ITEM_STATUS_CHANGED` for every Active/Inactive transition.

Audit events include tenant ID, mill ID, Item ID, actor ID, action, changed values, and timestamp. Audit history is append-only from the Item API perspective.

Historical records preserve the stable database Item ID. Item status changes and descriptive edits must not mutate historical business records.

## 10. API invariants

### `GET /api/items`

- Requires request context.
- Returns only Items for the current tenant and mill.

### `GET /api/items/reference-data`

- Returns active tenant/mill Item Categories and UOMs.
- Returns the configured Storage Type and Status values used by the Item form.

### `POST /api/items`

- Requires Item Name, Item Code, Item Category, Item UOM, Storage Type, Quality Managed, and Status.
- Validates all references and controlled values.
- Applies configured duplicate detection.
- Records an Item creation audit event.

### `PATCH /api/items/:id`

- Requires the Item to belong to the current tenant and mill.
- Validates all references and controlled values.
- Applies posted-usage protections.
- Applies deactivation controls.
- Records an update or status-change audit event.

### `DELETE /api/items/:id`

- Never physically deletes an Item.
- Performs a controlled deactivation when allowed.
- Rejects the operation when open transactions or active configuration references exist.

## 11. Data ownership and integration rules

1. The Item module owns Item identity, classification, UOM assignment, storage classification, quality eligibility, status, audit, and lifecycle controls.
2. Purchasing and other transaction modules must select active Items by Item ID.
3. Transaction modules must not accept an inactive, cross-tenant, or unknown Item.
4. Posted transaction lines must preserve the Item ID and must not depend only on a mutable display name.
5. Item rules must remain configurable where the business requires tenant, company, mill, or policy variation.

## 12. Acceptance criteria

### Item creation

**Given** a valid tenant/mill context and active category and UOM references  
**When** a user submits a complete Item  
**Then** the Item is created with a tenant/mill scope and an `ITEM_CREATED` audit event.

### Invalid UOM or SKU

**Given** an inactive or unknown UOM code  
**When** the user submits it as Item UOM or Item SKU  
**Then** the API rejects the request and does not create or update the Item.

### Cross-tenant access

**Given** an Item belonging to another tenant or mill  
**When** a user requests, edits, or deactivates it  
**Then** the API does not expose or mutate that Item.

### Deactivation

**Given** an Active Item with no open usage or active configuration references  
**When** the user changes its status to Inactive  
**Then** the status changes and an `ITEM_STATUS_CHANGED` audit event is recorded.

### Deactivation protection

**Given** an Active Item with open usage or active configuration references  
**When** the user attempts to deactivate it  
**Then** the API rejects the request and preserves the Item as Active.

### Posted usage protection

**Given** an Item with posted usage  
**When** a user attempts to change its Item Code, Category, or UOM  
**Then** the API rejects the update and preserves the posted history.

### Hard deletion

**Given** any existing Item  
**When** a delete request is submitted  
**Then** the database record is not physically deleted.

## 13. Legacy compatibility

The legacy SQLite columns and older Item records remain migration-compatible. Current Item create/update behavior uses the active rules in this document. The deprecated `Co-product` category is inactive and is not available for new assignments.
