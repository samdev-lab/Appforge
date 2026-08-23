/**
 * AppForgePackagePlanner
 * Dry-run planning engine for application package imports, upgrades, and migrations.
 * Generates dependency-ordered plans: Data -> Experience -> Behavior -> Security -> Integration.
 */
var AppForgePackagePlanner = Class.create();
AppForgePackagePlanner.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePackagePlanner] ';
        this.inventory = new AppForgePackageInventory();
        this.securityAnalyzer = new AppForgePackageSecurityAnalyzer();
        this.diffEngine = new AppForgePackageDiffEngine();
        this.compatibilityChecker = new AppForgePackageCompatibilityChecker();
    },

    /**
     * Generates a dry-run package import/upgrade execution plan.
     * @param {Object} packageDef - Target package definition / manifest.
     * @param {Object} [installedDef] - Existing installed application definition (null for new installs).
     * @param {string} [targetEnv] - Target environment (DEV, TEST, UAT, PRODUCTION).
     * @return {Object} Structured dry-run package plan.
     */
    generatePlan: function(packageDef, installedDef, targetEnv) {
        'use strict';
        var invResult = this.inventory.discoverComponents(packageDef);
        if (!invResult.valid) {
            return {
                valid: false,
                status: 'BLOCKED',
                errors: invResult.errors,
                operations: []
            };
        }

        var secScan = this.securityAnalyzer.scan(packageDef);
        if (secScan.result === 'BLOCK') {
            return {
                valid: false,
                status: 'BLOCKED',
                errors: secScan.findings.map(function(f) { return '[' + f.severity + '] ' + f.label; }),
                operations: []
            };
        }

        var currentVer = (installedDef && installedDef.version) || null;
        var compat = this.compatibilityChecker.checkCompatibility(packageDef, targetEnv, currentVer);
        if (!compat.compatible) {
            return {
                valid: false,
                status: 'INCOMPATIBLE',
                errors: compat.issues,
                operations: []
            };
        }

        var diff = this.diffEngine.calculateDiff(installedDef, packageDef);
        if (diff.has_breaking_changes) {
            return {
                valid: false,
                status: 'BLOCKED',
                errors: diff.breaking.map(function(b) { return 'BREAKING CHANGE DETECTED: ' + b.type + ' on ' + b.name; }),
                diff: diff,
                operations: []
            };
        }

        var operations = [];
        var migrations = [];
        var sequence = 1;

        // 1. Data Operations (Schemas & Fields)
        var schemas = packageDef.schemas || [];
        for (var s = 0; s < schemas.length; s++) {
            var sch = schemas[s];
            var flds = sch.fields || [];
            for (var f = 0; f < flds.length; f++) {
                var fieldName = sch.name + '.' + flds[f].name;
                var isNew = !installedDef || diff.added.some(function(a) { return a.name === fieldName; });

                operations.push({
                    sequence: sequence++,
                    layer: 'DATA',
                    operation_type: isNew ? 'CREATE_FIELD' : 'VERIFY_FIELD',
                    target: fieldName,
                    status: isNew ? 'CREATE' : 'UNCHANGED'
                });

                if (isNew) {
                    migrations.push({
                        operation: 'ADD_FIELD',
                        target: fieldName,
                        rollback_strategy: 'REMOVE_FIELD'
                    });
                }
            }
        }

        // 2. Experience Operations
        if (packageDef.experience) {
            operations.push({
                sequence: sequence++,
                layer: 'EXPERIENCE',
                operation_type: installedDef ? 'UPDATE_UI' : 'CREATE_UI',
                target: (packageDef.name || 'App') + ' UI Layout',
                status: installedDef ? 'UPDATE' : 'CREATE'
            });
        }

        // 3. Behavior Operations (Logic)
        if (packageDef.logic && packageDef.logic.business_rules) {
            for (var b = 0; b < packageDef.logic.business_rules.length; b++) {
                operations.push({
                    sequence: sequence++,
                    layer: 'BEHAVIOR',
                    operation_type: 'SYNC_BUSINESS_RULE',
                    target: packageDef.logic.business_rules[b].name,
                    status: 'SYNC'
                });
            }
        }

        // 4. Security Operations
        if (packageDef.security) {
            operations.push({
                sequence: sequence++,
                layer: 'SECURITY',
                operation_type: 'SYNC_SECURITY_POLICY',
                target: (packageDef.name || 'App') + ' Security',
                status: 'SYNC'
            });
        }

        // 5. Integration Operations
        if (packageDef.integration) {
            operations.push({
                sequence: sequence++,
                layer: 'INTEGRATION',
                operation_type: 'SYNC_INTEGRATION',
                target: (packageDef.name || 'App') + ' Integrations',
                status: 'SYNC'
            });
        }

        gs.info(this.LOG_PREFIX + 'Package plan generated cleanly (' + operations.length + ' operations)');
        return {
            valid: true,
            status: 'READY',
            operations: operations,
            migrations: migrations,
            diff: diff,
            summary: {
                total_operations: operations.length,
                migration_steps: migrations.length,
                added_components: diff.summary.added_count,
                modified_components: diff.summary.modified_count
            },
            warnings: []
        };
    },

    type: 'AppForgePackagePlanner'
};
