import { ApplicationError, normalizeError } from '../shared/errors.js';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api/v1';

export async function apiRequest(path, { method = 'GET', body, signal, headers = {}, tenantContext } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      credentials: 'include',
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(tenantContext ? { 'X-Mill-Context': tenantContext } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ApplicationError({ code: payload?.code || `HTTP_${response.status}`, message: payload?.message || 'The server could not complete the request.', field: payload?.field, details: payload?.details, correlationId: payload?.correlationId });
    return payload;
  } catch (error) {
    throw normalizeError(error);
  } finally { clearTimeout(timeout); }
}
