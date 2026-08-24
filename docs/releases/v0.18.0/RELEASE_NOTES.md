# AppForge v0.18.0 Release Notes

**Release Date:** August 24, 2026  
**Platform Version:** `v0.18.0`  
**Certified Commit:** `7872137`  
**Target Instance:** `dev280961.service-now.com` (WashingtonDC, `x_appforge`)  
**Grand Automated Test Suite:** **1,310 / 1,310 PASSED (100% Green)**  
**Certification Status:** **PRODUCTION CERTIFIED**

---

## 1. What's New in v0.18.0

### Multi-Tenant Enterprise Control Plane
* **Strict Hierarchy:** Platform $\rightarrow$ Tenant $\rightarrow$ [Users, Applications, Packages, Environments, Keys, Policies, Deployments, Audit].
* **Server-Side Tenant Context:** `AppForgeTenantContext` derives tenant identity from authenticated session, blocking IDOR and header spoofing.
* **Role Separation:** Strict enforcement that `TENANT_ADMIN != PLATFORM_ADMIN`, preventing privilege escalation.
* **Resource Quotas & Metering:** Multi-tier subscription quota enforcement (`COMMUNITY`, `ENTERPRISE`, `UNLIMITED`) with real-time metering.
* **Cross-Tenant Trust Fabric:** Scoped, auditable package trust defaulting to `DENY`, with instantaneous revocation (`TRUST_REVOKED`).
* **Sovereign Export/Import & Decommissioning:** Sanitizes private keys from exports; Four-Eyes governed deletion with cryptographic SHA-256 evidence certificates.

---

## 2. Certified Operational Baselines
* **Instance Compatibility:** ServiceNow WashingtonDC release verified.
* **Package Integrity:** Asymmetric ECDSA (NIST P-256) / SHA-256 signatures with Public Key Registry lookup.
* **Migration Capacity:** 1,000 to 500,000 records safely processed in chunks of 500.
* **Resilience:** 13 lifecycle failure injection points verified with zero orphan metadata and zero dangling locks.
