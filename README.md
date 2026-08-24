# AppForge — ServiceNow Application Platform

[![AppForge Version](https://img.shields.io/badge/version-0.16.0-blue.svg)](CHANGELOG.md)
[![Platform](https://img.shields.io/badge/platform-ServiceNow-green.svg)](https://developer.servicenow.com)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#)

AppForge is a long-term **ServiceNow-native application platform** — an Application Factory built inside ServiceNow that allows administrators and developers to create, configure, secure, automate, integrate, and operate completely custom business applications (such as ITSM, CSM, SPM, HR, Vendor Management, Asset Management, Procurement, and custom line-of-business apps) using metadata-driven engines.

> **Phase 018 Status**: AppForge Enterprise Visual Studio, Compliance Portal & Declarative Template Factory established (`AppForgeTemplateFactory.js`, `AppForgeStudioWorkspaceService.js`, `AppForgeDeclarativeDesignerEngine.js`, `AppForgeStudioAPI.js`, `AppForgeWorkspace.html`). Features 6 pre-built enterprise templates (Employee Onboarding, Vendor Management, Asset Request, Case Management, Approval Governance, Blank Application), Visual JSON Designer for Tables/Fields/Forms/Lists/Logic/Security/APIs, Executive Home Dashboard with live metrics (zero fake data), Governed Deployment Pipeline with Four-Eyes modal gating, Compliance Portal, Drift Center, and unified Audit Operations Timeline. Complete 20-stage customer journey verified and 675/675 automated tests passing (100%).

---

## 🏛️ System Architecture Baseline

```text
                         APPFORGE
                            │
                            ▼
                 ┌─────────────────────┐
                 │ AppForge Experience │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   AppForge Core     │
                 │                     │
                 │ Application Factory │
                 │ Metadata Engine     │
                 │ Security Engine     │
                 │ UI Engine           │
                 │ Automation Engine   │
                 │ Integration Engine  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ ServiceNow Platform │
                 │                     │
                 │ Tables              │
                 │ Glide               │
                 │ ACL                 │
                 │ Flow Designer       │
                 │ APIs                │
                 │ Events              │
                 │ ATF                 │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ AppForge Foundation │
                 └──────────┬──────────┘

                            │
                            ▼

                    ┌───────────────┐
                    │    GitHub     │
                    │ Source Control│
                    └───────────────┘
```

---

## 📜 Architectural Principles

1. **Platform First**: Built as a reusable platform; no hardcoded business assumptions.
2. **Metadata Driven**: Driven by configuration and metadata schemas rather than custom static scripts.
3. **ServiceNow Native**: 100% native (Scoped Application, Script Includes, Flow Designer, ATF, ACLs). No external servers, Node, React, or non-ServiceNow DBs.
4. **Extensible**: Modular architecture allowing future engines and business applications to plug into core foundation.
5. **Secure by Default**: Strict scope isolation, role-based access control (`x_appforge.admin`, `x_appforge.developer`, `x_appforge.user`), and least privilege default policies.
6. **Upgrade Safe**: Built using standard ServiceNow APIs (`GlideRecord`, `GlideAggregate`, REST APIs) without modifying Global application records or core platform artifacts.

---

## 📁 Repository & Documentation Directory Structure

```text
AppForge/
├── README.md
├── docs/
│   ├── servicenow-app-manifest.json
│   ├── architecture/
│   ├── development-standards/
│   ├── security/
│   ├── testing/
│   ├── source-control/
│   ├── deployment/
│   ├── data-model/
│   └── change-log/
└── AppForge/                       # ServiceNow Documentation Alias Structure
    ├── Architecture/
    ├── Development Standards/
    ├── Security/
    ├── Testing/
    ├── Source Control/
    ├── Deployment/
    ├── Data Model/
    └── Change Log/
```

- [Architecture Specification](docs/architecture/README.md)
- [Development Standards & Naming Conventions](docs/development-standards/README.md)
- [Security Architecture & Role Baseline](docs/security/README.md)
- [Testing & ATF Strategy](docs/testing/README.md)
- [Source Control Integration & Workflow Guide](docs/source-control/README.md)
- [Deployment & Version Release Process](docs/deployment/README.md)
- [Data Model & Schema Baseline](docs/data-model/README.md)
- [Version Change Log](docs/change-log/CHANGELOG.md)

---

## ⚙️ Quick Start — ServiceNow Studio Integration

1. Open your **ServiceNow Personal Developer Instance (PDI)**: [`https://dev280961.service-now.com/`](https://dev280961.service-now.com/)
2. Navigate to **ServiceNow Studio** (`System Applications > Studio`).
3. Click **Import From Source Control**.
4. URL: `https://github.com/samdev-lab/Appforge.git`
5. Branch: `main`
6. Authentication: GitHub Personal Access Token (PAT) or SSH Key.
7. Once imported, set current scope to **AppForge** (`x_appforge`).

---

## 🏷️ Versioning

AppForge uses Semantic Versioning (`MAJOR.MINOR.PATCH`).
Current Baseline: `v0.16.0`.
