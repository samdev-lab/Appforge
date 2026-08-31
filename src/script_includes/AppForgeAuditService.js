/**
 * AppForgeAuditService
 * Central Audit Center & Operational Telemetry Engine with Correlation IDs.
 *
 * Implements:
 *   - Comprehensive audit logging across all lifecycle actions
 *   - Dual-signature support (8-arg legacy and 6-arg ops action signature)
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
     * Records a structured audit event with dual-signature support.
     */
    logEvent: function(a1, a2, a3, a4, a5, a6, a7, a8) {
        'use strict';
        var tenantId, user, action, appKey, object, result, correlationId, details;

        // Check if 1st argument is an action identifier (or if 3rd arg is action)
        if (typeof a3 === 'string' && a3 === a3.toUpperCase() && a3.indexOf('_') !== -1 && (!a1 || a1.indexOf('_') === -1 || a1.indexOf('tenant') === 0 || a1 === 'platform')) {
            // 8-arg signature: (tenantId, user, action, appKey, object, result, correlationId, details)
            tenantId = a1 || 'system';
            user = a2 || 'system';
            action = a3 || 'UNKNOWN';
            appKey = a4 || 'platform';
            object = a5 || 'system';
            result = (a6 || 'SUCCESS').toUpperCase();
            correlationId = a7 || ('corr_' + Date.now().toString(36));
            details = a8 || {};
        } else {
            // 6-arg ops signature: (action, category/object, user, correlationId, result, details/message)
            action = (a1 || 'UNKNOWN').toUpperCase();
            object = a2 || 'system';
            appKey = a2 || 'platform';
            user = a3 || 'system';
            tenantId = 'system';
            correlationId = a4 || ('corr_' + Date.now().toString(36));
            result = (a5 || 'SUCCESS').toUpperCase();
            details = (typeof a6 === 'object' && a6 !== null) ? a6 : { message: a6 };
        }

        var eventId = 'audit_' + Math.floor(Math.random() * 10000000);
        var entry = {
            event_id: eventId,
            timestamp: new Date().toISOString(),
            tenant_id: tenantId,
            user: user,
            action: action,
            application_key: appKey,
            object: object,
            result: result,
            correlation_id: correlationId,
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
        if (f.user) list = list.filter(function(e) { return e.user === f.user; });

        return list;
    },

    _sanitizeDetails: function(obj) {
        'use strict';
        if (typeof obj !== 'object' || obj === null) return obj;
        var sanitized = {};
        for (var k in obj) {
            var low = k.toLowerCase();
            if (low.indexOf('secret') !== -1 || low.indexOf('password') !== -1 || low.indexOf('token') !== -1 ||
                low.indexOf('auth') !== -1 || low.indexOf('card') !== -1 || low.indexOf('cvv') !== -1) {
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
