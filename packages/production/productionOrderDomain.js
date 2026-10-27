export const PRODUCTION_ORDER_STATUSES = ["DRAFT", "PENDING", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"];

export const PRODUCTION_ORDER_TRANSITIONS = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function canTransitionProductionOrder(from, to) {
  return PRODUCTION_ORDER_TRANSITIONS[from]?.includes(to) === true;
}

export function calculateRemainingDemand({ contractQuantity, fulfilledQuantity = 0, plannedQuantity = 0 }) {
  return Math.max(0, Number(contractQuantity || 0) - Number(fulfilledQuantity || 0) - Number(plannedQuantity || 0));
}

export function calculateExpectedQuantity(inputQuantity, yieldPercent) {
  const quantity = Number(inputQuantity);
  const yieldValue = Number(yieldPercent);
  if (!Number.isFinite(quantity) || !Number.isFinite(yieldValue) || quantity < 0 || yieldValue < 0) return null;
  return Number((quantity * yieldValue / 100).toFixed(3));
}

export function validateProductionOrder(input, references = {}) {
  const errors = {};
  if (!input.orderDate) errors.orderDate = "Production Order Date is required.";
  if (!input.millId) errors.millId = "Mill / Facility is required.";
  if (!input.lineId) errors.lineId = "Production Line is required.";
  if (!input.routingId) errors.routingId = "Routing is required.";
  if (!input.plannedStart) errors.plannedStart = "Planned start is required.";
  if (!input.plannedEnd) errors.plannedEnd = "Planned end is required.";
  if (input.plannedStart && input.plannedEnd && new Date(input.plannedEnd) <= new Date(input.plannedStart)) errors.plannedEnd = "Planned end must be later than planned start.";
  const quantity = Number(input.plannedFfbQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) errors.plannedFfbQuantity = "Planned FFB input quantity must be positive.";
  if (!Array.isArray(input.allocations) || input.allocations.length === 0) errors.allocations = "At least one demand allocation is required.";
  if (Array.isArray(input.allocations)) input.allocations.forEach((allocation, index) => {
    const planned = Number(allocation.plannedQuantity);
    if (!allocation.contractId || allocation.contractLineId === undefined || allocation.contractLineId === "") errors[`allocation_${index}`] = "Each allocation must identify a sales contract line.";
    if (!Number.isFinite(planned) || planned <= 0) errors[`allocation_quantity_${index}`] = "Each allocation quantity must be positive.";
    if (Number.isFinite(Number(allocation.remainingAvailableDemand)) && planned > Number(allocation.remainingAvailableDemand)) errors[`allocation_over_${index}`] = "Allocation exceeds remaining available demand.";
    if (references.routingOutputs && allocation.demandProduct && !references.routingOutputs.includes(allocation.demandProduct)) errors[`allocation_output_${index}`] = "Demand product must be a valid output of the selected routing.";
  });
  if (Array.isArray(input.outputs)) input.outputs.forEach((output, index) => {
    if (!output.product) errors[`output_${index}`] = "Expected output product is required.";
    if (references.routingOutputs && !references.routingOutputs.includes(output.product)) errors[`output_valid_${index}`] = "Expected output must be a valid output of the selected routing.";
    if (output.expectedQuantity !== "" && (!Number.isFinite(Number(output.expectedQuantity)) || Number(output.expectedQuantity) < 0)) errors[`output_quantity_${index}`] = "Expected output quantity must be non-negative.";
  });
  return errors;
}
