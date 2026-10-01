import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateSupplierRiskScore, evaluateCustomerExposure } from '../private-core-repositories/risk-engine/index.js';
import { calculateSettlementPrice } from '../private-core-repositories/pricing-engine/index.js';
import { evaluateApprovalPolicy, evaluateWeighbridgeTolerance } from '../private-core-repositories/policy-engine/index.js';
import { checkTenantEntitlement } from '../private-core-repositories/entitlement-engine/index.js';
import { generateAuditHash, buildTenantScopePredicate, sanitizeOutboundPayload } from '../private-core-repositories/security-engine/index.js';

test('risk engine calculates supplier and customer exposure', () => {
  const supplierRisk = calculateSupplierRiskScore({
    totalDeliveries: 10,
    rejectedTonnage: 15,
    acceptedTonnage: 85,
    averageRipenessScore: 75
  });
  assert.equal(supplierRisk.tier === 'LOW' || supplierRisk.tier === 'MEDIUM' || supplierRisk.tier === 'HIGH', true);

  const exposure = evaluateCustomerExposure({ creditLimit: 50000, outstandingBalance: 40000, pendingDispatchValue: 15000 });
  assert.equal(exposure.isExceeded, true);
  assert.equal(exposure.canAuthorizeDispatch, false);
});

test('pricing engine computes FFA and moisture deductions', () => {
  const pricing = calculateSettlementPrice({
    baseContractPrice: 3800,
    ffaPercentage: 5.4, // 4 points above 5.0%
    moisturePercentage: 0.25,
    dirtPercentage: 0.1 // combined 0.35% > 0.25%
  });
  assert.equal(pricing.hasQualityDeductions, true);
  assert.equal(pricing.finalSettlementPrice < 3800, true);
});

test('policy engine enforces multi-step approvals and weighbridge tolerance', () => {
  const approval = evaluateApprovalPolicy({ documentType: 'PURCHASE_CONTRACT', totalAmount: 250000, riskTier: 'HIGH' });
  assert.equal(approval.approvalRequired, true);
  assert.equal(approval.steps.some(s => s.role === 'FINANCE_DIRECTOR'), true);

  const tareCheck = evaluateWeighbridgeTolerance({ recordedTareKg: 10500, registeredVehicleTareKg: 10000, tolerancePercent: 2.0 });
  assert.equal(tareCheck.isWithinTolerance, false);
  assert.equal(tareCheck.requiresSupervisorOverride, true);
});

test('entitlement engine gates modules and limits capacity', () => {
  const standardPlan = checkTenantEntitlement({ plan: 'STANDARD', currentMillsCount: 1, requestedModule: 'production' });
  assert.equal(standardPlan.isEntitled, false);

  const enterprisePlan = checkTenantEntitlement({ plan: 'ENTERPRISE', currentMillsCount: 2, requestedModule: 'production' });
  assert.equal(enterprisePlan.isEntitled, true);
});

test('security engine creates audit hash chain and redacts sensitive data', () => {
  const hash1 = generateAuditHash({ previousHash: 'GENESIS', record: { action: 'weigh' } });
  const hash2 = generateAuditHash({ previousHash: hash1, record: { action: 'confirm' } });
  assert.notEqual(hash1, hash2);

  const predicate = buildTenantScopePredicate({ tenantId: 't1', millId: 'm1' });
  assert.equal(predicate.clause, 'tenant_id = ? AND mill_id = ?');

  const sanitized = sanitizeOutboundPayload({ username: 'admin', password: 'secretPassword123' });
  assert.equal(sanitized.password, '[REDACTED]');
});

