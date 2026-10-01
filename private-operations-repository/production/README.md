# ROCKEYE Production Deployment & Environments

**Classification:** PRIVATE OPERATIONS REPOSITORY — CONFIDENTIAL  
**Owning Domain:** Operations / Site Reliability Engineering  
**Scope:** Production environment manifests, secrets management, process supervisors, and rollout controls  

## Contents

1. `production-env.template`: Environment variable baseline for air-gapped or VPC production deployments.
2. `rockeye.service`: Systemd service supervisor for production bare-metal or VM deployments with automated restart on failure.

