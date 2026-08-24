# AppForge Multi-Tenant Architecture & Security Model

## 1. Overview

AppForge operates as a sovereign, multi-tenant enterprise application factory and governance platform. Multi-tenancy is enforced through defense-in-depth security layers rather than relying solely on UI filtering.

---

## 2. Multi-Tenant Structural Hierarchy

```text
Platform (Super Admin)
   │
   ├── Tenant A
   │     ├── Users & Roles (Tenant Admin, Developer, Release Mgr, Auditor)
   │     ├── Applications & Schemas
   │     ├── Packages & Signed Manifests (ECDSA P-256)
   │     ├── Environments (DEV, TEST, PROD)
   │     ├── Public Keys (x_appforge_public_key)
   │     ├── Policies & Exceptions (APPFORGE_BASELINE)
   │     ├── Deployments & Isolated Mutex Locks
   │     └── Audit & Telemetry Streams
   │
   ├── Tenant B
   │     └── ...
   │
   └── Tenant C
         └── ...
```

---

## 3. Defense-in-Depth Isolation Model

| Layer | Enforcement Mechanism | Failure Response |
| :--- | :--- | :--- |
| **REST API / Ingestion** | `AppForgeTenantContext` server-side derivation from auth session | `TENANT_CONTEXT_INVALID` / `401/403` |
| **Service Layer** | `AppForgeTenantIsolationValidator` checks actor vs resource tenant | `CROSS_TENANT_ACCESS_DENIED` |
| **Database / GlideRecord** | Row-level `tenant_id` query constraints and security wrappers | `RESOURCE_NOT_FOUND` / empty result |
| **Async Queues & Workers** | Immutable `tenant_id` context serialization and worker sandbox | Zero context leakage |
| **Caching Layer** | Compound cache keys: `tenant_id:resource:id:version` | Cache misses / isolated domains |
| **Deployment Locks** | Scoped mutex keys: `tenant_id:environment` | No cross-tenant blocking |
| **Cryptographic Trust** | Scoped `x_appforge_public_key` registry + Enclave key providers | `ACCESS_DENIED` |
| **Export / Import** | Sanitizer strips all private keys, secrets, and other tenant data | Zero secret exposure |

---

## 4. Role Hierarchy & Privilege Separation

- **`PLATFORM_ADMIN`**: Global super-administrator capable of provisioning, suspending, and decommissioning tenants.
- **`TENANT_ADMIN`**: Tenant-scoped administrator managing applications, users, environments, and policies. **Strictly prohibited from escalating to `PLATFORM_ADMIN` or accessing other tenants.**
- **`TENANT_DEVELOPER`**: Creates schemas, views, business logic, and API definitions within the tenant boundary.
- **`TENANT_RELEASE_MANAGER`**: Builds packages and promotes deployments within tenant environments.
- **`TENANT_SECURITY_APPROVER`**: Approves production deployment gates and cross-tenant trust relationships.
- **`TENANT_VIEWER`**: Read-only observability and compliance dashboard access.

---

## 5. Cross-Tenant Trust & Governed Federation

Cross-tenant operations default to **`DENY`**. An explicit, auditable trust relationship must exist:
- **`source_tenant`**: Publishing tenant.
- **`target_tenant`**: Consuming tenant.
- **`trusted_key`**: Fingerprint of authorized signing key.
- **`allowed_packages`**: Explicit whitelist of package identifiers.
- **`status`**: Must be `ACTIVE` (revocation immediately aborts deployments with `TRUST_REVOKED`).

---

## 6. Noisy-Neighbor Controls & Disaster Recovery

- **Fair Scheduling**: High-volume operations (such as 1,000,000-record migrations) are capped at 50% worker allocation to guarantee zero latency degradation for concurrent tenant deployments.
- **Disaster Recovery Blast Radius**: Tenant-scoped backup and restore operations reconstruct application schemas and metadata without affecting or restarting sibling tenants.
