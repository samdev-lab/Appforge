# AppForge Enterprise Developer Guide

## 1. Declarative Schema Model (Source of Truth)
In AppForge, the JSON application specification is the authoritative source of truth.

### Top-Level Specification Structure:
```json
{
  "application": {
    "name": "Employee Onboarding",
    "application_id": "app_employee_onboarding",
    "scope": "x_appforge_employee",
    "version": "1.0.0",
    "owner": "admin"
  },
  "modules": [
    { "name": "Onboarding", "module_id": "mod_onboarding", "order": 100 }
  ],
  "schemas": [
    {
      "name": "Employee",
      "schema_id": "sch_employee",
      "table_name": "x_appforge_employee_employee",
      "fields": [
        { "name": "u_first_name", "label": "First Name", "type": "string", "length": 100, "mandatory": true },
        { "name": "u_email", "label": "Email", "type": "string", "length": 150, "unique": true },
        { "name": "u_start_date", "label": "Start Date", "type": "date" }
      ]
    }
  ],
  "experience": { "forms": [], "lists": [], "views": [], "navigation": [] },
  "logic": { "business_rules": [], "events": [], "notifications": [] },
  "security": { "roles": [], "acls": [] },
  "integration": { "apis": [] }
}
```

---

## 2. Supported Field Types
`AppForgeFieldTypeMapper` maps declarative types to ServiceNow physical types:
* `string` $\rightarrow$ `String`
* `integer` $\rightarrow$ `Integer`
* `decimal` $\rightarrow$ `Decimal`
* `boolean` $\rightarrow$ `True/False`
* `date` $\rightarrow$ `Date`
* `datetime` $\rightarrow$ `Date/Time`
* `reference` $\rightarrow$ `Reference` (requires `reference_table` target)
* `choice` $\rightarrow$ `Choice`

---

## 3. Business Logic & Security Guards
All scripts attached to Business Rules or Script Includes are parsed by `AppForgeScriptSecurityScanner`:
* **Prohibited Patterns**: `eval()`, `new Function()`, direct SQL statements (`GlideSQLStatement`, `JDBC`), raw credential access (`sa_password`), and session impersonation.
* **Safe Script Model**: Use standard Scoped Glide APIs (`GlideRecordSecure`, `gs.info`, `gs.eventQueue`).
