import test from "node:test";
import assert from "node:assert/strict";
import { activeStationOptions, aggregateCheckpointResult, evaluateQualityValue, isCheckpointEffective, RECORDING_FREQUENCIES, validateCheckpoint, validateCheckpointBatch, validateCheckpointParameters, validateObservation } from "../packages/quality/productionQualityDomain.js";
import { STATION_QUALITY_PARAMETER_SEEDS, STATION_QUALITY_STANDARDS, stationQualityCheckpointSeeds } from "../packages/quality/stationQualityStandards.js";

test("station quality standards cover the laboratory template with unique reusable definitions", () => {
  assert.equal(STATION_QUALITY_STANDARDS.length, 8);
  assert.equal(STATION_QUALITY_PARAMETER_SEEDS.length > 30, true);
  assert.equal(new Set(STATION_QUALITY_PARAMETER_SEEDS.map((item) => item.code)).size, STATION_QUALITY_PARAMETER_SEEDS.length);
  assert.equal(new Set(stationQualityCheckpointSeeds().map((item) => item.code)).size, stationQualityCheckpointSeeds().length);
  const clarification = stationQualityCheckpointSeeds().find((item) => item.process === "Clarification");
  assert.equal(clarification.code, "QC-CLR-QUALITY");
  assert.equal(clarification.parameters.length, 7);
  assert.equal(clarification.parameters.every((item) => item.minLimit !== null && item.maxLimit !== null && item.allowedVariancePercent > 0), true);
  assert.equal(clarification.parameters.find((item) => item.code === "CLR-FFA").targetValue, "3.5");
  const palmKernel = stationQualityCheckpointSeeds().find((item) => item.code === "QC-PK-QUALITY");
  assert.equal(palmKernel.process, "CPO Tank");
  assert.equal(palmKernel.parameters.length, 4);
  assert.equal(palmKernel.parameters.every((item) => item.material === "PK"), true);
});

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

test("checkpoint pass/fail rule is mandatory and controls evaluation", () => {
  const missingRule = validateCheckpoint({ ...checkpoint, passFailRule: "" }, []);
  assert.equal(missingRule.valid, false);
  assert.match(missingRule.errors.passFailRule, /required/);
  assert.equal(evaluateQualityValue({ ...checkpoint, passFailRule: "EXACT_MATCH", targetValue: "140" }, "140").status, "PASS");
  assert.equal(evaluateQualityValue({ ...checkpoint, passFailRule: "EXACT_MATCH", targetValue: "140" }, "141").status, "FAIL");
});

test("exact-match parameters support a configured plus/minus percentage variance", () => {
  const tolerant = { ...checkpoint, passFailRule: "EXACT_MATCH", targetValue: "100", allowedVariancePercent: 5 };
  assert.equal(evaluateQualityValue(tolerant, 104).status, "PASS");
  assert.equal(evaluateQualityValue(tolerant, 106).status, "FAIL");
  assert.equal(evaluateQualityValue({ ...tolerant, allowedVariancePercent: 0 }, 100).status, "PASS");
});

test("checkpoint batches keep station, parameter and rule records independent", () => {
  const result = validateCheckpointBatch([
    { ...checkpoint, id: undefined, code: "CLR-FFA", process: "Clarification", parameter: "FFA", passFailRule: "IN_RANGE" },
    { ...checkpoint, id: undefined, code: "TANK-TEMP", process: "CPO Tank", parameter: "Temperature", passFailRule: "EXACT_MATCH", targetValue: "50" },
  ], []);
  assert.equal(result.valid, true);
  assert.equal(result.value[0].process, "Clarification");
  assert.equal(result.value[1].passFailRule, "EXACT_MATCH");
});

test("one checkpoint accepts unique parameter assignments with independent rules", () => {
  const result = validateCheckpointParameters([
    { parameter: "FFA", dataType: "DECIMAL", passFailRule: "IN_RANGE", minLimit: 0, maxLimit: 5 },
    { parameter: "Color", dataType: "DECIMAL", passFailRule: "EXACT_MATCH", targetValue: "2" },
  ], { code: "CLR-QC", name: "Clarification quality", process: "Clarification", frequency: "DAY", sequence: 1, effectiveFrom: "2026-01-01" });
  assert.equal(result.valid, true);
  assert.equal(result.value[1].passFailRule, "EXACT_MATCH");
});

test("checkpoint final result aggregates parameter results deterministically", () => {
  assert.equal(aggregateCheckpointResult([{ status: "PASS" }, { status: "WARNING" }]).status, "WARNING");
  assert.equal(aggregateCheckpointResult([{ status: "WARNING" }, { status: "FAIL" }]).status, "FAIL");
  assert.equal(aggregateCheckpointResult([{ status: "PASS" }, { status: "PASS" }]).status, "PASS");
});

test("checkpoint effective dates preserve historical applicability", () => {
  assert.equal(isCheckpointEffective(checkpoint, "2026-06-01"), true);
  assert.equal(isCheckpointEffective({ ...checkpoint, effectiveTo: "2026-05-31" }, "2026-06-01"), false);
});

test("ad hoc checkpoints do not require an operation stage", () => {
  const result = validateCheckpoint({ code: "FFA", name: "FFA", process: "Clarification", frequency: "AD_HOC", sequence: 1, parameter: "FFA", dataType: "DECIMAL", passFailRule: "IN_RANGE", effectiveFrom: "2026-01-01" }, []);
  assert.equal(result.valid, true);
  assert.equal(RECORDING_FREQUENCIES.includes("AD_HOC"), true);
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
