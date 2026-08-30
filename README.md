# AppForge — Autonomous Application Studio for ServiceNow

[![Automated Tests](https://img.shields.io/badge/Tests-1%2C429%20Passed-22c55e.svg)](scripts/test)
[![Version](https://img.shields.io/badge/Version-v0.18.0-0284c7.svg)](docs/releases/v0.18.0/)
[![ServiceNow](https://img.shields.io/badge/ServiceNow-Rome%20to%20Xanadu-6366f1.svg)](docs/guides/ADMINISTRATOR_GUIDE.md)
[![License](https://img.shields.io/badge/License-Commercial-0f172a.svg)](docs/guides/USER_GUIDE.md)

AppForge is the enterprise autonomous application and service catalog lifecycle engine for ServiceNow. It eliminates repetitive manual configuration, cuts SI consulting costs by 80%, and enforces policy-as-code governance across all your instances.

---

## ⚡ Quick Start (1-Click Install)

```bash
git clone https://github.com/samdev-lab/Appforge.git
cd AppForge
./scripts/install
```

Open the AppForge Studio Workspace:
👉 **`https://<your-instance>.service-now.com/x_1805046_app_fo_0_workspace.do`**

---

## 📦 What AppForge Does

```text
COMPLEXITY INSIDE  ──>  SIMPLICITY OUTSIDE

[ Choose Template ]  ──>  [ Configure ]  ──>  [ Validate ]  ──>  [ Deploy ]  ──>  [ Monitor ]
```

* **⚡ Template-First Application Creator:** Choose from Employee Onboarding, Vendor Management, IT Access, or Custom to generate tables, forms, and variables in seconds.
* **🛡️ Four-Eyes Production Governance:** Automated separation of duties (`POL-SEC-006`) with cryptographic signing and zero data exfiltration.
* **📂 Reverse-Engineering Importer:** Convert existing update sets and custom scoped apps into declarative AppForge applications in 1 click.
* **🔍 Schema Drift & Self-Healing:** Automated sub-production drift detection with instant one-click rollback.

---

## 📁 Repository Structure

```text
├── scripts/
│   ├── install       # One-click automated ServiceNow instance installer
│   ├── validate      # Preflight and connectivity validator
│   ├── setup         # Environment setup and XML metadata compiler
│   ├── test          # Complete test runner (1,429 automated tests)
│   ├── deploy        # Production deployment CLI
│   └── uninstall     # Safe scoped application uninstaller
├── src/              # Native ServiceNow Script Includes & UI Pages (Light Mode)
├── tests/            # 23 Automated Test Suites
└── docs/             # User, Administrator, and Architecture Guides
```

---

## 📚 Documentation
* [Installation Guide](INSTALL.md)
* [Quick Start Guide](QUICK_START.md)
* [Troubleshooting & FAQs](TROUBLESHOOTING.md)
* [End User Guide](docs/guides/USER_GUIDE.md)
* [Administrator Guide](docs/guides/ADMINISTRATOR_GUIDE.md)
