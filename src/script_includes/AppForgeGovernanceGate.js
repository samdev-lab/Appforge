/**
 * AppForgeGovernanceGate
 * Unified pre-flight governance gate for Production Deployments, Migrations, and Installations.
 * Evaluates policies, four-eyes approvals, security scans, and active exceptions.
 */
var AppForgeGovernanceGate = Class.create();
AppForgeGovernanceGate.prototype = {
    initialize: function(exceptionManager) {
        'use strict';
        this.LOG_PREFIX = '[AppForgeGovernanceGate] ';
        this.policyEngine = new AppForgePolicyEngine();
        this.policyEvaluator = new AppForgePolicyEvaluator();
        this.exceptionManager = exceptionManager || new AppForgeGovernanceExceptionManager();
    },

    /**
     * Evaluates pre-flight governance for an operation.
     * @param {Object} operationContext - Operation context (environment, actor, approver, etc.).
     * @param {string} tenantId - Tenant context.
     * @return {Object} Gate evaluation result.
     */
    evaluateGate: function(operationContext, tenantId) {
        'use strict';
        var ctx = operationContext || {};
        var pack = this.policyEngine.getPolicyPack('APPFORGE_BASELINE');
        var blocked = false;
        var blockingPolicies = [];

        for (var i = 0; i < pack.length; i++) {
            var pol = pack[i];
            var ev = this.policyEvaluator.evaluatePolicy(pol, ctx, tenantId);

            if (ev.result === 'NON_COMPLIANT' && pol.effect === 'DENY') {
                // Check if active exception exists
                if (ctx.exception_id && this.exceptionManager.isExceptionActive(ctx.exception_id)) {
                    gs.info(this.LOG_PREFIX + 'Policy ' + pol.policy_id + ' bypassed by approved exception: ' + ctx.exception_id);
                } else {
                    blocked = true;
                    blockingPolicies.push({ policy_id: pol.policy_id, name: pol.name, reason: ev.reason });
                }
            }
        }

        if (blocked) {
            gs.warn(this.LOG_PREFIX + 'Preflight gate BLOCKED by ' + blockingPolicies.length + ' policy violation(s).');
            return {
                passed: false,
                status: 'BLOCKED',
                error: 'GOVERNANCE_GATE_BLOCKED: Mandatory policies violated.',
                blocking_policies: blockingPolicies
            };
        }

        return {
            passed: true,
            status: 'PASSED',
            evaluated_policies: pack.length
        };
    },

    type: 'AppForgeGovernanceGate'
};
