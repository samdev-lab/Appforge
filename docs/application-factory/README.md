# AppForge Application Factory Core Architecture

## 1. Overview & Provisioning Pipeline

The AppForge Application Factory transforms declarative JSON application definitions into ServiceNow application metadata and data structures using a deterministic, idempotent, dry-run, and auditable pipeline.

```text
 ┌────────────────────────────────────────────────────────┐
 │           Declarative Application Definition           │
 │        (x_appforge_application_definition)             │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │              AppForgeDefinitionValidator               │
 │  • Validates JSON structure & mandatory attributes     │
 │  • Validates internal field types & reference targets  │
 │  • Enforces Destructive Operation Safety Guard         │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                 AppForgeFactoryPlanner                 │
 │  • Generates dry-run execution plan                    │
 │  • Resolves dependency order                           │
 │  • Detects existing vs new artifacts                   │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                 AppForgeFactoryExecutor                │
 │  • Provisions Application, Modules, Schemas, Fields   │
 │  • Tracks execution metrics & audit logs               │
 │  • Triggers AppForgeFactoryRollback on failure         │
 └────────┬───────────────────────────────────────────────┘
          │
          ├──► x_appforge_factory_run       (Factory audit log)
          └──► x_appforge_factory_operation (Granular operation log)
```

---

## 2. Declarative Definition Format

```json
{
  "application": {
    "name": "Employee Onboarding",
    "scope": "x_appforge_employee",
    "version": "1.0.0"
  },
  "modules": [
    {
      "name": "Employee",
      "type": "CORE"
    }
  ],
  "schemas": [
    {
      "name": "Employee",
      "module": "Employee",
      "fields": [
        {
          "name": "employee_name",
          "type": "string",
          "mandatory": true
        },
        {
          "name": "email",
          "type": "string"
        },
        {
          "name": "manager",
          "type": "reference",
          "reference_table": "sys_user"
        }
      ]
    }
  ]
}
```

---

## 3. Destructive Operation Safety Guard

In compliance with enterprise safety rules, destructive operations (e.g. `DELETE TABLE`, `DELETE FIELD`, `DROP DATA`) requested in definitions are strictly **BLOCKED**:
```text
Destructive operation on schema (Employee) BLOCKED: Destructive operation requires Migration Engine.
```

---

## 4. Factory REST APIs

- **Dry-Run Plan API**: `POST /api/x_appforge/factory/plan`
- **Execution API**: `POST /api/x_appforge/factory/execute`
