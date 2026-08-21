# AppForge Architecture Specification

## 1. Vision & Architecture Overview

AppForge is designed as a native **Application Factory** inside ServiceNow. It abstracts application creation into metadata, lifecycle management, UI engines, workflow orchestration, security policies, and API abstractions.

---

## 2. Logical Layer Breakdown

```text
 ┌────────────────────────────────────────────────────────┐
 │                 APPFORGE EXPERIENCE                    │
 │                                                        │
 │  App Builder Workspace │ Admin Center │ Portal / APIs │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                    APPFORGE CORE                       │
 │                                                        │
 │ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
 │ │ Application│ │ Module     │ │ Metadata / Schema    │ │
 │ │ Factory    │ │ Manager    │ │ Engine               │ │
 │ └────────────┘ └────────────┘ └──────────────────────┘ │
 │ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
 │ │ UI Engine  │ │ Workflow   │ │ Business Logic       │ │
 │ │            │ │ Engine     │ │ Engine               │ │
 │ └────────────┘ └────────────┘ └──────────────────────┘ │
 │ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
 │ │ Security / │ │ API /      │ │ Notification /       │ │
 │ │ ACL Engine │ │ Integration│ │ Event Engine         │ │
 │ └────────────┘ └────────────┘ └──────────────────────┘ │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                 SERVICENOW PLATFORM                    │
 │                                                        │
 │ Tables │ Glide │ Flow Designer │ Script Includes       │
 │ ACL    │ Roles │ Events         │ REST APIs            │
 │ ATF    │ Jobs  │ Notifications  │ Attachments           │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                APPFORGE FOUNDATION                     │
 │                                                        │
 │ Application Registry │ Module Registry                 │
 │ Metadata Store       │ Role Baseline                   │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                   GITHUB GIT REPO                      │
 └────────────────────────────────────────────────────────┘
```

### Layer Details
1. **AppForge Experience Layer**: Provides workspaces, admin interfaces, and API entry points for application builders and users.
2. **AppForge Core Layer**: Contains generic platform engines (Factory, Metadata, UI, Workflow, Security, Integration).
3. **ServiceNow Platform Layer**: Leverages native platform capabilities (GlideScript, Flow Designer, ACLs, ATF, REST APIs).
4. **AppForge Foundation Layer**: Core registry metadata tables, global properties, and access control baselines.
5. **Source Control Layer**: GitHub integration for Git-based ALM, versioning, and environment promotion.

---

## 3. Core Architectural Principles

### Principle 1 — Platform First
- AppForge is built as an extensible platform engine.
- Hardcoded logic specific to single verticals (e.g. ITSM ticket states) must never exist in the core engine.

### Principle 2 — Metadata Driven
- Table configurations, UI forms, workflows, and validations are defined as record metadata.
- Core engines interpret metadata dynamically at runtime.

### Principle 3 — ServiceNow Native
- Utilizes ServiceNow native constructs only: Scoped Applications, Script Includes, Flow Designer, Business Rules, Client Scripts, ATF.
- Strictly no external application servers, Node.js, React SPA bundles, or external SQL/NoSQL databases.

### Principle 4 — Extensible
- Modular structure allows plugins and new domain modules to register without modifying core scripts.

### Principle 5 — Secure by Default
- Default closed security posture.
- Every table and endpoint requires explicit Scoped ACLs and Role checks.

### Principle 6 — Upgrade Safe
- Zero customization of global/out-of-the-box platform records.
- Standard Glide API usages ensuring seamless platform upgrades (e.g., Xanadu, Washington DC, Utah).
