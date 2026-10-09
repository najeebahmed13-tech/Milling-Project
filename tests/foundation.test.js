import test from 'node:test';
import assert from 'node:assert/strict';
import { formatQuantity, formatPercentage, statusTone } from '../src/shared/formatters.js';
import { ApplicationError, normalizeError } from '../src/shared/errors.js';
import { getVisibleNavigation } from '../src/app/navigation.js';
import { can } from '../src/security/permissions.js';
import { masterDefinitions, getMasterDefinition } from '../src/config/masterData.js';
import { transitionContract, validateContractDraft, quantitySummary, isContractEligible } from '../src/commercial/contracts.js';
import { calculateNetWeight, validateDisposition, transitionReceipt, traceabilityChain, validateFfbReceiveForm } from '../src/receiving/receiving.js';

test('quantity and percentage formatters produce readable values', () => {
  assert.equal(formatQuantity(24.35, 't'), '24.35 t');
  assert.equal(formatPercentage(82.44), '82.4%');
});

test('status tone maps semantic states without relying on CSS', () => {
  assert.equal(statusTone('Partial reject'), 'danger');
  assert.equal(statusTone('Awaiting approval'), 'warning');
  assert.equal(statusTone('Completed'), 'success');
});

test('navigation and permission helpers are deny-by-default', () => {
  assert.equal(getVisibleNavigation([{ id: 'a', permission: 'a.read' }, { id: 'b', permission: null }], new Set(['b.read'])).length, 1);
  assert.equal(can('secret.read', { permissions: new Set() }), false);
});

test('application errors normalize transport failures', () => {
  const error = normalizeError(new Error('socket closed'));
  assert.equal(error instanceof ApplicationError, true);
  assert.equal(error.code, 'NETWORK_ERROR');
});

test('master definitions have explicit keys, fields and scoped lifecycle controls', () => {
  assert.equal(masterDefinitions.length >= 10, true);
  assert.equal(masterDefinitions.every((definition) => definition.key && definition.title && definition.fields.length > 0), true);
  assert.equal(getMasterDefinition('materials').fields.some((field) => field.key === 'baseUom'), true);
  assert.equal(getMasterDefinition('qualityParameters').fields.some((field) => field.key === 'dataType'), true);
});

test('contract transitions are explicit and invalid actions are rejected', () => {
  const draft = { id: 'SC-1', state: 'DRAFT' };
  assert.deepEqual(transitionContract(draft, 'submit'), { ok: true, state: 'SUBMITTED' });
  assert.equal(transitionContract(draft, 'approve').code, 'INVALID_STATE_TRANSITION');
  assert.equal(transitionContract({ ...draft, state: 'ACTIVE' }, 'cancel', { hasUtilization: true }).code, 'CONTRACT_IN_USE');
});

test('contract draft validation and utilization summary protect quantity integrity', () => {
  assert.equal(validateContractDraft({}).valid, false);
  const contract = { id: 'PC-1', quantity: 100, state: 'ACTIVE', validFrom: '2026-01-01', validUntil: '2026-12-31' };
  assert.deepEqual(quantitySummary(contract, [{ contractId: 'PC-1', quantity: 30, status: 'POSTED' }]), { contracted: 100, utilized: 30, remaining: 70 });
  assert.equal(isContractEligible(contract, '2026-09-30'), true);
});

test('weighbridge calculates authoritative net weight in either direction', () => {
  assert.deepEqual(calculateNetWeight(32.45, 12.18, 'GROSS'), { valid: true, gross: 32.45, tare: 12.18, net: 20.27 });
  assert.deepEqual(calculateNetWeight(12.18, 32.45, 'TARE'), { valid: true, gross: 32.45, tare: 12.18, net: 20.27 });
  assert.equal(calculateNetWeight(10, 12, 'GROSS').code, 'INVALID_NET_WEIGHT');
});

test('FFB disposition must reconcile to authoritative net weight', () => {
  assert.equal(validateDisposition(20.27, 19.5, 0.77).valid, true);
  assert.equal(validateDisposition(20.27, 19, 0.77).code, 'DISPOSITION_MISMATCH');
});

test('receipt state transitions and genealogy chain are explicit', () => {
  assert.deepEqual(transitionReceipt({ state: 'GRADING' }, 'completeGrading'), { ok: true, state: 'READY_TO_POST' });
  assert.equal(transitionReceipt({ state: 'DRAFT' }, 'post').code, 'INVALID_STATE_TRANSITION');
  assert.equal(traceabilityChain({ supplier: 'Estate', purchaseContract: 'PC-1', vehicle: 'JQK 4812', weighbridgeId: 'WB-1', id: 'FFBR-1', gradingId: 'GR-1' }).lot, null);
});

test('FFB receive form enforces required master selections and optional declared quantity', () => {
  assert.equal(validateFfbReceiveForm({ driverName: 'A', vehicleNo: 'JQK 4812', supplier: 'Estate', item: 'FFB', grossWeight: '20.250' }).valid, true);
  assert.equal(validateFfbReceiveForm({ driverName: 'A', vehicleNo: 'JQK 4812', supplier: 'Estate', item: '', grossWeight: '20.250' }).code, 'INVALID_RECEIVING');
  assert.equal(validateFfbReceiveForm({ driverName: 'A', vehicleNo: 'JQK 4812', supplier: 'Estate', item: 'FFB', grossWeight: '20.250', supplierDeclaredQty: '-1' }).code, 'INVALID_DECLARED_QTY');
});
