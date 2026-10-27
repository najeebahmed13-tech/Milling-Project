export function normalizeFfbDisposition(netWeight, acceptedQty, rejectedQty) {
  const net = Number(netWeight);
  const accepted = acceptedQty == null || acceptedQty === '' ? net : Number(acceptedQty);
  const rejected = rejectedQty == null || rejectedQty === '' ? 0 : Number(rejectedQty);
  if (![net, accepted, rejected].every(Number.isFinite) || net <= 0 || accepted < 0 || rejected < 0) {
    return { valid: false, code: 'INVALID_DISPOSITION', message: 'Accepted and rejected quantities must be zero or greater.' };
  }
  if (Math.abs((accepted + rejected) - net) > 0.001) {
    return { valid: false, code: 'DISPOSITION_WEIGHT_MISMATCH', message: 'Accepted plus rejected quantity must equal the authoritative net weight.' };
  }
  return { valid: true, accepted: Number(accepted.toFixed(3)), rejected: Number(rejected.toFixed(3)) };
}

export function buildFfbLotNumber(receiptId, stamp = new Date().toISOString()) {
  const date = stamp.slice(0, 10).replaceAll('-', '');
  return `FFB-${date}-${String(receiptId).padStart(6, '0')}`;
}
