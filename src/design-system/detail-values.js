import { normalizeDisplayText } from "../shared/formatters.js";

export const DETAIL_EMPTY_VALUE = "-";
export const DETAIL_PENDING_VALUE = "TBA";

export function resolveDetailValue(value, { pending = false, fallback = DETAIL_EMPTY_VALUE } = {}) {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    return normalizeDisplayText(value, fallback);
  }
  return pending ? DETAIL_PENDING_VALUE : fallback;
}
