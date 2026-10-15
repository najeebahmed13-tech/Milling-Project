import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUom, validateUom } from "../packages/masters/uomDomain.js";

test("UOM normalization trims labels and canonicalizes codes", () => {
  assert.deepEqual(normalizeUom({ code: " kg ", name: " Kilogram ", symbol: " kg ", category: "Mass", precision: "3", active: 1 }), {
    code: "KG", name: "Kilogram", symbol: "kg", category: "Mass", precision: 3, active: true,
  });
});

test("UOM validation enforces required fields and precision bounds", () => {
  const result = validateUom({ code: "", name: "", symbol: "", category: "Other", precision: 13 }, []);
  assert.equal(result.valid, false);
  assert.match(result.errors.code, /unique code/);
  assert.match(result.errors.precision, /0 to 12/);
});

test("UOM validation prevents duplicate codes and symbols but allows the current record", () => {
  const existing = [{ id: "UOM-1", code: "KG", name: "Kilogram", symbol: "kg", category: "Mass", precision: 0 }];
  const duplicate = validateUom({ code: "kg", name: "Other", symbol: "kilo", category: "Mass", precision: 0 }, existing);
  assert.equal(duplicate.valid, false);
  assert.equal(duplicate.errors.code, "Code must be unique.");

  const sameRecord = validateUom(existing[0], existing, "UOM-1");
  assert.equal(sameRecord.valid, true);
});
