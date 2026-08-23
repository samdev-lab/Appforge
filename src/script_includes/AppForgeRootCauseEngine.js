/**
 * AppForgeRootCauseEngine
 * Performs evidence-based root cause analysis tracing across architectural dependencies
 * (Data -> UI -> Logic -> Security -> Integration -> Deployment -> Migration).
 */
var AppForgeRootCauseEngine = Class.create();
AppForgeRootCauseEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeRootCauseEngine] ';
    },

    /**
     * Identifies probable root cause from correlated incidents and telemetry.
     * @param {Object} incident - Incident descriptor.
     * @param {Array<Object>} [recentChanges] - Recent migrations/deployments.
     * @return {Object} Root cause analysis finding.
     */
    analyzeRootCause: function(incident, recentChanges) {
        'use strict';
        if (!incident || !incident.evidence || incident.evidence.length === 0) {
            return {
                probable_root_cause: 'ROOT_CAUSE_UNKNOWN',
                confidence: 0.0,
                affected_components: [],
                supporting_events: [],
                dependency_path: []
            };
        }

        var evidenceStr = JSON.stringify(incident.evidence);
        var rootCause = 'APPLICATION_RUNTIME_ERROR';
        var confidence = 0.70;
        var affected = ['Application Runtime'];
        var depPath = ['Application'];

        if (/MIGRATION|SCHEMA|FIELD/i.test(evidenceStr)) {
            rootCause = 'SCHEMA_MIGRATION_CONFLICT';
            confidence = 0.92;
            affected = ['Schema Registry', 'Business Rules', 'API Controllers'];
            depPath = ['Schema', 'Behavior', 'API'];
        } else if (/INTEGRATION|TIMEOUT|REST|ENDPOINT/i.test(evidenceStr)) {
            rootCause = 'OUTBOUND_INTEGRATION_TIMEOUT';
            confidence = 0.95;
            affected = ['Integration Service', 'REST Outbound Message'];
            depPath = ['Integration', 'API'];
        } else if (/SECURITY|ACL|UNAUTHORIZED|ROLE/i.test(evidenceStr)) {
            rootCause = 'SECURITY_ACL_DENIAL';
            confidence = 0.98;
            affected = ['Security ACL Matrix', 'Role Constraints'];
            depPath = ['Security', 'Experience'];
        } else if (/DEPLOYMENT|PACKAGE|VERSION/i.test(evidenceStr)) {
            rootCause = 'DEPLOYMENT_PACKAGE_INCOMPATIBILITY';
            confidence = 0.88;
            affected = ['Deployment Pipeline', 'Package Snapshot'];
            depPath = ['Deployment', 'Application'];
        }

        return {
            probable_root_cause: rootCause,
            confidence: confidence,
            affected_components: affected,
            supporting_events: incident.evidence,
            dependency_path: depPath
        };
    },

    type: 'AppForgeRootCauseEngine'
};
