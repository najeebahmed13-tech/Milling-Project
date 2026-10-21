export const QUALITY_PARAMETER_DATA_TYPES = ["DECIMAL", "INTEGER", "TEXT", "BOOLEAN", "SELECTION"];
export const QUALITY_PARAMETER_MATERIALS = ["CPO", "PK", "BOTH"];
export const QUALITY_PARAMETER_TYPES = ["MACHINE", "PRODUCT", "LOSS"];

export function normalizeQualityParameter(input = {}) {
  return {
    ...input,
    code: String(input.code ?? "").trim().toUpperCase(),
    name: String(input.name ?? "").trim(),
    dataType: String(input.dataType ?? "").trim().toUpperCase(),
    uom: String(input.uom ?? "").trim(),
    precision: input.precision === "" || input.precision == null ? "" : Number(input.precision),
    material: String(input.material ?? "BOTH").trim().toUpperCase(),
    parameterTypes: [...new Set((Array.isArray(input.parameterTypes) ? input.parameterTypes : []).map((type) => String(type).trim().toUpperCase()).filter(Boolean))],
    description: String(input.description ?? "").trim(),
    active: Boolean(input.active),
  };
}

export function validateQualityParameter(input, existing = [], editingId = null) {
  const value = normalizeQualityParameter(input);
  const errors = {};
  if (!value.code) errors.code = "Enter a unique parameter code.";
  if (!value.name) errors.name = "Enter a parameter name.";
  if (!QUALITY_PARAMETER_DATA_TYPES.includes(value.dataType)) errors.dataType = "Select a valid data type.";
  if (!QUALITY_PARAMETER_MATERIALS.includes(value.material)) errors.material = "Select CPO, PK, or Both.";
  if (!value.parameterTypes.length) errors.parameterTypes = "Parameter type is required; select at least one type.";
  if (value.parameterTypes.some((type) => !QUALITY_PARAMETER_TYPES.includes(type))) errors.parameterTypes = "Select valid parameter types.";
  if (value.precision !== "" && (!Number.isInteger(value.precision) || value.precision < 0 || value.precision > 12)) {
    errors.precision = "Use a whole number from 0 to 12.";
  }

  const comparable = existing.filter((record) => record.id !== editingId);
  if (comparable.some((record) => String(record.code).trim().toUpperCase() === value.code)) {
    errors.code = "Code must be unique.";
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}
