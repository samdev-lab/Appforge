# AppForge Change Log

All notable changes to the AppForge platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-22

### Added - Stage 0: Engineering Foundation & ServiceNow Source Control Baseline
- Established AppForge Scoped Application manifest (`x_appforge`, version `0.1.0`).
- Configured repository structure for `samdev-lab/Appforge.git` on PDI `dev280961.service-now.com` with baseline `main` branch.
- Documented complete system architecture specs (Experience Layer, Core Layer, Platform Layer, Foundation Layer).
- Established 6 core architectural principles (Platform First, Metadata Driven, ServiceNow Native, Extensible, Secure by Default, Upgrade Safe).
- Established development standards and strict naming conventions for Scoped Applications, Tables, Fields, Script Includes, Business Rules, Client Scripts, UI Policies, ACLs, Roles, Flows, Events, REST APIs, Properties, and Modules.
- Established security baseline and role hierarchy (`x_appforge.admin`, `x_appforge.developer`, `x_appforge.user`).
- Formulated testing strategy, ATF guidelines, and bi-directional ServiceNow Studio <-> GitHub synchronization validation procedures.
- Executed Prompt 001A ServiceNow PDI ↔ GitHub source control validation commit (`APPFORGE-001A: Validate ServiceNow GitHub source control`).
- Established deployment & release process and semantic versioning rules.
