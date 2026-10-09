export const RECEIPT_STATES = ['DRAFT', 'WEIGHING', 'GRADING', 'READY_TO_POST', 'POSTED', 'CANCELLED'];

export function validateFfbReceiveForm(form) {
  const gross = Number(form.grossWeight);
  const declared = form.supplierDeclaredQty === '' || form.supplierDeclaredQty == null ? null : Number(form.supplierDeclaredQty);
  const missing = ['driverName', 'vehicleNo', 'supplier', 'item'].filter((key) => !String(form[key] || '').trim());
  if (missing.length || !Number.isFinite(gross) || gross <= 0) return { valid: false, code: 'INVALID_RECEIVING', missing, message: 'Driver name, lorry plate number, supplier, item and a positive gross weight are required.' };
  if (declared !== null && (!Number.isFinite(declared) || declared < 0)) return { valid: false, code: 'INVALID_DECLARED_QTY', message: 'Supplier declared quantity must be zero or greater.' };
  return { valid: true, gross, declared };
}

const transitions = {
  DRAFT: { startWeighing: 'WEIGHING', cancel: 'CANCELLED' },
  WEIGHING: { recordWeight: 'WEIGHING', completeWeighing: 'GRADING', cancel: 'CANCELLED' },
  GRADING: { completeGrading: 'READY_TO_POST', cancel: 'CANCELLED' },
  READY_TO_POST: { post: 'POSTED', cancel: 'CANCELLED' },
  POSTED: {}, CANCELLED: {}
};

export function calculateNetWeight(firstWeight, secondWeight, firstWeightType = 'GROSS') {
  const first = Number(firstWeight); const second = Number(secondWeight);
  if (!Number.isFinite(first) || !Number.isFinite(second) || first <= 0 || second <= 0) return { valid: false, code: 'INVALID_WEIGHT', message: 'Both weighments must be greater than zero.' };
  const gross = firstWeightType === 'GROSS' ? first : second;
  const tare = firstWeightType === 'GROSS' ? second : first;
  const net = gross - tare;
  if (gross < tare || net <= 0) return { valid: false, code: 'INVALID_NET_WEIGHT', message: 'Gross weight must be greater than tare weight and net weight must be positive.' };
  return { valid: true, gross, tare, net: Number(net.toFixed(3)) };
}

export function validateDisposition(netWeight, accepted, rejected) {
  const net = Number(netWeight); const acceptedQty = Number(accepted); const rejectedQty = Number(rejected);
  if (!Number.isFinite(net) || !Number.isFinite(acceptedQty) || !Number.isFinite(rejectedQty) || acceptedQty < 0 || rejectedQty < 0) return { valid: false, code: 'INVALID_DISPOSITION', message: 'Accepted and rejected quantities must be zero or greater.' };
  if (Math.abs(acceptedQty + rejectedQty - net) > 0.001) return { valid: false, code: 'DISPOSITION_MISMATCH', message: 'Accepted plus rejected quantity must equal the authoritative net weight.' };
  if (acceptedQty === 0 && rejectedQty === 0) return { valid: false, code: 'EMPTY_DISPOSITION', message: 'Enter an accepted or rejected quantity.' };
  return { valid: true, accepted: acceptedQty, rejected: rejectedQty };
}

export function transitionReceipt(receipt, action, { permission = true } = {}) {
  if (!permission) return { ok: false, code: 'PERMISSION_DENIED', message: 'You do not have permission to perform this receiving action.' };
  const nextState = transitions[receipt.state]?.[action];
  if (!nextState) return { ok: false, code: 'INVALID_STATE_TRANSITION', message: `A ${action} action is not available while this receipt is ${receipt.state}.` };
  return { ok: true, state: nextState };
}

export function traceabilityChain(receipt) {
  return { supplier: receipt.supplier, purchaseContract: receipt.purchaseContract, vehicle: receipt.vehicle, weighbridge: receipt.weighbridgeId, receipt: receipt.id, grading: receipt.gradingId, lot: receipt.lotId || null, inventoryMovement: receipt.inventoryMovementId || null };
}
