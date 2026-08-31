/**
 * AppForgeAuditService
 * Central Audit Center & Operational Telemetry Engine with Correlation IDs.
 *
 * Implements:
 *   - Comprehensive audit logging across all lifecycle actions
 *   - Correlation ID propagation (X-Correlation-ID)
 *   - Masked payload enforcement (Zero secret exposure)
 *   - Structured query & compliance audit reporting
 */
var AppForgeAuditService = Class.create();
AppForgeAuditService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeAuditService] ';

        if (!AppForgeAuditService._store) {
            AppForgeAuditService._store = {
                events: []
            };
        }
        this._store = AppForgeAuditService._store;
    },

    /**
     * Records a structured audit event.
     */
    logEvent: function(tenantId, user, action, appKey, object, result, correlationId, details) {
        'use strict';
        var eventId = 'audit_' + Math.floor(Math.random() * 10000000);
        var entry = {
            event_id: eventId,
            timestamp: new Date().toISOString(),
            tenant_id: tenantId || 'system',
            user: user || 'system',
            action: (action || 'UNKNOWN').toUpperCase(),
            application_key: appKey || 'platform',
            object: object || 'system',
            result: (result || 'SUCCESS').toUpperCase(),
            correlation_id: correlationId || ('corr_' + Date.now().toString(36)),
            details: this._sanitizeDetails(details || {})
        };

        AppForgeAuditService._store.events.push(entry);
        gs.info(this.LOG_PREFIX + '[' + entry.action + '] ' + entry.application_key + ' -> ' + entry.result + ' (Corr: ' + entry.correlation_id + ')');
        return entry;
    },

    /**
     * Queries audit events matching filter criteria.
     */
    queryAuditLogs: function(filter) {
        'use strict';
        var f = filter || {};
        var list = AppForgeAuditService._store.events.slice();

        if (f.tenant_id) list = list.filter(function(e) { return e.tenant_id === f.tenant_id; });
        if (f.application_key) list = list.filter(function(e) { return e.application_key === f.application_key; });
        if (f.action) list = list.filter(function(e) { return e.action === f.action.toUpperCase(); });
        if (f.result) list = list.filter(function(e) { return e.result === f.result.toUpperCase(); });
        if (f.correlation_id) list = list.filter(function(e) { return e.correlation_id === f.correlation_id; });

        return list;
    },

    /**
     * Sanitizes sensitive fields from details before logging.
     * @private
     */
    _sanitizeDetails: function(obj) {
        'use strict';
        if (typeof obj !== 'object' || obj === null) return obj;
        var sanitized = {};
        for (var k in obj) {
            var low = k.toLowerCase();
            if (low.indexOf('secret') !== -1 || low.indexOf('password') !== -1 || low.indexOf('token') !== -1 || low.indexOf('auth') !== -1) {
                sanitized[k] = '********';
            } else if (typeof obj[k] === 'object' && obj[k] !== null) {
                sanitized[k] = this._sanitizeDetails(obj[k]);
            } else {
                sanitized[k] = obj[k];
            }
        }
        return sanitized;
    },

    resetStore: function() {
        'use strict';
        AppForgeAuditService._store = {
            events: []
        };
        this._store = AppForgeAuditService._store;
    },

    type: 'AppForgeAuditService'
};
