export function normalizeBreadcrumbItems(items = []) {
  return items
    .filter((item) => item && String(item.label || "").trim())
    .map((item) => ({ ...item, label: String(item.label).trim() }));
}
