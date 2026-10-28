import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_FIELD_DEFINITIONS, CANONICAL_TERMINOLOGY, canonicalLabel, canonicalStatusLabel, getCanonicalFieldDefinition } from "../packages/shared/canonicalDomain.js";

test("canonical terminology keeps business concepts stable across aliases", () => {
  assert.equal(CANONICAL_TERMINOLOGY.customer.canonical, "Customer");
  assert.ok(CANONICAL_TERMINOLOGY.customer.aliases.includes("Client"));
  assert.equal(CANONICAL_TERMINOLOGY.productionPlan.canonical, "Production Plan");
  assert.ok(CANONICAL_TERMINOLOGY.productionPlan.aliases.includes("Monthly Plan"));
});

test("production planning fields expose explicit cross-layer mappings", () => {
  const planNo = getCanonicalFieldDefinition("productionPlanNumber");
  assert.deepEqual(planNo, {
    key: "productionPlanNumber",
    label: "Production Plan No.",
    frontend: "productionPlanNo",
    api: "productionPlanNo",
    database: "plan_no",
    note: "legacy column",
  });
  assert.equal(canonicalLabel("plannedFfbQuantity"), "Planned FFB Quantity");
  assert.equal(CANONICAL_FIELD_DEFINITIONS.netProductionRequirement.database, "net_requirement");
});

test("status labels are canonical and tolerate unknown legacy codes", () => {
  assert.equal(canonicalStatusLabel("IN_PROGRESS"), "IN PROGRESS");
  assert.equal(canonicalStatusLabel("released"), "Released");
  assert.equal(canonicalStatusLabel("future_status"), "FUTURE STATUS");
});

