# AppForge Change Log

All notable changes to the AppForge platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-08-23

### Added — Stage 4: Logic & Automation Factory
- Created Logic Registry schemas: `x_appforge_logic`, `x_appforge_business_rule`, `x_appforge_script_include`, `x_appforge_event`, `x_appforge_notification`, `x_appforge_logic_run`, `x_appforge_logic_operation`.
- Implemented `AppForgeConditionEngine.js` — 13 supported operators (=, !=, >, <, >=, <=, IS_EMPTY, IS_NOT_EMPTY, CHANGES, CHANGES_TO, CHANGES_FROM, IN, NOT_IN), JS expression + SN filter string generation.
- Implemented `AppForgeActionEngine.js` — 8 supported actions (SET_FIELD, COPY_FIELD, CLEAR_FIELD, CREATE_RECORD, UPDATE_RECORD, ADD_MESSAGE, RAISE_EVENT, SEND_NOTIFICATION); 4 blocked actions (DELETE_RECORD, DELETE_MULTIPLE, MASS_UPDATE, DIRECT_SQL).
- Implemented `AppForgeScriptSecurityScanner.js` — static pattern scanner with BLOCK-level (eval, Function(), deleteMultiple, GlideSQLStatement, execCommand) and WARN-level findings, plus structural syntax validation.
- Implemented `AppForgeLogicValidator.js` — validates Business Rules, Script Includes, Events, Notifications, cross-scope protection, destructive guards, payload injection prevention, recipient type validation.
- Implemented `AppForgeLogicPlanner.js` — dependency-ordered dry-run plan (Events → Business Rules → Notifications → Script Includes) with inline security scan.
- Implemented `AppForgeLogicRollback.js` — compensating rollback manager (COMPLETE / PARTIAL / NOT_POSSIBLE).
- Implemented `AppForgeLogicExecutor.js` — provisions real ServiceNow platform artifacts: `sys_script`, `sys_script_include`, `sysevent_register`, `sysevent_email_action`; writes AppForge Logic Registry and `x_appforge_logic_run` / `x_appforge_logic_operation` audit records.
- Implemented `AppForgeLogicAPI.js` — REST endpoints `POST /api/x_appforge/logic/plan` and `POST /api/x_appforge/logic/execute` with RBAC enforcement.
- Created `tests/AppForgeLogicTestSuite.js` — 35 automated test scenarios covering Business Rules, Actions, Script Includes, Events, Notifications, Security, and End-to-End Integration.
- All 137/137 automated tests passed (35 Prompt 007 + 102 regressions).

## [0.6.0] - 2026-08-23

### Added - Stage 3: Experience Factory — Forms, Lists, Views & UI Layout Engine
- Created Form Registry schemas (`x_appforge_form`, `x_appforge_form_section`, `x_appforge_form_field`).
- Created List & View Registry schemas (`x_appforge_list`, `x_appforge_list_field`, `x_appforge_view`).
- Created Navigation & Related List Registry schemas (`x_appforge_navigation`, `x_appforge_related_list`).
- Created Experience Audit Run schema (`x_appforge_experience_run`) and Granular UI Operation Log schema (`x_appforge_experience_operation`).
- Implemented Experience Validator service (`AppForgeExperienceValidator.js`) checking table existence, section uniqueness, field placement, and enforcing destructive UI guards.
- Implemented Experience Planner service (`AppForgeExperiencePlanner.js`) generating dependency-ordered dry-run UI execution plans.
- Implemented Experience Executor service (`AppForgeExperienceExecutor.js`) provisioning real ServiceNow platform UI metadata (`sys_ui_view`, `sys_ui_form`, `sys_ui_section`, `sys_ui_element`, `sys_ui_list`, `sys_ui_list_element`, `sys_app_application`, `sys_app_module`, `sys_ui_related_list`) and AppForge Experience Registries.
- Implemented Experience Compensating Rollback service (`AppForgeExperienceRollback.js`).
- Implemented Experience REST API (`AppForgeExperienceAPI.js`) for `POST /api/x_appforge/experience/plan` and `POST /api/x_appforge/experience/execute`.
- Formulated automated test suite (`tests/AppForgeExperienceTestSuite.js`) executing 25 new Prompt 006 scenarios + 27 Prompt 005 Factory regression scenarios + 20 Prompt 004 Discovery regression scenarios + 20 Prompt 003 Registry regression scenarios + 10 Prompt 002 Webhook regression scenarios (102/102 PASSED).

## [0.5.0] - 2026-08-23

