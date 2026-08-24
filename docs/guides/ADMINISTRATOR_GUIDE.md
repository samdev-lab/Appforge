# AppForge Enterprise Administrator Guide

## 1. Introduction & Overview
AppForge is a native ServiceNow Declarative Application Factory and Policy-as-Code Governance Engine. This guide describes the administrative setup, application provisioning, template instantiation, deployment promotion, Four-Eyes approval flows, and disaster recovery procedures.

---

## 2. Setup & Roles
AppForge enforces strict role-based access control (RBAC):
* `x_appforge.admin`: Full platform control, tenant configuration, and policy administration.
* `x_appforge.governance_manager`: Approves production deployment gates, compliance policies, and policy exceptions.
* `x_appforge.deployer`: Initiates deployments, monitors execution pipelines, and acquires deployment locks.
* `x_appforge.developer`: Designs declarative schemas, forms, lists, logic, and REST APIs.
* `x_appforge.user`: Interacts with generated line-of-business custom applications.

---

## 3. Application Creation & Template Factory
Administrators can provision custom applications using the **Template Factory**:
1. Navigate to **AppForge Studio > Template Factory**.
2. Select an enterprise template:
   * **Employee Onboarding** (`employee_onboarding`)
   * **Vendor Management** (`vendor_management`)
   * **Asset Request & Fulfillment** (`asset_request`)
   * **Case Management** (`case_management`)
   * **Approval Governance** (`approval_management`)
   * **Blank Application** (`blank_application`)
3. Click **Instantiate Template** to validate and register the declarative definition.

---

## 4. Governed Deployment & Four-Eyes Approvals
Promoting an application from DEV $\rightarrow$ TEST $\rightarrow$ PRODUCTION:
1. **Packaging**: Generate sealed package with canonical SHA-256 digest.
2. **Preflight**: Automated check for schema compatibility, health, locks, and security policies.
3. **Four-Eyes Gate**: For UAT/PRODUCTION, a user distinct from the requester must approve:
   $$\text{Requester} \neq \text{Approver}$$
4. **Execution**: The platform acquires an exclusive mutex lock in `x_appforge_deployment_lock` to prevent concurrent collisions.

---

## 5. Drift Detection & Remediation
AppForge continuously scans live ServiceNow metadata (`sys_*`) against signed package manifests:
* **Safe Remediation**: Non-destructive repairs (`REAPPLY_ACL`, `RESTORE_CONFIGURATION`) are executed automatically.
* **Destructive Actions**: Permanent block (`FORBIDDEN`) on `DROP_TABLE` and `DELETE_DATA`.
