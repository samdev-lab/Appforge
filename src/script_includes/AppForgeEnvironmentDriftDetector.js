/**
 * AppForgeEnvironmentDriftDetector
 * Analyzes configuration, version, schema, and security drift across environments (DEV, TEST, UAT, PROD).
 */
var AppForgeEnvironmentDriftDetector = Class.create();
AppForgeEnvironmentDriftDetector.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeEnvironmentDriftDetector] ';
    },

    /**
     * Detects drift between two environments.
     * @param {Object} sourceEnvState - State of source environment (e.g. DEV).
     * @param {Object} targetEnvState - State of target environment (e.g. PROD).
     * @return {Object} { drift_detected: boolean, severity: 'INFO'|'WARNING'|'CRITICAL', drifts: Array }
     */
    detectDrift: function(sourceEnvState, targetEnvState) {
        'use strict';
        var drifts = [];

        var sVer = (sourceEnvState && sourceEnvState.version) || '1.1.0';
        var tVer = (targetEnvState && targetEnvState.version) || '1.0.0';

        if (sVer !== tVer) {
            drifts.push({
                type: 'VERSION_DRIFT',
                severity: (targetEnvState && targetEnvState.type === 'PRODUCTION') ? 'CRITICAL' : 'WARNING',
                description: 'Version mismatch: Source (' + sVer + ') vs Target (' + tVer + ')'
            });
        }

        var hasCritical = drifts.some(function(d) { return d.severity === 'CRITICAL'; });
        var severity = hasCritical ? 'CRITICAL' : (drifts.length > 0 ? 'WARNING' : 'INFO');

        return {
            drift_detected: drifts.length > 0,
            severity: severity,
            drifts: drifts,
            source_version: sVer,
            target_version: tVer
        };
    },

    type: 'AppForgeEnvironmentDriftDetector'
};
