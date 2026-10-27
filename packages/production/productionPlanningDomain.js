export const PRODUCTION_PLAN_STATUSES = ["DRAFT", "PROPOSED", "UNDER_REVIEW", "APPROVED", "PARTIALLY_RELEASED", "RELEASED", "COMPLETED", "CLOSED", "CANCELLED"];

export const PRODUCTION_PLAN_PERIOD_TYPES = ["MONTH", "WEEK", "DAY", "CUSTOM"];
export const PRODUCTION_PLAN_RISK_STATUSES = ["HEALTHY", "BELOW_SAFETY_STOCK", "SHORTFALL_RISK", "EXCESS_STOCK"];

export const PRODUCTION_PLAN_TRANSITIONS = {
  DRAFT: ["PROPOSED", "CANCELLED"],
  PROPOSED: ["UNDER_REVIEW", "DRAFT", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED: ["PARTIALLY_RELEASED", "RELEASED", "CANCELLED"],
  PARTIALLY_RELEASED: ["RELEASED", "COMPLETED", "CANCELLED"],
  RELEASED: ["COMPLETED", "CLOSED"],
  COMPLETED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function canTransitionProductionPlan(from, to) {
  return PRODUCTION_PLAN_TRANSITIONS[String(from || "").toUpperCase()]?.includes(String(to || "").toUpperCase()) === true;
}

export function validatePlanningPeriod({ periodType = "CUSTOM", periodFrom, periodTo } = {}) {
  const errors = {};
  const type = String(periodType || "").toUpperCase();
  if (!PRODUCTION_PLAN_PERIOD_TYPES.includes(type)) errors.periodType = "Planning period type is invalid.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(periodFrom || ""))) errors.periodFrom = "Planning start date must use YYYY-MM-DD.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(periodTo || ""))) errors.periodTo = "Planning end date must use YYYY-MM-DD.";
  if (!errors.periodFrom && !errors.periodTo && String(periodTo) < String(periodFrom)) errors.periodTo = "Planning end date cannot precede the start date.";
  return errors;
}

export function validatePlanningLine(line = {}) {
  const errors = {};
  const quantityFields = ["grossDemand", "availableInventory", "reservedInventory", "safetyStock", "alreadyPlannedQuantity", "plannedQuantity"];
  if (!String(line.productId ?? line.product ?? "").trim()) errors.product = "A product or item is required.";
  if (!String(line.uom || "").trim()) errors.uom = "A planning UOM is required.";
  for (const field of quantityFields) {
    const value = Number(line[field] ?? 0);
    if (!Number.isFinite(value) || value < 0) errors[field] = `${field} must be a non-negative number.`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(line.requiredByDate || ""))) errors.requiredByDate = "Required-by date must use YYYY-MM-DD.";
  if (line.expectedYieldPercent != null && line.expectedYieldPercent !== "" && (!Number.isFinite(Number(line.expectedYieldPercent)) || Number(line.expectedYieldPercent) <= 0 || Number(line.expectedYieldPercent) > 100)) errors.expectedYieldPercent = "Expected yield must be greater than 0 and no more than 100 percent.";
  return errors;
}

export function normalizePlanningQuantity(value, precision = 3) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Number(amount.toFixed(precision));
}

export function calculateNetProductionRequirement({ grossDemand = 0, availableInventory = 0, reservedInventory = 0, safetyStock = 0, alreadyPlannedQuantity = 0 }) {
  const value = Number(grossDemand) - Number(availableInventory) - Number(reservedInventory) + Number(safetyStock) - Number(alreadyPlannedQuantity);
  return Math.max(0, Number(value.toFixed(3)));
}

export function calculateRequiredFfb(outputQuantity, yieldPercent) {
  const output = Number(outputQuantity); const yieldValue = Number(yieldPercent);
  if (!Number.isFinite(output) || !Number.isFinite(yieldValue) || output < 0 || yieldValue <= 0) return null;
  return Number((output / (yieldValue / 100)).toFixed(3));
}

export function consolidateDemand(lines = [], existingAllocations = []) {
  const allocated = new Map(existingAllocations.map((row) => [`${row.deliveryRequestLineId}`, Number(row.allocatedQuantity || 0)]));
  const groups = new Map();
  for (const line of lines) {
    if (!line || line.cancelled || line.eligible === false || Number(line.requestedQuantity || 0) <= 0) continue;
    const remaining = Math.max(0, Number(line.requestedQuantity) - Number(line.fulfilledQuantity || 0) - Number(allocated.get(String(line.id)) || 0));
    if (!remaining) continue;
    const key = [line.product, line.requiredDate, line.millId || "", line.customerName || ""].join("|");
    const current = groups.get(key) || { ...line, deliveryRequestLineIds: [], grossDemand: 0 };
    current.grossDemand = Number((current.grossDemand + remaining).toFixed(3));
    current.deliveryRequestLineIds.push(line.id);
    groups.set(key, current);
  }
  return [...groups.values()];
}

export function calculatePlanVsActual({ plannedQuantity = 0, actualQuantity = 0 }) {
  const planned = Number(plannedQuantity); const actual = Number(actualQuantity);
  const variance = Number((actual - planned).toFixed(3));
  return { planned, actual, variance, variancePercent: planned ? Number(((variance / planned) * 100).toFixed(2)) : 0, remaining: Math.max(0, Number((planned - actual).toFixed(3))) };
}

export function calculateProjectedStock({ openingStock = 0, plannedProduction = 0, plannedConsumption = 0 }) {
  return Number((Number(openingStock) + Number(plannedProduction) - Number(plannedConsumption)).toFixed(3));
}

export function planningRiskStatus({ projectedStock = 0, safetyStock = 0, netRequirement = 0, plannedProduction = 0 }) {
  if (Number(projectedStock) < Number(safetyStock)) return "BELOW_SAFETY_STOCK";
  if (Number(plannedProduction) < Number(netRequirement)) return "SHORTFALL_RISK";
  if (Number(plannedProduction) > Number(netRequirement) * 1.1 && Number(netRequirement) > 0) return "EXCESS_STOCK";
  return "HEALTHY";
}

export function buildPlanningBuckets(from, to, granularity = "month") {
  const start = new Date(`${from}T00:00:00Z`); const end = new Date(`${to}T00:00:00Z`); const buckets = [];
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return buckets;
  const cursor = new Date(start);
  while (cursor <= end) {
    const bucketStart = new Date(cursor); let bucketEnd = new Date(cursor);
    if (granularity === "day") bucketEnd.setUTCDate(bucketEnd.getUTCDate());
    else if (granularity === "week") bucketEnd.setUTCDate(bucketEnd.getUTCDate() + 6);
    else { bucketEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)); }
    if (bucketEnd > end) bucketEnd.setTime(end.getTime());
    const key = granularity === "month" ? `${bucketStart.getUTCFullYear()}-${String(bucketStart.getUTCMonth() + 1).padStart(2, "0")}` : bucketStart.toISOString().slice(0, 10);
    buckets.push({ key, from: bucketStart.toISOString().slice(0, 10), to: bucketEnd.toISOString().slice(0, 10), label: granularity === "week" ? `Week ${Math.ceil(bucketStart.getUTCDate() / 7)}` : key });
    cursor.setTime(bucketEnd.getTime()); cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
}
