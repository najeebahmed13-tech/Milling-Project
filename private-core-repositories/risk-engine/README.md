# ROCKEYE Risk Engine

**Classification:** PRIVATE CORE REPOSITORY — PROPRIETARY INTELLECTUAL PROPERTY  
**Owning Domain:** Platform / Risk & Credit Governance  
**Scope:** Supplier delivery risk, customer credit exposure, and quality deviation scoring  

## 1. Overview

The Risk Engine evaluates multi-dimensional operational risks in palm oil supply chains, providing real-time scoring for:
1. **Supplier Reliability & Default Risk:** Calculated based on historical fulfillment variance, rejected tonnage ratio, and delivery delay frequency.
2. **Quality Variance Risk (SQVI):** Weighted scoring of unripeness, dirt, moisture, and empty fruit bunches (EFB) over rolling delivery windows.
3. **Customer Credit Exposure:** Real-time checking against credit ceilings, unbilled weighbridge despatches, and overdue payment aging.

## 2. API / Interface

```javascript
import { calculateSupplierRiskScore, evaluateCustomerExposure } from './index.js';

const score = calculateSupplierRiskScore({
  totalDeliveries: 45,
  rejectedTonnage: 12.5,
  acceptedTonnage: 450.0,
  averageRipenessScore: 88.5
});
```

