/**
 * Cross-layer vocabulary for the ERP/MES domain.
 *
 * The public contract uses camelCase names. Database mappings are explicit so
 * legacy snake_case columns remain compatible until a versioned migration is
 * approved. Do not use display labels as API or persistence identifiers.
 */
export const CANONICAL_TERMINOLOGY = Object.freeze({
  customer: Object.freeze({ canonical: "Customer", aliases: ["Client"] }),
  supplier: Object.freeze({ canonical: "Supplier", aliases: ["Vendor"] }),
  mill: Object.freeze({ canonical: "Mill / Facility", aliases: ["Plant", "Factory", "Facility"] }),
  product: Object.freeze({ canonical: "Product", aliases: ["Item", "Material"] }),
  machine: Object.freeze({ canonical: "Machine", aliases: ["Equipment", "Asset"] }),
  storageLocation: Object.freeze({ canonical: "Storage Location", aliases: ["Warehouse Location", "Bin"] }),
  productionPlan: Object.freeze({ canonical: "Production Plan", aliases: ["Monthly Plan", "Weekly Plan"] }),
  productionOrder: Object.freeze({ canonical: "Production Order", aliases: ["Work Order", "Manufacturing Order"] }),
  deliveryRequest: Object.freeze({ canonical: "Delivery Request", aliases: ["Demand Request"] }),
  plannedFfbQuantity: Object.freeze({ canonical: "Planned FFB Quantity", aliases: ["Planned FFB", "FFB Plan"] }),
  unitOfMeasure: Object.freeze({ canonical: "Unit of Measure", aliases: ["UOM", "Unit"] }),
});

const definitions = [
  ["productionPlanNumber", "Production Plan No.", "productionPlanNo", "productionPlanNo", "plan_no", "legacy column"],
  ["productionOrderNumber", "Production Order No.", "productionOrderNo", "productionOrderNo", "order_no", "legacy column"],
  ["millId", "Mill / Facility", "millId", "millId", "mill_id", "canonical"],
  ["productId", "Product", "productId", "productId", "product", "legacy text product reference"],
  ["customerId", "Customer", "customerId", "customerId", "customer_id", "canonical"],
  ["supplierId", "Supplier", "supplierId", "supplierId", "supplier_id", "canonical"],
  ["storageLocationId", "Storage Location", "storageLocationId", "storageLocationId", "storage_location_id", "canonical"],
  ["periodType", "Planning Period", "periodType", "periodType", "period_type", "canonical"],
  ["periodFrom", "Period From", "periodFrom", "periodFrom", "period_from", "canonical"],
  ["periodTo", "Period To", "periodTo", "periodTo", "period_to", "canonical"],
  ["requiredByDate", "Required By Date", "requiredByDate", "requiredByDate", "required_by_date", "canonical"],
  ["plannedProductionQuantity", "Planned Production Quantity", "plannedProductionQuantity", "plannedProductionQuantity", "planned_quantity", "canonical"],
  ["plannedFfbQuantity", "Planned FFB Quantity", "plannedFfbQuantity", "plannedFfbQuantity", "planned_ffb_quantity", "canonical"],
  ["currentStockQuantity", "Current Stock Quantity", "currentStockQuantity", "currentStockQuantity", "available_inventory", "legacy semantic mapping"],
  ["reservedStockQuantity", "Reserved Stock Quantity", "reservedStockQuantity", "reservedStockQuantity", "reserved_inventory", "legacy semantic mapping"],
  ["netProductionRequirement", "Net Production Requirement", "netProductionRequirement", "netProductionRequirement", "net_requirement", "canonical"],
  ["expectedYieldPercent", "Expected Yield %", "expectedYieldPercent", "expectedYieldPercent", "expected_yield_percent", "canonical"],
  ["uom", "Unit of Measure", "uom", "uom", "uom", "canonical"],
];

export const CANONICAL_FIELD_DEFINITIONS = Object.freeze(Object.fromEntries(
  definitions.map(([key, label, frontend, api, database, note]) => [key, Object.freeze({ key, label, frontend, api, database, note })]),
));

export const PRODUCTION_PLAN_STATUS_LABELS = Object.freeze({
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  RELEASED: "Released",
  COMPLETED: "Completed",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
});

export function getCanonicalFieldDefinition(key) {
  return CANONICAL_FIELD_DEFINITIONS[key] || null;
}

export function canonicalLabel(key, fallback = key) {
  return getCanonicalFieldDefinition(key)?.label || fallback;
}

export function canonicalStatusLabel(value) {
  const code = String(value || "").trim().toUpperCase();
  return PRODUCTION_PLAN_STATUS_LABELS[code] || code.replaceAll("_", " ") || "Unknown";
}

