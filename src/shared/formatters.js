export function formatQuantity(value, uom = 't', maximumFractionDigits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return `— ${uom}`;
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits, minimumFractionDigits: 0 }).format(number)} ${uom}`;
}

export function formatPercentage(value, maximumFractionDigits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(number)}%`;
}

export function formatDateTime(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const datePart = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone }).format(date).replaceAll('/', '-');
  const timePart = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone }).format(date);
  return `${datePart} ${timePart}`;
}

export function formatTime(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone }).format(date);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date).replaceAll('/', '-');
}

export function statusTone(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('reject') || normalized.includes('review') || normalized.includes('failed') || normalized.includes('out of spec')) return 'danger';
  if (normalized.includes('grading') || normalized.includes('pending') || normalized.includes('awaiting') || normalized.includes('hold')) return 'warning';
  if (normalized.includes('pass') || normalized.includes('accepted') || normalized.includes('released') || normalized.includes('completed') || normalized.includes('active') || normalized.includes('available')) return 'success';
  return 'neutral';
}
