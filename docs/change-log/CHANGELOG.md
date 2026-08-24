# AppForge Change Log

All notable changes to the AppForge platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.16.0] - 2026-08-24

### Added — Stage 13: Enterprise Visual Studio, Compliance Portal & Declarative Template Factory (Prompt 018)
- Implemented `AppForgeTemplateFactory.js` — pre-packaged enterprise declarative template catalog with 6 rich, validated templates (Employee Onboarding, Vendor Management, Asset Request, Case Management, Approval Governance, Blank Application).
- Implemented `AppForgeStudioWorkspaceService.js` — aggregates real operational metrics, application catalog, detail views, error formatting with correlation IDs, and unified audit timelines across platform registries without fake mock data.
- Implemented `AppForgeDeclarativeDesignerEngine.js` — visual designer engine enabling declarative mutations across Tables, Fields, Forms, Lists, Logic (with script security scanning), Security (with high-risk delete warnings), and APIs.
- Implemented `AppForgeStudioAPI.js` — unified Scripted REST API controller for Studio dashboard, templates, applications, visual designer, deployment pipeline, four-eyes approval, rollback, compliance, drift remediation, and audit operations with role-based access control.
- Implemented `AppForgeWorkspace.html` — single-page responsive enterprise visual workspace interface providing 13 core navigation views (Home Dashboard, Applications, Template Factory, Visual Designer, Versions, Packages, Deployments, Governance, Migrations, Drift, Audit Timeline).
- Created `tests/AppForgeStudioTestSuite.js` — 75 comprehensive automated test scenarios covering Workspace Dashboard, Template Factory, Declarative Designer Operations, 20-Stage Customer Journey for Employee Onboarding, Governance/4-Eyes Gating, Drift Detection/Remediation, and Security/Failure Isolation.
- Created `scratch/test_studio_journey_audit.js` — forensic validation runner certifying all 20 lifecycle stages on real platform records.
- All 675/675 automated test scenarios passed (75 Prompt 018 + 600 regressions, 100% green).

## [0.15.0] - 2026-08-24

### Added — Stage 12: Enterprise Governance, Policy-as-Code & Compliance Factory
- Created Governance Registry schemas: `x_appforge_policy`, `x_appforge_policy_exception`, `x_appforge_control`, `x_appforge_compliance_assessment`, `x_appforge_policy_evaluation`, `x_appforge_governance_run`.
- Implemented `AppForgePolicyEngine.js` — declarative Policy-as-Code engine with anti-scripting/eval/SQL syntax guards, policy versioning, and built-in policy packs (`APPFORGE_BASELINE`, `ENTERPRISE_SECURITY`, `AI_SAFETY`).
- Implemented `AppForgePolicyEvaluator.js` — evaluates declarative policies against target application artifacts producing explainable reasons and structured results (`COMPLIANT`, `NON_COMPLIANT`, `WARNING`, `NOT_APPLICABLE`).
- Implemented `AppForgeComplianceEvidence.js` — collects, sanitizes (`[REDACTED_SECRET]`), and cryptographically hashes (SHA-256) compliance evidence across platform registries.
- Implemented `AppForgeComplianceEngine.js` — runs assessments, computes deterministic compliance percentages (e.g. 100%, 92%), logs findings, and recommends remediations.
- Implemented `AppForgeControlTestEngine.js` — executes deterministic control validation tests against platform state (`PASS`, `FAIL`, `NOT_TESTED`).
- Implemented `AppForgeGovernanceExceptionManager.js` — manages policy exceptions with Four-Eyes principle (`requested_by != approved_by`), expiry tracking, and risk ratings.
- Implemented `AppForgeGovernanceRemediationEngine.js` — enforces safety classifications on remediations (`READ_ONLY`, `SAFE_AUTOMATION`, `APPROVAL_REQUIRED`, `FORBIDDEN`), blocking destructive operations (`DROP_TABLE`, `DELETE_DATA`).
- Implemented `AppForgeAIGovernanceEngine.js` — enforces AI safety guardrails (zero secrets, zero tenant leakage, explainable decisions, human gates).
- Implemented `AppForgeGovernanceGate.js` — pre-flight governance gate for Production Deployments, Migrations, and Installations.
- Implemented `AppForgeGovernanceAPI.js` — Scripted REST API for policies, compliance assessments, exceptions, drift, and remediation with strict RBAC.
- Created `tests/AppForgeGovernanceTestSuite.js` — 74 automated test scenarios covering Policy-as-Code, Security Baselines, Compliance, Exceptions, Drift Remediation, and Multi-Tenant Isolation.
- Created `scratch/test_governance_artifact_audit.js` — real platform verification of policy evaluation on `Employee Onboarding`, controlled violation detection, automated drift remediation, Four-Eyes exception gating, and multi-tenant isolation.
- All 600/600 automated test scenarios passed (74 Prompt 015 + 526 regressions).

