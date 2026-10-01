# ROCKEYE ERP + MES — Platform Architecture & Folder Structure

# Milling-Project
This repository is a modular, configurable, and scalable commercial ERP + MES platform for palm oil organizations of every scale (single mills, multi-mill operators, and multi-company conglomerates).

---

## Repository Decomposition & Topology

The platform architecture is partitioned into three distinct repository tiers to enforce domain isolation, protect proprietary intellectual property, and govern operational infrastructure:

```
PUBLIC / MAIN REPOSITORY
├── apps/
│   ├── web/                    # Browser SPA application shell & navigation
│   └── api/                    # Express modular backend API service
├── modules/
│   ├── commercial/             # Customers, Suppliers, Sales & Purchase Contracts
│   ├── receiving/              # Inbound Weighbridge, FFB Grading, Rejection Reconciliation
│   ├── production/             # MES Line/Station Routing, Operations, Production Runs
│   ├── inventory/              # Item master, Storage Units, Balances, Movements
│   ├── masters/                # Logistics, Numbering Sequences, Master Data Center
│   └── security/               # Client-side permission helpers & presentation guards
├── packages/
│   ├── shared/                 # Formatters, status tones, normalized errors
│   ├── api-client/             # Centralized fetch wrapper & error handling
│   ├── config/                 # Master data definitions & field schemas
│   └── security/               # Role & permission evaluation guards
├── core/
│   └── contracts/              # Explicit API schemas, SQL DDL, event schemas, error envelopes
├── tests/                      # Automated unit, integration, contract, and structure tests
└── docs/
    └── public/                 # Public architectural guides, data model, coding standards


PRIVATE CORE REPOSITORIES
├── risk-engine/                # Supplier reliability index & customer credit exposure engine
├── pricing-engine/             # MPOB index-linked pricing & FFA/M&D penalty-bonus matrix
├── policy-engine/              # Multi-tier approval matrices & weighbridge tolerance policies
├── entitlement-engine/         # Multi-tenant licensing, plan tiers, and mill capacity quotas
└── security-engine/            # Cryptographic audit hash chaining & tenant isolation guards


PRIVATE OPERATIONS REPOSITORY
├── infrastructure/             # Docker Compose prod manifests, database clustering specs
├── production/                 # Production environment templates & systemd service units
├── security-policies/          # SOC 2 controls, data classification, and network rules
├── runbooks/                   # Mill disaster recovery, DB failover, zero-downtime migration
└── restricted-docs/            # Proprietary mass-balance models & internal threat modeling
```

---

## Disciplined Vibe Coding Pipeline

All engineering contributions must strictly advance through the 9-stage engineering pipeline:

```
Requirement → Contract → Architecture boundary → Implementation → Tests → Static checks → Security checks → Human review → Merge
```

- **Engineering Rules**: Maintained in [AGENTS.md](AGENTS.md)
- **Detailed Standards**: Maintained in [docs/coding-standards.md](docs/coding-standards.md) (and [docs/public/coding-standards.md](docs/public/coding-standards.md))

---

## Verification & Build Commands

- **Run Automated Test Suite**:
  ```bash
  npm test
  ```
- **Compile Production Bundle**:
  ```bash
  npm run build
  ```
- **Start Development Server**:
  ```bash
  npm run dev
  ```

