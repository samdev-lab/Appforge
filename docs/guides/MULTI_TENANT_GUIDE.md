# AppForge Multi-Tenant Administration & Governance Guide

## 1. Introduction
This guide defines operational procedures for provisioning, governing, securing, and offboarding enterprise tenants on AppForge.

---

## 2. Tenant Provisioning & Tiers

| Tier | Max Apps | Max Envs | Max Deploys/Month | Max Records | Max User Seats |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **COMMUNITY** | 5 | 2 | 20 | 10,000 | 10 |
| **ENTERPRISE** | 50 | 10 | 500 | 1,000,000 | 250 |
| **UNLIMITED** | Uncapped | Uncapped | Uncapped | Uncapped | Uncapped |

---

## 3. Tenant Lifecycle Transitions

1. **`PENDING`**: Tenant initialized, awaiting configuration.
2. **`ACTIVE`**: Fully operational tenant with full mutation and deployment capabilities.
3. **`SUSPENDED`**: Temporarily frozen (e.g. for security audit or billing). Application mutation and deployments blocked.
4. **`DELETION_REQUESTED`**: Deletion initiated; requires Four-Eyes approval.
5. **`DELETED`**: Cryptographically purged; issued immutable SHA-256 evidence certificate.

---

## 4. Quota Monitoring & Metering

Real-time quota monitoring prevents resource starvation:
- Usage is metered on every application creation, schema addition, and deployment run.
- Attempts exceeding tier limits are rejected with `QUOTA_EXCEEDED` and logged in tenant audit trails.
