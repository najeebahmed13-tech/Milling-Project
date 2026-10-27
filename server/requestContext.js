const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export const DEMO_CONTEXT = Object.freeze({ tenantId: "demo-tenant", millId: "demo-mill", actorId: "demo-user" });

function readHeader(req, name) {
  const value = req.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function invalid(value) { return !value || !IDENTIFIER.test(value); }

export function resolveRequestContext(req, { allowDemoFallback = process.env.NODE_ENV !== "production" } = {}) {
  const tenantId = readHeader(req, "X-Tenant-Id") || (allowDemoFallback ? DEMO_CONTEXT.tenantId : "");
  const millId = readHeader(req, "X-Mill-Id") || (allowDemoFallback ? DEMO_CONTEXT.millId : "");
  const actorId = readHeader(req, "X-Actor-Id") || (allowDemoFallback ? DEMO_CONTEXT.actorId : "");
  if (invalid(tenantId) || invalid(millId) || invalid(actorId)) return { ok: false, code: "TENANT_CONTEXT_REQUIRED", message: "A valid tenant, mill and actor context is required." };
  return { ok: true, context: Object.freeze({ tenantId, millId, actorId }) };
}

export function attachRequestContext(req, res, next) {
  const result = resolveRequestContext(req);
  if (!result.ok) return res.status(401).json({ success: false, error: { code: result.code, message: result.message } });
  req.tenantContext = result.context;
  return next();
}

export function requestContext(req) { return req.tenantContext || DEMO_CONTEXT; }
