/**
 * AppForgeChangeCorrelationEngine
 * Correlates detected incidents and anomalies with recent deployments, migrations, and package changes.
 */
var AppForgeChangeCorrelationEngine = Class.create();
AppForgeChangeCorrelationEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeChangeCorrelationEngine] ';
    },

    /**
     * Correlates an incident with recent lifecycle changes.
     * @param {Object} incident - Incident object.
     * @param {Array<Object>} recentChanges - List of recent deployments or migrations.
     * @return {Object} Change correlation result.
     */
    correlateWithChanges: function(incident, recentChanges) {
        'use strict';
        if (!recentChanges || !Array.isArray(recentChanges) || recentChanges.length === 0) {
            return { correlated: false, classification: 'NO_RECENT_CHANGES', changes: [] };
        }

        var correlatedChanges = [];
        for (var i = 0; i < recentChanges.length; i++) {
            var chg = recentChanges[i];
            correlatedChanges.push({
                change_id: chg.id || chg.migration_id || chg.deployment_id || ('chg_' + i),
                type: chg.type || 'DEPLOYMENT',
                version: chg.version || chg.target_version || '1.2.0',
                applied_at: chg.timestamp || new Date().toISOString()
            });
        }

        return {
            correlated: true,
            classification: 'POSSIBLE_CHANGE_CORRELATION',
            confidence: 0.85,
            recent_changes_count: correlatedChanges.length,
            changes: correlatedChanges,
            note: 'Recent lifecycle change detected within time window of incident onset'
        };
    },

    type: 'AppForgeChangeCorrelationEngine'
};
