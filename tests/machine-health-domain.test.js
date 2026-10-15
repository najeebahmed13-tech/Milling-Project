import test from "node:test";
import assert from "node:assert/strict";
import { MACHINE_HEALTH_PARAMETER_SEEDS, MACHINE_HEALTH_STANDARDS } from "../packages/masters/machineHealthStandards.js";
import { normalizeMachineHealthParameter, validateMachineHealthParameter } from "../packages/masters/machineHealthDomain.js";

test("machine health standards cover station monitoring metrics with unique codes", () => {
  assert.equal(MACHINE_HEALTH_STANDARDS.length, 7);
  assert.equal(MACHINE_HEALTH_PARAMETER_SEEDS.length > 30, true);
  assert.equal(new Set(MACHINE_HEALTH_PARAMETER_SEEDS.map((item) => item.code)).size, MACHINE_HEALTH_PARAMETER_SEEDS.length);
});

test("machine health configuration normalizes values and validates station scope", () => {
  const value = normalizeMachineHealthParameter({ code: " thr-temp ", name: "Temperature", stationCode: "ST-THRESH", stationName: "Threshing", dataType: "decimal", intervalMinutes: "30", active: 1 });
  assert.equal(value.code, "THR-TEMP");
  assert.equal(value.intervalMinutes, 30);
  assert.equal(validateMachineHealthParameter(value, []).valid, true);
  assert.equal(validateMachineHealthParameter({ ...value, stationCode: "", stationName: "" }, []).valid, false);
});

test("machine health validation rejects invalid ranges and duplicate codes", () => {
  const existing = [{ id: "MHC-1", code: "TEMP", stationCode: "ST-1", stationName: "Station 1", dataType: "DECIMAL", frequency: "PERIODIC" }];
  const result = validateMachineHealthParameter({ code: "TEMP", name: "Temperature", stationCode: "ST-1", stationName: "Station 1", dataType: "DECIMAL", frequency: "PERIODIC", warningMin: 90, warningMax: 80 }, existing);
  assert.equal(result.valid, false);
  assert.equal(result.errors.code, "Code must be unique.");
  assert.match(result.errors.warningLimits, /cannot exceed/);
});

test("machine health cadence only requires minutes for minute-based frequencies", () => {
  const base = { code: "DAILY-TEMP", name: "Daily temperature", stationCode: "ST-1", stationName: "Station 1", dataType: "DECIMAL", active: true };
  assert.equal(validateMachineHealthParameter({ ...base, frequency: "DAILY", intervalMinutes: "" }, []).valid, true);
  assert.equal(validateMachineHealthParameter({ ...base, frequency: "PERIODIC", intervalMinutes: "" }, []).errors.intervalMinutes, "Enter the interval in minutes for this frequency.");
});
