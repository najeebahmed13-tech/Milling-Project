import test from "node:test";
import assert from "node:assert/strict";
import { activeStationOptions, evaluateQualityValue, isCheckpointEffective, validateCheckpoint, validateObservation } from "../packages/quality/productionQualityDomain.js";

test("quality checkpoint station options come from active station masters", () => {
  assert.deepEqual(activeStationOptions([{ id: 1, code: "ST-STER", name: "Sterilization", status: "ACTIVE" }, { id: 2, code: "ST-OLD", name: "Old Station", status: "INACTIVE" }, { id: 3, name: "Digester" }]), [
    { id: 1, code: "ST-STER", name: "Sterilization" }, { id: 3, code: "", name: "Digester" },
  ]);
});

const checkpoint = { id: 1, code: "STER-TEMP", name: "Sterilizer temperature", process: "Sterilization", operationStage: "Sterilizer 01", frequency: "CYCLE", sequence: 1, parameter: "Temperature", dataType: "DECIMAL", uom: "°C", minLimit: 135, maxLimit: 145, warningMin: 137, warningMax: 143, mandatory: true, status: "ACTIVE", effectiveFrom: "2026-01-01" };

test("checkpoint validation rejects invalid limits and duplicate active versions", () => {
  const result = validateCheckpoint({ ...checkpoint, maxLimit: 130 }, [checkpoint]);
  assert.equal(result.valid, false);
  assert.match(result.errors.limits, /cannot exceed/);
});

test("checkpoint effective dates preserve historical applicability", () => {
  assert.equal(isCheckpointEffective(checkpoint, "2026-06-01"), true);
  assert.equal(isCheckpointEffective({ ...checkpoint, effectiveTo: "2026-05-31" }, "2026-06-01"), false);
});

test("quality evaluation returns pass, warning and fail centrally", () => {
  assert.equal(evaluateQualityValue(checkpoint, 140).status, "PASS");
  assert.equal(evaluateQualityValue(checkpoint, 136).status, "WARNING");
  assert.equal(evaluateQualityValue(checkpoint, 130).status, "FAIL");
});

test("cycle-wise observations require cycle and prevent duplicates", () => {
  const missing = validateObservation({ productionDate: "2026-10-15", observedValue: 140, resultStatus: "PASS" }, checkpoint);
  assert.equal(missing.valid, false);
  assert.match(missing.errors.cycleNumber, /cycle-wise/);
  const duplicate = validateObservation({ productionDate: "2026-10-15", cycleNumber: 2, observedValue: 140, resultStatus: "PASS" }, checkpoint, [{ checkpointId: 1, productionDate: "2026-10-15", cycleNumber: 2 }]);
  assert.equal(duplicate.valid, false);
  assert.match(duplicate.errors.duplicate, /already exists/);
});
