export const RECORDING_FREQUENCIES = ["CYCLE", "DAY", "SHIFT", "BATCH", "HOURLY", "EVENT", "AD_HOC"];
export const DATA_TYPES = ["INTEGER", "DECIMAL", "TEXT", "BOOLEAN", "SELECTION"];
export const PASS_FAIL_RULES = ["IN_RANGE", "EXACT_MATCH"];
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
    allowedVariancePercent: numberOrNull(input.allowedVariancePercent),
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
  if (!RECORDING_FREQUENCIES.includes(checkpoint.frequency)) errors.frequency = "Select a supported recording frequency.";
  if (!DATA_TYPES.includes(checkpoint.dataType)) errors.dataType = "Select a supported data type.";
  if (!String(input?.passFailRule || "").trim()) errors.passFailRule = "Pass/Fail Rule is required.";
  else if (!PASS_FAIL_RULES.includes(checkpoint.passFailRule)) errors.passFailRule = "Select a supported pass/fail rule.";
  if (!checkpoint.parameter) errors.parameter = "Quality parameter is required.";
  if (!Number.isInteger(checkpoint.sequence) || checkpoint.sequence < 1) errors.sequence = "Sequence must be a positive integer.";
  if (!Number.isInteger(checkpoint.sampleCount) || checkpoint.sampleCount < 1) errors.sampleCount = "Sample count must be at least 1.";
  if (checkpoint.passFailRule === "IN_RANGE") {
    if (checkpoint.minLimit !== null && checkpoint.maxLimit !== null && checkpoint.minLimit > checkpoint.maxLimit) errors.limits = "Minimum limit cannot exceed maximum limit.";
    if (checkpoint.warningMin !== null && checkpoint.warningMax !== null && checkpoint.warningMin > checkpoint.warningMax) errors.warningLimits = "Warning minimum cannot exceed warning maximum.";
  }
  if (checkpoint.allowedVariancePercent !== null && (!Number.isFinite(checkpoint.allowedVariancePercent) || checkpoint.allowedVariancePercent < 0 || checkpoint.allowedVariancePercent > 100)) errors.allowedVariancePercent = "Allowed variance must be between 0 and 100 percent.";
  if (checkpoint.effectiveFrom && checkpoint.effectiveTo && checkpoint.effectiveFrom > checkpoint.effectiveTo) errors.effectivePeriod = "Effective From cannot be after Effective To.";
  const duplicate = existing.find((item) => Number(item.id) !== Number(checkpoint.id) && item.code === checkpoint.code && item.version === checkpoint.version && item.status === "ACTIVE");
  if (duplicate) errors.code = "An active checkpoint with this code and version already exists.";
  return { valid: Object.keys(errors).length === 0, errors, value: checkpoint };
}

export function validateCheckpointBatch(inputs, existing = []) {
  if (!Array.isArray(inputs) || !inputs.length) return { valid: false, errors: { batch: "At least one checkpoint is required." }, value: [] };
  const errors = {};
  const values = inputs.map((input) => validateCheckpoint(input, existing).value);
  inputs.forEach((input, index) => {
    const result = validateCheckpoint(input, existing);
    if (!result.valid) errors[index] = result.errors;
  });
  const seen = new Set();
  values.forEach((value, index) => {
    if (seen.has(`${value.code}:${value.version || 1}`)) errors[index] = { ...(errors[index] || {}), code: "Checkpoint code and version must be unique within this batch." };
    seen.add(`${value.code}:${value.version || 1}`);
  });
  return { valid: Object.keys(errors).length === 0, errors, value: values };
}

export function validateCheckpointParameters(parameters, parent = {}) {
  if (!Array.isArray(parameters) || !parameters.length) return { valid: false, errors: { parameters: "At least one quality parameter is required." }, value: [] };
  const errors = {};
  const value = parameters.map((parameter, index) => {
    const result = validateCheckpoint({ ...parent, ...parameter, code: parent.code || `PARAM-${index + 1}`, name: parent.name || parameter.parameter, process: parent.process, parameter: parameter.parameter });
    if (!result.valid) errors[index] = result.errors;
    return result.value;
  });
  const seen = new Set();
  value.forEach((parameter, index) => {
    if (seen.has(parameter.parameter)) errors[index] = { ...(errors[index] || {}), parameter: "Each parameter can only be assigned once to a checkpoint." };
    seen.add(parameter.parameter);
  });
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function isCheckpointEffective(checkpoint, date) {
  const target = String(date || "").slice(0, 10);
  return checkpoint.status === "ACTIVE" && checkpoint.effectiveFrom <= target && (!checkpoint.effectiveTo || checkpoint.effectiveTo >= target);
}

export function evaluateQualityValue(checkpointInput, observedValue) {
  const checkpoint = normalizeCheckpoint(checkpointInput);
  if (observedValue === "" || observedValue === null || observedValue === undefined) return { status: checkpoint.mandatory ? "FAIL" : "WARNING", reason: "VALUE_REQUIRED" };
  if (checkpoint.passFailRule === "EXACT_MATCH") {
    const target = Number(checkpoint.targetValue);
    const observed = Number(observedValue);
    if (checkpoint.allowedVariancePercent !== null && Number.isFinite(target) && Number.isFinite(observed)) {
      const tolerance = Math.abs(target) * checkpoint.allowedVariancePercent / 100;
      return Math.abs(observed - target) <= tolerance ? { status: "PASS", reason: "EXACT_MATCH_WITHIN_VARIANCE" } : { status: "FAIL", reason: "OUTSIDE_ALLOWED_VARIANCE" };
    }
    return String(observedValue).trim() === String(checkpoint.targetValue).trim() ? { status: "PASS", reason: "EXACT_MATCH" } : { status: "FAIL", reason: "EXACT_MISMATCH" };
  }
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

export function aggregateCheckpointResult(results = []) {
  const statuses = results.map((result) => String(result?.status || result || "").toUpperCase());
  if (!statuses.length || statuses.includes("FAIL")) return { status: "FAIL", reason: statuses.length ? "PARAMETER_FAILURE" : "NO_PARAMETER_RESULTS" };
  if (statuses.includes("WARNING")) return { status: "WARNING", reason: "PARAMETER_WARNING" };
  return { status: "PASS", reason: "ALL_PARAMETERS_PASS" };
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
  const evaluation = observation.parameters ? { status: observation.resultStatus, reason: observation.evaluationReason || "PARAMETER_RESULTS" } : evaluateQualityValue(checkpoint, observation.observedValue);
  return { valid: Object.keys(errors).length === 0, errors, evaluation };
}
