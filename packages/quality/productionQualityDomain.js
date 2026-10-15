export const RECORDING_FREQUENCIES = ["CYCLE", "DAY", "SHIFT", "BATCH", "HOURLY", "EVENT"];
export const DATA_TYPES = ["INTEGER", "DECIMAL", "TEXT", "BOOLEAN", "SELECTION"];
export const RESULT_STATUSES = ["PASS", "WARNING", "FAIL"];

export function activeStationOptions(stations = []) {
  return stations
    .filter((station) => station?.name && String(station.status || "ACTIVE").toUpperCase() === "ACTIVE")
    .map((station) => ({ id: station.id, code: String(station.code || "").trim(), name: String(station.name).trim() }));
}

const numberOrNull = (value) => value === "" || value === null || value === undefined ? null : Number(value);

export function normalizeCheckpoint(input = {}) {
  return {
    ...input,
    code: String(input.code || "").trim().toUpperCase(),
    name: String(input.name || "").trim(),
    process: String(input.process || "").trim(),
    operationStage: String(input.operationStage || "").trim(),
    frequency: String(input.frequency || "DAY").trim().toUpperCase(),
    sequence: Number(input.sequence || 1),
    parameter: String(input.parameter || "").trim(),
    dataType: String(input.dataType || "DECIMAL").trim().toUpperCase(),
    uom: String(input.uom || "").trim(),
    targetValue: input.targetValue === undefined ? "" : String(input.targetValue),
    minLimit: numberOrNull(input.minLimit),
    maxLimit: numberOrNull(input.maxLimit),
    warningMin: numberOrNull(input.warningMin),
    warningMax: numberOrNull(input.warningMax),
    mandatory: Boolean(input.mandatory),
    samplingFrequency: String(input.samplingFrequency || "").trim(),
    sampleCount: Number(input.sampleCount || 1),
    aggregationMethod: String(input.aggregationMethod || "NONE").trim().toUpperCase(),
    passFailRule: String(input.passFailRule || "IN_RANGE").trim().toUpperCase(),
    remarksRequiredOnFailure: Boolean(input.remarksRequiredOnFailure),
    correctiveActionRequired: Boolean(input.correctiveActionRequired),
    effectiveFrom: String(input.effectiveFrom || "").trim(),
    effectiveTo: String(input.effectiveTo || "").trim(),
    status: String(input.status || "ACTIVE").trim().toUpperCase(),
  };
}

export function validateCheckpoint(input, existing = []) {
  const checkpoint = normalizeCheckpoint(input);
  const errors = {};
  if (!checkpoint.code) errors.code = "Checkpoint code is required.";
  if (!checkpoint.name) errors.name = "Checkpoint name is required.";
  if (!checkpoint.process) errors.process = "Station is required.";
  if (!checkpoint.operationStage) errors.operationStage = "Operation or stage is required.";
  if (!RECORDING_FREQUENCIES.includes(checkpoint.frequency)) errors.frequency = "Select a supported recording frequency.";
  if (!DATA_TYPES.includes(checkpoint.dataType)) errors.dataType = "Select a supported data type.";
  if (!checkpoint.parameter) errors.parameter = "Quality parameter is required.";
  if (!Number.isInteger(checkpoint.sequence) || checkpoint.sequence < 1) errors.sequence = "Sequence must be a positive integer.";
  if (!Number.isInteger(checkpoint.sampleCount) || checkpoint.sampleCount < 1) errors.sampleCount = "Sample count must be at least 1.";
  if (checkpoint.minLimit !== null && checkpoint.maxLimit !== null && checkpoint.minLimit > checkpoint.maxLimit) errors.limits = "Minimum limit cannot exceed maximum limit.";
  if (checkpoint.warningMin !== null && checkpoint.warningMax !== null && checkpoint.warningMin > checkpoint.warningMax) errors.warningLimits = "Warning minimum cannot exceed warning maximum.";
  if (checkpoint.effectiveFrom && checkpoint.effectiveTo && checkpoint.effectiveFrom > checkpoint.effectiveTo) errors.effectivePeriod = "Effective From cannot be after Effective To.";
  const duplicate = existing.find((item) => Number(item.id) !== Number(checkpoint.id) && item.code === checkpoint.code && item.version === checkpoint.version && item.status === "ACTIVE");
  if (duplicate) errors.code = "An active checkpoint with this code and version already exists.";
  return { valid: Object.keys(errors).length === 0, errors, value: checkpoint };
}

export function isCheckpointEffective(checkpoint, date) {
  const target = String(date || "").slice(0, 10);
  return checkpoint.status === "ACTIVE" && checkpoint.effectiveFrom <= target && (!checkpoint.effectiveTo || checkpoint.effectiveTo >= target);
}

export function evaluateQualityValue(checkpointInput, observedValue) {
  const checkpoint = normalizeCheckpoint(checkpointInput);
  if (observedValue === "" || observedValue === null || observedValue === undefined) return { status: checkpoint.mandatory ? "FAIL" : "WARNING", reason: "VALUE_REQUIRED" };
  if (checkpoint.dataType === "INTEGER" && !/^-?\d+$/.test(String(observedValue))) return { status: "FAIL", reason: "INVALID_INTEGER" };
  if (checkpoint.dataType === "DECIMAL" && !Number.isFinite(Number(observedValue))) return { status: "FAIL", reason: "INVALID_DECIMAL" };
  if (["INTEGER", "DECIMAL"].includes(checkpoint.dataType)) {
    const value = Number(observedValue);
    if (checkpoint.minLimit !== null && value < checkpoint.minLimit) return { status: "FAIL", reason: "BELOW_MINIMUM" };
    if (checkpoint.maxLimit !== null && value > checkpoint.maxLimit) return { status: "FAIL", reason: "ABOVE_MAXIMUM" };
    if (checkpoint.warningMin !== null && value < checkpoint.warningMin) return { status: "WARNING", reason: "WARNING_MINIMUM" };
    if (checkpoint.warningMax !== null && value > checkpoint.warningMax) return { status: "WARNING", reason: "WARNING_MAXIMUM" };
  }
  return { status: "PASS", reason: "WITHIN_RULE" };
}

export function validateObservation(observation, checkpoint, existing = []) {
  const errors = {};
  const productionDate = String(observation.productionDate || "").slice(0, 10);
  if (!productionDate) errors.productionDate = "Production date is required.";
  if (!observation.observedValue && observation.observedValue !== 0) errors.observedValue = "Observed value is required.";
  if (checkpoint.frequency === "CYCLE" && !String(observation.cycleNumber || "").trim()) errors.cycleNumber = "Cycle number is required for cycle-wise checkpoints.";
  if (checkpoint.remarksRequiredOnFailure && observation.resultStatus === "FAIL" && !String(observation.remarks || "").trim()) errors.remarks = "Remarks are required when the result fails.";
  if (checkpoint.correctiveActionRequired && observation.resultStatus === "FAIL" && !String(observation.correctiveAction || "").trim()) errors.correctiveAction = "Corrective action is required when the result fails.";
  const duplicate = existing.find((item) => Number(item.checkpointId) === Number(checkpoint.id) && item.productionDate === productionDate && String(item.cycleNumber || "") === String(observation.cycleNumber || ""));
  if (duplicate) errors.duplicate = "A quality record already exists for this checkpoint and production period.";
  const evaluation = evaluateQualityValue(checkpoint, observation.observedValue);
  return { valid: Object.keys(errors).length === 0, errors, evaluation };
}
