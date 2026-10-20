// Master records are selected by their stable identifiers but presented by name.
// Codes remain available for search, tables, and traceability without cluttering selectors.
export function masterName(record, fallback = "") {
  return record?.name || record?.label || record?.code || fallback;
}
