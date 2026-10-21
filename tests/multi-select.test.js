import test from "node:test";
import assert from "node:assert/strict";
import { getMultiSelectSummary, normalizeMultiSelectOptions, toggleMultiSelectValue } from "../src/design-system/multi-select.js";

test("multi-select options normalize to stable value and label pairs", () => {
  assert.deepEqual(normalizeMultiSelectOptions(["PRODUCTION", { value: "STORAGE", label: "Storage" }]), [
    { value: "PRODUCTION", label: "PRODUCTION" },
    { value: "STORAGE", label: "Storage" },
  ]);
});

test("multi-select toggles preserve option order and remove duplicates", () => {
  const options = normalizeMultiSelectOptions(["PRODUCTION", "STORAGE", "DISPATCH", "LOSS"]);
  assert.deepEqual(toggleMultiSelectValue(["STORAGE", "STORAGE"], "PRODUCTION", options), ["PRODUCTION", "STORAGE"]);
  assert.deepEqual(toggleMultiSelectValue(["PRODUCTION", "STORAGE"], "PRODUCTION", options), ["STORAGE"]);
});

test("multi-select summary communicates empty, single, and multiple selections", () => {
  const options = normalizeMultiSelectOptions(["PRODUCTION", "STORAGE", "DISPATCH", "LOSS"]);
  assert.equal(getMultiSelectSummary([], options, "Select parameter types"), "Select parameter types");
  assert.equal(getMultiSelectSummary(["PRODUCTION"], options, "Select parameter types"), "PRODUCTION");
  assert.equal(getMultiSelectSummary(["PRODUCTION", "LOSS"], options, "Select parameter types"), "PRODUCTION, LOSS");
});
