# AppForge Data Model Baseline

## 1. Overview

Prompt 001 establishes the **Data Model Baseline and Schema Guidelines**. In strict compliance with Prompt 001 instructions, **no custom business tables or business modules are created in this phase**.

---

## 2. Table Naming & Prefix Standards

Future AppForge tables will follow strict naming and inheritance rules:

- **Scope Prefix**: `x_appforge_`
- **Primary Registry Tables**: Extend `sys_metadata` or base platform tables where appropriate.
- **Transactional Application Tables**: Extend `task` or base custom table constructs only when explicitly specified by future prompts.

---

## 3. Metadata Engine Target Schema Strategy (Future Phases Preview)

Future metadata registry tables will encompass:
- **Application Registry** (`x_appforge_application_registry`)
- **Module Registry** (`x_appforge_module_registry`)
- **Table Schema Registry** (`x_appforge_table_registry`)
- **Field Schema Registry** (`x_appforge_field_registry`)
- **Configuration Registry** (`x_appforge_config_registry`)

> **Note**: These schemas will be formally introduced in Stage 1 / Prompt 002.
