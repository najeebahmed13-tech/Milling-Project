# ROCKEYE Pricing Engine

**Classification:** PRIVATE CORE REPOSITORY — PROPRIETARY INTELLECTUAL PROPERTY  
**Owning Domain:** Commercial / Pricing Operations  
**Scope:** Dynamic formula pricing, index-linked contracts, and quality penalty/bonus matrices  

## 1. Overview

The Pricing Engine automates settlement and dispatch billing based on:
1. **Index-Linked Formula Pricing:** Linking contract pricing to market spot references (e.g. MPOB Daily CPO/PK index).
2. **Quality Penalty & Bonus Matrix:**
   - Free Fatty Acids (FFA): Baseline 5.0%, penalty calculated per 0.1% exceedance.
   - Moisture & Dirt (M&D): Standard 0.25% threshold, deduction scaled to net delivered weight.
   - Fruitlet Ripeness: Graded bonus/malus applied to raw FFB deliveries.

