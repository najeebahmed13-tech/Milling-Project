# ROCKEYE Security Engine

**Classification:** PRIVATE CORE REPOSITORY — PROPRIETARY INTELLECTUAL PROPERTY  
**Owning Domain:** Platform / Cryptographic Security & Isolation  
**Scope:** Tamper-evident audit chain hashing, session tokens, and data isolation predicates  

## 1. Overview

The Security Engine enforces multi-tenant defense-in-depth:
1. **Audit Hash Chaining:** Creates SHA-256 tamper-evident merkle chain linkages across consecutive operational audit logs.
2. **Tenant Scoping Predicates:** Generates SQL isolation predicates (`WHERE tenant_id = ? AND mill_id = ?`) preventing accidental cross-tenant data leaks.
3. **Sensitive Field Redaction:** Filters authorization tokens, hashed passwords, and proprietary pricing algorithms from outbound responses.

