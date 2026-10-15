import test from "node:test";
import assert from "node:assert/strict";
import { createMonitoringRequest, summarizeRequest, validateMonitoringRequest } from "../packages/maintenance/machineMonitoringDomain.js";

const parameters = [{ code: "THR-TEMP", name: "Temperature", stationCode: "ST-THRESH", stationName: "Threshing", uom: "°C", active: true }];

test("monitoring requests are generated from active station parameters", () => {
  const request = createMonitoringRequest({ stationCode: "ST-THRESH", stationName: "Threshing", productionDate: "2026-10-15" }, parameters, []);
  assert.equal(request.values.length, 1);
  assert.equal(request.values[0].parameterCode, "THR-TEMP");
  assert.equal(validateMonitoringRequest(request).valid, true);
});

test("monitoring progress distinguishes pending and recorded values", () => {
  const request = createMonitoringRequest({ stationCode: "ST-THRESH", stationName: "Threshing", productionDate: "2026-10-15" }, parameters, []);
  assert.deepEqual(summarizeRequest(request), { total: 1, completed: 0, pending: 1, complete: false });
  request.values[0].value = "90";
  request.values[0].status = "RECORDED";
  assert.deepEqual(summarizeRequest(request), { total: 1, completed: 1, pending: 0, complete: true });
});
