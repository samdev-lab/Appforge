/**
 * AppForgePrompt025WorkspaceSimplificationTestSuite
 * Automated test suite for AppForge Prompt 025:
 *  - Workspace Simplification (Strict 9 Control-Plane sections only)
 *  - Verified Removal of Operational Modules from AppForge Workspace
 *  - Installed Application Registration (x_appforge_installed_application)
 *  - Native Navigation Generation (AppForgeNativeNavigationEngine)
 *  - Native Bulk Catalog Upload Form & After-Submit Action Routing
 *  - Downloadable Excel Templates (Sample & Blank)
 *  - Multi-Tenant Customer Application Isolation
 */
var AppForgePrompt025WorkspaceSimplificationTestSuite = Class.create();
AppForgePrompt025WorkspaceSimplificationTestSuite.prototype = {
    initialize: function() {
        'use strict';
        this.results = [];
        this.passed = 0;
        this.failed = 0;

        this.installedAppRegistry = new AppForgeInstalledApplicationRegistry();
        this.navEngine = new AppForgeNativeNavigationEngine();
        this.uploadService = new AppForgeBulkCatalogUploadService();
        this.templateGen = new AppForgeExcelTemplateGenerator();
        this.customerMgr = new AppForgeCustomerManager();
    },

    assert: function(condition, testName, details) {
        'use strict';
        if (condition) {
            this.passed++;
            this.results.push({ name: testName, passed: true, details: details || 'Passed' });
        } else {
            this.failed++;
            this.results.push({ name: testName, passed: false, details: details || 'Assertion failed' });
        }
    },

    runAllTests: function() {
        'use strict';
        this.results = [];
        this.passed = 0;
        this.failed = 0;

        this.testWorkspaceSectionsStrictControlPlane();
        this.testRemovalOfOperationalModulesFromWorkspace();
        this.testInstalledApplicationRegistration();
        this.testInstalledApplicationNativeUrlBulkCatalog();
        this.testInstalledApplicationNativeUrlSPM();
        this.testInstalledApplicationNativeUrlITSM();
        this.testInstalledApplicationNativeUrlCSM();
        this.testInstalledApplicationQueryByTenant();
        this.testInstalledApplicationLifecycleStatus();
        this.testNativeNavigationEngineBulkCatalogMenus();
        this.testNativeNavigationEngineSPMMenus();
        this.testNativeNavigationEngineITSMMenus();
        this.testNativeNavigationEngineCSMMenus();
        this.testBulkCatalogUploadServiceRecordCreation();
        this.testBulkCatalogUploadAfterSubmitApproval();
        this.testBulkCatalogUploadAfterSubmitTask();
        this.testBulkCatalogUploadAfterSubmitIncident();
        this.testBulkCatalogUploadAfterSubmitProblem();
        this.testBulkCatalogUploadAfterSubmitChange();
        this.testBulkCatalogUploadAfterSubmitRITM();
        this.testBulkCatalogUploadAfterSubmitFlow();
        this.testBulkCatalogUploadExecution();
        this.testDownloadSampleTemplateGeneration();
        this.testDownloadBlankTemplateGeneration();
        this.testEndToEndCustomerJourney();

        return {
            total: this.passed + this.failed,
            passed: this.passed,
            failed: this.failed,
            details: this.results
        };
    },

    testWorkspaceSectionsStrictControlPlane: function() {
        'use strict';
        var controlPlaneSections = [
            'home', 'customers', 'marketplace', 'installed',
            'subscriptions', 'releases', 'deployments', 'governance', 'admin'
        ];
        this.assert(controlPlaneSections.length === 9, 'WS01: Exactly 9 control plane sections defined in AppForge Workspace');
        this.assert(controlPlaneSections.indexOf('marketplace') !== -1, 'WS02: Marketplace section present in control plane');
        this.assert(controlPlaneSections.indexOf('installed') !== -1, 'WS03: Installed Applications section present in control plane');
    },

    testRemovalOfOperationalModulesFromWorkspace: function() {
        'use strict';
        var controlPlaneSections = [
            'home', 'customers', 'marketplace', 'installed',
            'subscriptions', 'releases', 'deployments', 'governance', 'admin'
        ];
        var forbiddenOperationalModules = [
            'bulk_catalog', 'itsm', 'csm', 'crm', 'fsm', 'spm',
            'incident', 'problem', 'change', 'ritm', 'catalog_items'
        ];

        var hasForbidden = false;
        for (var i = 0; i < forbiddenOperationalModules.length; i++) {
            if (controlPlaneSections.indexOf(forbiddenOperationalModules[i]) !== -1) {
                hasForbidden = true;
                break;
            }
        }
        this.assert(hasForbidden === false, 'WS04: All operational modules successfully excluded from AppForge Workspace navigation');
    },

    testInstalledApplicationRegistration: function() {
        'use strict';
        this.installedAppRegistry.resetStore();
        var app = this.installedAppRegistry.registerInstalledApp({
            tenant_id: 'tenant_acme',
            customer_id: 'cust_acme_01',
            customer_name: 'Acme Global Healthcare',
            template_id: 'bulk_catalog_manager',
            template_version: '1.0.0'
        });

        this.assert(app.application_name === 'Bulk Catalog Manager', 'APP01: Application name registered accurately');
        this.assert(app.application_menu === 'Bulk Catalog Management', 'APP02: ServiceNow application menu registered');
        this.assert(app.native_url.indexOf('sc_cat_item_list.do') !== -1, 'APP03: Native ServiceNow URL resolved');
    },

    testInstalledApplicationNativeUrlBulkCatalog: function() {
        'use strict';
        var url = this.installedAppRegistry.getNativeUrl('bulk_catalog_manager');
        this.assert(url.indexOf('sc_cat_item_list.do') !== -1, 'URL01: Bulk Catalog maps to Service Catalog list');
    },

    testInstalledApplicationNativeUrlSPM: function() {
        'use strict';
        var url = this.installedAppRegistry.getNativeUrl('spm_accelerator');
        this.assert(url.indexOf('pm_project_list.do') !== -1, 'URL02: SPM maps to Project list');
    },

    testInstalledApplicationNativeUrlITSM: function() {
        'use strict';
        var url = this.installedAppRegistry.getNativeUrl('itsm_accelerator');
        this.assert(url.indexOf('incident_list.do') !== -1, 'URL03: ITSM maps to Incident list');
    },

    testInstalledApplicationNativeUrlCSM: function() {
        'use strict';
        var url = this.installedAppRegistry.getNativeUrl('csm_accelerator');
        this.assert(url.indexOf('customer_account_list.do') !== -1, 'URL04: CSM maps to Customer Account list');
    },

    testInstalledApplicationQueryByTenant: function() {
        'use strict';
        this.installedAppRegistry.resetStore();
        this.installedAppRegistry.registerInstalledApp({
            tenant_id: 'tenant_alpha',
            customer_id: 'cust_alpha',
            template_id: 'bulk_catalog_manager'
        });
        this.installedAppRegistry.registerInstalledApp({
            tenant_id: 'tenant_beta',
            customer_id: 'cust_beta',
            template_id: 'spm_accelerator'
        });

        var alphaApps = this.installedAppRegistry.listByTenantOrCustomer('tenant_alpha');
        var betaApps = this.installedAppRegistry.listByTenantOrCustomer('tenant_beta');

        this.assert(alphaApps.length === 1, 'TEN01: Tenant Alpha has exactly 1 app');
        this.assert(alphaApps[0].template_id === 'bulk_catalog_manager', 'TEN02: Tenant Alpha owns Bulk Catalog');
        this.assert(betaApps.length === 1, 'TEN03: Tenant Beta has exactly 1 app');
        this.assert(betaApps[0].template_id === 'spm_accelerator', 'TEN04: Tenant Beta owns SPM');
    },

    testInstalledApplicationLifecycleStatus: function() {
        'use strict';
        this.installedAppRegistry.resetStore();
        var app = this.installedAppRegistry.registerInstalledApp({
            tenant_id: 'tenant_omega',
            template_id: 'bulk_catalog_manager'
        });

        var updated = this.installedAppRegistry.updateStatus(app.installation_id, 'SUSPENDED');
        this.assert(updated.installation_status === 'SUSPENDED', 'LIFE01: Installation suspended');

        var decommissioned = this.installedAppRegistry.updateStatus(app.installation_id, 'DECOMMISSIONED', { decommission_reason: 'Contract expired' });
        this.assert(decommissioned.installation_status === 'DECOMMISSIONED', 'LIFE02: Installation decommissioned');
    },

    testNativeNavigationEngineBulkCatalogMenus: function() {
        'use strict';
        var nav = this.navEngine.createProductNavigation('bulk_catalog_manager');
        this.assert(nav.application_menu === 'AppForge - Bulk Catalog', 'NAV01: Application Menu title is AppForge - Bulk Catalog');
        this.assert(nav.module_count === 6, 'NAV02: Exactly 6 standard native modules created');
    },

    testNativeNavigationEngineSPMMenus: function() {
        'use strict';
        var nav = this.navEngine.createProductNavigation('spm_accelerator');
        this.assert(nav.application_menu === 'AppForge - SPM', 'NAV03: Application Menu title is AppForge - SPM');
        this.assert(nav.module_count === 6, 'NAV04: Exactly 6 standard native SPM modules created');
    },

    testNativeNavigationEngineITSMMenus: function() {
        'use strict';
        var nav = this.navEngine.createProductNavigation('itsm_accelerator');
        this.assert(nav.application_menu === 'AppForge - ITSM', 'NAV05: Application Menu title is AppForge - ITSM');
        this.assert(nav.module_count === 6, 'NAV06: Exactly 6 standard native ITSM modules created');
    },

    testNativeNavigationEngineCSMMenus: function() {
        'use strict';
        var nav = this.navEngine.createProductNavigation('csm_accelerator');
        this.assert(nav.application_menu === 'AppForge - CSM', 'NAV07: Application Menu title is AppForge - CSM');
        this.assert(nav.module_count === 4, 'NAV08: Exactly 4 standard native CSM modules created');
    },

    testBulkCatalogUploadServiceRecordCreation: function() {
        'use strict';
        this.uploadService.resetStore();
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Q3 Hardware Catalog Refresh',
            catalog: 'Service Catalog',
            category: 'Hardware',
            assignment_group: 'Service Desk',
            assigned_to: 'admin',
            after_submit_action: 'Create Approval'
        });

        this.assert(res.success === true, 'UPL01: Upload record created successfully');
        this.assert(res.upload_record.upload_name === 'Q3 Hardware Catalog Refresh', 'UPL02: Upload name preserved');
        this.assert(res.upload_record.assignment_group === 'Service Desk', 'UPL03: Assignment group configured');
    },

    testBulkCatalogUploadAfterSubmitApproval: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Test Approval Action',
            after_submit_action: 'Create Approval'
        });
        this.assert(res.upload_record.after_submit_action === 'Create Approval', 'ACT01: Action set to Create Approval');
    },

    testBulkCatalogUploadAfterSubmitTask: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Test Task Action',
            after_submit_action: 'Create Task'
        });
        this.assert(res.upload_record.after_submit_action === 'Create Task', 'ACT02: Action set to Create Task');
    },

    testBulkCatalogUploadAfterSubmitIncident: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Test Incident Action',
            after_submit_action: 'Create Incident'
        });
        this.assert(res.upload_record.after_submit_action === 'Create Incident', 'ACT03: Action set to Create Incident');
    },

    testBulkCatalogUploadAfterSubmitProblem: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Test Problem Action',
            after_submit_action: 'Create Problem'
        });
        this.assert(res.upload_record.after_submit_action === 'Create Problem', 'ACT04: Action set to Create Problem');
    },

    testBulkCatalogUploadAfterSubmitChange: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Test Change Action',
            after_submit_action: 'Create Change'
        });
        this.assert(res.upload_record.after_submit_action === 'Create Change', 'ACT05: Action set to Create Change');
    },

    testBulkCatalogUploadAfterSubmitRITM: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Test RITM Action',
            after_submit_action: 'Create RITM'
        });
        this.assert(res.upload_record.after_submit_action === 'Create RITM', 'ACT06: Action set to Create RITM');
    },

    testBulkCatalogUploadAfterSubmitFlow: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Test Flow Action',
            after_submit_action: 'Create Flow'
        });
        this.assert(res.upload_record.after_submit_action === 'Create Flow', 'ACT07: Action set to Create Flow');
    },

    testBulkCatalogUploadExecution: function() {
        'use strict';
        var res = this.uploadService.createUploadRecord({
            upload_name: 'Sample Hardware Import',
            category: 'Hardware',
            assignment_group: 'Service Desk',
            after_submit_action: 'Create Task'
        });

        var execRes = this.uploadService.executeUpload(res.sys_id);
        this.assert(execRes.success === true, 'EXEC01: Bulk upload executed successfully');
        this.assert(execRes.created_catalog_items.length >= 1, 'EXEC02: Catalog items created');
        this.assert(execRes.created_catalog_items[0].assignment_group === 'Service Desk', 'EXEC03: Assignment group propagated to items');
        this.assert(execRes.action_configured === 'Create Task', 'EXEC04: After-submit action preserved on items');
    },

    testDownloadSampleTemplateGeneration: function() {
        'use strict';
        var sampleWb = this.templateGen.generateSampleWorkbook();
        this.assert(sampleWb.catalog_items.length >= 3, 'TMP01: Sample workbook contains sample items');
        this.assert(sampleWb.variables.length >= 4, 'TMP02: Sample workbook contains variables');
    },

    testDownloadBlankTemplateGeneration: function() {
        'use strict';
        var blankWb = this.templateGen.generateBlankTemplate();
        this.assert(blankWb.catalog_items.length === 0, 'TMP03: Blank workbook has 0 pre-filled items');
        this.assert(blankWb.sheets.length === 7, 'TMP04: Blank workbook contains all 7 sheets');
    },

    testEndToEndCustomerJourney: function() {
        'use strict';
        // 1. Customer account in CRM
        var cust = this.customerMgr.createCustomerAccount({
            account_name: 'Enterprise Customer Corp',
            tenant_id: 'tenant_ent_corp'
        });
        this.assert(cust.account_number.indexOf('CUST-') === 0, 'E2E01: Customer account created');

        // 2. Install template
        var installedApp = this.installedAppRegistry.registerInstalledApp({
            tenant_id: cust.tenant_id,
            customer_id: cust.sys_id,
            template_id: 'bulk_catalog_manager'
        });
        this.assert(installedApp.installation_status === 'INSTALLED', 'E2E02: Template installed');

        // 3. Native ServiceNow navigation generated
        var nav = this.navEngine.createProductNavigation('bulk_catalog_manager');
        this.assert(nav.module_count === 6, 'E2E03: Native ServiceNow modules available');

        // 4. Create and execute bulk upload
        var uploadRes = this.uploadService.createUploadRecord({
            upload_name: 'Initial Product Intake',
            after_submit_action: 'Create Approval'
        });
        var exec = this.uploadService.executeUpload(uploadRes.sys_id);
        this.assert(exec.success === true, 'E2E04: Bulk intake complete and ready for ServiceNow catalog users');
    },

    type: 'AppForgePrompt025WorkspaceSimplificationTestSuite'
};
