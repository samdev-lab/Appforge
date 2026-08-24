# AppForge Platform Super Administrator Guide

## 1. Platform Super Admin Role Scope
The `PLATFORM_ADMIN` manages the global SaaS control plane, tenant provisioning, global security baselines, subscription tier limits, and tenant offboarding.

---

## 2. Tenant Provisioning
```javascript
var cp = new AppForgeMultiTenantControlPlane();
var res = cp.provisionTenant({
    tenant_id: 'tenant_acme',
    name: 'Acme Corporation',
    tier: 'ENTERPRISE',
    contact_email: 'admin@acme.com'
}, 'platform_super_admin');
```

---

## 3. Suspending & Reactivating Tenants
- **Suspension:** Immediately terminates active deployment promotions and API mutations for the tenant.
- **Reactivation:** Restores full tenant operations without metadata loss.

---

## 4. Governed Deletion & Decommissioning
- Requires Four-Eyes approval (requester != approver).
- Asserts zero active deployments or mutex locks before purge.
- Generates a cryptographic SHA-256 evidence certificate.
