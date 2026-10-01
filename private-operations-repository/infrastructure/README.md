# ROCKEYE Infrastructure Configuration

**Classification:** PRIVATE OPERATIONS REPOSITORY — CONFIDENTIAL  
**Owning Domain:** Operations / Cloud & DevOps  
**Scope:** Infrastructure-as-code, container orchestration, high availability, and network isolation  

## Components

- `docker-compose.prod.yml`: Multi-container production deployment specification (App server, Vite static CDN proxy, PostgreSQL primary-replica cluster, Redis queue worker).
- Database Clustering: Transactional master with read replicas for analytical queries and dashboards.
- Reverse Proxy: NGINX / Cloudflare edge with TLS 1.3 termination, rate limiting, and DDoS mitigation.

