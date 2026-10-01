# Runbook: Mill Disaster Recovery & Database Failover

## 1. Trigger Conditions
- Database primary node unreachability exceeding 60 seconds.
- Storage corruption or ransomware compromise.

## 2. Emergency Steps
1. **Quarantine Primary:** Prevent split-brain by terminating incoming writes at the load balancer.
2. **Promote Standby Replica:** Execute promotion script:
   ```bash
   pg_ctl promote -D /var/lib/postgresql/data
   ```
3. **Switch DNS / Virtual IP:** Point `db-primary.rockeye.internal` to the promoted standby.
4. **Offline Weighbridge Fallback:** Instruct weighbridge operators to activate cached local SQLite buffering mode if WAN connectivity is severed.
5. **Verify Data Integrity:** Run consistency check on last recorded weighbridge ticket vs receipts.

