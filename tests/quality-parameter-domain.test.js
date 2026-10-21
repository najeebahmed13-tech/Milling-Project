import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQualityParameter, validateQualityParameter } from "../packages/masters/qualityParameterDomain.js";

test("quality parameter normalization canonicalizes codes and data types", () => {
  assert.deepEqual(normalizeQualityParameter({ code: " ffa ", name: " Free Fatty Acid ", dataType: "decimal", precision: "2", active: 1 }), {
    code: "FFA", name: "Free Fatty Acid", dataType: "DECIMAL", uom: "", precision: 2, material: "BOTH", parameterTypes: [], description: "", active: true,
  });
});

test("quality parameter types normalize as unique supported selections", () => {
  assert.deepEqual(normalizeQualityParameter({ parameterTypes: ["production", "STORAGE", "production", "unknown"] }).parameterTypes, ["PRODUCTION", "STORAGE", "UNKNOWN"]);
  assert.equal(validateQualityParameter({ code: "TEMP", name: "Temperature", dataType: "DECIMAL", parameterTypes: ["PRODUCTION"] }, []).valid, true);
  assert.equal(validateQualityParameter({ code: "TEMP", name: "Temperature", dataType: "DECIMAL", parameterTypes: ["LOSS"] }, []).valid, true);
  assert.equal(validateQualityParameter({ code: "TEMP", name: "Temperature", dataType: "DECIMAL", parameterTypes: ["OTHER"] }, []).valid, false);
});

test("quality parameter type is mandatory", () => {
  const result = validateQualityParameter({ code: "TEMP", name: "Temperature", dataType: "DECIMAL", parameterTypes: [] }, []);
  assert.equal(result.valid, false);
  assert.match(result.errors.parameterTypes, /required/i);
});

test("quality parameter validation enforces supported types and precision", () => {
  const result = validateQualityParameter({ code: "FFA", name: "FFA", dataType: "DATE", precision: 13 }, []);
  assert.equal(result.valid, false);
  assert.match(result.errors.dataType, /valid data type/);
  assert.match(result.errors.precision, /0 to 12/);
});

test("quality parameter codes are unique while the current edit remains valid", () => {
  const existing = [{ id: "QP-1", code: "FFA", name: "FFA", dataType: "DECIMAL", parameterTypes: ["PRODUCTION"] }];
  assert.equal(validateQualityParameter({ code: "ffa", name: "Other", dataType: "TEXT", parameterTypes: ["PRODUCTION"] }, existing).valid, false);
  assert.equal(validateQualityParameter(existing[0], existing, "QP-1").valid, true);
});
