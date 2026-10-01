import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadContract(filename) {
  const filePath = path.join(__dirname, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export const API_CONTRACTS = loadContract('api-contracts.json');
export const ERROR_CONTRACTS = loadContract('error-contracts.json');
export const EVENT_CONTRACTS = loadContract('event-contracts.json');

/**
 * Validates that an error payload conforms to standard error envelope contract.
 */
export function validateErrorEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') return false;
  if (envelope.success !== false) return false;
  if (!envelope.error || typeof envelope.error !== 'object') return false;
  if (typeof envelope.error.code !== 'string' || typeof envelope.error.message !== 'string') return false;
  return true;
}

/**
 * Validates that an event payload conforms to standard domain event contract.
 */
export function validateEventEnvelope(event) {
  if (!event || typeof event !== 'object') return false;
  const required = ['eventId', 'eventName', 'tenantId', 'millId', 'entityType', 'entityId', 'timestamp', 'payload'];
  for (const field of required) {
    if (event[field] === undefined || event[field] === null) return false;
  }
  return true;
}

