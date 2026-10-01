/**
 * ROCKEYE Private Core — Policy Engine
 * Multi-tier approval routing and operational threshold evaluation
 */

export function evaluateApprovalPolicy({
  documentType = 'PURCHASE_CONTRACT',
  totalAmount = 0,
  riskTier = 'LOW',
  hasQualityOverride = false
}) {
  const steps = [];

  // Step 1: Standard Operational Level
  steps.push({ stepNumber: 1, role: 'MILL_MANAGER', required: true });

  // Step 2: Commercial Finance Approval for large transactions
  if (totalAmount > 100000 || riskTier === 'HIGH') {
    steps.push({ stepNumber: 2, role: 'FINANCE_DIRECTOR', required: true });
  }

  // Step 3: Executive Committee for high-risk / overriding transactions
  if (totalAmount > 500000 || hasQualityOverride) {
    steps.push({ stepNumber: 3, role: 'EXECUTIVE_COMMITTEE', required: true });
  }

  return {
    documentType,
    approvalRequired: steps.length > 1,
    steps,
    totalSteps: steps.length
  };
}

export function evaluateWeighbridgeTolerance({ recordedTareKg = 0, registeredVehicleTareKg = 0, tolerancePercent = 2.0 }) {
  if (registeredVehicleTareKg <= 0) {
    return { isWithinTolerance: true, deviationPercent: 0, requiresSupervisorOverride: false };
  }

  const deviationKg = Math.abs(recordedTareKg - registeredVehicleTareKg);
  const deviationPercent = (deviationKg / registeredVehicleTareKg) * 100;
  const isWithinTolerance = deviationPercent <= tolerancePercent;

  return {
    isWithinTolerance,
    deviationPercent: Number(deviationPercent.toFixed(2)),
    requiresSupervisorOverride: !isWithinTolerance
  };
}

