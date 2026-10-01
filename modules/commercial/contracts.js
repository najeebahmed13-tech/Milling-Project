export const CONTRACT_ACTIONS = {
  submit: 'submit', approve: 'approve', reject: 'reject', activate: 'activate', cancel: 'cancel', complete: 'complete'
};

const transitions = {
  DRAFT: { submit: 'SUBMITTED', cancel: 'CANCELLED' },
  SUBMITTED: { approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED' },
  APPROVED: { activate: 'ACTIVE', cancel: 'CANCELLED' },
  ACTIVE: { complete: 'COMPLETED', cancel: 'CANCELLED' },
  REJECTED: {}, CANCELLED: {}, COMPLETED: {}
};

export function transitionContract(contract, action, { permission = true, hasUtilization = false } = {}) {
  if (!permission) return { ok: false, code: 'PERMISSION_DENIED', message: 'You do not have permission to perform this contract action.' };
  if (action === 'cancel' && hasUtilization) return { ok: false, code: 'CONTRACT_IN_USE', message: 'This contract cannot be cancelled after utilization has started.' };
  const nextState = transitions[contract.state]?.[action];
  if (!nextState) return { ok: false, code: 'INVALID_STATE_TRANSITION', message: `A ${action} action is not available while this contract is ${contract.state}.` };
  return { ok: true, state: nextState };
}

export function validateContractDraft(draft) {
  const errors = {};
  if (!draft.partyId) errors.partyId = 'Select a customer or supplier.';
  if (!draft.material) errors.material = 'Select a material.';
  if (!draft.quantity || Number(draft.quantity) <= 0) errors.quantity = 'Contract quantity must be greater than zero.';
  if (!draft.uom) errors.uom = 'Select a unit of measure.';
  if (!draft.validFrom || !draft.validUntil) errors.validity = 'Enter both validity dates.';
  if (draft.validFrom && draft.validUntil && draft.validUntil < draft.validFrom) errors.validity = 'Valid until must be on or after valid from.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function quantitySummary(contract, allocations = []) {
  const contracted = Number(contract.quantity) || 0;
  const utilized = allocations.filter((allocation) => allocation.contractId === contract.id && allocation.status !== 'REVERSED').reduce((sum, allocation) => sum + Number(allocation.quantity || 0), 0);
  return { contracted, utilized, remaining: Math.max(0, contracted - utilized) };
}

export function isContractEligible(contract, date = new Date().toISOString().slice(0, 10)) {
  return contract.state === 'ACTIVE' && date >= contract.validFrom && date <= contract.validUntil;
}
