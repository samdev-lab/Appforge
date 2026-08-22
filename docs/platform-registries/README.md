# AppForge Platform Registries & Metadata Architecture

## 1. Overview & Registry Model

AppForge introduces a production-grade, authoritative metadata model for registering Applications, Modules, Schemas, and Fields. The architecture establishes a clear hierarchical structure:

```text
 ┌────────────────────────────────────────────────────────┐
 │                  Application Registry                  │
 │                (x_appforge_application)                │
 └───────────┬────────────────────────────────────────────┘
             │
             ├──► Module Registry (x_appforge_module)
             │        │
             │        └──► Schema Registry (x_appforge_schema)
             │                 │
             │                 └──► Schema Field Registry
             │                      (x_appforge_schema_field)
             │
             └──► GitHub Repository Mapping (x_appforge_repository)
```

---

## 2. Table Specifications & Data Schemas

### Application Registry (`x_appforge_application`)
- `application_id`: Unique string key (e.g. `appforge_platform`, `crm_app`).
- `name`: Internal application name.
- `scope`: Unique ServiceNow scope prefix (e.g. `x_appforge`).
- `version`: Semantic version (e.g. `0.3.0`).
- `status`: Controlled lifecycle status (`PLANNED`, `DEVELOPMENT`, `TESTING`, `UAT`, `PRODUCTION`, `RETIRED`).
- `repository`: Reference to `x_appforge_repository`.

### Module Registry (`x_appforge_module`)
- `module_id`: Unique module key within application.
- `name`: Internal module name.
- `application`: Mandatory reference to `x_appforge_application`.
- `type`: Functional domain (`CORE`, `DATA`, `UI`, `API`, `INTEGRATION`, `WORKFLOW`, `SECURITY`, `REPORTING`).
- `status`: Module status (`PLANNED`, `DEVELOPMENT`, `ACTIVE`, `DEPRECATED`, `RETIRED`).

### Schema Registry (`x_appforge_schema`)
- `schema_id`: Unique schema key within application.
- `name`: Logical entity name (e.g. `Customer`, `Order`).
- `application`: Mandatory reference to `x_appforge_application`.
- `module`: Optional reference to `x_appforge_module`.
- `physical_table`: Actual physical ServiceNow table name (e.g. `x_appforge_crm_customer`).

### Schema Field Registry (`x_appforge_schema_field`)
- `field_id`: Unique field identifier.
- `name`: Internal field name (e.g. `u_email`).
- `schema`: Mandatory reference to `x_appforge_schema`.
- `internal_type`: Supported type (`string`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `reference`, `choice`, `currency`, `journal`, `html`).
- `mandatory`, `unique`, `max_length`, `default_value`, `reference_table`, `sequence`.

---

## 3. Controlled Application Lifecycle

AppForge enforces a state machine preventing invalid lifecycle jumps:

```text
 PLANNED ──► DEVELOPMENT ──► TESTING ──► UAT ──► PRODUCTION ──► RETIRED
                 ▲             │          │          │
                 └─────────────┴──────────┴──────────┘
```

- Invalid jumps (e.g. `PLANNED` → `PRODUCTION` or `RETIRED` → `PRODUCTION`) are strictly rejected.

---

## 4. REST Query APIs

Read-only REST endpoints allow external or internal consumers to inspect metadata:
- `GET /api/x_appforge/applications`
- `GET /api/x_appforge/applications/{id}`
- `GET /api/x_appforge/modules?application={app_sys_id}`
- `GET /api/x_appforge/schemas?application={app_sys_id}`
- `GET /api/x_appforge/schemas/{id}/fields`
