export const clientRequestContext = Object.freeze({
  tenantId: import.meta.env.VITE_TENANT_ID || "demo-tenant",
  millId: import.meta.env.VITE_MILL_ID || "demo-mill",
  actorId: import.meta.env.VITE_ACTOR_ID || "demo-user",
});

export function contextHeaders(extra = {}) {
  return {
    "X-Tenant-Id": clientRequestContext.tenantId,
    "X-Mill-Id": clientRequestContext.millId,
    "X-Actor-Id": clientRequestContext.actorId,
    ...extra,
  };
}
