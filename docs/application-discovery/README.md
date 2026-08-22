# AppForge Application Discovery & Branch Binding Engine

## 1. Overview

Stage 2 establishes the **AppForge Application Discovery & Branch Binding Engine**. It provides automatic, idempotent discovery of ServiceNow applications and binds them to their dedicated GitHub repositories and branches (specifically supporting instance development branch `sn_instances/dev280961` on `samdev-lab/Appforge.git`).

```text
 ┌────────────────────────────────────────────────────────┐
 │             ServiceNow Application (PDI)               │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │             AppForgeApplicationDiscovery               │
 │  • Discovers runtime application metadata              │
 │  • Idempotent CREATE / UPDATE in Application Registry  │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │             AppForgeGitBranchValidator                 │
 │  • Validates repository mapping (samdev-lab/Appforge)  │
 │  • Validates branch health (sn_instances/dev280961)    │
 └────────┬───────────────────────────────────────────────┘
          │
          ├──► AppForgeBranchPatternParser  (Classifies INSTANCE branch type)
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │             AppForge Git Branch Registry               │
 │             (x_appforge_git_branch)                    │
 └────────┬───────────────────────────────────────────────┘
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │             AppForge Difference Detector               │
 │  • Compares registered metadata vs platform/Git state  │
 │  • Reports MATCH, DIFFERENCE, MISSING, or ERROR        │
 └────────┬───────────────────────────────────────────────┘
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │             x_appforge_discovery_run Audit Log         │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Real Application & Branch Binding Specification

- **ServiceNow Application**: `AppForge` (`x_appforge`)
- **GitHub Repository**: `samdev-lab/Appforge` (`https://github.com/samdev-lab/Appforge.git`)
- **Primary Instance Branch**: `sn_instances/dev280961`
- **Branch Type Classification**: `INSTANCE` (`instance_identifier = dev280961`)
- **Git Safety Guarantee**: Branch `sn_instances/dev280961` is preserved intact without force-pushing, history rewrites, or branch resets.

---

## 3. Discovery REST API

- **Endpoint**: `POST /api/x_appforge/applications/{application_id}/discover`
- **Controller**: `AppForgeDiscoveryAPI.js`
- **Authorization**: `x_appforge.developer` / `x_appforge.admin`

---

## 4. Difference Detection Engine

AppForge compares registered metadata against actual platform or Git state:
- `MATCH`: Values align exactly across ServiceNow, AppForge Registry, and GitHub.
- `DIFFERENCE`: Discrepancy detected (e.g. version or branch mismatch).
- `MISSING`: Attribute missing in target system.
- `ERROR`: Exception or authorization failure.
