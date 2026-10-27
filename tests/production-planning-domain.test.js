import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionProductionPlan, calculateNetProductionRequirement, calculateRequiredFfb, consolidateDemand, calculatePlanVsActual, calculateProjectedStock, planningRiskStatus, buildPlanningBuckets, normalizePlanningQuantity, validatePlanningLine, validatePlanningPeriod } from "../packages/production/productionPlanningDomain.js";

test("calculates net requirement with inventory, safety stock and existing plans", () => assert.equal(calculateNetProductionRequirement({ grossDemand: 100, availableInventory: 20, reservedInventory: 5, safetyStock: 10, alreadyPlannedQuantity: 15 }), 70));
test("uses configured yield for FFB requirement", () => assert.equal(calculateRequiredFfb(21, 21), 100));
test("consolidates eligible demand and excludes fulfilled or allocated demand", () => { const rows=consolidateDemand([{id:"a",product:"CPO",requiredDate:"2026-11-01",customerName:"A",requestedQuantity:100,fulfilledQuantity:10},{id:"b",product:"CPO",requiredDate:"2026-11-01",customerName:"A",requestedQuantity:50,fulfilledQuantity:0,cancelled:true}], [{deliveryRequestLineId:"a",allocatedQuantity:20}]); assert.equal(rows[0].grossDemand,70); });
test("guards plan status transitions and plan versus actual variance", () => { assert.equal(canTransitionProductionPlan("DRAFT","PROPOSED"),true); assert.equal(canTransitionProductionPlan("DRAFT","RELEASED"),false); assert.deepEqual(calculatePlanVsActual({plannedQuantity:100,actualQuantity:90}),{planned:100,actual:90,variance:-10,variancePercent:-10,remaining:10}); });
test("projects stock and identifies planning risk", () => { assert.equal(calculateProjectedStock({openingStock:420,plannedProduction:1200,plannedConsumption:1500}),120); assert.equal(planningRiskStatus({projectedStock:80,safetyStock:100,netRequirement:100,plannedProduction:100}),"BELOW_SAFETY_STOCK"); });
test("builds calendar-aware month, week and day buckets", () => { assert.equal(buildPlanningBuckets("2026-10-01","2026-10-31","week").length,5); assert.equal(buildPlanningBuckets("2026-10-01","2026-10-03","day").length,3); });
test("validates bounded planning periods and line inputs", () => {
  assert.deepEqual(validatePlanningPeriod({ periodType: "MONTH", periodFrom: "2026-10-01", periodTo: "2026-10-31" }), {});
  assert.equal(validatePlanningPeriod({ periodType: "MONTH", periodFrom: "2026-11-01", periodTo: "2026-10-31" }).periodTo, "Planning end date cannot precede the start date.");
  assert.deepEqual(validatePlanningLine({ product: "CPO", uom: "MT", grossDemand: 10, availableInventory: 2, reservedInventory: 0, safetyStock: 1, alreadyPlannedQuantity: 0, plannedQuantity: 9, requiredByDate: "2026-10-31", expectedYieldPercent: 21 }), {});
  assert.ok(validatePlanningLine({ product: "CPO", uom: "MT", plannedQuantity: -1, requiredByDate: "bad" }).plannedQuantity);
});
test("normalizes quantities without accepting invalid values", () => { assert.equal(normalizePlanningQuantity(12.3456), 12.346); assert.equal(normalizePlanningQuantity(-1), null); assert.equal(normalizePlanningQuantity("not-a-number"), null); });
