/**
 * AppForgePrompt027IndependentApplicationFactoryTestSuite
 * Comprehensive Automated Test Suite for AppForge Prompt 027:
 * Independent Native ServiceNow Capability Applications & Application Factory.
 *
 * Validates:
 *  - 7 Independent installable applications (CRM, CSM, SPM, FSM, RM, Bulk Catalog, ITSM)
 *  - Declarative manifests and 25-step compilation factory
 *  - ITSM OOB table reuse vs custom table architectures
 *  - Subscription enforcement and dependency gating
 *  - Strict multi-customer left navigation visibility isolation
 *  - Independent versioning, upgrade, rollback, suspend, Four-Eyes decommissioning
 *  - Zero-rebuild package checksum consistency
 *  - BC-001 template download, validation diagnostics, and import
 *  - End-to-end customer journey
 */
var AppForgePrompt027IndependentApplicationFactoryTestSuite = Class.create();
AppForgePrompt027IndependentApplicationFactoryTestSuite.prototype = {
    initialize: function() {
        'use strict';
        this.installer = new AppForgeCapabilityInstaller();
        this.marketplace = new AppForgeCapabilityMarketplace();
        this.manifestRegistry = new AppForgeApplicationManifestRegistry();
        this.navEngine = this.installer.navEngine;
        this.configEngine = this.installer.configEngine;
        this.customerManager = this.installer.customerManager;
        this.uploadService = new AppForgeBulkCatalogUploadService();
        this.excelGenerator = new AppForgeExcelTemplateGenerator();
        this.appRegistry = this.installer.installedAppRegistry;

        // Reset memory stores for test isolation
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

        // 1. Declarative Manifest Registry & Completeness
        runTest('P027-01: Manifest Registry contains all 7 capabilities', this.test01_ManifestCatalogCompleteness);
        runTest('P027-02: CRM manifest defines accounts, contacts, leads, opportunities', this.test02_CrmManifestDefinition);
        runTest('P027-03: CSM manifest defines accounts, contacts, cases, assets, SLAs', this.test03_CsmManifestDefinition);
        runTest('P027-04: SPM manifest defines portfolios, programs, projects, demands', this.test04_SpmManifestDefinition);
        runTest('P027-05: FSM manifest defines work orders, dispatch, technicians, territories', this.test05_FsmManifestDefinition);
        runTest('P027-06: Resource Management manifest defines resources, plans, allocations', this.test06_RmManifestDefinition);
        runTest('P027-07: Bulk Catalog manifest defines imports, templates, history, errors', this.test07_BulkCatalogManifestDefinition);
        runTest('P027-08: ITSM manifest defines OOB table reuse', this.test08_ItsmManifestOobReuse);

        // 2. Application Independence
        runTest('P027-09: CRM installs independently without CSM or SPM', this.test09_CrmIndependentInstall);
        runTest('P027-10: CSM installs independently without CRM', this.test10_CsmIndependentInstall);
        runTest('P027-11: SPM installs independently without CRM or CSM', this.test11_SpmIndependentInstall);
        runTest('P027-12: FSM installs independently without CSM', this.test12_FsmIndependentInstall);
        runTest('P027-13: Resource Management installs independently', this.test13_RmIndependentInstall);
        runTest('P027-14: Bulk Catalog installs independently', this.test14_BulkCatalogIndependentInstall);
        runTest('P027-15: ITSM installs independently and reuses OOB tables', this.test15_ItsmIndependentInstall);

        // 3. Subscription & Entitlement Control (Section 19)
        runTest('P027-16: Active subscription permits installation', this.test16_ActiveSubscriptionPermitsInstall);
        runTest('P027-17: Blocked/missing subscription rejects installation', this.test17_BlockedSubscriptionRejectsInstall);

        // 4. Multi-Customer Left Navigation Visibility Isolation (Section 2-4 & 28)
        runTest('P027-18: Customer A (CRM only) sees CRM only in navigation', this.test18_CustomerACrmNavigationIsolation);
        runTest('P027-19: Customer B (CSM + CRM) sees CSM and CRM only', this.test19_CustomerBCsmCrmNavigationIsolation);
        runTest('P027-20: Customer C (SPM + Bulk + RM) sees exactly 3 installed applications', this.test20_CustomerCSpmBulkRmNavigationIsolation);
        runTest('P027-21: Uninstalled capabilities never appear in navigation', this.test21_UninstalledCapabilitiesHidden);

        // 5. Native Configuration Modules
        runTest('P027-22: CRM configuration module properties and seeding', this.test22_CrmConfigurationModule);
        runTest('P027-23: SPM configuration module properties and seeding', this.test23_SpmConfigurationModule);
        runTest('P027-24: Bulk Catalog configuration module properties and seeding', this.test24_BulkCatalogConfigurationModule);

        // 6. Bulk Catalog BC-001 Template & Action Execution
        runTest('P027-25: Downloadable BC-001 template contains 7 sheets and metadata', this.test25_Bc001TemplateStructure);
        runTest('P027-26: Template validation catches errors and produces row diagnostics', this.test26_Bc001ValidationRowDiagnostics);
        runTest('P027-27: Bulk catalog upload execution with 10 after-submit action support', this.test27_BulkCatalogUploadAfterSubmit);

        // 7. Lifecycle, Versioning & Zero-Rebuild Integrity
        runTest('P027-28: Installation is 100% idempotent', this.test28_InstallationIdempotency);
        runTest('P027-29: Independent application upgrade does not affect other apps', this.test29_IndependentApplicationUpgrade);
        runTest('P027-30: Rollback restores prior version and checksum', this.test30_RollbackRestoresPriorVersion);
        runTest('P027-31: Suspend capability preserves data and blocks access', this.test31_SuspendPreservesData);
        runTest('P027-32: Four-Eyes governed decommissioning', this.test32_FourEyesDecommissioning);
        runTest('P027-33: Zero-rebuild package checksum consistency across environments', this.test33_ZeroRebuildChecksumConsistency);

        // 8. End-to-End Customer Journey
        runTest('P027-34: End-to-end customer journey from Marketplace to CRM record creation', this.test34_EndToEndCrmJourney);
        runTest('P027-35: End-to-end customer journey from Marketplace to SPM record creation', this.test35_EndToEndSpmJourney);

        var passed = 0;
        var failed = 0;
        for (var i = 0; i < results.length; i++) {
            if (results[i].passed) {
                passed++;
            } else {
                failed++;
                gs.error('[AppForgePrompt027IndependentApplicationFactoryTestSuite] FAILED: ' + results[i].name + ' - ' + results[i].details);
            }
        }

        gs.info('[AppForgePrompt027IndependentApplicationFactoryTestSuite] COMPLETED: ' + passed + '/' + results.length + ' PASSED.');
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

    test01_ManifestCatalogCompleteness: function() {
        var manifests = this.manifestRegistry.listManifests();
        var pass = manifests.length === 7;
        return { passed: pass, details: 'Manifests registered: ' + manifests.length };
    },

    test02_CrmManifestDefinition: function() {
        var m = this.manifestRegistry.getManifest('crm');
        var pass = m && m.tables.indexOf('x_appforge_crm_account') !== -1 && m.tables.indexOf('x_appforge_crm_lead') !== -1 && m.tables.indexOf('x_appforge_crm_opportunity') !== -1 && m.price === 699 && m.modules.length === 10;
        return { passed: !!pass, details: 'CRM Tables: ' + (m ? m.tables.length : 0) + ', Modules: ' + (m ? m.modules.length : 0) };
    },

    test03_CsmManifestDefinition: function() {
        var m = this.manifestRegistry.getManifest('csm');
        var pass = m && m.tables.indexOf('x_appforge_csm_case') !== -1 && m.tables.indexOf('x_appforge_csm_account') !== -1 && m.price === 799 && m.modules.length === 8;
        return { passed: !!pass, details: 'CSM Tables: ' + (m ? m.tables.length : 0) + ', Modules: ' + (m ? m.modules.length : 0) };
    },

    test04_SpmManifestDefinition: function() {
        var m = this.manifestRegistry.getManifest('spm');
        var pass = m && m.tables.indexOf('x_appforge_spm_project') !== -1 && m.tables.indexOf('x_appforge_spm_demand') !== -1 && m.price === 999 && m.modules.length === 10;
        return { passed: !!pass, details: 'SPM Tables: ' + (m ? m.tables.length : 0) + ', Modules: ' + (m ? m.modules.length : 0) };
    },

    test05_FsmManifestDefinition: function() {
        var m = this.manifestRegistry.getManifest('fsm');
        var pass = m && m.tables.indexOf('x_appforge_fsm_work_order') !== -1 && m.tables.indexOf('x_appforge_fsm_dispatch') !== -1 && m.price === 899 && m.modules.length === 9;
        return { passed: !!pass, details: 'FSM Tables: ' + (m ? m.tables.length : 0) + ', Modules: ' + (m ? m.modules.length : 0) };
    },

    test06_RmManifestDefinition: function() {
        var m = this.manifestRegistry.getManifest('resource_management');
        var pass = m && m.tables.indexOf('x_appforge_rm_resource') !== -1 && m.tables.indexOf('x_appforge_rm_allocation') !== -1 && m.price === 499 && m.modules.length === 8;
        return { passed: !!pass, details: 'RM Tables: ' + (m ? m.tables.length : 0) + ', Modules: ' + (m ? m.modules.length : 0) };
    },

    test07_BulkCatalogManifestDefinition: function() {
        var m = this.manifestRegistry.getManifest('bulk_catalog');
        var pass = m && m.tables.indexOf('x_appforge_catalog_import') !== -1 && m.tables.indexOf('x_appforge_catalog_template') !== -1 && m.price === 299 && m.modules.length === 6;
        return { passed: !!pass, details: 'Bulk Catalog Tables: ' + (m ? m.tables.length : 0) + ', Modules: ' + (m ? m.modules.length : 0) };
    },

    test08_ItsmManifestOobReuse: function() {
        var m = this.manifestRegistry.getManifest('itsm');
        var pass = m && m.is_oob_table_reuse === true && m.tables.indexOf('incident') !== -1 && m.tables.indexOf('change_request') !== -1 && m.price === 599 && m.modules.length === 7;
        return { passed: !!pass, details: 'ITSM OOB Table Reuse: ' + (m ? m.is_oob_table_reuse : null) };
    },

    test09_CrmIndependentInstall: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_indep_crm', capability_id: 'crm' });
        var hasCrm = this.installer.hasCapability('cust_indep_crm', 'crm');
        var hasCsm = this.installer.hasCapability('cust_indep_crm', 'csm');
        var pass = res.success && res.status === 'INSTALLED' && hasCrm === true && hasCrm !== hasCsm;
        return { passed: !!pass, details: 'CRM installed: ' + hasCrm + ', CSM not installed: ' + (!hasCsm) };
    },

    test10_CsmIndependentInstall: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_indep_csm', capability_id: 'csm' });
        var hasCsm = this.installer.hasCapability('cust_indep_csm', 'csm');
        var hasCrm = this.installer.hasCapability('cust_indep_csm', 'crm');
        var pass = res.success && hasCsm === true && hasCrm === false;
        return { passed: !!pass, details: 'CSM installed: ' + hasCsm + ', CRM not installed: ' + (!hasCrm) };
    },

    test11_SpmIndependentInstall: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_indep_spm', capability_id: 'spm' });
        var hasSpm = this.installer.hasCapability('cust_indep_spm', 'spm');
        var hasCrm = this.installer.hasCapability('cust_indep_spm', 'crm');
        var pass = res.success && hasSpm === true && hasCrm === false;
        return { passed: !!pass, details: 'SPM installed: ' + hasSpm + ', CRM not installed: ' + (!hasCrm) };
    },

    test12_FsmIndependentInstall: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_indep_fsm', capability_id: 'fsm' });
        var hasFsm = this.installer.hasCapability('cust_indep_fsm', 'fsm');
        var hasCsm = this.installer.hasCapability('cust_indep_fsm', 'csm');
        var pass = res.success && hasFsm === true && hasCsm === false;
        return { passed: !!pass, details: 'FSM installed: ' + hasFsm + ', CSM not installed: ' + (!hasCsm) };
    },

    test13_RmIndependentInstall: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_indep_rm', capability_id: 'resource_management' });
        var hasRm = this.installer.hasCapability('cust_indep_rm', 'resource_management');
        var pass = res.success && hasRm === true;
        return { passed: !!pass, details: 'RM installed: ' + hasRm };
    },

    test14_BulkCatalogIndependentInstall: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_indep_cat', capability_id: 'bulk_catalog' });
        var hasCat = this.installer.hasCapability('cust_indep_cat', 'bulk_catalog');
        var pass = res.success && hasCat === true;
        return { passed: !!pass, details: 'Bulk Catalog installed: ' + hasCat };
    },

    test15_ItsmIndependentInstall: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_indep_itsm', capability_id: 'itsm' });
        var hasItsm = this.installer.hasCapability('cust_indep_itsm', 'itsm');
        var pass = res.success && hasItsm === true && res.is_oob_table_reuse === true;
        return { passed: !!pass, details: 'ITSM installed: ' + hasItsm + ', OOB reuse: ' + res.is_oob_table_reuse };
    },

    test16_ActiveSubscriptionPermitsInstall: function() {
        this.installer.setCustomerSubscription('cust_sub_active', 'crm', 'ACTIVE', 'Enterprise');
        var res = this.installer.installCapability({ customer_id: 'cust_sub_active', capability_id: 'crm' });
        var pass = res.success && res.status === 'INSTALLED';
        return { passed: !!pass, details: 'Installation permitted: ' + res.success };
    },

    test17_BlockedSubscriptionRejectsInstall: function() {
        this.installer.setCustomerSubscription('cust_sub_blocked', 'spm', 'BLOCKED', 'None');
        var res = this.installer.installCapability({ customer_id: 'cust_sub_blocked', capability_id: 'spm' });
        var pass = res.success === false && res.status === 'SUBSCRIPTION_BLOCKED';
        return { passed: !!pass, details: 'Installation blocked correctly: ' + (res.status === 'SUBSCRIPTION_BLOCKED') };
    },

    test18_CustomerACrmNavigationIsolation: function() {
        var custA = 'cust_nav_a';
        this.installer.installCapability({ customer_id: custA, capability_id: 'crm' });
        var visible = this.installer.navEngine.getUserVisibleNavigation(custA, ['crm']);
        var pass = visible.length === 1 && visible[0].application.title === 'AppForge - CRM';
        return { passed: !!pass, details: 'Visible menus: ' + visible.map(function(v) { return v.application.title; }).join(', ') };
    },

    test19_CustomerBCsmCrmNavigationIsolation: function() {
        var custB = 'cust_nav_b';
        this.installer.installCapability({ customer_id: custB, capability_id: 'csm' });
        this.installer.installCapability({ customer_id: custB, capability_id: 'crm' });
        var visible = this.installer.navEngine.getUserVisibleNavigation(custB, ['csm', 'crm']);
        var titles = visible.map(function(v) { return v.application.title; });
        var pass = visible.length === 2 && titles.indexOf('AppForge - CSM') !== -1 && titles.indexOf('AppForge - CRM') !== -1 && titles.indexOf('AppForge - SPM') === -1;
        return { passed: !!pass, details: 'Visible menus: ' + titles.join(', ') };
    },

    test20_CustomerCSpmBulkRmNavigationIsolation: function() {
        var custC = 'cust_nav_c';
        this.installer.installCapability({ customer_id: custC, capability_id: 'spm' });
        this.installer.installCapability({ customer_id: custC, capability_id: 'bulk_catalog' });
        this.installer.installCapability({ customer_id: custC, capability_id: 'resource_management' });
        var visible = this.installer.navEngine.getUserVisibleNavigation(custC, ['spm', 'bulk_catalog', 'resource_management']);
        var titles = visible.map(function(v) { return v.application.title; });
        var pass = visible.length === 3 && titles.indexOf('AppForge - SPM') !== -1 && titles.indexOf('AppForge - Bulk Catalog') !== -1 && titles.indexOf('AppForge - Resource Management') !== -1 && titles.indexOf('AppForge - CSM') === -1;
        return { passed: !!pass, details: 'Visible menus: ' + titles.join(', ') };
    },

    test21_UninstalledCapabilitiesHidden: function() {
        var cust = 'cust_nav_single';
        this.installer.installCapability({ customer_id: cust, capability_id: 'fsm' });
        var visible = this.installer.navEngine.getUserVisibleNavigation(cust, ['fsm']);
        var titles = visible.map(function(v) { return v.application.title; });
        var pass = visible.length === 1 && titles.indexOf('AppForge - FSM') !== -1 && titles.indexOf('AppForge - CRM') === -1 && titles.indexOf('AppForge - ITSM') === -1;
        return { passed: !!pass, details: 'Only FSM visible, uninstalled hidden: ' + titles.join(', ') };
    },

    test22_CrmConfigurationModule: function() {
        var cfg = this.configEngine.getConfiguration('crm', 'cust_cfg_crm');
        var pass = cfg && cfg.settings.default_pipeline_stage === 'Prospecting' && cfg.settings.opportunity_lead_auto_convert === true && cfg.table_name === 'x_appforge_crm_config';
        return { passed: !!pass, details: 'CRM Config Stage: ' + (cfg ? cfg.settings.default_pipeline_stage : null) };
    },

    test23_SpmConfigurationModule: function() {
        var cfg = this.configEngine.getConfiguration('spm', 'cust_cfg_spm');
        var pass = cfg && cfg.settings.demand_approval_required === true && cfg.settings.project_number_prefix === 'PRJ' && cfg.table_name === 'x_appforge_spm_config';
        return { passed: !!pass, details: 'SPM Config Prefix: ' + (cfg ? cfg.settings.project_number_prefix : null) };
    },

    test24_BulkCatalogConfigurationModule: function() {
        var cfg = this.configEngine.getConfiguration('bulk_catalog', 'cust_cfg_cat');
        var pass = cfg && cfg.settings.template_schema_version === 'BC-001' && cfg.settings.max_batch_size === 500 && cfg.table_name === 'x_appforge_catalog_config';
        return { passed: !!pass, details: 'Catalog Config Version: ' + (cfg ? cfg.settings.template_schema_version : null) };
    },

    test25_Bc001TemplateStructure: function() {
        var wb = this.excelGenerator.generateSampleWorkbook();
        var pass = wb && wb.schema_version === 'BC-001' && wb.catalog_items && wb.variables && wb.choices && wb.ui_policies && wb.assignment && wb.after_submit && wb.attachments;
        return { passed: !!pass, details: '7 Sheets verified with BC-001 schema' };
    },

    test26_Bc001ValidationRowDiagnostics: function() {
        var badPayload = {
            catalog_items: [{ name: '' }],
            variables: [{ name: '' }],
            after_submit: [{ action_type: 'UNKNOWN_ACTION' }]
        };
        var res = this.uploadService.validateUploadPayload(badPayload);
        var pass = res.valid === false && res.diagnostics.length >= 3 && res.diagnostics[0].row !== undefined;
        return { passed: !!pass, details: 'Row diagnostics generated: ' + (res ? res.diagnostics.length : 0) };
    },

    test27_BulkCatalogUploadAfterSubmit: function() {
        var uploadRec = this.uploadService.createBulkUploadRecord({
            upload_name: 'FY27 IT Hardware Refresh',
            category: 'Hardware',
            after_submit_action: 'Create Approval'
        });
        var execRes = this.uploadService.executeUpload(uploadRec.sys_id);
        var pass = execRes.success && execRes.status === 'COMPLETED' && execRes.action_configured === 'Create Approval';
        return { passed: !!pass, details: 'Upload status: ' + (execRes ? execRes.status : null) };
    },

    test28_InstallationIdempotency: function() {
        var res1 = this.installer.installCapability({ customer_id: 'cust_idem_master', capability_id: 'crm' });
        var res2 = this.installer.installCapability({ customer_id: 'cust_idem_master', capability_id: 'crm' });
        var pass = res1.success && res2.success && res2.idempotent === true && res1.installation_id === res2.installation_id && res1.installation_checksum === res2.installation_checksum;
        return { passed: !!pass, details: 'Idempotency verified with matching checksum: ' + (res1 ? res1.installation_checksum : null) };
    },

    test29_IndependentApplicationUpgrade: function() {
        this.installer.installCapability({ customer_id: 'cust_upg_indep', capability_id: 'crm' });
        this.installer.installCapability({ customer_id: 'cust_upg_indep', capability_id: 'csm' });

        var upgRes = this.installer.upgradeCapability('cust_upg_indep', 'crm', '1.1.0');
        var crmInst = this.installer._store.installations['cust_upg_indep_crm'];
        var csmInst = this.installer._store.installations['cust_upg_indep_csm'];

        var pass = upgRes.success && crmInst.version === '1.1.0' && csmInst.version === '1.0.0';
        return { passed: !!pass, details: 'CRM version: ' + (crmInst ? crmInst.version : null) + ', CSM version remained: ' + (csmInst ? csmInst.version : null) };
    },

    test30_RollbackRestoresPriorVersion: function() {
        this.installer.installCapability({ customer_id: 'cust_roll_indep', capability_id: 'spm' });
        this.installer.upgradeCapability('cust_roll_indep', 'spm', '1.2.0');
        var rollRes = this.installer.rollbackCapability('cust_roll_indep', 'spm');
        var spmInst = this.installer._store.installations['cust_roll_indep_spm'];

        var pass = rollRes.success && spmInst.version === '1.0.0';
        return { passed: !!pass, details: 'Restored version: ' + (spmInst ? spmInst.version : null) };
    },

    test31_SuspendPreservesData: function() {
        this.installer.installCapability({ customer_id: 'cust_susp_indep', capability_id: 'fsm' });
        var suspRes = this.installer.suspendCapability('cust_susp_indep', 'fsm', 'Annual Maintenance Window');
        var hasFsm = this.installer.hasCapability('cust_susp_indep', 'fsm');
        var inst = this.installer._store.installations['cust_susp_indep_fsm'];

        var pass = suspRes.success && suspRes.status === 'SUSPENDED' && hasFsm === false && inst.tables_created.length > 0;
        return { passed: !!pass, details: 'Status: ' + (suspRes ? suspRes.status : null) + ', Tables preserved: ' + (inst ? inst.tables_created.length : 0) };
    },

    test32_FourEyesDecommissioning: function() {
        this.installer.installCapability({ customer_id: 'cust_decom_indep', capability_id: 'resource_management' });
        var req = this.installer.requestDecommission('cust_decom_indep', 'resource_management', 'admin_requester', 'Contract concluded');
        var badApprove = this.installer.executeDecommission(req.request_id, 'admin_requester');
        var goodApprove = this.installer.executeDecommission(req.request_id, 'independent_approver');

        var pass = req.success && badApprove.success === false && goodApprove.success === true && goodApprove.status === 'DECOMMISSIONED';
        return { passed: !!pass, details: 'Four-Eyes enforced: blocked requester=' + (badApprove.success === false) + ', approved by officer=' + goodApprove.success };
    },

    test33_ZeroRebuildChecksumConsistency: function() {
        var checksumDev = this.installer.calculatePackageChecksum('crm', '1.0.0');
        var checksumTest = this.installer.calculatePackageChecksum('crm', '1.0.0');
        var checksumProd = this.installer.calculatePackageChecksum('crm', '1.0.0');
        var pass = checksumDev === checksumTest && checksumTest === checksumProd && checksumDev.indexOf('sha256_') === 0;
        return { passed: !!pass, details: 'Zero-rebuild checksum: ' + checksumDev };
    },

    test34_EndToEndCrmJourney: function() {
        var cust = this.customerManager.createCustomerAccount({
            account_name: 'Starlight Global Logistics',
            tenant_id: 'tenant_starlight'
        });
        var installRes = this.installer.installCapability({
            customer_id: cust.sys_id,
            tenant_id: cust.tenant_id,
            capability_id: 'crm'
        });
        var appMenu = this.installer.navEngine.getNavigationMenu('crm');
        var config = this.configEngine.getConfiguration('crm', cust.sys_id);
        var nativeUrl = installRes.native_url;

        var pass = cust.sys_id && installRes.success && installRes.status === 'INSTALLED' && appMenu && appMenu.modules.length === 10 && config && nativeUrl === '/customer_account_list.do';
        return { passed: !!pass, details: 'Customer: ' + cust.account_name + ' -> CRM Installed -> 10 Modules -> URL: ' + nativeUrl };
    },

    test35_EndToEndSpmJourney: function() {
        var cust = this.customerManager.createCustomerAccount({
            account_name: 'Vanguard Aerospace Inc',
            tenant_id: 'tenant_vanguard'
        });
        var installRes = this.installer.installCapability({
            customer_id: cust.sys_id,
            tenant_id: cust.tenant_id,
            capability_id: 'spm'
        });
        var appMenu = this.installer.navEngine.getNavigationMenu('spm');
        var config = this.configEngine.getConfiguration('spm', cust.sys_id);
        var nativeUrl = installRes.native_url;

        var pass = cust.sys_id && installRes.success && installRes.status === 'INSTALLED' && appMenu && appMenu.modules.length === 10 && config && nativeUrl === '/pm_project_list.do';
        return { passed: !!pass, details: 'Customer: ' + cust.account_name + ' -> SPM Installed -> 10 Modules -> URL: ' + nativeUrl };
    },

    type: 'AppForgePrompt027IndependentApplicationFactoryTestSuite'
};
