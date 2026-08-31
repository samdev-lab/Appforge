/**
 * AppForgePrompt026CapabilityMarketplaceTestSuite
 * Authoritative Automated Test Suite for AppForge Prompt 026:
 * Capability Marketplace & Native ServiceNow Application Factory.
 */
var AppForgePrompt026CapabilityMarketplaceTestSuite = Class.create();
AppForgePrompt026CapabilityMarketplaceTestSuite.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePrompt026CapabilityMarketplaceTestSuite] ';
        this.marketplace = new AppForgeCapabilityMarketplace();
        this.installer = new AppForgeCapabilityInstaller();
        this.navEngine = new AppForgeNativeNavigationEngine();
        this.installedAppRegistry = new AppForgeInstalledApplicationRegistry();
        this.templateGen = new AppForgeExcelTemplateGenerator();
        this.uploadService = new AppForgeBulkCatalogUploadService();
        this.customerManager = new AppForgeCustomerManager();
        this.excelParser = new AppForgeCatalogExcelParser();

        this.passCount = 0;
        this.failCount = 0;
        this.errors = [];
    },

    assert: function(condition, message) {
        'use strict';
        if (condition) {
            this.passCount++;
        } else {
            this.failCount++;
            this.errors.push(message);
            gs.error(this.LOG_PREFIX + 'FAILED: ' + message);
        }
    },

    runAllTests: function() {
        'use strict';
        this.passCount = 0;
        this.failCount = 0;
        this.errors = [];

        // 1. Marketplace Discovery & Pricing
        this.testMarketplaceCapabilityCount();
        this.testMarketplaceCapabilityIds();
        this.testMarketplaceCapabilityPricing();
        this.testMarketplacePricingUpdate();
        this.testMarketplaceSearchFilter();
        this.testMarketplaceCompatibility();

        // 2. One-Click Capability Installations
        this.testInstallBulkCatalog();
        this.testInstallSPM();
        this.testInstallITSM();
        this.testInstallCSM();
        this.testInstallCRM();
        this.testInstallFSM();
        this.testInstallResourceManagement();

        // 3. Multi-Customer Acceptance Test (Section 19)
        this.testCustomer1Isolation();
        this.testCustomer2Isolation();
        this.testCustomer3Isolation();

        // 4. Bulk Catalog 7-Sheet Templates & Actions
        this.testBulkCatalog7SheetSampleGeneration();
        this.testBulkCatalog7SheetBlankGeneration();
        this.testBulkCatalogDownloadAliases();
        this.testBulkCatalogUpload10AfterSubmitActions();
        this.testBulkCatalogSafetyRejection();

        // 5. Governance & Decommissioning
        this.testDecommissionFourEyesEnforcement();
        this.testDecommissionExecution();

        var total = this.passCount + this.failCount;
        gs.info(this.LOG_PREFIX + 'COMPLETED: ' + this.passCount + '/' + total + ' PASSED.');
        return {
            total: total,
            passed: this.passCount,
            failed: this.failCount,
            errors: this.errors
        };
    },

    // 1. Marketplace Discovery & Pricing
    testMarketplaceCapabilityCount: function() {
        'use strict';
        var caps = this.marketplace.listCapabilities();
        this.assert(caps.length === 7, 'MKT01: Marketplace offers exactly 7 first-class capabilities');
    },

    testMarketplaceCapabilityIds: function() {
        'use strict';
        var expected = ['bulk_catalog', 'spm', 'csm', 'crm', 'fsm', 'resource_management', 'itsm'];
        for (var i = 0; i < expected.length; i++) {
            var cap = this.marketplace.getCapability(expected[i]);
            this.assert(cap !== null, 'MKT02: Capability ' + expected[i] + ' is registered');
            this.assert(cap.version === '1.0.0', 'MKT03: Capability ' + expected[i] + ' has version 1.0.0');
        }
    },

    testMarketplaceCapabilityPricing: function() {
        'use strict';
        this.assert(this.marketplace.getCapability('bulk_catalog').price === 299, 'PRICE01: Bulk Catalog price is $299/mo');
        this.assert(this.marketplace.getCapability('spm').price === 999, 'PRICE02: SPM price is $999/mo');
        this.assert(this.marketplace.getCapability('csm').price === 799, 'PRICE03: CSM price is $799/mo');
        this.assert(this.marketplace.getCapability('crm').price === 699, 'PRICE04: CRM price is $699/mo');
        this.assert(this.marketplace.getCapability('fsm').price === 899, 'PRICE05: FSM price is $899/mo');
        this.assert(this.marketplace.getCapability('resource_management').price === 499, 'PRICE06: Resource Management price is $499/mo');
        this.assert(this.marketplace.getCapability('itsm').price === 599, 'PRICE07: ITSM price is $599/mo');
    },

    testMarketplacePricingUpdate: function() {
        'use strict';
        var res = this.marketplace.updatePricing('bulk_catalog', 349);
        this.assert(res.success === true, 'PRICE08: Dynamic price update successful');
        this.assert(this.marketplace.getCapability('bulk_catalog').price === 349, 'PRICE09: Updated price reflected');
        // Reset price
        this.marketplace.updatePricing('bulk_catalog', 299);
    },

    testMarketplaceSearchFilter: function() {
        'use strict';
        var enterprise = this.marketplace.search({ category: 'Enterprise Management' });
        this.assert(enterprise.length === 2, 'SEARCH01: Found 2 Enterprise Management capabilities (SPM & Resource Management)');
        var kwSearch = this.marketplace.search({ query: 'Portfolio' });
        this.assert(kwSearch.length === 1 && kwSearch[0].id === 'spm', 'SEARCH02: Keyword search for Portfolio finds SPM');
    },

    testMarketplaceCompatibility: function() {
        'use strict';
        var spm = this.marketplace.getCapability('spm');
        this.assert(spm.compatibility.indexOf('WashingtonDC') !== -1, 'COMPAT01: WashingtonDC supported');
        this.assert(spm.compatibility.indexOf('Xanadu') !== -1, 'COMPAT02: Xanadu supported');
    },

    // 2. One-Click Capability Installations
    testInstallBulkCatalog: function() {
        'use strict';
        var res = this.installer.installCapability({ customer_id: 'cust_acme_corp', capability_id: 'bulk_catalog' });
        this.assert(res.success === true, 'INST01: Bulk Catalog installation successful');
        this.assert(res.application_menu === 'AppForge - Bulk Catalog', 'INST02: Correct Bulk Catalog application menu');
        this.assert(res.modules_count === 6, 'INST03: Bulk Catalog creates 6 native modules');
        this.assert(res.native_url.indexOf('/sc_cat_item_list.do') !== -1, 'INST04: Landing URL points to Catalog Items');
    },

    testInstallSPM: function() {
        'use strict';
        var res = this.installer.installCapability({ customer_id: 'cust_apex_fin', capability_id: 'spm' });
        this.assert(res.success === true, 'INST05: SPM installation successful');
        this.assert(res.application_menu === 'AppForge - SPM', 'INST06: Correct SPM application menu');
        this.assert(res.modules_count === 10, 'INST07: SPM creates 10 native modules');
        this.assert(res.native_url.indexOf('/pm_project_list.do') !== -1, 'INST08: Landing URL points to PM Projects');
    },

    testInstallITSM: function() {
        'use strict';
        var res = this.installer.installCapability({ customer_id: 'cust_apex_fin', capability_id: 'itsm' });
        this.assert(res.success === true, 'INST09: ITSM installation successful');
        this.assert(res.application_menu === 'AppForge - ITSM', 'INST10: Correct ITSM application menu');
        this.assert(res.modules_count === 7, 'INST11: ITSM creates 7 native modules');
        this.assert(res.native_url.indexOf('/incident_list.do') !== -1, 'INST12: Landing URL points to Incidents');
    },

    testInstallCSM: function() {
        'use strict';
        var res = this.installer.installCapability({ customer_id: 'cust_zenith_log', capability_id: 'csm' });
        this.assert(res.success === true, 'INST13: CSM installation successful');
        this.assert(res.application_menu === 'AppForge - CSM', 'INST14: Correct CSM application menu');
        this.assert(res.modules_count === 8, 'INST15: CSM creates 8 native modules');
        this.assert(res.native_url.indexOf('/customer_account_list.do') !== -1, 'INST16: Landing URL points to Customer Accounts');
    },

    testInstallCRM: function() {
        'use strict';
        var res = this.installer.installCapability({ customer_id: 'cust_zenith_log', capability_id: 'crm' });
        this.assert(res.success === true, 'INST17: CRM installation successful');
        this.assert(res.application_menu === 'AppForge - CRM', 'INST18: Correct CRM application menu');
        this.assert(res.modules_count === 10, 'INST19: CRM creates 10 native modules');
    },

    testInstallFSM: function() {
        'use strict';
        var res = this.installer.installCapability({ customer_id: 'cust_zenith_log', capability_id: 'fsm' });
        this.assert(res.success === true, 'INST20: FSM installation successful');
        this.assert(res.application_menu === 'AppForge - FSM', 'INST21: Correct FSM application menu');
        this.assert(res.modules_count === 9, 'INST22: FSM creates 9 native modules');
        this.assert(res.native_url.indexOf('/wm_order_list.do') !== -1, 'INST23: Landing URL points to Work Orders');
    },

    testInstallResourceManagement: function() {
        'use strict';
        var res = this.installer.installCapability({ customer_id: 'cust_titan_mfg', capability_id: 'resource_management' });
        this.assert(res.success === true, 'INST24: Resource Management installation successful');
        this.assert(res.application_menu === 'AppForge - Resource Management', 'INST25: Correct Resource Management application menu');
        this.assert(res.modules_count === 8, 'INST26: Resource Management creates 8 native modules');
        this.assert(res.native_url.indexOf('/resource_plan_list.do') !== -1, 'INST27: Landing URL points to Resource Plans');
    },

    // 3. Multi-Customer Acceptance Test (Section 19)
    testCustomer1Isolation: function() {
        'use strict';
        // Customer 1: Bulk Catalog only
        var cust1Id = 'cust_c1_' + Math.floor(Math.random() * 10000);
        this.customerManager.createCustomerAccount({ customer_id: cust1Id, name: 'Customer 1 Logistics' });
        this.installer.installCapability({ customer_id: cust1Id, capability_id: 'bulk_catalog' });

        this.assert(this.installer.hasCapability(cust1Id, 'bulk_catalog') === true, 'CUST1_01: Customer 1 has Bulk Catalog');
        this.assert(this.installer.hasCapability(cust1Id, 'spm') === false, 'CUST1_02: Customer 1 does not have SPM');
        this.assert(this.installer.hasCapability(cust1Id, 'csm') === false, 'CUST1_03: Customer 1 does not have CSM');
        this.assert(this.installer.hasCapability(cust1Id, 'fsm') === false, 'CUST1_04: Customer 1 does not have FSM');
    },

    testCustomer2Isolation: function() {
        'use strict';
        // Customer 2: ITSM + CSM
        var cust2Id = 'cust_c2_' + Math.floor(Math.random() * 10000);
        this.customerManager.createCustomerAccount({ customer_id: cust2Id, name: 'Customer 2 Financial' });
        this.installer.installCapability({ customer_id: cust2Id, capability_id: 'itsm' });
        this.installer.installCapability({ customer_id: cust2Id, capability_id: 'csm' });

        this.assert(this.installer.hasCapability(cust2Id, 'itsm') === true, 'CUST2_01: Customer 2 has ITSM');
        this.assert(this.installer.hasCapability(cust2Id, 'csm') === true, 'CUST2_02: Customer 2 has CSM');
        this.assert(this.installer.hasCapability(cust2Id, 'spm') === false, 'CUST2_03: Customer 2 does not have SPM');
        this.assert(this.installer.hasCapability(cust2Id, 'fsm') === false, 'CUST2_04: Customer 2 does not have FSM');
        this.assert(this.installer.hasCapability(cust2Id, 'crm') === false, 'CUST2_05: Customer 2 does not have CRM');
    },

    testCustomer3Isolation: function() {
        'use strict';
        // Customer 3: SPM + Bulk Catalog + Resource Management + FSM
        var cust3Id = 'cust_c3_' + Math.floor(Math.random() * 10000);
        this.customerManager.createCustomerAccount({ customer_id: cust3Id, name: 'Customer 3 Global Enterprise' });
        this.installer.installCapability({ customer_id: cust3Id, capability_id: 'spm' });
        this.installer.installCapability({ customer_id: cust3Id, capability_id: 'bulk_catalog' });
        this.installer.installCapability({ customer_id: cust3Id, capability_id: 'resource_management' });
        this.installer.installCapability({ customer_id: cust3Id, capability_id: 'fsm' });

        this.assert(this.installer.hasCapability(cust3Id, 'spm') === true, 'CUST3_01: Customer 3 has SPM');
        this.assert(this.installer.hasCapability(cust3Id, 'bulk_catalog') === true, 'CUST3_02: Customer 3 has Bulk Catalog');
        this.assert(this.installer.hasCapability(cust3Id, 'resource_management') === true, 'CUST3_03: Customer 3 has Resource Management');
        this.assert(this.installer.hasCapability(cust3Id, 'fsm') === true, 'CUST3_04: Customer 3 has FSM');
        this.assert(this.installer.hasCapability(cust3Id, 'crm') === false, 'CUST3_05: Customer 3 does not have CRM');
    },

    // 4. Bulk Catalog 7-Sheet Templates & Actions
    testBulkCatalog7SheetSampleGeneration: function() {
        'use strict';
        var wb = this.templateGen.generateSampleWorkbook();
        this.assert(wb.schema_version === 'BC-001', 'TPL01: Schema version is BC-001');
        this.assert(wb.release_compatibility === 'WashingtonDC', 'TPL02: Release compatibility is WashingtonDC');
        this.assert(wb.catalog_items.length >= 3, 'TPL03: Sample contains at least 3 catalog items');
        this.assert(wb.variables.length >= 5, 'TPL04: Sample contains variables');
        this.assert(wb.choices.length >= 6, 'TPL05: Sample contains choices');
        this.assert(wb.ui_policies.length >= 1, 'TPL06: Sample contains UI policies');
        this.assert(wb.assignment.length >= 2, 'TPL07: Sample contains assignment mappings');
        this.assert(wb.after_submit.length >= 3, 'TPL08: Sample contains after_submit actions');
        this.assert(wb.attachments.length >= 1, 'TPL09: Sample contains attachments sheet');
    },

    testBulkCatalog7SheetBlankGeneration: function() {
        'use strict';
        var blank = this.templateGen.generateBlankWorkbook();
        this.assert(blank.schema_version === 'BC-001', 'TPL10: Blank template has schema BC-001');
        this.assert(blank.sheets.length === 7, 'TPL11: Blank template contains 7 clean sheets');
        this.assert(blank.catalog_items.length === 0, 'TPL12: Blank template has empty items');
    },

    testBulkCatalogDownloadAliases: function() {
        'use strict';
        var sample = this.templateGen.generateSampleTemplate();
        var blank = this.templateGen.generateBlankTemplate();
        this.assert(sample !== null && sample.catalog_items.length > 0, 'TPL13: generateSampleTemplate alias works');
        this.assert(blank !== null && blank.sheets.length === 7, 'TPL14: generateBlankTemplate alias works');
    },

    testBulkCatalogUpload10AfterSubmitActions: function() {
        'use strict';
        var actions = [
            'Create Approval', 'Create Task', 'Create Incident', 'Create Problem',
            'Create Change', 'Create Request', 'Create RITM', 'Create Catalog Task',
            'Create Flow', 'No Additional Action'
        ];
        for (var i = 0; i < actions.length; i++) {
            var res = this.uploadService.createBulkUploadRecord({
                upload_name: 'Import Action Test ' + i,
                catalog: 'Service Catalog',
                category: 'Hardware',
                after_submit_action: actions[i]
            });
            this.assert(res.success === true, 'ACTION01: Successfully configured ' + actions[i]);
            this.assert(res.record.after_submit_action === actions[i], 'ACTION02: Stored ' + actions[i]);
        }
    },

    testBulkCatalogSafetyRejection: function() {
        'use strict';
        var res = this.uploadService.validateUploadPayload(null);
        this.assert(res.valid === false, 'SAFETY01: Null payload rejected safely');
    },

    // 5. Governance & Decommissioning
    testDecommissionFourEyesEnforcement: function() {
        'use strict';
        var req = this.installer.requestDecommission('cust_acme_corp', 'bulk_catalog', 'admin_user', 'Contract renewal');
        this.assert(req.success === true, 'GOV01: Decommission request created');

        // Self-approval must fail Four-Eyes principle
        var selfApprove = this.installer.executeDecommission(req.request_id, 'admin_user');
        this.assert(selfApprove.success === false, 'GOV02: Self-approval rejected by Four-Eyes principle');
    },

    testDecommissionExecution: function() {
        'use strict';
        var req = this.installer.requestDecommission('cust_acme_corp', 'bulk_catalog', 'requester_admin', 'Testing decommissioning');
        var exec = this.installer.executeDecommission(req.request_id, 'approver_director');
        this.assert(exec.success === true, 'GOV03: Governed decommissioning executed with independent approver');
        this.assert(exec.status === 'DECOMMISSIONED', 'GOV04: Status updated to DECOMMISSIONED');
    },

    type: 'AppForgePrompt026CapabilityMarketplaceTestSuite'
};