### Added - Stage 2: Application Factory Core Engine
- Created Application Definition schema (`x_appforge_application_definition`) storing declarative JSON definitions.
- Created Factory Audit Run schema (`x_appforge_factory_run`) and Granular Operation Log schema (`x_appforge_factory_operation`).
- Implemented Centralized Table Name Generator service (`AppForgeTableNameGenerator.js`) enforcing scope prefix (`x_appforge_`), snake_case, max length, and reserved name protection.
- Implemented Field Type Mapper service (`AppForgeFieldTypeMapper.js`) mapping internal types (`string`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `reference`, `choice`, `currency`, `journal`, `html`) to platform metadata attributes.
- Implemented Definition Validator service (`AppForgeDefinitionValidator.js`) checking JSON schema structure, field types, constraints, and enforcing destructive operation guards.
- Implemented Factory Planner service (`AppForgeFactoryPlanner.js`) generating dependency-ordered dry-run execution plans.
- Implemented Factory Executor service (`AppForgeFactoryExecutor.js`) provisioning Applications, Modules, Schemas, Fields, and References via Registry services, collecting performance metrics.
- Implemented Compensating Rollback service (`AppForgeFactoryRollback.js`) managing cleanup upon execution errors.
- Implemented Factory REST API (`AppForgeFactoryAPI.js`) for `POST /api/x_appforge/factory/plan` and `POST /api/x_appforge/factory/execute`.
- Formulated automated test suite (`tests/AppForgeFactoryTestSuite.js`) executing 27 new Prompt 005 scenarios + 20 Prompt 004 Discovery regression scenarios + 20 Prompt 003 Registry regression scenarios + 10 Prompt 002 Webhook regression scenarios (77/77 PASSED).

## [0.4.0] - 2026-08-23

### Added - Stage 2 Foundation: Application Discovery & Branch Binding Engine
- Created Git Branch Registry schema (`x_appforge_git_branch`) mapping Git branches (`sn_instances/dev280961`) to AppForge Applications.
- Created Discovery Audit Run schema (`x_appforge_discovery_run`) logging discovery execution runs and latest commit SHAs.
- Implemented Branch Pattern Parser service (`AppForgeBranchPatternParser.js`) recognizing instance pattern `sn_instances/{instance_identifier}` (`INSTANCE` type with instance `dev280961`).
- Implemented Branch Validator service (`AppForgeGitBranchValidator.js`) evaluating relationship health (`VALID`, `INVALID`, `MISSING`, `UNMAPPED`, `STALE`, `ERROR`).
- Implemented Application Discovery service (`AppForgeApplicationDiscovery.js`) for idempotent discovery of ServiceNow application metadata and branch binding.
- Implemented Metadata Difference Detector service (`AppForgeDifferenceDetector.js`) comparing registered vs actual state (`MATCH`, `DIFFERENCE`, `MISSING`, `ERROR`).
- Implemented Discovery REST API (`AppForgeDiscoveryAPI.js`) for `POST /api/x_appforge/applications/{application_id}/discover`.
- Formulated automated test suite (`tests/AppForgeDiscoveryTestSuite.js`) executing 20 new Prompt 004 scenarios + 20 Prompt 003 Registry regression scenarios + 10 Prompt 002 Webhook regression scenarios (50/50 PASSED).

## [0.3.0] - 2026-08-23

### Added - Stage 0.3: Platform Foundation & Registries
- Created Application Registry schema (`x_appforge_application`) with unique `application_id`, `scope`, and controlled lifecycle state machine (`PLANNED` → `DEVELOPMENT` → `TESTING` → `UAT` → `PRODUCTION` → `RETIRED`).
- Created Module Registry schema (`x_appforge_module`) with composite application-scoped uniqueness.
- Created Schema Registry schema (`x_appforge_schema`) mapping logical application entities to physical ServiceNow platform tables (`physical_table`).
- Created Schema Field Registry schema (`x_appforge_schema_field`) supporting field types (`string`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `reference`, `choice`, `currency`, `journal`, `html`).
- Implemented Server-Side Registry Services: `AppForgeApplicationRegistry`, `AppForgeModuleRegistry`, `AppForgeSchemaRegistry`, `AppForgeSchemaFieldRegistry`.
- Implemented Registry Read-Only REST APIs (`AppForgeRegistryRESTAPI.js`) for querying `/applications`, `/modules`, `/schemas`, `/schemas/{id}/fields`.
- Created sample seed dataset (`src/data/x_appforge_sample_data.json`) for `AppForge Platform` (`0.3.0`), `Platform Foundation` module, and core schemas.
- Formulated automated test runner suite (`tests/AppForgeRegistryTestSuite.js`) executing 20 new registry scenarios + 10 Phase 002 Webhook regression scenarios (30/30 PASSED).

## [0.2.0] - 2026-08-23

### Added - Stage 0.2: GitHub → ServiceNow Webhook Integration
- Created Scripted REST API endpoint `POST /api/x_appforge/github/webhook` (`AppForgeGitHubWebhookAPI.js`).
- Implemented HMAC-SHA256 signature verification service (`AppForgeWebhookSecurity.js`) utilizing private property `x_appforge.github.webhook_secret` and constant-time string comparison.
- Created Git Event Persistence & Audit table schema (`x_appforge_git_event`) with unique indexed `delivery_id`.
- Created AppForge Repository Mapping table schema (`x_appforge_repository`).
- Implemented Webhook Ingestion & Idempotency engine (`AppForgeGitHubWebhookService.js`) using `X-GitHub-Delivery` header to reject duplicate deliveries.
- Implemented Event Router and State Processor service (`AppForgeGitEventService.js`).
- Implemented event-specific processors: `AppForgePushProcessor`, `AppForgePullRequestProcessor`, `AppForgeReviewProcessor`, `AppForgeWorkflowProcessor`.
- Formulated automated test runner suite (`tests/AppForgeGitHubWebhookTestSuite.js`) executing the 10 mandatory test scenarios.

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
