# AppForge Template Catalog Architecture

**Version:** v0.19.0  
**Status:** Certified Production  

---

## 🏛️ System Architecture Overview

The AppForge Template Catalog provides a decoupled marketplace-style installation pipeline that converts 5-layer declarative application templates into native, runtime-independent ServiceNow applications:

```text
                  APPFORGE CONTROL PLANE
                            │
               ┌────────────┴────────────┐
               │                         │
        Template Catalog          AppForge Studio
        (Certified v0.19)         (Release Governance)
               │                         │
               └────────────┬────────────┘
                            │
                            ▼
          AppForge Template Installation Service
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
         Data Layer    Logic Layer    Security (POL-SEC-006)
             │              │              │
             └──────────────┬──────────────┘
                            ▼
               Native ServiceNow Runtime
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
   Application Menus & Modules      Physical Tables & ACLs
   (sys_app_application)          (sys_db_object)
             │                             │
             └──────────────┬──────────────┘
                            ▼
                  End User Consumption
          (Native ServiceNow UI - No AppForge UI required)
```

---

## 🔒 Security & Tenant Separation

1. **Role-Based Isolation:**
   * **AppForge Admin (`x_1805046_app_fo_0.admin`):** Manages catalog templates, tenant licenses, and releases.
   * **End Users:** Interact exclusively with native ServiceNow modules and records without requiring access to AppForge control plane.
2. **Cryptographic Package Verification:**
   * All templates are verified for signature integrity (HMAC-SHA256 / ECDSA) prior to instance insertion.
3. **Idempotency & Rollback:**
   * Duplicate installation attempts execute idempotent replay without table corruption.
   * Installation errors trigger compensating rollback restoring clean schema state.
