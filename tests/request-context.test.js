import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_CONTEXT, resolveRequestContext } from '../server/requestContext.js';

function request(headers = {}) { return { get(name) { return headers[name] || headers[name.toLowerCase()] || ''; } }; }

test('request context uses the explicit tenant, mill and actor scope', () => {
  const result = resolveRequestContext(request({ 'X-Tenant-Id': 'tenant-a', 'X-Mill-Id': 'mill-7', 'X-Actor-Id': 'user-4' }), { allowDemoFallback: false });
  assert.deepEqual(result, { ok: true, context: { tenantId: 'tenant-a', millId: 'mill-7', actorId: 'user-4' } });
});

test('request context rejects missing production scope instead of guessing a tenant', () => {
  const result = resolveRequestContext(request(), { allowDemoFallback: false });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'TENANT_CONTEXT_REQUIRED');
});

test('request context rejects malformed identifiers', () => {
  const result = resolveRequestContext(request({ 'X-Tenant-Id': 'tenant/a', 'X-Mill-Id': 'mill-1', 'X-Actor-Id': 'user-1' }), { allowDemoFallback: false });
  assert.equal(result.ok, false);
});

test('local development remains compatible with the seeded demo context', () => {
  assert.deepEqual(resolveRequestContext(request(), { allowDemoFallback: true }).context, DEMO_CONTEXT);
});
