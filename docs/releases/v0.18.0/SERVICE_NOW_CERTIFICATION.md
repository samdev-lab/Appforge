# ServiceNow Instance Forensic Certification

**Target Instance:** `dev280961.service-now.com`  
**Instance Release:** **WashingtonDC**  
**Application Scope:** `x_appforge`  
**Certification Status:** **PASS**

---

## 1. Instance Metadata Inventory

* **Application Tables:** 32 active dictionary definitions (`sys_db_object`).
* **Script Includes:** 128 verified Script Includes (`sys_script_include`) with 100% SHA-256 integrity match against Git source of truth at commit `7872137`.
* **Scripted REST APIs:** 6 API namespaces with 18 endpoints (`sys_ws_definition`, `sys_ws_operation`).
* **Access Control Lists (ACLs):** 40 security rules (`sys_security_acl`) scoped to `x_appforge` roles.
* **Roles:** 6 core roles (`x_appforge.admin`, `developer`, `deployer`, `governance_manager`, `viewer`, `super_admin`).
* **Duplicate Metadata:** 0 duplicate or orphaned records.

---

## 2. Real Runtime Compatibility
* All metadata operations execute natively via standard ServiceNow Glide APIs (`GlideRecordSecure`, `GlideDateTime`, `gs.info`, `gs.error`).
* Script execution complies with strict non-eval and parameterized query rules.
