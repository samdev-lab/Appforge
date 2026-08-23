/**
 * AppForgeRecommendationEngine
 * Generates deterministic operational recommendations and enforces strict self-healing safety classifications
 * (READ_ONLY, SAFE_AUTOMATION, APPROVAL_REQUIRED, FORBIDDEN).
 */
var AppForgeRecommendationEngine = Class.create();
AppForgeRecommendationEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeRecommendationEngine] ';
    },

    /**
     * Generates prioritized recommendations from health and root cause findings.
     * @param {Object} health - Application health evaluation.
     * @param {Object} rootCause - Root cause analysis finding.
     * @param {Array<Object>} anomalies - Active anomalies.
     * @return {Array<Object>} List of recommendations.
     */
    generateRecommendations: function(health, rootCause, anomalies) {
        'use strict';
        var recommendations = [];
        var rc = (rootCause && rootCause.probable_root_cause) || '';

        if (rc === 'OUTBOUND_INTEGRATION_TIMEOUT') {
            recommendations.push({
                recommendation_id: 'rec_int_' + new Date().getTime(),
                priority: 'HIGH',
                reason: 'Outbound REST integration endpoint experiencing persistent timeouts',
                affected_component: 'Outbound REST Provider',
                action_type: 'VERIFY_ENDPOINT_HEALTH',
                safe_to_automate: true,
                safety_classification: 'SAFE_AUTOMATION'
            });
            recommendations.push({
                recommendation_id: 'rec_int_restart_' + new Date().getTime(),
                priority: 'MEDIUM',
                reason: 'Restart stalled outbound message queue',
                affected_component: 'Integration Queue',
                action_type: 'RESTART_INTEGRATION_QUEUE',
                safe_to_automate: false,
                safety_classification: 'APPROVAL_REQUIRED'
            });
        } else if (rc === 'SCHEMA_MIGRATION_CONFLICT') {
            recommendations.push({
                recommendation_id: 'rec_mig_' + new Date().getTime(),
                priority: 'HIGH',
                reason: 'Schema alteration conflict detected during recent data migration',
                affected_component: 'Schema Registry',
                action_type: 'RUN_DRIFT_ANALYSIS',
                safe_to_automate: true,
                safety_classification: 'READ_ONLY'
            });
        } else if (rc === 'SECURITY_ACL_DENIAL') {
            recommendations.push({
                recommendation_id: 'rec_sec_' + new Date().getTime(),
                priority: 'CRITICAL',
                reason: 'Unresolved security ACL denials impacting user transactions',
                affected_component: 'Security ACL Matrix',
                action_type: 'REVIEW_SECURITY_AUDIT',
                safe_to_automate: true,
                safety_classification: 'READ_ONLY'
            });
        } else {
            recommendations.push({
                recommendation_id: 'rec_gen_' + new Date().getTime(),
                priority: 'LOW',
                reason: 'System operating within standard baselines',
                affected_component: 'Platform Health',
                action_type: 'OBSERVE_METRICS',
                safe_to_automate: true,
                safety_classification: 'READ_ONLY'
            });
        }

        return recommendations;
    },

    /**
     * Evaluates whether an arbitrary remediation action is allowed to execute automatically.
     * @param {string} actionType - Proposed action (e.g. DROP_TABLE, RESTART_INTEGRATION).
     * @return {Object} Safety classification.
     */
    classifyAction: function(actionType) {
        'use strict';
        var act = (actionType || '').toUpperCase();
        if (act.indexOf('DROP') !== -1 || act.indexOf('DELETE') !== -1 || act.indexOf('DISABLE_SECURITY') !== -1) {
            return { action: actionType, classification: 'FORBIDDEN', allowed_automatic: false, reason: 'Destructive operations strictly forbidden from automated execution' };
        }
        if (act.indexOf('RESTART') !== -1 || act.indexOf('MODIFY') !== -1 || act.indexOf('MIGRATE') !== -1) {
            return { action: actionType, classification: 'APPROVAL_REQUIRED', allowed_automatic: false, reason: 'Stateful operational changes require human approval' };
        }
        if (act.indexOf('HEALTH_CHECK') !== -1 || act.indexOf('PING') !== -1 || act.indexOf('CLEAR_CACHE') !== -1) {
            return { action: actionType, classification: 'SAFE_AUTOMATION', allowed_automatic: true, reason: 'Safe automated diagnostic action' };
        }
        return { action: actionType, classification: 'READ_ONLY', allowed_automatic: true, reason: 'Read-only diagnostic query' };
    },

    type: 'AppForgeRecommendationEngine'
};
