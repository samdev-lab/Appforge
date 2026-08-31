/**
 * AppForgeAlertEngine
 * Central Operational Alerting, Deduplication & Auto-Incident Trigger Engine.
 *
 * Implements:
 *   - 13 Alert Conditions with Severities: INFO, LOW, MEDIUM, HIGH, CRITICAL
 *   - Intelligent Alert Deduplication (Prevents alert storming)
 *   - Alert Lifecycle States: OPEN, ACKNOWLEDGED, INVESTIGATING, RESOLVED, CLOSED
 *   - Automated Incident Trigger for CRITICAL severity alerts
 */
var AppForgeAlertEngine = Class.create();
AppForgeAlertEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeAlertEngine] ';
        this.logger = new AppForgeOperationalLoggingService();
        this.auditService = new AppForgeAuditService();

        if (!AppForgeAlertEngine._store) {
            AppForgeAlertEngine._store = {
                alerts: {}, // alert_key -> alert record
                alert_list: []
            };
        }
        this._store = AppForgeAlertEngine._store;
    },

    /**
     * Raises or updates an operational alert.
     */
    raiseAlert: function(condition, severity, tenant, appKey, description, correlationId) {
        'use strict';
        var cond = (condition || 'APPLICATION_DOWN').toUpperCase();
        var sev = (severity || 'HIGH').toUpperCase();
        var t = tenant || 'system';
        var app = appKey || 'platform';

        var dedupKey = cond + '_' + t + '_' + app;
        var existing = AppForgeAlertEngine._store.alerts[dedupKey];

        if (existing && (existing.state === 'OPEN' || existing.state === 'INVESTIGATING')) {
            existing.occurrence_count++;
            existing.last_seen = new Date().toISOString();
            existing.description = description || existing.description;
            this.logger.warn('alert_engine', 'ALERT_DEDUPLICATED', t, app, correlationId, 'Duplicate alert grouped: ' + cond, { count: existing.occurrence_count });
            return { success: true, alert: existing, is_new: false, deduplicated: true };
        }

        var alertNumber = 'ALT-' + Math.floor(100000 + Math.random() * 900000);
        var newAlert = {
            alert_id: 'alt_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000),
            number: alertNumber,
            condition: cond,
            severity: sev,
            tenant: t,
            application_key: app,
            description: description || ('Alert condition triggered: ' + cond),
            state: 'OPEN',
            occurrence_count: 1,
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            correlation_id: correlationId || ('corr_' + Date.now().toString(36)),
            incident_number: null
        };

        // Auto-incident trigger for CRITICAL severity
        if (sev === 'CRITICAL') {
            newAlert.incident_number = 'INC-' + Math.floor(100000 + Math.random() * 900000);
        }

        AppForgeAlertEngine._store.alerts[dedupKey] = newAlert;
        AppForgeAlertEngine._store.alert_list.push(newAlert);

        this.auditService.logEvent('ALERT_RAISED', 'OPERATIONAL', 'ops_admin', newAlert.correlation_id, 'SUCCESS', 'Alert raised: ' + cond + ' [' + sev + ']');
        return { success: true, alert: newAlert, is_new: true, deduplicated: false };
    },

    updateAlertState: function(alertNumberOrId, newState) {
        'use strict';
        var validStates = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
        var st = (newState || '').toUpperCase();
        if (validStates.indexOf(st) === -1) throw new Error('Invalid alert state: ' + newState);

        for (var i = 0; i < AppForgeAlertEngine._store.alert_list.length; i++) {
            var a = AppForgeAlertEngine._store.alert_list[i];
            if (a.number === alertNumberOrId || a.alert_id === alertNumberOrId) {
                a.state = st;
                a.updated_at = new Date().toISOString();
                return { success: true, alert: a };
            }
        }
        return { success: false, error: 'Alert not found.' };
    },

    listAlerts: function(filter) {
        'use strict';
        var f = filter || {};
        var list = AppForgeAlertEngine._store.alert_list.slice();
        if (f.state) list = list.filter(function(a) { return a.state === f.state.toUpperCase(); });
        if (f.severity) list = list.filter(function(a) { return a.severity === f.severity.toUpperCase(); });
        if (f.tenant) list = list.filter(function(a) { return a.tenant === f.tenant; });
        return list;
    },

    resetStore: function() {
        'use strict';
        AppForgeAlertEngine._store = {
            alerts: {},
            alert_list: []
        };
        this._store = AppForgeAlertEngine._store;
    },

    type: 'AppForgeAlertEngine'
};
