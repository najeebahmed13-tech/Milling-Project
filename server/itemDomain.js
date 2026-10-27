export const ITEM_CATEGORIES = [
  "Raw Material",
  "Intermediate/WIP",
  "Finished Product",
  "By-product",
  "Consumable",
  "Chemical",
  "Spare Part",
  "Packaging",
  "Fuel & Utility",
  "Waste",
];

export const ITEM_STORAGE_TYPES = [
  "Tank",
  "Bulk Warehouse",
  "Silo",
  "Open Yard",
  "Covered Warehouse",
  "Container",
  "None",
];

export const ITEM_TRACEABILITY_METHODS = ["None", "Lot", "Batch", "Serial"];

export const ITEM_STATUSES = ["Active", "Inactive"];

const text = (value) => (value === undefined || value === null ? "" : String(value).trim());

export function normalizeItemInput(body = {}) {
  const traceabilityRequired = body.traceabilityRequired === undefined ? null : (body.traceabilityRequired === true || body.traceabilityRequired === 1 || body.traceabilityRequired === "true");
  return {
    itemCode: text(body.itemCode),
    name: text(body.name),
    shortName: text(body.shortName),
    description: text(body.description),
    category: text(body.category),
    sku: text(body.sku),
    unit: text(body.unit),
    storageType: text(body.storageType),
    inventoryControlled: body.inventoryControlled === undefined ? null : (body.inventoryControlled === true || body.inventoryControlled === 1 || body.inventoryControlled === "true"),
    traceabilityRequired,
    traceabilityMethod: traceabilityRequired === true ? text(body.traceabilityMethod) : "None",
    qualityManaged: body.qualityManaged !== false && body.qualityManaged !== 0 && body.qualityManaged !== "false",
    imageData: text(body.imageData),
    status: text(body.status),
  };
}

export function itemValidationErrors(item, { categories, uoms, policies = {}, specialRules = [] } = {}) {
  const errors = {};
  if (!item.name) errors.name = "Item name is required.";
  if (!item.itemCode) errors.itemCode = "Item code is required.";
  if (!item.category) errors.category = "Item category is required.";
  if (!item.unit) errors.unit = "Item UOM is required.";
  if (item.inventoryControlled === null) errors.inventoryControlled = "Inventory Controlled is required.";
  if (item.traceabilityRequired === null) errors.traceabilityRequired = "Traceability Required is required.";
  if (categories && !categories.some((row) => row.name === item.category && row.active)) errors.category = "Select an active item category.";
  if (uoms && !uoms.some((row) => row.code === item.unit && row.active)) errors.unit = "Select an active UOM from the UOM Master.";
  if (item.sku && uoms && !uoms.some((row) => row.code === item.sku && row.active)) errors.sku = "Select the Item SKU from the active UOM Master.";
  if (!ITEM_STORAGE_TYPES.includes(item.storageType)) errors.storageType = "Select a valid storage type.";
  if (!ITEM_TRACEABILITY_METHODS.includes(item.traceabilityMethod)) errors.traceabilityMethod = "Select a valid traceability method.";
  if (item.traceabilityRequired === true && (!item.traceabilityMethod || item.traceabilityMethod === "None")) errors.traceabilityMethod = "Traceability method is required when Traceability Required is Yes.";
  if (item.traceabilityRequired === false && item.traceabilityMethod !== "None") errors.traceabilityMethod = "Traceability method must be None when traceability is disabled.";
  if (!ITEM_STATUSES.includes(item.status)) errors.status = "Status must be Active or Inactive.";
  return errors;
}

export function changedItemValues(before, after) {
  const fields = ["item_code", "name", "item_short_name", "item_description", "category", "item_sku", "unit", "storage_type", "inventory_controlled", "traceability_required", "traceability_method", "quality_managed", "status", "image_data"];
  return Object.fromEntries(fields.filter((field) => before?.[field] !== after?.[field]).map((field) => [field, { before: before?.[field] ?? null, after: after?.[field] ?? null }]));
}
