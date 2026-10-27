import test from "node:test";
import assert from "node:assert/strict";
import { ITEM_CATEGORIES, ITEM_STORAGE_TYPES, ITEM_TRACEABILITY_METHODS, itemValidationErrors, normalizeItemInput } from "../server/itemDomain.js";

const refs = {
  categories: ITEM_CATEGORIES.map((name) => ({ name, active: true })),
  uoms: [{ code: "T", active: true }, { code: "KG", active: true }],
  specialRules: [{ label: "FFB items", match: ["FFB"], method: "Lot" }],
};

test("item domain accepts a complete active item with explicit inventory and traceability settings", () => {
  const item = normalizeItemInput({ itemCode: "RM-001", name: "Palm Kernel", category: "Raw Material", unit: "T", storageType: "Silo", inventoryControlled: true, traceabilityRequired: false, traceabilityMethod: "Batch", qualityManaged: false, status: "Active" });
  assert.equal(item.traceabilityMethod, "None");
  assert.deepEqual(itemValidationErrors(item, refs), {});
});

test("inventory and traceability flags are mandatory", () => {
  const item = normalizeItemInput({ itemCode: "RM-003", name: "Test Material", category: "Raw Material", unit: "T", storageType: "Silo", status: "Active" });
  const errors = itemValidationErrors(item, refs);
  assert.match(errors.inventoryControlled, /required/);
  assert.match(errors.traceabilityRequired, /required/);
});

test("string false traceability input still normalizes the method to None", () => {
  const item = normalizeItemInput({ traceabilityRequired: "false", traceabilityMethod: "Batch" });
  assert.equal(item.traceabilityRequired, false);
  assert.equal(item.traceabilityMethod, "None");
});

test("item domain rejects invalid reference values", () => {
  const item = normalizeItemInput({ itemCode: "FFB", name: "Fresh Fruit Bunch", category: "Unknown", unit: "NOPE", storageType: "Yard", inventoryControlled: true, traceabilityRequired: true, traceabilityMethod: "None", status: "Active" });
  const errors = itemValidationErrors(item, refs);
  assert.match(errors.category, /active item category/);
  assert.match(errors.unit, /active UOM/);
  assert.match(errors.storageType, /valid storage/);
});

test("traceability method is required when traceability is enabled", () => {
  const item = normalizeItemInput({ itemCode: "RM-004", name: "Traceable Material", category: "Raw Material", unit: "T", storageType: "Silo", inventoryControlled: true, traceabilityRequired: true, traceabilityMethod: "None", status: "Active" });
  const errors = itemValidationErrors(item, refs);
  assert.match(errors.traceabilityMethod, /required when Traceability Required is Yes/);
});

test("item SKU must come from an active UOM reference when supplied", () => {
  const item = normalizeItemInput({ itemCode: "RM-002", name: "Palm Kernel", category: "Raw Material", unit: "T", sku: "NOT-A-UOM", storageType: "Silo", status: "Active" });
  const errors = itemValidationErrors(item, refs);
  assert.match(errors.sku, /UOM Master/);
});

test("item domain exposes the controlled values required by the Item master", () => {
  assert.deepEqual(ITEM_STORAGE_TYPES, ["Tank", "Bulk Warehouse", "Silo", "Open Yard", "Covered Warehouse", "Container", "None"]);
  assert.ok(ITEM_CATEGORIES.includes("Intermediate/WIP"));
  assert.equal(ITEM_CATEGORIES.includes("Co-product"), false);
  assert.ok(ITEM_CATEGORIES.includes("Waste"));
  assert.deepEqual(ITEM_TRACEABILITY_METHODS, ["None", "Lot", "Batch", "Serial"]);
});