## [0.14.0] - 2026-08-23

### Added — Stage 11: Enterprise Federation & Multi-Tenant Marketplace Foundation
- Created Federation & Marketplace Registry schemas: `x_appforge_tenant`, `x_appforge_tenant_member`, `x_appforge_organization`, `x_appforge_marketplace_app`, `x_appforge_subscription`, `x_appforge_application_installation`, `x_appforge_federated_instance`, `x_appforge_tenant_configuration`, `x_appforge_feature_entitlement`, `x_appforge_marketplace_audit`.
- Implemented `AppForgeTenantManager.js` — tenant provisioning, lifecycle states (`PROVISIONING`, `ACTIVE`, `SUSPENDED`, `LOCKED`, `TERMINATED`), tenant-scoped user roles (`TENANT_OWNER`, `TENANT_ADMIN`, `TENANT_DEVELOPER`, `TENANT_OPERATOR`, `TENANT_VIEWER`), anti-circular organization hierarchy validation, and strict multi-tenant isolation.
- Implemented `AppForgeMarketplaceSecurityAnalyzer.js` — scans application packages for raw credentials, eval/Function, SQL/JDBC, and unapproved cross-scope modifications (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- Implemented `AppForgeMarketplacePublisher.js` — multi-stage application publishing workflow with Four-Eyes principle (`requested_by != approved_by`) preventing self-approval.
- Implemented `AppForgeLicenseProvider.js` — provider-neutral licensing abstraction (Free, Trial, User-Based, App-Based, Subscription, Enterprise) without storing raw payment credentials.
- Implemented `AppForgeEntitlementEngine.js` — determines tenant application, feature flag, API, and user seat limit entitlements (`ENTITLED`, `NOT_ENTITLED`, `EXPIRED`, `SUSPENDED`, `LIMIT_EXCEEDED`).
- Implemented `AppForgeSubscriptionManager.js` — tenant subscription lifecycle management (`subscribe`, `activate`, `suspend`, `renew`, `cancel`, `expire`).
- Implemented `AppForgeDistributionEngine.js` — package version resolution, canonical SHA-256 checksum verification, and HMAC digital signature validation.
- Implemented `AppForgeMarketplaceCatalog.js` — catalog searching, category filtering, publisher queries, and visibility enforcement.
- Implemented `AppForgeFederationManager.js` — cross-instance federation controller validating instance identity and credential references (never raw credentials).
- Implemented `AppForgeApplicationInstaller.js` — multi-stage application installation orchestrator reusing existing Package, Deployment, Migration, and Security engines.
- Implemented `AppForgeMarketplaceAPI.js` — Scripted REST API for tenant management, marketplace publishing, subscriptions, licensing, installation, and federation.
- Created `tests/AppForgeFederationTestSuite.js` — 70 automated test scenarios covering Tenant Isolation, Marketplace Publishing, Security Scanning, Licensing, Entitlements, Package Integrity, and Cross-Instance Federation.
- Created `scratch/test_federation_artifact_audit.js` — real platform verification of multi-tenant provisioning, cross-tenant isolation, package tampering blocking, and marketplace installation on `Employee Onboarding`.
- All 526/526 automated test scenarios passed (70 Prompt 014 + 456 regressions).

## [0.13.0] - 2026-08-23

### Added — Stage 10: Application Intelligence & Observability Factory
- Created Telemetry & Intelligence Registry schemas: `x_appforge_telemetry`, `x_appforge_incident`, `x_appforge_remediation`, `x_appforge_intelligence_run`, `x_appforge_intelligence_finding`, `x_appforge_intelligence_recommendation`.
- Implemented `AppForgeTelemetryService.js` — cross-layer telemetry ingestion across all 5 architectural tiers with automatic secret sanitization (`[REDACTED_SECRET]`), deduplication, and retention policies.
- Implemented `AppForgeMetricsEngine.js` — metrics engine calculating Counters, Gauges, Histograms, Latencies (avg, p50, p95, p99), Error Rates, and Success Rates.
- Implemented `AppForgeBaselineEngine.js` — statistical baseline engine (min, max, average, median, p95, std dev) over configurable time windows without claiming ML.
- Implemented `AppForgeAnomalyDetector.js` — detects threshold violations, latency spikes, error spikes, failure patterns, and security anomalies.
- Implemented `AppForgeApplicationHealthEngine.js` — deterministic 0–100 health scoring (`HEALTHY`, `DEGRADED`, `WARNING`, `CRITICAL`, `UNKNOWN`) across weighted architectural layers.
- Implemented `AppForgeIncidentCorrelationEngine.js` — correlates multi-layer event cascades by correlation ID into singular incident groups.
- Implemented `AppForgeRootCauseEngine.js` — evidence-based root cause analysis tracing through architectural dependency graphs.
- Implemented `AppForgeChangeCorrelationEngine.js` — correlates incidents with recent deployments, migrations, and package changes (`POSSIBLE_CHANGE_CORRELATION`).
- Implemented `AppForgeRecommendationEngine.js` — deterministic recommendation generator with safety classifications (`READ_ONLY`, `SAFE_AUTOMATION`, `APPROVAL_REQUIRED`, `FORBIDDEN`).
- Implemented `AppForgeDiagnosticEngine.js` — master diagnostic coordinator aggregating health, metrics, anomalies, incidents, and root causes into audit logs.
- Implemented `AppForgeIntelligenceContext.js` — prepares sanitized, secret-free context packages for downstream AI reasoning.
- Implemented `MockIntelligenceProvider.js` — provider-neutral AI interface abstraction.
- Implemented `AppForgeIntelligenceAPI.js` — Scripted REST API for `/health`, `/anomalies`, `/diagnose`, `/recommend`, `/summary/{id}` with strict RBAC.
- Created `tests/AppForgeIntelligenceTestSuite.js` — 66 automated test scenarios covering Telemetry, Metrics, Baselines, Health Scoring, Anomaly Detection, Incident Correlation, Root Cause, Recommendations, Safety Model, AI Context, and Failure Scenarios.
- Created `scratch/test_intelligence_artifact_audit.js` — real platform verification of multi-layer telemetry ingestion, health scoring, latency spike anomaly detection, incident correlation, root cause diagnosis, and remediation gating.
- All 456/456 automated test scenarios passed (66 Prompt 013 + 390 regressions).

## [0.12.0] - 2026-08-23

### Added — Stage 9: Enterprise Migration & High-Volume Data Transformation Factory
- Created Migration Registry schemas: `x_appforge_migration`, `x_appforge_migration_operation`, `x_appforge_reference_mapping`, `x_appforge_migration_error`, `x_appforge_migration_marker`, `x_appforge_migration_audit`.
- Implemented `AppForgeMigrationValidator.js` — validates schema operations, 12 transformation types, reference mappings, data types, and strictly blocks unsafe SQL/JDBC/eval and cross-scope modifications.
- Implemented `AppForgeMigrationRiskEngine.js` — assesses migration risks (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) based on volume, schema alterations, and reversibility.
- Implemented `AppForgeMigrationPlanner.js` — dry-run dependency-ordered migration planner modifying 0 target database records during planning.
- Implemented `AppForgeMigrationLockManager.js` — mutex locking on applications and tables to prevent concurrent colliding migrations.
- Implemented `AppForgeMigrationBatchProcessor.js` — chunked high-volume batch processor with per-batch checkpointing, pause/resume/cancel controls, before/after SHA-256 state checksums, and execution markers.
- Implemented `AppForgeMigrationReconciler.js` — post-migration reconciliation engine verifying record counts, checksums, reference integrity, and failure thresholds.
- Implemented `AppForgeMigrationRollback.js` — compensating rollback manager restoring transformed records from before-values with rollback reconciliation.
- Implemented `AppForgeMigrationCutover.js` — zero/minimal-downtime cutover coordinator (`PREPARED` → `READY` → `APPROVED` → `CUTOVER` → `VERIFIED`).
- Implemented `AppForgeMigrationExecutor.js` — end-to-end migration coordinator with audit logging (`X-Correlation-ID`) and secret protection.
- Implemented `AppForgeMigrationAPI.js` — Scripted REST API for `/plan`, `/dry-run`, `/validate`, `/start`, `/pause`, `/resume`, `/cancel`, `/rollback`, `/status` with strict RBAC.
- Created `tests/AppForgeMigrationTestSuite.js` — 66 automated test scenarios covering Registry, Schema, Planning, Transformations, Batching, Idempotency, Reconciliation, Failure/Quarantine, Rollback, Security/Anti-SQL, Approvals, and Real Operations.
- Created `scratch/test_migration_artifact_audit.js` — real platform verification of schema evolution (`onboarding_status`), data normalization (`department` → `UPPERCASE`), 10-record & 1,000-record batch execution, pause/resume, rollback, and reconciliation.
- All 390/390 automated test scenarios passed (66 Prompt 012 + 324 regressions).

## [0.11.0] - 2026-08-23

### Added — Stage 8: Deployment Pipeline & Multi-Environment Orchestration Factory
- Created Deployment Registry schemas: `x_appforge_environment`, `x_appforge_instance_target`, `x_appforge_deployment_pipeline`, `x_appforge_deployment_run`, `x_appforge_deployment_operation`, `x_appforge_deployment_approval`, `x_appforge_deployment_audit`, `x_appforge_promotion_history`.
- Implemented `AppForgeTargetHealthChecker.js` — validates instance reachability, credential references, AppForge versions, and target lock state.
- Implemented `AppForgeDeploymentLockManager.js` — exclusive deployment locks per environment to block concurrent writes with timeout safeguards.
- Implemented `AppForgeDeploymentPreflight.js` — multi-criteria pre-flight engine validating integrity, health, security, compatibility, locks, and approvals.
- Implemented `AppForgeDeploymentPlanner.js` — dry-run deployment planner generating dependency-ordered operation manifests.
- Implemented `AppForgeDeploymentRollback.js` — reverse-order compensating rollback orchestrator with restoration verification.
- Implemented `AppForgeDeploymentVerifier.js` — post-deployment verification of Data, Experience, Behavior, Security, and Integration layers.
- Implemented `AppForgeDeploymentSmokeTest.js` — non-destructive automated smoke test suite for deployed applications.
- Implemented `AppForgeApplicationHealthChecker.js` — runtime health assessment engine (`HEALTHY`, `DEGRADED`, `FAILED`).
- Implemented `AppForgeEnvironmentDriftDetector.js` — detects version, schema, and security drift across environments.
- Implemented `AppForgeDeploymentExecutor.js` — coordinates end-to-end checkpointed deployments, audit logging (`X-Correlation-ID`), and secret sanitization (`[REDACTED_SECRET]`).
- Implemented `AppForgeDeploymentAPI.js` — Scripted REST API for `/plan`, `/dry-run`, `/validate`, `/start`, `/approve`, `/rollback` with RBAC (`x_appforge.deployer`, `x_appforge.release_manager`, `x_appforge.admin`).
- Created `tests/AppForgeDeploymentTestSuite.js` — 57 automated test scenarios covering Environment, Pipeline, Preflight, Four-Eyes Approval, Deployment, Checkpointing, Rollback, Security, GitHub Tracking, Drift, and Real Operations.
- Created `scratch/test_deployment_artifact_audit.js` — real platform verification of health checks, pre-flight, Four-Eyes approval gate, locking, dry-run, execution, verification, rollback, and drift detection.
- All 324/324 automated test scenarios passed (57 Prompt 011 + 267 regressions).

## [0.10.0] - 2026-08-23

### Added — Stage 7: Application Packaging, Versioning & Lifecycle Governance Factory
- Created Packaging & Lifecycle Registry schemas: `x_appforge_package`, `x_appforge_application_version`, `x_appforge_migration`, `x_appforge_package_snapshot`, `x_appforge_release_approval`, `x_appforge_release_run`, `x_appforge_release_operation`.
- Implemented `AppForgePackageInventory.js` — inventories all 5 application layers (Data, Experience, Behavior, Security, Integration) and performs completeness checks.
- Implemented `AppForgeChecksumEngine.js` — calculates deterministic, order-independent SHA-256 checksums from canonicalized component metadata.
- Implemented `AppForgePackageSigner.js` — cryptographically signs and verifies application packages using HMAC-SHA256 digests.
- Implemented `AppForgePackageDiffEngine.js` — compares application versions, identifying ADDED, MODIFIED, UNCHANGED, REMOVED, and BREAKING changes.
- Implemented `AppForgeReleaseNotesGenerator.js` — generates structured, deterministic release notes markdown from package diffs.
- Implemented `AppForgePackageCompatibilityChecker.js` — verifies platform, AppForge version, and environment compatibility (`DEV`, `TEST`, `UAT`, `PRODUCTION`) while enforcing strict downgrade protection.
- Implemented `AppForgePackageSecurityAnalyzer.js` — scans packages for raw secrets, unsafe scripts, admin escalation, and destructive drop operations.
- Implemented `AppForgePackagePlanner.js` — dependency-ordered dry-run planner for application imports and upgrades, generating migration steps and rollback strategies.
- Implemented `AppForgeLifecycleManager.js` — manages application lifecycle gates (`PLANNED` → `DEVELOPMENT` → `TESTING` → `UAT` → `PRODUCTION-READY`) with release approvals.
- Implemented `AppForgePackageExecutor.js` — builds packages, serializes snapshots, registers semantic versions, and records audit logs.
- Implemented `AppForgePackageAPI.js` — Scripted REST API for `POST /api/x_appforge/package/export`, `/plan`, `/import`, and `/approve` with strict RBAC.
- Created `tests/AppForgePackageTestSuite.js` — 45 automated test scenarios covering Packaging, Versioning, Dependencies, Security, Planning, Lifecycle, GitHub Tracking, and Real Platform Operations.
- Created `scratch/test_package_artifact_audit.js` — real platform verification of 5-layer inventory, packaging v1.0.0 & v1.1.0, checksums, diff engine, release notes, migration & rollback planning, and idempotency.
- All 267/267 automated test scenarios passed (45 Prompt 010 + 222 regressions).

## [0.9.0] - 2026-08-23

### Added — Stage 6: Integration & API Factory
- Created Integration Registry schemas: `x_appforge_integration`, `x_appforge_api`, `x_appforge_api_resource`, `x_appforge_outbound_integration`, `x_appforge_webhook`, `x_appforge_authentication`, `x_appforge_integration_run`, `x_appforge_integration_operation`.
- Implemented `AppForgeTransformationEngine.js` — transforms fields across 9 data types (`STRING`, `INTEGER`, `DECIMAL`, `BOOLEAN`, `DATE`, `DATETIME`, `UPPERCASE`, `LOWERCASE`, `TRIM`).
- Implemented `AppForgeRequestMappingEngine.js` — evaluates declarative request mapping templates (`${current.<field>}`).
- Implemented `AppForgeResponseMappingEngine.js` — maps external HTTP response fields back to ServiceNow target record fields with type transformations.
- Implemented `AppForgeRetryEngine.js` — retry policies (`NONE`, `FIXED`, `EXPONENTIAL`) while skipping non-retryable 4xx/authentication errors.
- Implemented `AppForgeIdempotencyManager.js` — prevents duplicate record creation by caching request keys and delivery IDs.
- Implemented `AppForgeRateLimiter.js` — enforces integration-level rate limits per minute/hour with 429 response handling.
- Implemented `AppForgeIntegrationValidator.js` — validates endpoints, HTTP methods, authentication references, mappings, timeouts, and cross-scope restrictions.
- Implemented `AppForgeIntegrationSecurityAnalyzer.js` — pre-flight scanner detecting raw credential leakage, public anonymous write APIs, cross-scope access, and destructive DELETE API endpoints.
- Implemented `AppForgeIntegrationPlanner.js` — dependency-ordered dry-run planner (Authentications → Integrations → Inbound APIs & Resources → Outbound REST & Mappings → Webhooks).
- Implemented `AppForgeIntegrationRollback.js` — compensating rollback manager for reversible integration artifacts.
- Implemented `AppForgeIntegrationExecutor.js` — provisions real ServiceNow platform integration artifacts: `sys_ws_definition`, `sys_ws_operation`, `sys_rest_message`, `sys_rest_message_fn`, and writes AppForge integration registries with correlation IDs (`X-Correlation-ID`) and header/cookie secret masking.
- Implemented `MockEmployeeHRProvider.js` — controlled mock endpoint provider for automated tests and connectivity testing.
- Implemented `AppForgeIntegrationAPI.js` — Scripted REST API for `POST /api/x_appforge/integration/plan`, `/execute`, and `/test` with strict RBAC (`x_appforge.admin` / `x_appforge.developer`).
- Created `tests/AppForgeIntegrationTestSuite.js` — 45 automated test scenarios covering Registry, REST API, Authentication, Request/Response, Webhook, Retry, Security, Integration Mocks, and Real Platform Integration.
- Created `scratch/test_integration_artifact_audit.js` — real platform verification of inbound API, outbound REST, webhook HMAC, mapping, transformation, idempotency, and audit masking.
- All 222/222 automated test scenarios passed (45 Prompt 009 + 177 regressions).

## [0.8.0] - 2026-08-23

### Added — Stage 5: Security & Access Control Factory
- Created Security Registry schemas: `x_appforge_role`, `x_appforge_acl`, `x_appforge_data_policy`, `x_appforge_security_policy`, `x_appforge_security_run`, `x_appforge_security_operation`.
- Implemented `AppForgeSecurityValidator.js` — validates application-scoped roles, role hierarchy (cycle/circular inheritance detection), table/field/record ACLs, data policies, and cross-scope restrictions.
- Implemented `AppForgeSecurityAnalyzer.js` — pre-flight security analyzer scanning for admin lockout risk, privilege escalation, cross-scope access, public access risk, wildcard write rules, and sensitive field exposure.
- Implemented `AppForgeSecurityPlanner.js` — dependency-ordered dry-run planner (Roles by inheritance → Table ACLs → Field ACLs → Record ACLs → Data Policies).
- Implemented `AppForgeSecurityRollback.js` — compensating rollback manager for reversible security artifacts.
- Implemented `AppForgeSecurityExecutor.js` — provisions real ServiceNow platform security artifacts: `sys_user_role`, `sys_user_role_contains`, `sys_security_acl`, `sys_security_acl_role`, `sys_data_policy2`, `sys_data_policy_rule`, and updates AppForge security registries.
- Implemented `AppForgeSecurityAPI.js` — Scripted REST API for `POST /api/x_appforge/security/plan` & `POST /api/x_appforge/security/execute` with strict RBAC.
- Created `tests/AppForgeSecurityTestSuite.js` — 40 automated test scenarios covering Roles, ACLs, Field Security, Record Security, Data Policies, Security Analysis, API Security, and End-to-End Integration.
- Created `scratch/test_security_artifact_audit.js` — real positive/negative authorization testing matrix across normal user, manager, admin, field security (`salary`), record security (`manager = current_user`), and data policy enforcement.
- All 177/177 automated test scenarios passed (40 Prompt 008 + 137 regressions).

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
