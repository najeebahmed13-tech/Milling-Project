export const EMPTY_VALUE = "\u2014";
export const TEXT_SEPARATOR = "\u00B7";

// Preserve compatibility with legacy records that contain known UTF-8 decoding artifacts.
const MOJIBAKE_REPLACEMENTS = [
  ["\u00c3\u0192\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u009d", EMPTY_VALUE],
  ["\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d", EMPTY_VALUE],
  ["\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u201d", EMPTY_VALUE],
  ["\u00e2\u20ac\u201d", EMPTY_VALUE],
  ["\u00c3\u201a\u00c2\u00b7", TEXT_SEPARATOR],
  ["\u00c2\u00b7", TEXT_SEPARATOR],
  ["\u00c3\u2014", "\u00D7"],
  ["\u00c3\u0192\u00e2\u20ac\u201d", "\u00D7"],
  ["\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00ba", "\u203A"],
  ["\u00e2\u20ac\u00ba", "\u203A"],
];

export function normalizeDisplayText(value, fallback = EMPTY_VALUE) {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  const text = String(value);
  if (/^[\s\u00c3\u0192\u00c2\u00e2\u20ac\u2122\u201c\u201d\u201a\u00ac\u2020\u2021\u00ba\u00bb\u00bf\ufffd]+$/u.test(text)) return fallback;
  return MOJIBAKE_REPLACEMENTS.reduce((current, [broken, replacement]) => current.replaceAll(broken, replacement), text);
}

export function formatNumber(value, { minimumFractionDigits = 0, maximumFractionDigits = 3 } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return EMPTY_VALUE;
  return new Intl.NumberFormat(undefined, { minimumFractionDigits, maximumFractionDigits }).format(number);
}

export function formatQuantity(value, uom = "t", maximumFractionDigits = 2) {
  const formatted = formatNumber(value, { maximumFractionDigits });
  return formatted === EMPTY_VALUE ? EMPTY_VALUE : `${formatted} ${uom}`;
}

export function formatCurrency(value, currency = "MYR") {
  const number = Number(value);
  if (!Number.isFinite(number)) return EMPTY_VALUE;
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(number);
}

export function formatPercentage(value, maximumFractionDigits = 1) {
  const formatted = formatNumber(value, { maximumFractionDigits });
  return formatted === EMPTY_VALUE ? EMPTY_VALUE : `${formatted}%`;
}

export function formatInputValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

export function formatVehiclePlate(value, fallback = EMPTY_VALUE) {
  const normalized = normalizeDisplayText(value, "").trim().toUpperCase().replace(/\s+/g, " ");
  if (!normalized) return fallback;
  return normalized.includes(" ") ? normalized : normalized.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
}

export function formatDateTime(value, timeZone, locale = "en-GB") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  const datePart = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone }).format(date).replaceAll("/", "-");
  const timePart = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: true, timeZone }).format(date);
  return `${datePart} ${timePart}`;
}

export function formatTime(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone }).format(date);
}

export function formatDate(value) {
  if (!value) return EMPTY_VALUE;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date).replaceAll("/", "-");
}

export function statusTone(status = "") {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("reject") || normalized.includes("review") || normalized.includes("failed") || normalized.includes("out of spec")) return "danger";
  if (normalized.includes("grading") || normalized.includes("pending") || normalized.includes("awaiting") || normalized.includes("hold")) return "warning";
  if (normalized.includes("pass") || normalized.includes("accepted") || normalized.includes("released") || normalized.includes("completed") || normalized.includes("active") || normalized.includes("available")) return "success";
  return "neutral";
}
