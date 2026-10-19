import test from "node:test";
import assert from "node:assert/strict";
import { filterDispatchQualityRecords, normalizeDispatchQualityRecord, parseQualityParameters } from "../src/quality/dispatch-quality.js";

test("dispatch quality normalization keeps dispatch, logistics, and sample data in one record", () => {
  const record = normalizeDispatchQualityRecord({
    id: 7,
    order_no: "DO-001",
    material: "CPO",
    customer: "Buyer A",
    vehicle_no: "ABC 123",
    driver_name: "Driver A",
    transporter: "Haulage Co",
    status: "QUALITY_RELEASED",
    qualityReceipt: {
      receipt_no: "QR-001",
      sample_time: "2026-10-16T08:00:00.000Z",
      tested_by: "QC User",
      status: "PASS",
      parameter_results_json: JSON.stringify([{ parameter: "FFA", result: "3.2", uom: "%" }]),
    },
  });

  assert.deepEqual(record.parameters, [{ parameter: "FFA", result: "3.2", uom: "%" }]);
  assert.equal(record.customer, "Buyer A");
  assert.equal(record.vehicle, "ABC 123");
  assert.equal(record.transporter, "Haulage Co");
  assert.equal(record.sampleNo, "QR-001");
  assert.equal(record.qualityStatus, "PASS");
});

test("dispatch quality normalization handles pending quality and malformed parameters safely", () => {
  const record = normalizeDispatchQualityRecord({ id: 1, order_no: "DO-002", status: "QUALITY_PENDING", qualityReceipt: { parameter_results_json: "invalid" } });
  assert.equal(record.qualityStatus, "PENDING");
  assert.deepEqual(record.parameters, []);
  assert.equal(record.transporter, "—");
  assert.deepEqual(parseQualityParameters({}), []);
});

test("dispatch quality search covers customer, vehicle, transporter and sample number", () => {
  const records = [normalizeDispatchQualityRecord({ order_no: "DO-001", customer: "Buyer A", vehicle_no: "ABC", transporter: "Haulage Co", qualityReceipt: { receipt_no: "QR-001" } })];
  assert.equal(filterDispatchQualityRecords(records, "haulage").length, 1);
  assert.equal(filterDispatchQualityRecords(records, "QR-001").length, 1);
  assert.equal(filterDispatchQualityRecords(records, "missing").length, 0);
});
