import test from "node:test";
import assert from "node:assert/strict";
import { calculateExpectedQuantity, calculateRemainingDemand, canTransitionProductionOrder, validateProductionOrder } from "../packages/production/productionOrderDomain.js";

test("production order demand remaining subtracts fulfilled and other planned quantity", () => {
  assert.equal(calculateRemainingDemand({ contractQuantity: 100, fulfilledQuantity: 25, plannedQuantity: 30 }), 45);
});
test("production order expected quantity uses configured yield", () => {
  assert.equal(calculateExpectedQuantity(1000, 22.5), 225);
});
test("production order lifecycle only permits configured transitions", () => {
  assert.equal(canTransitionProductionOrder("DRAFT", "PENDING"), true);
  assert.equal(canTransitionProductionOrder("DRAFT", "COMPLETED"), false);
});
test("production order validation rejects invalid dates, over-allocation and routing outputs", () => {
  const errors = validateProductionOrder({
    orderDate: "2026-10-27", millId: "mill-1", lineId: 1, routingId: 1,
    plannedStart: "2026-10-28T10:00", plannedEnd: "2026-10-28T09:00", plannedFfbQuantity: 100,
    allocations: [{ contractId: 1, contractLineId: 0, plannedQuantity: 120, remainingAvailableDemand: 100 }],
    outputs: [{ product: "EFB", expectedQuantity: 10 }],
  }, { routingOutputs: ["CPO", "PK"] });
  assert.ok(errors.plannedEnd);
  assert.ok(errors.allocation_over_0);
  assert.ok(errors.output_valid_0);
});
