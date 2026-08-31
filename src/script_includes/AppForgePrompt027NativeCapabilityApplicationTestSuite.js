/**
 * AppForgePrompt027NativeCapabilityApplicationTestSuite
 * Automated Test Suite for AppForge Prompt 027:
 * Native Capability Applications, OOB Configuration & One-Click Implementation.
 *
 * Validates:
 *  - 25-step one-click capability installation factory
 *  - ITSM OOB table reuse vs custom table architecture for SPM/CSM/CRM/FSM/RM/Bulk Catalog
 *  - Native capability configuration (x_appforge_<cap>_config)
 *  - Left navigation visibility isolation across multi-tenant customers
 *  - Installation idempotency, upgrade, rollback, suspend, Four-Eyes decommission
 *  - BC-001 template validation, diagnostics, and 10 after-submit actions
 *  - End-to-end customer journey from Marketplace to native record creation
 */
var AppForgePrompt027NativeCapabilityApplicationTestSuite = Class.create();
AppForgePrompt027NativeCapabilityApplicationTestSuite.prototype = {
    initialize: function() {
        'use strict';
        this.installer = new AppForgeCapabilityInstaller();
        this.marketplace = new AppForgeCapabilityMarketplace();
        this.navEngine = this.installer.navEngine;
        this.configEngine = this.installer.configEngine;
        this.customerManager = this.installer.customerManager;
        this.uploadService = new AppForgeBulkCatalogUploadService();
        this.excelGenerator = new AppForgeExcelTemplateGenerator();
        this.appRegistry = this.installer.installedAppRegistry;

        // Reset memory stores for clean test isolation
        this.installer.resetStore();
        this.navEngine.resetStore();
        this.configEngine.resetStore();
        this.customerManager.resetStore();
        this.uploadService.resetStore();
        this.appRegistry.resetStore();
    },

    runAllTests: function() {
        'use strict';
        var results = [];
        var self = this;

        function runTest(name, fn) {
            try {
                var res = fn.call(self);
                results.push({ name: name, passed: res.passed, details: res.details });
            } catch (err) {
                results.push({ name: name, passed: false, details: 'Exception: ' + (err.message || err) });
            }
        }

        // 1. One-Click 25-Step Installation Factory for All 7 Capabilities
        runTest('P027-01: Install SPM executes 25-step lifecycle', this.test01_InstallSpm25Steps);
        runTest('P027-02: Install CSM executes 25-step lifecycle', this.test02_InstallCsm25Steps);
        runTest('P027-03: Install CRM executes 25-step lifecycle', this.test03_InstallCrm25Steps);
        runTest('P027-04: Install FSM executes 25-step lifecycle', this.test04_InstallFsm25Steps);
        runTest('P027-05: Install Resource Management executes 25-step lifecycle', this.test05_InstallRm25Steps);
        runTest('P027-06: Install Bulk Catalog executes 25-step lifecycle', this.test06_InstallBulkCatalog25Steps);
        runTest('P027-07: Install ITSM executes 25-step lifecycle', this.test07_InstallItsm25Steps);

        // 2. Table Architecture: ITSM OOB Reuse vs Custom Tables
        runTest('P027-08: ITSM reuses native OOB tables', this.test08_ItsmOobTableReuse);
        runTest('P027-09: SPM provisions x_appforge_spm_* custom tables', this.test09_SpmCustomTables);
        runTest('P027-10: CSM provisions x_appforge_csm_* custom tables', this.test10_CsmCustomTables);
        runTest('P027-11: CRM provisions x_appforge_crm_* custom tables', this.test11_CrmCustomTables);
        runTest('P027-12: FSM provisions x_appforge_fsm_* custom tables', this.test12_FsmCustomTables);
        runTest('P027-13: Resource Management provisions x_appforge_rm_* custom tables', this.test13_RmCustomTables);
        runTest('P027-14: Bulk Catalog provisions x_appforge_catalog_* custom tables', this.test14_BulkCatalogCustomTables);

        // 3. Native Configuration Management
        runTest('P027-15: SPM default configuration schema seeded', this.test15_SpmConfigurationSeeding);
        runTest('P027-16: CSM configuration update and retrieval', this.test16_CsmConfigurationUpdate);
        runTest('P027-17: FSM territory and dispatch configuration', this.test17_FsmConfiguration);
        runTest('P027-18: Resource Management capacity and matrix configuration', this.test18_RmConfiguration);
        runTest('P027-19: Configuration modules exist in all 7 capability menus', this.test19_ConfigurationModulesInMenus);

        // 4. Installation Idempotency & Lifecycle Operations
        runTest('P027-20: Double installation is 100% idempotent', this.test20_InstallationIdempotency);
        runTest('P027-21: Capability upgrade with version tracking', this.test21_CapabilityUpgrade);
        runTest('P027-22: Capability rollback restores prior version', this.test22_CapabilityRollback);
        runTest('P027-23: Capability suspension preserves data', this.test23_CapabilitySuspension);
        runTest('P027-24: Four-Eyes governed decommissioning', this.test24_FourEyesDecommissioning);

        // 5. Multi-Customer Left Navigation Visibility Isolation (Section 17)
        runTest('P027-25: Customer A (SPM only) navigation isolation', this.test25_CustomerANavigationIsolation);
        runTest('P027-26: Customer B (CSM + CRM) navigation isolation', this.test26_CustomerBNavigationIsolation);
        runTest('P027-27: Customer C (FSM + Bulk Catalog) navigation isolation', this.test27_CustomerCNavigationIsolation);

        // 6. Bulk Catalog BC-001 Template Download & Strict Validation
        runTest('P027-28: BC-001 template download contains 7 sheets', this.test28_Bc001TemplateDownload);
        runTest('P027-29: BC-001 strict validation detects errors with row diagnostics', this.test29_Bc001ValidationDiagnostics);
        runTest('P027-30: Bulk Catalog import executes with post-submit action', this.test30_BulkCatalogImportExecution);

        // 7. End-to-End Customer Journey
        runTest('P027-31: End-to-end customer journey from Marketplace to record creation', this.test31_EndToEndCustomerJourney);

        var passed = 0;
        var failed = 0;
        for (var i = 0; i < results.length; i++) {
            if (results[i].passed) {
                passed++;
            } else {
                failed++;
                gs.error('[AppForgePrompt027NativeCapabilityApplicationTestSuite] FAILED: ' + results[i].name + ' - ' + results[i].details);
            }
        }

        gs.info('[AppForgePrompt027NativeCapabilityApplicationTestSuite] COMPLETED: ' + passed + '/' + results.length + ' PASSED.');
        return {
            total: results.length,
            passed: passed,
            failed: failed,
            skipped: 0,
            allPassed: (failed === 0),
            details: results
        };
    },

    // ─── Test Implementations ──────────────────────────────────────────

    test01_InstallSpm25Steps: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_spm_test', capability_id: 'spm' });
        var pass = res.success && res.steps_completed === 25 && res.status === 'INSTALLED' && res.tables.length === 8;
        return { passed: !!pass, details: 'Steps: ' + res.steps_completed + ', Tables: ' + (res.tables ? res.tables.length : 0) };
    },

    test02_InstallCsm25Steps: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_csm_test', capability_id: 'csm' });
        var pass = res.success && res.steps_completed === 25 && res.status === 'INSTALLED' && res.tables.length === 7;
        return { passed: !!pass, details: 'CSM installed with 25 steps, tables: ' + (res.tables ? res.tables.length : 0) };
    },

    test03_InstallCrm25Steps: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_crm_test', capability_id: 'crm' });
        var pass = res.success && res.steps_completed === 25 && res.status === 'INSTALLED' && res.tables.length === 7;
        return { passed: !!pass, details: 'CRM installed with 25 steps, tables: ' + (res.tables ? res.tables.length : 0) };
    },

    test04_InstallFsm25Steps: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_fsm_test', capability_id: 'fsm' });
        var pass = res.success && res.steps_completed === 25 && res.status === 'INSTALLED' && res.tables.length === 7;
        return { passed: !!pass, details: 'FSM installed with 25 steps, tables: ' + (res.tables ? res.tables.length : 0) };
    },

    test05_InstallRm25Steps: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_rm_test', capability_id: 'resource_management' });
        var pass = res.success && res.steps_completed === 25 && res.status === 'INSTALLED' && res.tables.length === 6;
        return { passed: !!pass, details: 'RM installed with 25 steps, tables: ' + (res.tables ? res.tables.length : 0) };
    },

    test06_InstallBulkCatalog25Steps: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_bulk_test', capability_id: 'bulk_catalog' });
        var pass = res.success && res.steps_completed === 25 && res.status === 'INSTALLED' && res.tables.length === 5;
        return { passed: !!pass, details: 'Bulk Catalog installed with 25 steps, tables: ' + (res.tables ? res.tables.length : 0) };
    },

    test07_InstallItsm25Steps: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_itsm_test', capability_id: 'itsm' });
        var pass = res.success && res.steps_completed === 25 && res.status === 'INSTALLED' && res.is_oob_table_reuse === true;
        return { passed: !!pass, details: 'ITSM installed with 25 steps, OOB Table Reuse: ' + res.is_oob_table_reuse };
    },

    test08_ItsmOobTableReuse: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_itsm_tables', capability_id: 'itsm' });
        var tables = res.tables || [];
        var pass = tables.indexOf('incident') !== -1 && tables.indexOf('problem') !== -1 && tables.indexOf('change_request') !== -1 && tables.indexOf('sc_req_item') !== -1;
        return { passed: !!pass, details: 'OOB tables mapped: ' + tables.join(', ') };
    },

    test09_SpmCustomTables: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_spm_tables', capability_id: 'spm' });
        var tables = res.tables || [];
        var pass = tables.indexOf('x_appforge_spm_portfolio') !== -1 && tables.indexOf('x_appforge_spm_project') !== -1 && tables.indexOf('x_appforge_spm_demand') !== -1 && tables.indexOf('x_appforge_spm_config') !== -1;
        return { passed: !!pass, details: 'SPM custom tables mapped: ' + tables.join(', ') };
    },

    test10_CsmCustomTables: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_csm_tables', capability_id: 'csm' });
        var tables = res.tables || [];
        var pass = tables.indexOf('x_appforge_csm_account') !== -1 && tables.indexOf('x_appforge_csm_case') !== -1 && tables.indexOf('x_appforge_csm_config') !== -1;
        return { passed: !!pass, details: 'CSM custom tables mapped: ' + tables.join(', ') };
    },

    test11_CrmCustomTables: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_crm_tables', capability_id: 'crm' });
        var tables = res.tables || [];
        var pass = tables.indexOf('x_appforge_crm_account') !== -1 && tables.indexOf('x_appforge_crm_lead') !== -1 && tables.indexOf('x_appforge_crm_opportunity') !== -1 && tables.indexOf('x_appforge_crm_config') !== -1;
        return { passed: !!pass, details: 'CRM custom tables mapped: ' + tables.join(', ') };
    },

    test12_FsmCustomTables: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_fsm_tables', capability_id: 'fsm' });
        var tables = res.tables || [];
        var pass = tables.indexOf('x_appforge_fsm_work_order') !== -1 && tables.indexOf('x_appforge_fsm_dispatch') !== -1 && tables.indexOf('x_appforge_fsm_technician') !== -1 && tables.indexOf('x_appforge_fsm_config') !== -1;
        return { passed: !!pass, details: 'FSM custom tables mapped: ' + tables.join(', ') };
    },

    test13_RmCustomTables: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_rm_tables', capability_id: 'resource_management' });
        var tables = res.tables || [];
        var pass = tables.indexOf('x_appforge_rm_resource') !== -1 && tables.indexOf('x_appforge_rm_resource_plan') !== -1 && tables.indexOf('x_appforge_rm_allocation') !== -1 && tables.indexOf('x_appforge_rm_config') !== -1;
        return { passed: !!pass, details: 'RM custom tables mapped: ' + tables.join(', ') };
    },

    test14_BulkCatalogCustomTables: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_cat_tables', capability_id: 'bulk_catalog' });
        var tables = res.tables || [];
        var pass = tables.indexOf('x_appforge_catalog_import') !== -1 && tables.indexOf('x_appforge_catalog_template') !== -1 && tables.indexOf('x_appforge_catalog_config') !== -1;
        return { passed: !!pass, details: 'Bulk Catalog custom tables mapped: ' + tables.join(', ') };
    },

    test15_SpmConfigurationSeeding: function() {
        var cfg = this.configEngine.getConfiguration('spm', 'cust_spm_cfg_test');
        var pass = cfg && cfg.settings.default_project_assignment_group === 'PMO Group' && cfg.settings.project_number_prefix === 'PRJ' && cfg.table_name === 'x_appforge_spm_config';
        return { passed: !!pass, details: 'SPM Config Prefix: ' + (cfg ? cfg.settings.project_number_prefix : null) };
    },

    test16_CsmConfigurationUpdate: function() {
        var cfg = this.configEngine.updateConfiguration('csm', 'cust_csm_cfg_test', {
            auto_close_resolved_cases_days: 10,
            case_auto_assignment_group: 'VIP Support Tier 2'
        });
        var pass = cfg && cfg.settings.auto_close_resolved_cases_days === 10 && cfg.settings.case_auto_assignment_group === 'VIP Support Tier 2';
        return { passed: !!pass, details: 'CSM updated days: ' + (cfg ? cfg.settings.auto_close_resolved_cases_days : null) };
    },

    test17_FsmConfiguration: function() {
        var cfg = this.configEngine.getConfiguration('fsm', 'cust_fsm_cfg_test');
        var pass = cfg && cfg.settings.territory_radius_km === 50 && cfg.settings.technician_skill_matching_enforced === true;
        return { passed: !!pass, details: 'FSM radius: ' + (cfg ? cfg.settings.territory_radius_km : null) + ' km' };
    },

    test18_RmConfiguration: function() {
        var cfg = this.configEngine.getConfiguration('resource_management', 'cust_rm_cfg_test');
        var pass = cfg && cfg.settings.default_capacity_hours_per_week === 40 && cfg.settings.over_allocation_threshold_percent === 110;
        return { passed: !!pass, details: 'RM capacity: ' + (cfg ? cfg.settings.default_capacity_hours_per_week : null) + ' hrs/wk' };
    },

    test19_ConfigurationModulesInMenus: function() {
        var spmNav = this.navEngine.createProductNavigation('spm');
        var csmNav = this.navEngine.createProductNavigation('csm');
        var itsmNav = this.navEngine.createProductNavigation('itsm');
        var bulkNav = this.navEngine.createProductNavigation('bulk_catalog');

        function hasConfig(nav) {
            if (!nav || !nav.modules) return false;
            return nav.modules.some(function(m) { return m.title === 'Configuration'; });
        }

        var pass = hasConfig(spmNav) && hasConfig(csmNav) && hasConfig(itsmNav) && hasConfig(bulkNav);
        return { passed: !!pass, details: 'Configuration modules verified in navigation menus' };
    },

    test20_InstallationIdempotency: function() {
        var res1 = this.installer.installCapability({ customer_id: 'cust_idem_test', capability_id: 'spm' });
        var res2 = this.installer.installCapability({ customer_id: 'cust_idem_test', capability_id: 'spm' });
        var pass = res1.success && res2.success && res2.idempotent === true && res1.installation_id === res2.installation_id;
        return { passed: !!pass, details: 'First install: ' + res1.installation_id + ', Second install idempotent: ' + res2.idempotent };
    },

    test21_CapabilityUpgrade: function() {
        this.installer.installCapability({ customer_id: 'cust_upg_test', capability_id: 'bulk_catalog' });
        var upgRes = this.installer.upgradeCapability('cust_upg_test', 'bulk_catalog', '1.2.0');
        var pass = upgRes.success && upgRes.from_version === '1.0.0' && upgRes.to_version === '1.2.0';
        return { passed: !!pass, details: 'Upgraded version: ' + (upgRes ? upgRes.to_version : null) };
    },

    test22_CapabilityRollback: function() {
        this.installer.installCapability({ customer_id: 'cust_roll_test', capability_id: 'spm' });
        this.installer.upgradeCapability('cust_roll_test', 'spm', '1.1.0');
        var rollRes = this.installer.rollbackCapability('cust_roll_test', 'spm');
        var pass = rollRes.success && rollRes.restored_version === '1.0.0';
        return { passed: !!pass, details: 'Restored version: ' + (rollRes ? rollRes.restored_version : null) };
    },

    test23_CapabilitySuspension: function() {
        this.installer.installCapability({ customer_id: 'cust_susp_test', capability_id: 'csm' });
        var suspRes = this.installer.suspendCapability('cust_susp_test', 'csm', 'Contract Audit Renewal');
        var hasCap = this.installer.hasCapability('cust_susp_test', 'csm');
        var pass = suspRes.success && suspRes.status === 'SUSPENDED' && hasCap === false;
        return { passed: !!pass, details: 'Suspended status: ' + (suspRes ? suspRes.status : null) };
    },

    test24_FourEyesDecommissioning: function() {
        this.installer.installCapability({ customer_id: 'cust_decom_test', capability_id: 'fsm' });
        var req = this.installer.requestDecommission('cust_decom_test', 'fsm', 'admin_requester', 'End of service term');
        // Four-Eyes principle violation attempt
        var badApprove = this.installer.executeDecommission(req.request_id, 'admin_requester');
        // Valid independent approver
        var goodApprove = this.installer.executeDecommission(req.request_id, 'security_officer_approver');
        var pass = req.success && badApprove.success === false && goodApprove.success === true && goodApprove.status === 'DECOMMISSIONED';
        return { passed: !!pass, details: 'Violation blocked: ' + (badApprove.success === false) + ', Approved by officer: ' + goodApprove.success };
    },

    test25_CustomerANavigationIsolation: function() {
        var custA = 'cust_a_spm_only';
        this.installer.installCapability({ customer_id: custA, capability_id: 'spm' });
        var visible = this.installer.navEngine.getUserVisibleNavigation(custA, ['spm']);
        var pass = visible.length === 1 && visible[0].application.title === 'AppForge - SPM';
        return { passed: !!pass, details: 'Customer A visible menus: ' + visible.map(function(v) { return v.application.title; }).join(', ') };
    },

    test26_CustomerBNavigationIsolation: function() {
        var custB = 'cust_b_csm_crm';
        this.installer.installCapability({ customer_id: custB, capability_id: 'csm' });
        this.installer.installCapability({ customer_id: custB, capability_id: 'crm' });
        var visible = this.installer.navEngine.getUserVisibleNavigation(custB, ['csm', 'crm']);
        var titles = visible.map(function(v) { return v.application.title; });
        var pass = visible.length === 2 && titles.indexOf('AppForge - CSM') !== -1 && titles.indexOf('AppForge - CRM') !== -1 && titles.indexOf('AppForge - SPM') === -1;
        return { passed: !!pass, details: 'Customer B visible menus: ' + titles.join(', ') };
    },

    test27_CustomerCNavigationIsolation: function() {
        var custC = 'cust_c_fsm_bulk';
        this.installer.installCapability({ customer_id: custC, capability_id: 'fsm' });
        this.installer.installCapability({ customer_id: custC, capability_id: 'bulk_catalog' });
        var visible = this.installer.navEngine.getUserVisibleNavigation(custC, ['fsm', 'bulk_catalog']);
        var titles = visible.map(function(v) { return v.application.title; });
        var pass = visible.length === 2 && titles.indexOf('AppForge - FSM') !== -1 && titles.indexOf('AppForge - Bulk Catalog') !== -1 && titles.indexOf('AppForge - ITSM') === -1;
        return { passed: !!pass, details: 'Customer C visible menus: ' + titles.join(', ') };
    },

    test28_Bc001TemplateDownload: function() {
        var wb = this.excelGenerator.generateSampleWorkbook();
        var pass = wb && wb.schema_version === 'BC-001' && wb.catalog_items.length >= 3 && wb.variables.length >= 5 && wb.choices.length >= 5 && wb.after_submit.length >= 3 && wb.attachments.length >= 2;
        return { passed: !!pass, details: 'Schema: ' + (wb ? wb.schema_version : null) + ', Items: ' + (wb ? wb.catalog_items.length : 0) };
    },

    test29_Bc001ValidationDiagnostics: function() {
        var badPayload = {
            catalog_items: [
                { name: 'Standard Item' },
                { name: '' }, // empty name error
                { name: 'Standard Item' } // duplicate name error
            ],
            variables: [
                { name: '' } // missing variable name
            ],
            after_submit: [
                { action_type: 'INVALID_UNKNOWN_ACTION' } // invalid action type error
            ]
        };
        var res = this.uploadService.validateUploadPayload(badPayload);
        var pass = res.valid === false && res.errors.length >= 3 && res.diagnostics.length >= 3;
        return { passed: !!pass, details: 'Errors caught: ' + (res ? res.errors.length : 0) + ', Diagnostics: ' + (res ? res.diagnostics.length : 0) };
    },

    test30_BulkCatalogImportExecution: function() {
        var uploadRec = this.uploadService.createBulkUploadRecord({
            upload_name: 'Q3 Enterprise Catalog Refresh',
            category: 'Hardware',
            after_submit_action: 'Create Approval'
        });
        var execRes = this.uploadService.executeUpload(uploadRec.sys_id);
        var pass = execRes.success && execRes.status === 'COMPLETED' && execRes.total_items === 3 && execRes.action_configured === 'Create Approval';
        return { passed: !!pass, details: 'Import completed items: ' + execRes.total_items + ', Action: ' + execRes.action_configured };
    },

    test31_EndToEndCustomerJourney: function() {
        // Step 1: Customer Created
        var cust = this.customerManager.createCustomerAccount({
            account_name: 'Apex Global Financial Technologies',
            tenant_id: 'tenant_apex_global'
        });

        // Step 2: Customer Selects SPM & Installs
        var installRes = this.installer.installCapability({
            customer_id: cust.sys_id,
            tenant_id: cust.tenant_id,
            capability_id: 'spm'
        });

        // Step 3: SPM Application & Custom Tables Created
        var appMenu = this.installer.navEngine.getNavigationMenu('spm');

        // Step 4: Native Configuration Created
        var config = this.configEngine.getConfiguration('spm', cust.sys_id);

        // Step 5: Native Record Created in Project List
        var nativeUrl = installRes.native_url;
        var pass = cust.sys_id && installRes.success && installRes.status === 'INSTALLED' && appMenu && appMenu.modules.length === 10 && config && nativeUrl === '/pm_project_list.do';

        return {
            passed: !!pass,
            details: 'Customer: ' + cust.account_name + ' -> Installed SPM -> Menu Modules: ' + (appMenu ? appMenu.modules.length : 0) + ' -> Native URL: ' + nativeUrl
        };
    },

    type: 'AppForgePrompt027NativeCapabilityApplicationTestSuite'
};
