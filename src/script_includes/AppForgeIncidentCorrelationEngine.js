/**
 * AppForgeIncidentCorrelationEngine
 * Correlates related telemetry events across layers into unified incident records
 * grouped by correlation_id, transaction_id, and time windows.
 */
var AppForgeIncidentCorrelationEngine = Class.create();
AppForgeIncidentCorrelationEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeIncidentCorrelationEngine] ';
    },

    /**
     * Correlates an array of telemetry events into incident groups.
     * @param {Array<Object>} telemetryEvents - Array of telemetry records.
     * @param {string} [appId] - Application ID.
     * @return {Array<Object>} List of grouped incidents.
     */
    correlateIncidents: function(telemetryEvents, appId) {
        'use strict';
        if (!telemetryEvents || !Array.isArray(telemetryEvents) || telemetryEvents.length === 0) {
            return [];
        }

        var groups = {};
        for (var i = 0; i < telemetryEvents.length; i++) {
            var evt = telemetryEvents[i];
            var corrId = evt.correlation_id || evt.transaction_id || 'default_corr';

            if (!groups[corrId]) {
                groups[corrId] = {
                    events: [],
                    first_seen: evt.timestamp || new Date().toISOString(),
                    last_seen: evt.timestamp || new Date().toISOString(),
                    severities: []
                };
            }

            groups[corrId].events.push(evt);
            groups[corrId].last_seen = evt.timestamp || new Date().toISOString();
            if (evt.severity) groups[corrId].severities.push(evt.severity);
        }

        var incidents = [];
        for (var key in groups) {
            var g = groups[key];
            var failedEvents = g.events.filter(function(e) { return e.status === 'FAILURE' || e.severity === 'CRITICAL' || e.severity === 'HIGH'; });

            if (failedEvents.length > 0) {
                var root = failedEvents[0];
                var highestSev = g.severities.indexOf('CRITICAL') !== -1 ? 'CRITICAL' : (g.severities.indexOf('HIGH') !== -1 ? 'HIGH' : 'MEDIUM');

                incidents.push({
                    incident_id: 'inc_' + key.replace(/[^a-zA-Z0-9_]/g, '_'),
                    application: appId || root.application || 'Employee Onboarding',
                    severity: highestSev,
                    title: 'Correlated failure chain (' + failedEvents.length + ' failed events)',
                    status: 'OPEN',
                    root_event: root.event_type || root.operation || 'UNKNOWN_EVENT',
                    first_seen: g.first_seen,
                    last_seen: g.last_seen,
                    event_count: g.events.length,
                    probable_cause: root.operation ? ('Failure during ' + root.operation) : 'Root failure in ' + root.source,
                    evidence: failedEvents.map(function(e) { return e.source + ' [' + e.event_type + ']: ' + (e.operation || e.status); })
                });
            }
        }

        return incidents;
    },

    type: 'AppForgeIncidentCorrelationEngine'
};
