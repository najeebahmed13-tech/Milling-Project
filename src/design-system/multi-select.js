export function normalizeMultiSelectOptions(options = []) {
  const seen = new Set();
  return options.reduce((result, option) => {
    const normalized = typeof option === "string"
      ? { value: option, label: option }
      : { value: String(option?.value ?? ""), label: String(option?.label ?? option?.value ?? "") };
    if (!normalized.value || seen.has(normalized.value)) return result;
    seen.add(normalized.value);
    result.push(normalized);
    return result;
  }, []);
}

export function toggleMultiSelectValue(value = [], nextValue, options = []) {
  const optionValues = new Set(normalizeMultiSelectOptions(options).map((option) => option.value));
  const selected = new Set(value.filter((item) => optionValues.has(item)));
  if (selected.has(nextValue)) selected.delete(nextValue);
  else selected.add(nextValue);
  return normalizeMultiSelectOptions(options).map((option) => option.value).filter((item) => selected.has(item));
}

export function getMultiSelectSummary(value = [], options = [], placeholder = "Select options") {
  const selected = new Set(value);
  const labels = normalizeMultiSelectOptions(options).filter((option) => selected.has(option.value)).map((option) => option.label);
  return labels.length ? labels.join(", ") : placeholder;
}
