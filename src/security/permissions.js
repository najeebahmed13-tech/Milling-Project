export const demoUserContext = {
  userId: 'demo-user-sean',
  displayName: 'Sean Shapiro',
  tenantId: 'demo-tenant',
  companyId: 'demo-company',
  millId: 'demo-mill',
  permissions: new Set(['user.read', 'customer.read', 'supplier.read', 'sales.contract.read', 'sales.contract.create', 'sales.contract.update', 'sales.contract.submit', 'sales.contract.approve', 'sales.contract.cancel', 'purchase.contract.read', 'purchase.contract.create', 'purchase.contract.update', 'purchase.contract.submit', 'purchase.contract.approve', 'purchase.contract.cancel', 'sales.delivery_order.read', 'sales.delivery_order.create', 'sales.delivery_order.update', 'ffb.receipt.read', 'ffb.receipt.create', 'weighbridge.read', 'weighbridge.capture', 'ffb.grading.perform', 'finance.read', 'production.read', 'production.manage', 'production.run.start', 'production.stage.execute', 'production.quality.capture', 'production.run.complete', 'inventory.read', 'quality.read', 'dispatch.read', 'configuration.read', 'configuration.manage'])
};

export function can(permission, context = demoUserContext) {
  return !permission || context.permissions.has(permission);
}
