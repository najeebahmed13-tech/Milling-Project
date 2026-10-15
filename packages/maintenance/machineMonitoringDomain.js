export const MONITORING_REQUEST_SOURCES = ["ROUTINE", "PRODUCTION_QUALITY"];
export const MONITORING_REQUEST_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export function createMonitoringRequest(input, parameters = [], existing = []) {
  const stationParameters = parameters.filter((item) => item.active !== false && item.stationCode === input.stationCode);
  const values = stationParameters.map((parameter) => ({ parameterCode: parameter.code, parameterName: parameter.name, uom: parameter.uom || "", value: "", status: "PENDING", remarks: "" }));
  const requestNo = input.requestNo || `MMR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(existing.length + 1).padStart(4, "0")}`;
  return { id: input.id || `MMR-${Date.now()}`, requestNo, stationCode: input.stationCode, stationName: input.stationName, source: input.source || "ROUTINE", productionDate: input.productionDate, shift: input.shift || "DAY", dueAt: input.dueAt || "", status: "OPEN", notes: input.notes || "", values };
}

export function validateMonitoringRequest(request) {
  const errors = {};
  if (!request.stationCode || !request.stationName) errors.station = "Select a station.";
  if (!MONITORING_REQUEST_SOURCES.includes(request.source)) errors.source = "Select a request source.";
  if (!request.productionDate) errors.productionDate = "Select a monitoring date.";
  if (!request.values?.length) errors.values = "The selected station has no active monitoring parameters.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function summarizeRequest(request) {
  const values = request.values || [];
  const completed = values.filter((item) => item.status === "RECORDED").length;
  return { total: values.length, completed, pending: values.length - completed, complete: values.length > 0 && completed === values.length };
}
