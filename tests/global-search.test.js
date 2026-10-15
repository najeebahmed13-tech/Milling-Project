import test from "node:test";
import assert from "node:assert/strict";
import { globalSearchReducer, initialGlobalSearchState } from "../src/design-system/global-search-state.js";

test("global search opens and closes without changing unrelated state", () => {
  const opened = globalSearchReducer(initialGlobalSearchState, { type: "open" });
  assert.equal(opened.open, true);
  assert.deepEqual(globalSearchReducer(opened, { type: "close" }), { open: false });
  assert.deepEqual(globalSearchReducer(opened, { type: "unknown" }), opened);
});

test("global search toggle is reversible", () => {
  const opened = globalSearchReducer(initialGlobalSearchState, { type: "toggle" });
  assert.equal(opened.open, true);
  assert.deepEqual(globalSearchReducer(opened, { type: "toggle" }), initialGlobalSearchState);
});
