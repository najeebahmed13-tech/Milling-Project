import test from 'node:test';
import assert from 'node:assert/strict';
import {
  API_CONTRACTS,
  ERROR_CONTRACTS,
  EVENT_CONTRACTS,
  validateErrorEnvelope,
  validateEventEnvelope
} from '../core/contracts/contracts.js';

test('core contracts load and expose defined schemas', () => {
  assert.equal(typeof API_CONTRACTS.endpoints, 'object');
  assert.equal(typeof API_CONTRACTS.endpoints.ffbReceipts, 'object');
  assert.equal(typeof API_CONTRACTS.endpoints.weighbridgeTickets, 'object');
  assert.equal(typeof API_CONTRACTS.endpoints.productionRuns, 'object');

  assert.equal(typeof ERROR_CONTRACTS.standardErrorCodes, 'object');
  assert.equal(typeof ERROR_CONTRACTS.standardErrorCodes.TENANT_MISMATCH, 'string');

  assert.equal(Array.isArray(EVENT_CONTRACTS.events), true);
  assert.equal(EVENT_CONTRACTS.events.includes('ffb.receipt.posted'), true);
});

test('contract validator functions enforce schemas', () => {
  const validError = {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message: 'Missing parameter'
    }
  };
  assert.equal(validateErrorEnvelope(validError), true);
  assert.equal(validateErrorEnvelope({ success: true }), false);

  const validEvent = {
    eventId: 'evt-123',
    eventName: 'ffb.receipt.posted',
    tenantId: 'tenant-1',
    millId: 'mill-1',
    entityType: 'FFB_RECEIPT',
    entityId: 'rcpt-001',
    timestamp: new Date().toISOString(),
    payload: { netWeight: 25.5 }
  };
  assert.equal(validateEventEnvelope(validEvent), true);
  assert.equal(validateEventEnvelope({ eventId: 'evt-123' }), false);
});

