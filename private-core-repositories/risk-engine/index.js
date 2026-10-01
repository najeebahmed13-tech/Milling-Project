/**
 * ROCKEYE Private Core — Risk Engine
 * Proprietary supplier reliability and customer credit scoring
 */

export function calculateSupplierRiskScore({
  totalDeliveries = 1,
  rejectedTonnage = 0,
  acceptedTonnage = 0,
  averageRipenessScore = 100
}) {
  const totalTonnage = acceptedTonnage + rejectedTonnage;
  const rejectRatio = totalTonnage > 0 ? (rejectedTonnage / totalTonnage) : 0;
  
  // Base risk 0-100 (lower is better, >50 triggers approval hold)
  const qualityPenalty = Math.max(0, 100 - averageRipenessScore) * 0.4;
  const rejectionPenalty = Math.min(50, rejectRatio * 200);
  const deliveryReliabilityBonus = Math.min(10, totalDeliveries * 0.2);

  const riskScore = Math.max(0, Math.min(100, (rejectionPenalty + qualityPenalty - deliveryReliabilityBonus)));
  
  return {
    score: Number(riskScore.toFixed(2)),
    tier: riskScore < 20 ? 'LOW' : riskScore < 50 ? 'MEDIUM' : 'HIGH',
    requiresApproval: riskScore >= 50
  };
}

export function evaluateCustomerExposure({ creditLimit = 0, outstandingBalance = 0, pendingDispatchValue = 0 }) {
  const totalExposure = outstandingBalance + pendingDispatchValue;
  const utilization = creditLimit > 0 ? (totalExposure / creditLimit) : 1;

  return {
    creditLimit,
    totalExposure,
    utilizationPercent: Number((utilization * 100).toFixed(2)),
    isExceeded: totalExposure > creditLimit,
    canAuthorizeDispatch: totalExposure <= creditLimit
  };
}

