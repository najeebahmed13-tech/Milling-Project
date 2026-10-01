/**
 * ROCKEYE Private Core — Entitlement Engine
 * Tenant license quotas and module feature gating
 */

export const PLAN_LIMITS = {
  STANDARD: {
    maxMills: 1,
    maxCapacityMtPerHour: 45,
    allowedModules: ['masters', 'commercial', 'weighbridge', 'receiving', 'inventory']
  },
  ENTERPRISE: {
    maxMills: 5,
    maxCapacityMtPerHour: 120,
    allowedModules: ['masters', 'commercial', 'weighbridge', 'receiving', 'production', 'inventory', 'quality']
  },
  CONGLOMERATE: {
    maxMills: 999,
    maxCapacityMtPerHour: 9999,
    allowedModules: ['masters', 'commercial', 'weighbridge', 'receiving', 'production', 'inventory', 'quality', 'dispatch', 'analytics', 'audit']
  }
};

export function checkTenantEntitlement({ plan = 'ENTERPRISE', currentMillsCount = 1, requestedModule = 'production' }) {
  const tierConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.STANDARD;
  const isModuleAllowed = tierConfig.allowedModules.includes(requestedModule);
  const hasMillCapacity = currentMillsCount <= tierConfig.maxMills;

  return {
    plan,
    isEntitled: isModuleAllowed && hasMillCapacity,
    reasons: [
      ...(!isModuleAllowed ? [`Module '${requestedModule}' is not enabled in ${plan} plan`] : []),
      ...(!hasMillCapacity ? [`Mill limit (${tierConfig.maxMills}) reached for ${plan} plan`] : [])
    ]
  };
}

