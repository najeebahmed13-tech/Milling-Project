export const MACHINE_HEALTH_FREQUENCIES = ["PERIODIC", "PER_SHIFT", "PER_BATCH", "HOURLY", "DAILY"];
export const MACHINE_HEALTH_DATA_TYPES = ["DECIMAL", "INTEGER", "TEXT", "BOOLEAN"];

export function normalizeMachineHealthParameter(input = {}) {
  return {
    ...input,
    code: String(input.code ?? "").trim().toUpperCase(),
    name: String(input.name ?? "").trim(),
    stationCode: String(input.stationCode ?? "").trim(),
    stationName: String(input.stationName ?? "").trim(),
    machineCode: String(input.machineCode ?? "").trim(),
    machineName: String(input.machineName ?? "").trim(),
    frequency: String(input.frequency ?? "PERIODIC").trim().toUpperCase(),
    intervalMinutes: input.intervalMinutes === "" || input.intervalMinutes == null ? "" : Number(input.intervalMinutes),
    dataType: String(input.dataType ?? "").trim().toUpperCase(),
    uom: String(input.uom ?? "").trim(),
    warningMin: input.warningMin === "" || input.warningMin == null ? "" : Number(input.warningMin),
    warningMax: input.warningMax === "" || input.warningMax == null ? "" : Number(input.warningMax),
    criticalMin: input.criticalMin === "" || input.criticalMin == null ? "" : Number(input.criticalMin),
    criticalMax: input.criticalMax === "" || input.criticalMax == null ? "" : Number(input.criticalMax),
    required: Boolean(input.required),
    notes: String(input.notes ?? "").trim(),
    active: Boolean(input.active),
  };
}

export function validateMachineHealthParameter(input, existing = [], editingId = null) {
  const value = normalizeMachineHealthParameter(input);
  const errors = {};
  if (!value.code) errors.code = "Enter a unique monitoring code.";
  if (!value.name) errors.name = "Enter a metric name.";
  if (!value.stationCode || !value.stationName) errors.station = "Select a station from the Station Master.";
  if (!MACHINE_HEALTH_FREQUENCIES.includes(value.frequency)) errors.frequency = "Select a supported frequency.";
  if (["PERIODIC", "HOURLY"].includes(value.frequency) && value.intervalMinutes === "") errors.intervalMinutes = "Enter the interval in minutes for this frequency.";
  if (value.intervalMinutes !== "" && (!Number.isInteger(value.intervalMinutes) || value.intervalMinutes < 1)) errors.intervalMinutes = "Use a positive whole number of minutes.";
  if (!MACHINE_HEALTH_DATA_TYPES.includes(value.dataType)) errors.dataType = "Select a supported data type.";
  for (const key of ["warningMin", "warningMax", "criticalMin", "criticalMax"]) {
    if (value[key] !== "" && !Number.isFinite(value[key])) errors[key] = "Enter a valid number.";
  }
  if (value.warningMin !== "" && value.warningMax !== "" && value.warningMin > value.warningMax) errors.warningLimits = "Warning minimum cannot exceed warning maximum.";
  if (value.criticalMin !== "" && value.criticalMax !== "" && value.criticalMin > value.criticalMax) errors.criticalLimits = "Critical minimum cannot exceed critical maximum.";
  const comparable = existing.filter((record) => record.id !== editingId);
  if (comparable.some((record) => String(record.code).trim().toUpperCase() === value.code)) errors.code = "Code must be unique.";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
