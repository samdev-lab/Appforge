# AppForge Template Marketplace & Application Installer Architecture

**Release:** v0.19.0  
**Status:** Certified Enterprise Production  

---

## 🏛️ End-to-End Control Plane Architecture

```text
                  APPFORGE CONTROL PLANE
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 Template Marketplace   Customer CRM      Entitlements & Pricing
 (Certified v0.19)      (x_appforge_cust) (Subscription & Seats)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
          AppForge Template Installer Engine
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       Prerequisite   Cryptographic   Four-Eyes Policy Gate
       Dependencies    Signatures        (POL-SEC-006)
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
               5-Layer Application Compilation
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
   ServiceNow Navigation         Physical Relational Tables
   (sys_app_application)       (sys_db_object & sys_dictionary)
             │                             │
             └──────────────┬──────────────┘
                            ▼
                 End-User Consumption
          (Native ServiceNow UI — Zero AppForge Overhead)
```

---

## 🔒 Security & Governance Guarantees

1. **Decoupled User Runtime:** End users consume the generated applications directly from the ServiceNow left filter navigator without requiring access to AppForge developer workspaces.
2. **Four-Eyes Separation of Duties (`POL-SEC-006`):** Requesters cannot approve production deployments or decommission requests.
3. **Traceability:** Full trace from `Customer -> Tenant -> Template -> Version -> Package -> Release -> Deployment -> Application`.
4. **Governed Decommissioning:** Prohibits destructive one-click deletion; requires pre-decommission backup snapshot and audit certificate generation.
