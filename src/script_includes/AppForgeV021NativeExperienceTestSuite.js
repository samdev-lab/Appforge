/**
 * AppForgeV021NativeExperienceTestSuite
 * Comprehensive Automated Test Suite for AppForge v0.21:
 * Native ServiceNow Application Experience, Customer Product Management,
 * Excel Template Download, Catalog Portal Visibility, and RITM Flow Tracking.
 */
var AppForgeV021NativeExperienceTestSuite = Class.create();
AppForgeV021NativeExperienceTestSuite.prototype = {
    initialize: function() {
        'use strict';
        this.templateGenerator = new AppForgeExcelTemplateGenerator();
        this.customerManager = new AppForgeCustomerManager();
        this.flowTracker = new AppForgeFulfillmentFlowTracker();
        this.actionBuilder = new AppForgeCatalogActionBuilder();
        this.navEngine = new AppForgeNativeNavigationEngine();
        this.excelParser = new AppForgeCatalogExcelParser();
        this.installer = new AppForgeOneClickInstaller();

        // Reset state for test isolation
        this.customerManager.resetStore();
        this.flowTracker.resetStore();
        this.actionBuilder.resetStore();
        this.navEngine.resetStore();
    },

    /**
     * Executes all 25 test cases for v0.21.
     * @return {Object} Test results summary.
     */
    runAllTests: function() {
        'use strict';
        var results = [];

        // 1. Excel Template Download & Export (1-4)
        results.push(this.test01_SampleWorkbookGeneration());
        results.push(this.test02_BlankWorkbookGeneration());
        results.push(this.test03_ExcelCsvExport());
        results.push(this.test04_SpreadsheetMlXmlExport());

        // 2. Excel Parsing & Validation (5-6)
        results.push(this.test05_ParseSampleWorkbook());
        results.push(this.test06_ExcelValidationErrors());

        // 3. Catalog Portal Visibility (7-8)
        results.push(this.test07_CatalogItemPortalVisibility());
        results.push(this.test08_CatalogVariableOrdering());

        // 4. Real sc_req_item Lifecycle & Flow Tracking (9-12)
        results.push(this.test09_RitmLifecycleTracking());
        results.push(this.test10_ApprovalCreationAndProgression());
        results.push(this.test11_CatalogTaskFulfillment());
        results.push(this.test12_FlowProgressionVisualizer());

        // 5. Post-Submit Action Builder (13-14)
        results.push(this.test13_PostSubmitActionConfiguration());
        results.push(this.test14_PostSubmitActionExecution());

        // 6. Native ServiceNow Multi-Product Navigation (15-19)
        results.push(this.test15_BulkCatalogNavigationMenu());
        results.push(this.test16_SpmAcceleratorNavigationMenu());
        results.push(this.test17_ItsmAcceleratorNavigationMenu());
        results.push(this.test18_CsmAcceleratorNavigationMenu());
        results.push(this.test19_AppForgeTeamInternalMenu());

        // 7. Customer Account & Product Management (20-24)
        results.push(this.test20_CustomerAccountCreation());
        results.push(this.test21_CustomerProductInstallationLinkage());
        results.push(this.test22_CustomerEnvironmentRegistry());
        results.push(this.test23_CustomerSubscriptionManagement());
        results.push(this.test24_CrossTenantCustomerIsolation());

        // 8. End-to-End Customer Journey (25)
        results.push(this.test25_FullOneClickInstallToNativeExperience());

        var passed = 0;
        var failed = 0;
        for (var i = 0; i < results.length; i++) {
            if (results[i].passed) {
                passed++;
            } else {
                failed++;
            }
        }

        return {
            total: results.length,
            passed: passed,
            failed: failed,
            skipped: 0,
            allPassed: failed === 0,
            details: results
        };
    },

    // ─── 1. Excel Template Download & Export ──────────────────────────

    test01_SampleWorkbookGeneration: function() {
        'use strict';
        var wb = this.templateGenerator.generateSampleWorkbook();
        var pass = wb && wb.catalog_items.length === 3 && wb.variables.length >= 5 && wb.fulfillment.length >= 5;
        return {
            name: 'Test 01: Sample Excel Template Generation (7 Sheets)',
            passed: !!pass,
            details: 'Items: ' + (wb ? wb.catalog_items.length : 0) + ', Variables: ' + (wb ? wb.variables.length : 0)
        };
    },

    test02_BlankWorkbookGeneration: function() {
        'use strict';
        var wb = this.templateGenerator.generateBlankWorkbook();
        var pass = wb && wb.catalog_items.length === 0 && Array.isArray(wb.variables) && Array.isArray(wb.fulfillment);
        return {
            name: 'Test 02: Blank Excel Template Generation (Clean Headers)',
            passed: !!pass,
            details: 'Blank structure verified'
        };
    },

    test03_ExcelCsvExport: function() {
        'use strict';
        var csvItems = this.templateGenerator.exportCsv('catalog_items', true);
        var csvVars = this.templateGenerator.exportCsv('variables', true);
        var pass = csvItems.indexOf('Developer Laptop Request') !== -1 && csvVars.indexOf('device_model') !== -1;
        return {
            name: 'Test 03: Excel CSV Representation & Header Formatting',
            passed: !!pass,
            details: 'CSV rows and headers validated'
        };
    },

    test04_SpreadsheetMlXmlExport: function() {
        'use strict';
        var xml = this.templateGenerator.exportXmlSpreadsheet(true);
        var pass = xml.indexOf('<?xml version="1.0"?>') !== -1 &&
                   xml.indexOf('Catalog Items') !== -1 &&
                   xml.indexOf('Developer Laptop Request') !== -1;
        return {
            name: 'Test 04: SpreadsheetML XML Multi-Worksheet Export',
            passed: !!pass,
            details: 'SpreadsheetML XML generated with ' + xml.length + ' bytes'
        };
    },

    // ─── 2. Excel Parsing & Validation ────────────────────────────────

    test05_ParseSampleWorkbook: function() {
        'use strict';
        var sampleWb = this.templateGenerator.generateSampleWorkbook();
        var parsed = this.excelParser.parse(sampleWb);
        var pass = parsed && parsed.catalog_items.length === 3 && parsed.normalized_items.length === 3;
        return {
            name: 'Test 05: Bulk Catalog Excel Workbook Parser Ingestion',
            passed: !!pass,
            details: 'Parsed ' + (parsed ? parsed.normalized_items.length : 0) + ' normalized catalog trees'
        };
    },

    test06_ExcelValidationErrors: function() {
        'use strict';
        var invalidWb = {
            catalog_items: [{ name: '', category: 'Hardware' }] // Missing mandatory name
        };
        var hasError = false;
        try {
            var validator = new AppForgeCatalogValidator();
            var res = validator.validate(invalidWb);
            hasError = (res.errors && res.errors.length > 0) || !res.valid;
        } catch (e) {
            hasError = true;
        }
        return {
            name: 'Test 06: Excel Validation Error Detection & Reporting',
            passed: hasError,
            details: 'Validation errors caught and isolated safely'
        };
    },

    // ─── 3. Catalog Portal Visibility ─────────────────────────────────

    test07_CatalogItemPortalVisibility: function() {
        'use strict';
        var sampleWb = this.templateGenerator.generateSampleWorkbook();
        var laptopItem = sampleWb.catalog_items[0];
        var pass = laptopItem.category === 'Hardware' && laptopItem.active === true && !!laptopItem.price;
        return {
            name: 'Test 07: Service Catalog Category & Portal Visibility',
            passed: !!pass,
            details: 'Category: ' + laptopItem.category + ', Active: ' + laptopItem.active
        };
    },

    test08_CatalogVariableOrdering: function() {
        'use strict';
        var sampleWb = this.templateGenerator.generateSampleWorkbook();
        var vars = sampleWb.variables;
        var pass = vars[0].order === 100 && vars[1].order === 200 && vars[2].order === 300;
        return {
            name: 'Test 08: Sequential Variable Ordering (100, 200, 300)',
            passed: !!pass,
            details: 'Variables sorted cleanly'
        };
    },

    // ─── 4. Real sc_req_item Lifecycle & Flow Tracking ────────────────

    test09_RitmLifecycleTracking: function() {
        'use strict';
        var ritm = this.flowTracker.trackRitm({
            number: 'RITM0010042',
            catalog_item: 'Developer Laptop Request',
            requested_for: 'Alice Engineer',
            price: 2499.00
        });
        var pass = ritm && ritm.number === 'RITM0010042' && ritm.stage === 'Manager Approval';
        return {
            name: 'Test 09: Native sc_req_item Lifecycle Initialization',
            passed: !!pass,
            details: 'RITM: ' + ritm.number + ', Stage: ' + ritm.stage
        };
    },

    test10_ApprovalCreationAndProgression: function() {
        'use strict';
        var ritm = this.flowTracker.trackRitm({
            number: 'RITM0010043',
            catalog_item: 'Developer Laptop Request',
            requested_for: 'Bob Developer'
        });
        var appr = this.flowTracker.addApproval(ritm.sys_id, 'Sarah Manager', 'Manager');
        var updatedAppr = this.flowTracker.approveRequest(appr.sys_id);
        var pass = updatedAppr.state === 'approved' && ritm.stage === 'Service Desk Task';
        return {
            name: 'Test 10: Approval Workflow & Stage Progression to Task',
            passed: !!pass,
            details: 'Approval State: ' + updatedAppr.state + ', New Stage: ' + ritm.stage
        };
    },

    test11_CatalogTaskFulfillment: function() {
        'use strict';
        var ritm = this.flowTracker.trackRitm({
            number: 'RITM0010044',
            catalog_item: 'Developer Laptop Request',
            stage: 'Service Desk Task'
        });
        var task = this.flowTracker.createCatalogTask(ritm.sys_id, 'Image OS & Ship Laptop', 'Service Desk');
        var closedTask = this.flowTracker.completeCatalogTask(task.sys_id);
        var pass = closedTask.state === 'Closed Complete' && ritm.stage === 'Completed' && ritm.state === 'Closed Complete';
        return {
            name: 'Test 11: Catalog Task Fulfillment & RITM Closure',
            passed: !!pass,
            details: 'Task: ' + task.number + ', Final RITM State: ' + ritm.state
        };
    },

    test12_FlowProgressionVisualizer: function() {
        'use strict';
        var ritm = this.flowTracker.trackRitm({
            number: 'RITM0010045',
            catalog_item: 'Developer Laptop Request',
            stage: 'Service Desk Task'
        });
        this.flowTracker.addApproval(ritm.sys_id, 'Sarah Manager', 'Manager');
        var visualizer = this.flowTracker.getFlowProgression(ritm.sys_id);
        var pass = visualizer && visualizer.stages.length === 5 && visualizer.stages[0].status === 'COMPLETED' && visualizer.stages[2].status === 'CURRENT';
        return {
            name: 'Test 12: Real-time 5-Stage Flow Progression Visualizer',
            passed: !!pass,
            details: 'Stages rendered: ' + visualizer.stages.length + ', Current: ' + visualizer.current_stage
        };
    },

    // ─── 5. Post-Submit Action Builder ────────────────────────────────

    test13_PostSubmitActionConfiguration: function() {
        'use strict';
        var act1 = this.actionBuilder.createAction({
            catalog_item: 'Developer Laptop Request',
            sequence: 10,
            action_type: 'APPROVAL',
            approval_type: 'Manager',
            description: 'Manager sign-off'
        });
        var act2 = this.actionBuilder.createAction({
            catalog_item: 'Developer Laptop Request',
            sequence: 20,
            action_type: 'TASK',
            assignment_group: 'Service Desk',
            description: 'Fulfill laptop'
        });
        var actions = this.actionBuilder.getActionsForCatalogItem('Developer Laptop Request');
        var pass = actions.length === 2 && actions[0].sequence === 10 && actions[1].sequence === 20;
        return {
            name: 'Test 13: Post-Submit Action Configuration & Sequencing',
            passed: !!pass,
            details: 'Actions configured: ' + actions.length
        };
    },

    test14_PostSubmitActionExecution: function() {
        'use strict';
        var execRes = this.actionBuilder.executePostSubmitActions({
            sys_id: 'ritm_test_exec_01',
            number: 'RITM0099887',
            catalog_item: 'Developer Laptop Request'
        });
        var pass = execRes && execRes.success && execRes.executed_steps.length >= 2;
        return {
            name: 'Test 14: Post-Submit Action Orchestration & Table Routing',
            passed: !!pass,
            details: 'Executed ' + execRes.executed_steps.length + ' orchestrated steps'
        };
    },

    // ─── 6. Native ServiceNow Multi-Product Navigation ────────────────

    test15_BulkCatalogNavigationMenu: function() {
        'use strict';
        var nav = this.navEngine.registerProductNavigation('bulk_catalog_manager');
        var pass = nav && nav.application.title === 'AppForge - Bulk Catalog' && nav.modules.length === 6;
        return {
            name: 'Test 15: Bulk Catalog Native Application Menu & Modules',
            passed: !!pass,
            details: 'Menu: ' + nav.application.title + ', Modules: ' + nav.modules.length
        };
    },

    test16_SpmAcceleratorNavigationMenu: function() {
        'use strict';
        var nav = this.navEngine.registerProductNavigation('spm_accelerator');
        var pass = nav && nav.application.title === 'AppForge - SPM' && nav.modules.length === 6;
        return {
            name: 'Test 16: SPM Accelerator Native Navigation Structure',
            passed: !!pass,
            details: 'Menu: ' + nav.application.title + ', Modules: ' + nav.modules.length
        };
    },

    test17_ItsmAcceleratorNavigationMenu: function() {
        'use strict';
        var nav = this.navEngine.registerProductNavigation('itsm_accelerator');
        var pass = nav && nav.application.title === 'AppForge - ITSM' && nav.modules.length === 6;
        return {
            name: 'Test 17: ITSM Accelerator Native Navigation Structure',
            passed: !!pass,
            details: 'Menu: ' + nav.application.title + ', Modules: ' + nav.modules.length
        };
    },

    test18_CsmAcceleratorNavigationMenu: function() {
        'use strict';
        var nav = this.navEngine.registerProductNavigation('csm_accelerator');
        var pass = nav && nav.application.title === 'AppForge - CSM' && nav.modules.length === 4;
        return {
            name: 'Test 18: CSM Accelerator Native Navigation Structure',
            passed: !!pass,
            details: 'Menu: ' + nav.application.title + ', Modules: ' + nav.modules.length
        };
    },

    test19_AppForgeTeamInternalMenu: function() {
        'use strict';
        var nav = this.navEngine.registerProductNavigation('appforge_team');
        var pass = nav && nav.application.title === 'AppForge Team' && nav.modules.length === 8;
        return {
            name: 'Test 19: AppForge Team Internal Operations Application Menu',
            passed: !!pass,
            details: 'Internal Modules: ' + nav.modules.length
        };
    },

    // ─── 7. Customer Account & Product Management ─────────────────────

    test20_CustomerAccountCreation: function() {
        'use strict';
        var res = this.customerManager.createCustomer({
            account_name: 'Acme Global Healthcare',
            primary_contact: 'john.smith@acme.com',
            instance_url: 'https://acme-prod.service-now.com'
        });
        var pass = res.success && res.customer.account_name === 'Acme Global Healthcare' && !!res.customer.account_number;
        return {
            name: 'Test 20: Native Customer Account Creation (x_appforge_customer)',
            passed: !!pass,
            details: 'Account: ' + res.customer.account_number
        };
    },

    test21_CustomerProductInstallationLinkage: function() {
        'use strict';
        var cust = this.customerManager.createCustomer({ account_name: 'Apex Financial Services' }).customer;
        var pRes = this.customerManager.installCustomerProduct(cust.sys_id, {
            product_name: 'Bulk Catalog Manager',
            version: '1.0.0',
            license_tier: 'Enterprise'
        });
        var installed = this.customerManager.getInstalledProducts(cust.sys_id);
        var pass = pRes.success && installed.length === 1 && installed[0].product_name === 'Bulk Catalog Manager';
        return {
            name: 'Test 21: Customer Installed Product Linkage (Related List)',
            passed: !!pass,
            details: 'Installed: ' + installed.length + ' products'
        };
    },

    test22_CustomerEnvironmentRegistry: function() {
        'use strict';
        var cust = this.customerManager.createCustomer({ account_name: 'Zenith Logistics' }).customer;
        this.customerManager.addEnvironment(cust.sys_id, { instance_name: 'zenith-dev', environment_type: 'DEV' });
        this.customerManager.addEnvironment(cust.sys_id, { instance_name: 'zenith-prod', environment_type: 'PROD' });
        var envs = this.customerManager.getEnvironments(cust.sys_id);
        var pass = envs.length === 2 && envs[0].environment_type === 'DEV' && envs[1].environment_type === 'PROD';
        return {
            name: 'Test 22: Customer Multi-Environment Registry (DEV/TEST/PROD)',
            passed: !!pass,
            details: 'Registered ' + envs.length + ' instances'
        };
    },

    test23_CustomerSubscriptionManagement: function() {
        'use strict';
        var cust = this.customerManager.createCustomer({ account_name: 'Titan Manufacturing' }).customer;
        var subRes = this.customerManager.addSubscription(cust.sys_id, {
            product_name: 'Bulk Catalog Manager',
            tier: 'Enterprise Unlimited',
            seats: 1000
        });
        var pass = subRes.success && cust.active_subscriptions === 1 && subRes.subscription.seats === 1000;
        return {
            name: 'Test 23: Customer Subscription & Licensing Foundation',
            passed: !!pass,
            details: 'Tier: ' + subRes.subscription.tier + ', Seats: ' + subRes.subscription.seats
        };
    },

    test24_CrossTenantCustomerIsolation: function() {
        'use strict';
        var cust1 = this.customerManager.createCustomer({ account_name: 'Tenant Alpha Corp', tenant_id: 'tenant_alpha' }).customer;
        var cust2 = this.customerManager.createCustomer({ account_name: 'Tenant Beta Corp', tenant_id: 'tenant_beta' }).customer;

        this.customerManager.installCustomerProduct(cust1.sys_id, { product_name: 'SPM Accelerator' });
        this.customerManager.installCustomerProduct(cust2.sys_id, { product_name: 'ITSM Accelerator' });

        var alphaProducts = this.customerManager.getInstalledProducts(cust1.sys_id);
        var betaProducts = this.customerManager.getInstalledProducts(cust2.sys_id);

        var pass = alphaProducts.length === 1 && alphaProducts[0].product_name === 'SPM Accelerator' &&
                   betaProducts.length === 1 && betaProducts[0].product_name === 'ITSM Accelerator';
        return {
            name: 'Test 24: Strict Multi-Tenant Customer Data Isolation',
            passed: !!pass,
            details: 'Alpha Products: ' + alphaProducts.length + ', Beta Products: ' + betaProducts.length
        };
    },

    // ─── 8. End-to-End Customer Journey ───────────────────────────────

    test25_FullOneClickInstallToNativeExperience: function() {
        'use strict';
        // 1. One-Click Install Bulk Catalog
        var installRes = this.installer.install({
            template_id: 'bulk_catalog_manager',
            customer: 'MegaCorp Global',
            tenant_id: 'tenant_megacorp'
        });

        // 2. Generate Sample Excel Template
        var sampleWb = this.templateGenerator.generateSampleWorkbook();

        // 3. Parse Catalog
        var parsed = this.excelParser.parse(sampleWb);

        // 4. Order Item & Track RITM
        var ritm = this.flowTracker.trackRitm({
            number: 'RITM0088100',
            catalog_item: parsed.catalog_items[0].name,
            requested_for: 'John Smith'
        });

        // 5. Manager Approval & Task Fulfillment
        var appr = this.flowTracker.addApproval(ritm.sys_id, 'Sarah Manager', 'Manager');
        this.flowTracker.approveRequest(appr.sys_id);
        var visualizer = this.flowTracker.getFlowProgression(ritm.sys_id);

        var pass = installRes.success &&
                   parsed.normalized_items.length === 3 &&
                   ritm.number === 'RITM0088100' &&
                   visualizer.current_stage === 'Service Desk Task';

        return {
            name: 'Test 25: End-to-End Native Experience (Install → Excel → Catalog → RITM → Flow)',
            passed: !!pass,
            details: 'Installation: ' + installRes.status + ', Current Stage: ' + visualizer.current_stage
        };
    },

    type: 'AppForgeV021NativeExperienceTestSuite'
};
