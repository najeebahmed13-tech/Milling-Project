export function formatQuantity(value, uom = 't', maximumFractionDigits = 2) {
  const number = Number(value);
  const displayUom = /^(t|mt)$/i.test(String(uom).trim()) ? 'Metric Ton MT' : uom;
  if (!Number.isFinite(number)) return `— ${displayUom}`;
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits, minimumFractionDigits: 0 }).format(number)} ${displayUom}`;
}

export function formatPercentage(value, maximumFractionDigits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(number)}%`;
}

export function formatDateTime(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
}

export function statusTone(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('reject') || normalized.includes('review') || normalized.includes('failed') || normalized.includes('out of spec')) return 'danger';
  if (normalized.includes('grading') || normalized.includes('pending') || normalized.includes('awaiting') || normalized.includes('hold')) return 'warning';
  if (normalized.includes('pass') || normalized.includes('accepted') || normalized.includes('released') || normalized.includes('completed') || normalized.includes('active') || normalized.includes('available')) return 'success';
  return 'neutral';
}
