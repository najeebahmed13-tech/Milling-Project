import test from "node:test";
import assert from "node:assert/strict";
import { getMultiSelectSummary, normalizeMultiSelectOptions, toggleMultiSelectValue } from "../src/design-system/multi-select.js";

test("multi-select options normalize to stable value and label pairs", () => {
  assert.deepEqual(normalizeMultiSelectOptions(["MACHINE", { value: "PRODUCT", label: "Product" }]), [
    { value: "MACHINE", label: "MACHINE" },
    { value: "PRODUCT", label: "Product" },
  ]);
});

test("multi-select toggles preserve option order and remove duplicates", () => {
  const options = normalizeMultiSelectOptions(["MACHINE", "PRODUCT", "LOSS"]);
  assert.deepEqual(toggleMultiSelectValue(["PRODUCT", "PRODUCT"], "MACHINE", options), ["MACHINE", "PRODUCT"]);
  assert.deepEqual(toggleMultiSelectValue(["MACHINE", "PRODUCT"], "MACHINE", options), ["PRODUCT"]);
});

test("multi-select summary communicates empty, single, and multiple selections", () => {
  const options = normalizeMultiSelectOptions(["MACHINE", "PRODUCT", "LOSS"]);
  assert.equal(getMultiSelectSummary([], options, "Select parameter types"), "Select parameter types");
  assert.equal(getMultiSelectSummary(["MACHINE"], options, "Select parameter types"), "MACHINE");
  assert.equal(getMultiSelectSummary(["MACHINE", "LOSS"], options, "Select parameter types"), "MACHINE, LOSS");
});
