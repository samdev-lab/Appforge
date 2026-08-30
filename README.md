# AppForge — ServiceNow Application Marketplace & Instant Implementation Platform

[![Automated Tests](https://img.shields.io/badge/Tests-1%2C507%20Passed-22c55e.svg)](scripts/test)
[![Version](https://img.shields.io/badge/Version-v0.19.0-0284c7.svg)](docs/releases/v0.19.0/)
[![ServiceNow](https://img.shields.io/badge/ServiceNow-Rome%20to%20Xanadu-6366f1.svg)](docs/guides/ADMINISTRATOR_MARKETPLACE_GUIDE.md)
[![License](https://img.shields.io/badge/License-Commercial%20SaaS-0f172a.svg)](docs/strategy/MILLION_DOLLAR_PRODUCT_PRINCIPLES.md)

AppForge allows enterprise customers to **select business applications, install them into ServiceNow in minutes, configure them with minimal effort, and start using them immediately.**

> *"This is ServiceNow, but AppForge makes implementing applications 10x faster and easier."*

---

## ⚡ 1-Click Installation (Zero Overhead)

```bash
git clone https://github.com/samdev-lab/Appforge.git
cd AppForge
./scripts/install
```

Open the Live AppForge Marketplace Studio:
👉 **`https://<your-instance>.service-now.com/x_1805046_app_fo_0_workspace.do`**

---

## 🎯 The Three-Tier Experience

```text
1. CUSTOMER EXPERIENCE (Simplicity Outside)
   Find ──> Buy ──> Install ──> Configure ──> Use
   • Native ServiceNow Navigation & Modules (All > Employee Onboarding)
   • Zero exposure of JSON, Git, or internal engines

2. APPFORGE TEAM WORKSPACE (Operational Control)
   Customer ──> Subscription ──> Deployment ──> Support ──> Renewal
   • Multi-Tenant SaaS Workspace (dev280961)
   • Customer CRM & Four-Eyes Governance (POL-SEC-006)

3. APPFORGE ENGINE (Complexity Inside — Under the Hood)
   Factory ──> Package ──> Sign ──> Govern ──> Deploy ──> Recover
   • 5-Layer Declarative Compiler & Cryptographic Signatures
   • Continuous Schema Drift Detection & Instant Rollback
```

---

## 🛒 Available Certified Applications

| Application | Category | What It Creates | Price |
| :--- | :--- | :--- | :---: |
| **👤 Employee Onboarding** | HR | Onboarding requests, employee records, tasks, approvals, reports | $499 / mo |
| **🏢 Vendor Management** | Procurement | Vendor directory, contracts, SLAs, risk assessments | $599 / mo |
| **💬 Customer Service Hub** | CSM | Case intake, SLA escalation, account management | $699 / mo |
| **🚨 IT Request Management** | ITSM | Service desk tickets, severity routing, assignment queues | $450 / mo |
| **💻 Asset & Hardware Request** | Operations | Hardware provisioning, inventory deduction, asset tracking | $399 / mo |
| **📊 Project Intake & Governance** | SPM / PPM | Business demands, scoring matrix, capital budgets | $550 / mo |

---

## 📁 Repository Structure

```text
├── scripts/
│   ├── install       # One-click automated ServiceNow instance installer
│   ├── validate      # Preflight and connectivity validator
│   ├── setup         # Environment setup and XML metadata compiler
│   ├── test          # Complete test runner (1,507 automated tests)
│   ├── deploy        # Production deployment CLI
│   └── uninstall     # Safe scoped application uninstaller
├── src/              # Native ServiceNow Script Includes & UI Pages (Light Mode)
├── tests/            # 25 Automated Test Suites (100% Green)
└── docs/
    ├── strategy/     # Million-Dollar Company Product Principles & North Star
    ├── architecture/ # Marketplace, Factory, and Governance Architecture
    ├── guides/       # Customer, Administrator, and Entitlement Guides
    └── releases/     # Release Notes and Production Certifications
```

---

## 📚 Product Documentation & Principles
* [Million-Dollar Company Strategic Principles](docs/strategy/MILLION_DOLLAR_PRODUCT_PRINCIPLES.md)
* [Template Marketplace Architecture](docs/architecture/TEMPLATE_MARKETPLACE_ARCHITECTURE.md)
* [Customer Marketplace Guide](docs/guides/CUSTOMER_MARKETPLACE_GUIDE.md)
* [Administrator Marketplace Guide](docs/guides/ADMINISTRATOR_MARKETPLACE_GUIDE.md)
* [Pricing & Entitlements Guide](docs/guides/ENTITLEMENT_AND_PRICING_GUIDE.md)
* [Governed Decommissioning Guide](docs/guides/GOVERNED_DECOMMISSIONING_GUIDE.md)
* [v0.19.0 Release Notes](docs/releases/v0.19.0/MARKETPLACE_RELEASE_MANIFEST.md)
