# AppForge Administrator Guide

This guide covers enterprise configuration, security controls, role assignments, and governance for ServiceNow platform administrators.

---

## 🛡️ Security & Roles

AppForge enforces strict role-based access control (RBAC):
* **`x_1805046_app_fo_0.admin`**: Full administrative access to all AppForge configuration, environments, and policies.
* **`x_1805046_app_fo_0.user`**: Application creation, editing, and deployment request capabilities.
* **`sec_approver`**: Four-Eyes production release authorization role (`POL-SEC-006`).

---

## ⚙️ Administration Sections

From the **Health & Admin** tab, administrators can manage:
1. **General:** Instance URLs and active application scope (`x_1805046_app_fo_0`).
2. **Security:** Four-Eyes policy enforcement thresholds and signature requirements.
3. **Environments:** Managed instance list (`DEV`, `TEST`, `STAGE`, `PROD`).
4. **Audit Logs:** Immutable audit history of all application releases and approvals.
5. **System Health:** 1-click diagnostic scans across physical tables and REST endpoints.

---

## 🚀 Automated Deployment Pipeline
AppForge manages deployment safely via:
1. Preflight schema verification (preventing dictionary column merge collisions).
2. Four-Eyes separation of duties (preventing unauthorized production pushes).
3. Post-deployment integrity confirmation.
