/**
 * AppForgeRegistryTestSuite
 * Automated Test Runner for AppForge Platform Registries (Prompt 003).
 * Executes the 20 mandatory registry test scenarios.
 */
var AppForgeRegistryTestSuite = Class.create();
AppForgeRegistryTestSuite.prototype = {
    initialize: function() {
        'use strict';
        if (typeof AppForgeApplicationRegistry !== 'undefined') AppForgeApplicationRegistry._store = {};
        if (typeof AppForgeModuleRegistry !== 'undefined') AppForgeModuleRegistry._store = {};
        if (typeof AppForgeSchemaRegistry !== 'undefined') AppForgeSchemaRegistry._store = {};
        if (typeof AppForgeSchemaFieldRegistry !== 'undefined') AppForgeSchemaFieldRegistry._store = {};

        this.appRegistry = new AppForgeApplicationRegistry();
        this.moduleRegistry = new AppForgeModuleRegistry();
        this.schemaRegistry = new AppForgeSchemaRegistry();
        this.fieldRegistry = new AppForgeSchemaFieldRegistry();
    },

    /**
     * Main test execution runner for 20 registry test scenarios.
     * @return {Object} Test results summary (total, passed, failed, details).
     */
    runAllTests: function() {
        'use strict';
        var results = [];

        results.push(this.test01_CreateApplication());
        results.push(this.test02_RetrieveApplication());
        results.push(this.test03_DuplicateApplicationRejected());
        results.push(this.test04_InvalidLifecycleTransitionRejected());
        results.push(this.test05_UpdateApplication());
        results.push(this.test06_RetireApplication());
        results.push(this.test07_CreateModule());
        results.push(this.test08_DuplicateModuleRejected());
        results.push(this.test09_ModuleWithoutApplicationRejected());
        results.push(this.test10_CreateSchema());
        results.push(this.test11_DuplicateSchemaRejected());
        results.push(this.test12_InvalidApplicationRejected());
        results.push(this.test13_CreateField());
        results.push(this.test14_DuplicateFieldRejected());
        results.push(this.test15_InvalidFieldTypeRejected());
        results.push(this.test16_RelationshipAppModule());
        results.push(this.test17_RelationshipAppSchema());
        results.push(this.test18_RelationshipSchemaField());
        results.push(this.test19_QueryAllApplications());
        results.push(this.test20_QueryAllModulesForApp());

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

    // Test 1: Create Application
    test01_CreateApplication: function() {
        'use strict';
        var res = this.appRegistry.create({
            application_id: 'app_test_crm',
            name: 'CRM Test Application',
            scope: 'x_test_crm',
            publisher: 'Test Publisher',
            version: '1.0.0',
            description: 'Test CRM App',
            owner: 'admin'
        });
        var pass = res.success && res.sys_id !== undefined;
        return { name: 'Test 1: Create Application', passed: pass, details: pass ? 'Sys ID: ' + res.sys_id : res.error };
    },

    // Test 2: Retrieve Application
    test02_RetrieveApplication: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_crm');
        var pass = app !== null && app.application_id === 'app_test_crm' && app.name === 'CRM Test Application';
        return { name: 'Test 2: Retrieve Application', passed: pass, details: pass ? 'Name: ' + app.name : 'Not found' };
    },

    // Test 3: Duplicate Application Rejected
    test03_DuplicateApplicationRejected: function() {
        'use strict';
        var res = this.appRegistry.create({
            application_id: 'app_test_crm',
            name: 'CRM Duplicate',
            scope: 'x_test_crm_dup'
        });
        var pass = !res.success && res.error.indexOf('already exists') !== -1;
        return { name: 'Test 3: Duplicate Application Rejected', passed: pass, details: 'Rejected correctly: ' + res.error };
    },

    // Test 4: Invalid Lifecycle Transition Rejected (PLANNED -> PRODUCTION jump)
    test04_InvalidLifecycleTransitionRejected: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_crm');
        var res = this.appRegistry.changeStatus(app.sys_id, 'PRODUCTION');
        var pass = !res.success && res.error.indexOf('Invalid lifecycle state transition') !== -1;
        return { name: 'Test 4: Invalid Lifecycle Transition Rejected', passed: pass, details: 'Transition blocked: ' + res.error };
    },

    // Test 5: Update Application (Valid transition PLANNED -> DEVELOPMENT)
    test05_UpdateApplication: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_crm');
        var res = this.appRegistry.changeStatus(app.sys_id, 'DEVELOPMENT');
        var updatedApp = this.appRegistry.get('app_test_crm');
        var pass = res.success && updatedApp.status === 'DEVELOPMENT';
        return { name: 'Test 5: Update Application Status', passed: pass, details: 'Updated status: ' + updatedApp.status };
    },

    // Test 6: Retire Application (DEVELOPMENT -> RETIRED)
    test06_RetireApplication: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_crm');
        var res = this.appRegistry.changeStatus(app.sys_id, 'RETIRED');
        var retiredApp = this.appRegistry.get('app_test_crm');
        var pass = res.success && retiredApp.status === 'RETIRED';
        return { name: 'Test 6: Retire Application', passed: pass, details: 'Retired status: ' + retiredApp.status };
    },

    // Test 7: Create Module
    test07_CreateModule: function() {
        'use strict';
        var app = this.appRegistry.create({
            application_id: 'app_test_hr',
            name: 'HR Platform',
            scope: 'x_test_hr'
        });
        var modRes = this.moduleRegistry.create({
            module_id: 'mod_employee',
            name: 'Employee Core',
            application: app.sys_id,
            order: 100
        });
        var pass = modRes.success && modRes.sys_id !== undefined;
        return { name: 'Test 7: Create Module', passed: pass, details: pass ? 'Module Sys ID: ' + modRes.sys_id : modRes.error };
    },

    // Test 8: Duplicate Module Rejected
    test08_DuplicateModuleRejected: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_hr');
        var modRes = this.moduleRegistry.create({
            module_id: 'mod_employee',
            name: 'Employee Duplicate',
            application: app.sys_id
        });
        var pass = !modRes.success && modRes.error.indexOf('already exists') !== -1;
        return { name: 'Test 8: Duplicate Module Rejected', passed: pass, details: 'Duplicate module rejected: ' + modRes.error };
    },

    // Test 9: Module Without Application Rejected
    test09_ModuleWithoutApplicationRejected: function() {
        'use strict';
        var modRes = this.moduleRegistry.create({
            module_id: 'mod_orphan',
            name: 'Orphan Module',
            application: ''
        });
        var pass = !modRes.success && modRes.error.indexOf('mandatory') !== -1;
        return { name: 'Test 9: Module Without Application Rejected', passed: pass, details: 'Orphan module rejected correctly' };
    },

    // Test 10: Create Schema
    test10_CreateSchema: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_hr');
        var schRes = this.schemaRegistry.create({
            schema_id: 'sch_employee',
            name: 'Employee',
            application: app.sys_id,
            physical_table: 'x_test_hr_employee'
        });
        var pass = schRes.success && schRes.sys_id !== undefined;
        return { name: 'Test 10: Create Schema', passed: pass, details: pass ? 'Schema Sys ID: ' + schRes.sys_id : schRes.error };
    },

    // Test 11: Duplicate Schema Rejected
    test11_DuplicateSchemaRejected: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_hr');
        var schRes = this.schemaRegistry.create({
            schema_id: 'sch_employee',
            name: 'Employee Duplicate',
            application: app.sys_id,
            physical_table: 'x_test_hr_employee'
        });
        var pass = !schRes.success && schRes.error.indexOf('already exists') !== -1;
        return { name: 'Test 11: Duplicate Schema Rejected', passed: pass, details: 'Rejected correctly: ' + schRes.error };
    },

    // Test 12: Invalid Application Rejected
    test12_InvalidApplicationRejected: function() {
        'use strict';
        var schRes = this.schemaRegistry.create({
            schema_id: 'sch_invalid',
            name: 'Invalid',
            application: '',
            physical_table: 'x_test_invalid'
        });
        var pass = !schRes.success && schRes.error.indexOf('mandatory') !== -1;
        return { name: 'Test 12: Invalid Application Rejected', passed: pass, details: 'Missing app rejected correctly' };
    },

    // Test 13: Create Field
    test13_CreateField: function() {
        'use strict';
        var schList = this.schemaRegistry.list(this.appRegistry.get('app_test_hr').sys_id);
        var schemaSysId = schList[0].sys_id;

        var fldRes = this.fieldRegistry.create({
            field_id: 'fld_email',
            name: 'u_email',
            label: 'Email Address',
            schema: schemaSysId,
            internal_type: 'string',
            max_length: 100,
            mandatory: true
        });
        var pass = fldRes.success && fldRes.name === 'u_email';
        return { name: 'Test 13: Create Field', passed: pass, details: pass ? 'Field: u_email' : fldRes.error };
    },

    // Test 14: Duplicate Field Rejected
    test14_DuplicateFieldRejected: function() {
        'use strict';
        var schList = this.schemaRegistry.list(this.appRegistry.get('app_test_hr').sys_id);
        var schemaSysId = schList[0].sys_id;

        var fldRes = this.fieldRegistry.create({
            field_id: 'fld_email',
            name: 'u_email',
            label: 'Duplicate Email',
            schema: schemaSysId,
            internal_type: 'string'
        });
        var pass = !fldRes.success && fldRes.error.indexOf('already exists') !== -1;
        return { name: 'Test 14: Duplicate Field Rejected', passed: pass, details: 'Duplicate field rejected correctly' };
    },

    // Test 15: Invalid Field Type Rejected
    test15_InvalidFieldTypeRejected: function() {
        'use strict';
        var schList = this.schemaRegistry.list(this.appRegistry.get('app_test_hr').sys_id);
        var schemaSysId = schList[0].sys_id;

        var fldRes = this.fieldRegistry.create({
            field_id: 'fld_bad',
            name: 'u_bad',
            label: 'Bad Type Field',
            schema: schemaSysId,
            internal_type: 'unsupported_type_xyz'
        });
        var pass = !fldRes.success && fldRes.error.indexOf('Unsupported internal_type') !== -1;
        return { name: 'Test 15: Invalid Field Type Rejected', passed: pass, details: 'Unsupported type rejected correctly' };
    },

    // Test 16: Relationship Application -> Module
    test16_RelationshipAppModule: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_hr');
        var modules = this.moduleRegistry.list(app.sys_id);
        var pass = modules.length >= 1;
        return { name: 'Test 16: Relationship Application -> Module', passed: pass, details: 'Module count: ' + modules.length };
    },

    // Test 17: Relationship Application -> Schema
    test17_RelationshipAppSchema: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_hr');
        var schemas = this.schemaRegistry.list(app.sys_id);
        var pass = schemas.length >= 1;
        return { name: 'Test 17: Relationship Application -> Schema', passed: pass, details: 'Schema count: ' + schemas.length };
    },

    // Test 18: Relationship Schema -> Field
    test18_RelationshipSchemaField: function() {
        'use strict';
        var app = this.appRegistry.get('app_test_hr');
        var schList = this.schemaRegistry.list(app.sys_id);
        var fields = this.fieldRegistry.list(schList[0].sys_id);
        var pass = fields.length >= 1;
        return { name: 'Test 18: Relationship Schema -> Field', passed: pass, details: 'Field count: ' + fields.length };
    },

    // Test 19: Query All Applications
    test19_QueryAllApplications: function() {
        'use strict';
        var apps = this.appRegistry.list();
        var pass = apps.length >= 2;
        return { name: 'Test 19: Query All Applications', passed: pass, details: 'Total applications found: ' + apps.length };
    },

    // Test 20: Query All Modules for App
    test20_QueryAllModulesForApp: function() {
        'use strict';
        var vendorApp = this.appRegistry.create({
            application_id: 'app_test_vendor',
            name: 'Vendor Management',
            scope: 'x_test_vendor'
        });
        this.moduleRegistry.create({
            module_id: 'mod_vendor_core',
            name: 'Vendor Core',
            application: vendorApp.sys_id
        });
        var vendorModules = this.moduleRegistry.list(vendorApp.sys_id);
        var pass = vendorModules.length >= 1;
        return { name: 'Test 20: Query All Modules for Application', passed: pass, details: 'Vendor modules: ' + vendorModules.length };
    },

    type: 'AppForgeRegistryTestSuite'
};
