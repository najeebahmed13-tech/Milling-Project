export const STATUS_SEMANTIC_COLORS = Object.freeze({
  success: { tone: "success", hex: "#13845B" },
  danger: { tone: "danger", hex: "#D51C2A" },
  warning: { tone: "warning", hex: "#AA7207" },
  info: { tone: "info", hex: "#3977D4" },
  neutral: { tone: "neutral", hex: "#667085" },
});

const entries = [
  ["DRAFT", "Draft", "Record created but not submitted for processing.", "neutral", "Commercial, receiving, logistics"],
  ["SUBMITTED", "Submitted", "Record submitted and awaiting approval.", "warning", "Contracts"],
  ["APPROVED", "Approved", "Record approved for the next lifecycle step.", "success", "Contracts, credit"],
  ["REJECTED", "Rejected", "Record rejected by an approval or quality decision.", "danger", "Contracts, quality"],
  ["ACTIVE", "Active", "Master or contract is active and available for use.", "success", "Masters, contracts"],
  ["INACTIVE", "Inactive", "Master is retained but unavailable for new transactions.", "neutral", "Masters"],
  ["SUSPENDED", "Suspended", "Master is temporarily blocked from operational use.", "danger", "Transporter master"],
  ["CANCELLED", "Cancelled", "Workflow was cancelled before completion.", "danger", "Commercial, receiving, logistics"],
  ["COMPLETED", "Completed", "Workflow reached its terminal successful state.", "success", "Production, logistics"],
  ["POSTED", "Posted", "Operational transaction was posted to the system of record.", "success", "Receiving, inventory"],
  ["VOIDED", "Voided", "Posted record was voided through controlled correction.", "danger", "Inventory"],
  ["REVERSED", "Reversed", "Posted movement was reversed through controlled correction.", "danger", "Inventory, contracts"],
  ["WEIGHING", "Weighing", "Receiving record is in weighbridge capture.", "info", "Receiving"],
  ["GRADING", "Grading", "Receiving record is awaiting or undergoing quality grading.", "info", "Receiving"],
  ["GRADING_COMPLETED", "Grading completed", "Quality grading has been completed for the receipt.", "success", "Receiving"],
  ["FIRST_WEIGHT_RECORDED", "First weighing recorded", "Inbound first weighing has been captured.", "info", "Receiving"],
  ["READY_TO_POST", "Ready to post", "Validated record is ready for posting.", "success", "Receiving"],
  ["PENDING_SECOND_WEIGHING", "Pending second weighing", "Record is waiting for outbound/exit weighing.", "warning", "Receiving"],
  ["AWAITING_GRADING", "Awaiting grading", "Receiving record is waiting for quality grading.", "warning", "Receiving"],
  ["PENDING_GRADING", "Pending grading", "Receiving record is waiting for quality grading.", "warning", "Receiving"],
  ["PENDING_VEHICLE_EXIT", "Pending vehicle exit", "Record is waiting for the vehicle exit transaction.", "warning", "Receiving"],
  ["GRADED", "Graded", "Quality grading has been recorded for the receipt.", "success", "Receiving"],
  ["PLANNED", "Planned", "Delivery request is saved and planned for execution.", "info", "Commercial"],
  ["AWAITING_LOGISTICS", "Awaiting logistics", "Loading plan is waiting for transporter and vehicle assignment.", "warning", "Logistics"],
  ["PENDING_LOGISTICS_ASSIGNMENT", "Awaiting logistics", "Loading plan is waiting for transporter and vehicle assignment.", "warning", "Logistics, legacy code"],
  ["ASSIGNED", "Assigned", "Transport resources have been assigned.", "info", "Commercial, logistics"],
  ["LOADING_IN_PROGRESS", "Loading in progress", "Loading execution has started and is not complete.", "info", "Logistics"],
  ["LOADED", "Loaded", "Loading has completed successfully.", "success", "Logistics"],
  ["DISPATCHED", "Dispatched", "Dispatch has been recorded and released from the site.", "info", "Logistics"],
  ["FULFILLED", "Fulfilled", "Delivery request and workflow have been fulfilled.", "success", "Commercial, logistics"],
  ["PENDING", "Pending", "Configured action or decision has not yet been completed.", "warning", "Quality, receiving"],
  ["IN_PROGRESS", "In progress", "Work has started and remains open.", "info", "Quality, production"],
  ["READY_FOR_LOADING", "Ready for loading", "Quality and arrival prerequisites are satisfied.", "success", "Quality, logistics"],
  ["RELEASED", "Released", "Quality decision has released material for the next step.", "success", "Quality"],
  ["QUALITY_PENDING", "Quality pending", "Quality decision is required before dispatch continues.", "warning", "Inventory dispatch"],
  ["QUALITY_RELEASED", "Quality released", "Quality has released the dispatch for execution.", "success", "Inventory dispatch"],
  ["PASS", "Pass", "Inspection or quality result passed.", "success", "Quality, production"],
  ["REVIEW", "Review", "Inspection requires review before release.", "warning", "Quality, production"],
  ["OUT_OF_SPEC", "Out of spec", "Inspection result is outside configured specification.", "danger", "Quality, production"],
  ["FAILED", "Failed", "Operation or validation failed.", "danger", "Quality, system"],
  ["BLOCKED", "Blocked", "Operation cannot proceed until a blocking condition is resolved.", "danger", "System, workflows"],
  ["ORDERED", "Ordered", "Dispatch order has been created but not started.", "neutral", "Inventory dispatch"],
  ["EMPTY_WEIGHED", "Empty weighed", "Vehicle empty weighing has been completed.", "info", "Inventory dispatch"],
  ["LOADING", "Loading", "Dispatch loading is currently in progress.", "info", "Inventory dispatch"],
  ["NOT_RECORDED", "Not recorded", "Expected checklist result has not been entered.", "neutral", "Quality, logistics"],
  ["RECORDED", "Recorded", "Operational observation or measurement has been recorded.", "success", "Receiving, quality"],
  ["CERTIFIED", "Certified", "Measurement or result has been certified.", "success", "Receiving"],
  ["NOT_CERTIFIED", "Not certified", "Expected certification is not yet available.", "warning", "Receiving"],
  ["NO_STOCK_RECORDED", "No stock recorded", "No stock transaction has been recorded for the item.", "neutral", "Inventory"],
  ["TBA", "TBA", "Value is unavailable because a required workflow action is pending.", "warning", "Details pages"],
];

export const STATUS_REGISTRY = Object.freeze(Object.fromEntries(entries.map(([code, label, meaning, semanticColor, usage]) => [code, Object.freeze({ code, label, meaning, semanticColor, hex: STATUS_SEMANTIC_COLORS[semanticColor].hex, usage })])));

export function normalizeStatusCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function getStatusDefinition(value) {
  return STATUS_REGISTRY[normalizeStatusCode(value)] || null;
}

export function statusTone(value) {
  return getStatusDefinition(value)?.semanticColor || "neutral";
}
