import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFfbLotNumber, normalizeFfbDisposition } from '../server/ffbReceiptDomain.js';

test('FFB disposition defaults the accepted quantity to authoritative net weight', () => {
  assert.deepEqual(normalizeFfbDisposition(18.425), { valid: true, accepted: 18.425, rejected: 0 });
});

test('FFB disposition must reconcile accepted and rejected quantities', () => {
  const result = normalizeFfbDisposition(18.425, 18, 0);
  assert.equal(result.valid, false);
  assert.equal(result.code, 'DISPOSITION_WEIGHT_MISMATCH');
});

test('FFB lot numbers are stable and receipt-specific', () => {
  assert.equal(buildFfbLotNumber(42, '2026-10-27T08:00:00.000Z'), 'FFB-20261027-000042');
});
