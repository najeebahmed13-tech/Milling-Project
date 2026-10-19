const EMPTY = "—";

export function parseQualityParameters(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function qualityStatus(order) {
  if (order?.qualityReceipt?.status) return order.qualityReceipt.status;
  if (order?.status === "QUALITY_PENDING") return "PENDING";
  if (order?.status === "QUALITY_HOLD") return "HOLD";
  if (order?.status === "QUALITY_RELEASED") return "PASS";
  return "NOT_STARTED";
}

export function normalizeDispatchQualityRecord(order) {
  const receipt = order?.qualityReceipt || {};
  return {
    id: order?.id,
    orderNo: order?.order_no || EMPTY,
    material: order?.material || EMPTY,
    customer: order?.customer || EMPTY,
    quantity: order?.quantity,
    uom: order?.uom || "MT",
    vehicle: order?.vehicle_no || EMPTY,
    driver: order?.driver_name || EMPTY,
    transporter: order?.transporter || EMPTY,
    loadingBay: order?.loading_bay || EMPTY,
    dispatchStatus: order?.status || "UNKNOWN",
    qualityStatus: qualityStatus(order),
    sampleNo: receipt.receipt_no || EMPTY,
    sampleTime: receipt.sample_time || null,
    testedBy: receipt.tested_by || EMPTY,
    remarks: receipt.remarks || EMPTY,
    parameters: parseQualityParameters(receipt.parameter_results_json),
    orderDate: order?.order_date || null,
    emptyWeight: order?.empty_weight,
    loadedWeight: order?.loaded_weight,
    tareWeight: order?.tare_weight,
    netWeight: order?.net_weight,
    loadedQuantity: order?.loaded_quantity,
  };
}

export function filterDispatchQualityRecords(records, search) {
  const query = String(search || "").trim().toLowerCase();
  if (!query) return records;
  return records.filter((record) => [
    record.orderNo,
    record.material,
    record.customer,
    record.vehicle,
    record.driver,
    record.transporter,
    record.sampleNo,
    record.qualityStatus,
  ].join(" ").toLowerCase().includes(query));
}
