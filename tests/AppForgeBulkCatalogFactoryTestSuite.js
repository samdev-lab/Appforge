/**
 * AppForgeBulkCatalogFactoryTestSuite
 * Dedicated Automated Test Suite certifying the Bulk Catalog Factory engine,
 * 7-sheet Excel parsing, validation, idempotency, batching, Four-Eyes governance, rollback, and scale.
 */
var AppForgeBulkCatalogFactoryTestSuite = Class.create();
AppForgeBulkCatalogFactoryTestSuite.prototype = {
    initialize: function() {
        'use strict';
        this.factory = new AppForgeBulkCatalogFactory();
        this.results = { passed: 0, failed: 0, total: 0, tests: [], details: [] };
    },

    assert: function(condition, testName, details) {
        'use strict';
        this.results.total++;
        if (condition) {
            this.results.passed++;
            this.results.tests.push({ name: testName, status: 'PASSED' });
            this.results.details.push({ name: testName, passed: true });
        } else {
            this.results.failed++;
            this.results.tests.push({ name: testName, status: 'FAILED', details: details });
            this.results.details.push({ name: testName, passed: false, details: details });
            gs.error('[AppForgeBulkCatalogFactoryTestSuite] FAILED: ' + testName + ' - ' + (details || ''));
        }
    },

    runAllTests: function() {
        'use strict';
        gs.info('[AppForgeBulkCatalogFactoryTestSuite] Starting test execution...');

        this.testExcelTemplateGeneration();
        this.testSevenSheetParsing();
        this.testCatalogItemValidation();
        this.testVariableTypesAndChoices();
        this.testVariableSets();
        this.testUIPoliciesAndActions();
        this.testFulfillmentMapping();
        this.testSecurityPatternScanner();
        this.testExecutionPlannerAndDiffs();
        this.testFourEyesGovernance();
        this.testBatchingAndCheckpoints();
        this.testRollbackLedger();
        this.testScaleThousandItems();

        gs.info('[AppForgeBulkCatalogFactoryTestSuite] Completed: ' + this.results.passed + '/' + this.results.total + ' passed.');
        return this.results;
    },

    testExcelTemplateGeneration: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        this.assert(template.catalog_items.length === 1, 'T1: Starter Excel template contains catalog items sheet');
        this.assert(template.variables.length >= 3, 'T2: Starter Excel template contains variables sheet');
        this.assert(template.choices.length >= 3, 'T3: Starter Excel template contains choices sheet');
        this.assert(template.fulfillment.length >= 3, 'T4: Starter Excel template contains multi-stage fulfillment sheet');
    },

    testSevenSheetParsing: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        var bundle = this.factory.parser.parse(template);

        this.assert(bundle.normalized_items.length === 1, 'P1: Parsed 1 normalized catalog item');
        var item = bundle.normalized_items[0];
        this.assert(item.external_id === 'CAT-HR-001', 'P2: Normalized item external_id resolved');
        this.assert(item.variables.length === 3, 'P3: Variables linked to catalog item');
        this.assert(item.variables[1].choices.length === 3, 'P4: Choices linked to variable');
        this.assert(item.ui_policies.length === 1, 'P5: UI policies linked to catalog item');
        this.assert(item.ui_policies[0].actions.length === 1, 'P6: UI policy actions linked');
        this.assert(item.fulfillment.length === 3, 'P7: Fulfillment steps linked in order');
    },

    testCatalogItemValidation: function() {
        'use strict';
        // Test missing external_id
        var badBundle1 = {
            catalog_items: [{ catalog_item_name: 'No Ext ID Item' }]
        };
        var val1 = this.factory.validator.validateBundle(badBundle1);
        this.assert(val1.valid === false, 'V1: Missing external_id rejected');
        this.assert(val1.errors.length >= 1, 'V2: Error code recorded for missing external_id');

        // Test duplicate external_id
        var badBundle2 = {
            catalog_items: [
                { external_id: 'CAT-DUP-01', catalog_item_name: 'Item 1' },
                { external_id: 'CAT-DUP-01', catalog_item_name: 'Item 2' }
            ]
        };
        var val2 = this.factory.validator.validateBundle(badBundle2);
        this.assert(val2.valid === false, 'V3: Duplicate external_id rejected');
    },

    testVariableTypesAndChoices: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        var val = this.factory.validator.validateBundle(template);
        this.assert(val.valid === true, 'VT1: Standard variable types pass validation');
        this.assert(val.summary.total_variables === 3, 'VT2: Total variables count matches 3');
    },

    testVariableSets: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        this.assert(template.variable_sets.length >= 1, 'VS1: Reusable variable sets parsed');
        this.assert(template.variable_sets[0].name === 'common_requester_details', 'VS2: Variable set name verified');
    },

    testUIPoliciesAndActions: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        var bundle = this.factory.parser.parse(template);
        var policy = bundle.normalized_items[0].ui_policies[0];
        this.assert(policy.name.indexOf('Shipping Address') !== -1, 'UP1: UI Policy parsed');
        this.assert(policy.actions[0].mandatory === true, 'UP2: UI Policy Action mandatory flag preserved');
    },

    testFulfillmentMapping: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        var bundle = this.factory.parser.parse(template);
        var fulfillments = bundle.normalized_items[0].fulfillment;

        this.assert(fulfillments[0].action_type === 'RITM', 'F1: Step 1 maps to RITM');
        this.assert(fulfillments[1].action_type === 'TASK', 'F2: Step 2 maps to Catalog Task (sc_task)');
        this.assert(fulfillments[1].assignment_group === 'Hardware EUC Team', 'F3: Assignment group mapped');
        this.assert(fulfillments[0].approval_required === true, 'F4: Approval requirement mapped');
    },

    testSecurityPatternScanner: function() {
        'use strict';
        var maliciousBundle = {
            catalog_items: [
                {
                    external_id: 'CAT-HACK-001',
                    catalog_item_name: 'Malicious Item',
                    description: 'eval(malicious_code);'
                }
            ]
        };
        var val = this.factory.validator.validateBundle(maliciousBundle);
        this.assert(val.valid === false, 'SEC1: Malicious eval() pattern blocked');
        this.assert(val.errors[0].code === 'CAT-SEC-001', 'SEC2: Security violation code recorded');
    },

    testExecutionPlannerAndDiffs: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        var preview = this.factory.preview(template, { tenant_id: 'tenant_acme_01' });

        this.assert(preview.success === true, 'EP1: Preview generated successfully');
        this.assert(preview.plan.summary.create_count === 1, 'EP2: First run calculates 1 CREATE operation');
        this.assert(preview.plan.batches.length === 1, 'EP3: Partitioned into 1 batch');
    },

    testFourEyesGovernance: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        var job = this.factory.createImportJob(template, {
            tenant_id: 'tenant_acme_01',
            customer: 'Acme Corp',
            uploaded_by: 'developer_user'
        });

        this.assert(job.status === 'VALIDATED', 'FE1: Job created in VALIDATED state');

        // Self-approval must be blocked (POL-SEC-006)
        var selfApprovalBlocked = false;
        try {
            this.factory.execute(job.job_id, 'developer_user');
        } catch (e) {
            selfApprovalBlocked = true;
        }
        this.assert(selfApprovalBlocked === true, 'FE2: POL-SEC-006 blocks requester self-approval');

        // Independent approval succeeds
        var execRes = this.factory.execute(job.job_id, 'sarah.security');
        this.assert(execRes.success === true, 'FE3: Independent Four-Eyes approval executes job');
        this.assert(execRes.created_count === 1, 'FE4: Catalog item created');
    },

    testBatchingAndCheckpoints: function() {
        'use strict';
        var multiItemTemplate = {
            catalog_items: [],
            variables: [],
            choices: [],
            variable_sets: [],
            ui_policies: [],
            ui_policy_actions: [],
            fulfillment: []
        };

        for (var i = 1; i <= 120; i++) {
            multiItemTemplate.catalog_items.push({
                external_id: 'CAT-BATCH-' + i,
                catalog_item_name: 'Batch Item ' + i,
                category: 'Hardware',
                price: 100
            });
        }

        var preview = this.factory.preview(multiItemTemplate, { batch_size: 50 });
        this.assert(preview.plan.total_items === 120, 'B1: 120 items counted');
        this.assert(preview.plan.batches.length === 3, 'B2: 120 items partitioned into 3 batches (50+50+20)');
        this.assert(preview.plan.batches[0].items.length === 50, 'B3: Batch 1 has 50 items');
        this.assert(preview.plan.batches[2].items.length === 20, 'B4: Batch 3 has 20 items');
    },

    testRollbackLedger: function() {
        'use strict';
        var template = this.factory.parser.generateExcelTemplate();
        var job = this.factory.createImportJob(template, { uploaded_by: 'john.dev' });
        this.factory.execute(job.job_id, 'sarah.security');

        var rollRes = this.factory.rollback(job.job_id);
        this.assert(rollRes.rolled_back_count >= 1, 'RB1: Rollback deleted created entities');
        this.assert(rollRes.status === 'ROLLED_BACK', 'RB2: Rollback status recorded');
    },

    testScaleThousandItems: function() {
        'use strict';
        var bigBundle = {
            catalog_items: [],
            variables: [],
            choices: [],
            variable_sets: [],
            ui_policies: [],
            ui_policy_actions: [],
            fulfillment: []
        };

        for (var i = 1; i <= 1000; i++) {
            bigBundle.catalog_items.push({
                external_id: 'CAT-SCALE-' + i,
                catalog_item_name: 'Enterprise Service ' + i,
                category: 'Enterprise IT',
                price: 50
            });
        }

        var start = new Date().getTime();
        var val = this.factory.validator.validateBundle(bigBundle);
        var duration = new Date().getTime() - start;

        this.assert(val.valid === true, 'S1: 1,000 items validated with 0 errors');
        this.assert(duration < 2000, 'S2: 1,000 items validated in < 2 seconds (' + duration + 'ms)');
    },

    type: 'AppForgeBulkCatalogFactoryTestSuite'
};
