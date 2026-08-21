# AppForge Security Architecture & Baseline

## 1. Security Philosophy

AppForge adheres to **Secure by Default** principles. No data or functionality in AppForge is exposed without explicit access control definitions.

---

## 2. Role Strategy

AppForge defines a strict 3-tier role hierarchy:

```text
 ┌────────────────────────────────────────────────────────┐
 │                   x_appforge.admin                     │
 │  (Inherits x_appforge.developer & x_appforge.user)     │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                 x_appforge.developer                   │
 │               (Inherits x_appforge.user)               │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                    x_appforge.user                     │
 └────────────────────────────────────────────────────────┘
```

### Role Specification Matrix

| Role | Scope | Purpose & Privileges |
| :--- | :--- | :--- |
| `x_appforge.admin` | `x_appforge` | Full platform administration, security rules, global properties, and scope configuration. |
| `x_appforge.developer` | `x_appforge` | Application creation, metadata definitions, schema registration, workflow setup. |
| `x_appforge.user` | `x_appforge` | Execution and operation of applications hosted on AppForge platform. |

---

## 3. Access Control Lists (ACL) Strategy

- **Default Stance**: Denial by default.
- **Record Level ACLs**: Every AppForge table must have explicit `create`, `read`, `write`, and `delete` ACLs defined.
- **GlideRecordSecure**: All backend Script Includes and REST endpoints must execute DB queries using `GlideRecordSecure` or explicit `canRead()` / `canWrite()` checks.
- **REST Security**: Scripted REST APIs must mandate `x_appforge.user` or higher roles in API Security definitions.

---

## 4. Secret & Credential Management Rules

1. **Zero Hardcoded Credentials**: API keys, tokens, SSH keys, or passwords must NEVER be placed in Script Includes, Business Rules, or Git files.
2. **ServiceNow Credentials Store**: Use ServiceNow `Discovery Credentials` or `Connection & Credentials` table (`sys_connection`) for external secrets.
3. **System Properties**: Configurable properties use `sys_properties` with Private/Secret flags where applicable.
4. **Git Inspection**: Pre-commit / build verification checks inspect source control diffs for key or password patterns.
