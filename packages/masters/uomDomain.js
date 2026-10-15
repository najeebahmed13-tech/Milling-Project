export const UOM_CATEGORIES = ["Mass", "Volume", "Percentage", "Count"];

export function normalizeUom(input = {}) {
  return {
    ...input,
    code: String(input.code ?? "").trim().toUpperCase(),
    name: String(input.name ?? "").trim(),
    symbol: String(input.symbol ?? "").trim(),
    category: String(input.category ?? "").trim(),
    precision: input.precision === "" || input.precision == null ? "" : Number(input.precision),
    active: Boolean(input.active),
  };
}

export function validateUom(input, existing = [], editingId = null) {
  const value = normalizeUom(input);
  const errors = {};
  if (!value.code) errors.code = "Enter a unique code.";
  if (!value.name) errors.name = "Enter a unit name.";
  if (!value.symbol) errors.symbol = "Enter a display symbol.";
  if (!UOM_CATEGORIES.includes(value.category)) errors.category = "Select a valid category.";
  if (!Number.isInteger(value.precision) || value.precision < 0 || value.precision > 12) {
    errors.precision = "Use a whole number from 0 to 12.";
  }

  const comparable = existing.filter((record) => record.id !== editingId);
  if (comparable.some((record) => String(record.code).trim().toUpperCase() === value.code)) {
    errors.code = "Code must be unique.";
  }
  if (comparable.some((record) => String(record.symbol).trim().toLowerCase() === value.symbol.toLowerCase())) {
    errors.symbol = "Symbol must be unique.";
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}
