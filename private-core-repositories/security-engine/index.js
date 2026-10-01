import crypto from 'node:crypto';

/**
 * ROCKEYE Private Core — Security Engine
 * Cryptographic audit chaining and tenant isolation guards
 */

export function generateAuditHash({ previousHash = 'GENESIS', record = {} }) {
  const content = `${previousHash}:${JSON.stringify(record)}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function buildTenantScopePredicate(tenantContext) {
  if (!tenantContext || !tenantContext.tenantId) {
    throw new Error('SECURITY_VIOLATION: Missing tenant context');
  }

  const params = [tenantContext.tenantId];
  let clause = 'tenant_id = ?';

  if (tenantContext.millId) {
    clause += ' AND mill_id = ?';
    params.push(tenantContext.millId);
  }

  return { clause, params };
}

export function sanitizeOutboundPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const clone = { ...payload };
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'privateKey'];
  
  for (const key of sensitiveKeys) {
    if (key in clone) {
      clone[key] = '[REDACTED]';
    }
  }
  return clone;
}

