# AppForge Template Publishing & Certification Guide

How to author and certify new 5-layer declarative application templates.

---

## 🛠️ Template Structure Specification

Each template conforms to the unified 5-layer AppForge schema:

```json
{
  "template_id": "custom_app_id",
  "name": "Custom Application Name",
  "version": "1.0.0",
  "category": "Operations",
  "status": "PUBLISHED",
  "certification_status": "CERTIFIED",
  "modules": [
    { "name": "Module List", "table": "target_table", "icon": "list" }
  ],
  "layers": {
    "data": { "tables": [{ "name": "target_table", "label": "Table Label", "fields": ["field_a", "field_b"] }] },
    "experience": { "forms": ["Form Layout"], "lists": ["List Layout"] },
    "logic": { "business_rules": ["Auto Rule"] },
    "security": { "roles": ["app_user"], "acls": ["read", "write", "create"] },
    "integration": { "rest_endpoints": ["/api/custom/v1"] }
  }
}
```

---

## 🛡️ Certification Requirements
* Must pass automated policy checks (`POL-SEC-006`).
* Must include valid role permissions and ACL matrices.
* Must support clean compensating rollback upon installation error.
