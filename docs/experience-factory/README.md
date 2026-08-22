# AppForge Experience Factory — Forms, Lists, Views & UI Layout Engine

## 1. Overview & UI Provisioning Pipeline

The AppForge Experience Factory builds the UI Experience Layer on top of physical ServiceNow tables. It transforms declarative Experience JSON definitions into real ServiceNow platform UI metadata (`sys_ui_form`, `sys_ui_section`, `sys_ui_element`, `sys_ui_list`, `sys_ui_list_element`, `sys_ui_view`, `sys_app_application`, `sys_app_module`, `sys_ui_related_list`).

```text
 ┌────────────────────────────────────────────────────────┐
 │           Declarative Experience Definition            │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │              AppForgeExperienceValidator               │
 │  • Validates table existence & section uniqueness      │
 │  • Validates field placement & related lists           │
 │  • Enforces Destructive UI Safety Guard                │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │               AppForgeExperiencePlanner                │
 │  • Generates dry-run UI execution plan                 │
 │  • Resolves dependency order (View -> Form -> List -> Nav)
 │  • Detects existing vs new UI artifacts                │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │              AppForgeExperienceExecutor                │
 │  • Provisions sys_ui_form, sys_ui_list, sys_app_module │
 │  • Tracks execution metrics & audit log records        │
 │  • Triggers AppForgeExperienceRollback on failure      │
 └────────┬───────────────────────────────────────────────┘
          │
          ├──► x_appforge_experience_run       (UI audit log)
          └──► x_appforge_experience_operation (Granular log)
```

---

## 2. Declarative Experience Definition Format

```json
{
  "forms": [
    {
      "name": "Employee Form",
      "table": "x_appforge_employee_employee_onboarding_employee",
      "view": "default",
      "sections": [
        {
          "name": "Employee Information",
          "order": 100,
          "fields": ["employee_name", "email", "department", "manager"]
        }
      ]
    }
  ],
  "lists": [
    {
      "name": "Employee List",
      "table": "x_appforge_employee_employee_onboarding_employee",
      "view": "default",
      "fields": ["employee_name", "email", "department", "manager"]
    }
  ],
  "views": [
    { "name": "default", "schema": "Employee" }
  ],
  "related_lists": [
    {
      "parent_table": "x_appforge_employee_employee_onboarding_employee",
      "child_table": "x_appforge_onboarding_task",
      "relationship_field": "employee"
    }
  ],
  "navigation": [
    {
      "name": "Employee Onboarding",
      "target_table": "x_appforge_employee_employee_onboarding_employee",
      "target_type": "LIST",
      "order": 100
    }
  ]
}
```

---

## 3. Real ServiceNow Platform UI Metadata Provisioning

- **Forms & Sections**: `sys_ui_form`, `sys_ui_section`, `sys_ui_element`
- **Lists & Elements**: `sys_ui_list`, `sys_ui_list_element`
- **Views**: `sys_ui_view`
- **Navigation**: `sys_app_application` (App Menu), `sys_app_module` (Module Link)
- **Related Lists**: `sys_ui_related_list`, `sys_ui_related_list_entry`

---

## 4. Experience REST APIs

- **Dry-Run Plan API**: `POST /api/x_appforge/experience/plan`
- **Execution API**: `POST /api/x_appforge/experience/execute`
