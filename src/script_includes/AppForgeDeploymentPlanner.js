/**
 * AppForgeDeploymentPlanner
 * Dependency-ordered deployment planning engine producing dry-run execution manifests.
 */
var AppForgeDeploymentPlanner = Class.create();
AppForgeDeploymentPlanner.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeDeploymentPlanner] ';
        this.preflight = new AppForgeDeploymentPreflight();
        this.packagePlanner = new AppForgePackagePlanner();
    },

    /**
     * Formulates deployment plan.
     * @param {Object} packageDef - Target package definition.
     * @param {Object} targetEnv - Target environment.
     * @param {Object} [approval] - Approval descriptor.
     * @param {Object} [installedDef] - Existing installed application definition.
     * @return {Object} Structured dry-run deployment plan.
     */
    generatePlan: function(packageDef, targetEnv, approval, installedDef) {
        'use strict';
        var preflightResult = this.preflight.runPreflight(packageDef, targetEnv, approval);
        if (!preflightResult.ready) {
            return {
                valid: false,
                status: 'BLOCKED',
                errors: preflightResult.errors,
                preflight: preflightResult,
                operations: []
            };
        }

        var pkgPlan = this.packagePlanner.generatePlan(packageDef, installedDef || null, (targetEnv && targetEnv.type) || 'TEST');
        return {
            valid: true,
            status: 'READY',
            preflight: preflightResult,
            operations: pkgPlan.operations,
            migrations: pkgPlan.migrations,
            diff: pkgPlan.diff,
            summary: {
                total_operations: pkgPlan.operations.length,
                environment: (targetEnv && targetEnv.type) || 'TEST',
                target_modifications: 0
            }
        };
    },

    type: 'AppForgeDeploymentPlanner'
};
