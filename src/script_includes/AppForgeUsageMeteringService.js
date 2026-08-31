/**
 * AppForgeUsageMeteringService
 * Commercial Multi-Metric Usage Metering, Quota Enforcement & Threshold Alert Engine.
 *
 * Implements:
 *   - Metering Metrics: ACTIVE_USERS, API_CALLS, REST_EXECUTIONS, WEBHOOK_EXECUTIONS, CATALOG_ITEMS, CASES, OPPORTUNITIES, PROJECTS, STORAGE
 *   - Quota Enforcement Modes: SOFT_LIMIT, HARD_LIMIT, OVERAGE
 *   - Automated Threshold Alerts: 50%, 75%, 90%, 100%
 *   - Idempotent correlation-tracked usage recording
 */
var AppForgeUsageMeteringService = Class.create();
AppForgeUsageMeteringService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeUsageMeteringService] ';
        this.auditService = new AppForgeAuditService();

        if (!AppForgeUsageMeteringService._store) {
            AppForgeUsageMeteringService._store = {
                usage_records: [],
                usage_aggregates: {}, // customerId + '_' + appKey + '_' + metric -> count
                processed_correlations: {}
            };
        }
        this._store = AppForgeUsageMeteringService._store;
    },

    /**
     * Records a usage event with idempotency protection.
     */
    recordUsage: function(customerId, appKey, metric, quantity, correlationId, source) {
        'use strict';
        if (!customerId || !appKey || !metric) throw new Error('Customer ID, app key, and metric are required.');

        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var cleanMetric = metric.toUpperCase();
        var q = (typeof quantity === 'number') ? quantity : 1;
        var corr = correlationId || ('corr_use_' + Math.floor(Math.random() * 1000000));

        // Idempotency check
        if (AppForgeUsageMeteringService._store.processed_correlations[corr]) {
            return {
                success: true,
                duplicate: true,
                message: 'Usage event ' + corr + ' already recorded.',
                current_total: this.getUsage(customerId, cleanApp, cleanMetric)
            };
        }
        AppForgeUsageMeteringService._store.processed_correlations[corr] = true;

        var rec = {
            record_id: 'rec_' + Math.floor(Math.random() * 10000000),
            customer_id: customerId,
            application_key: cleanApp,
            metric: cleanMetric,
            quantity: q,
            source: source || 'api',
            correlation_id: corr,
            recorded_on: new Date().toISOString()
        };

        AppForgeUsageMeteringService._store.usage_records.push(rec);

        var aggKey = customerId + '_' + cleanApp + '_' + cleanMetric;
        AppForgeUsageMeteringService._store.usage_aggregates[aggKey] = (AppForgeUsageMeteringService._store.usage_aggregates[aggKey] || 0) + q;

        return {
            success: true,
            record: rec,
            current_total: AppForgeUsageMeteringService._store.usage_aggregates[aggKey]
        };
    },

    /**
     * Gets current total usage for a specific metric.
     */
    getUsage: function(customerId, appKey, metric) {
        'use strict';
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var aggKey = customerId + '_' + cleanApp + '_' + metric.toUpperCase();
        return AppForgeUsageMeteringService._store.usage_aggregates[aggKey] || 0;
    },

    /**
     * Checks quota limit and returns structured limit evaluation.
     */
    checkLimit: function(customerId, appKey, metric, planLimit, enforcementMode) {
        'use strict';
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var current = this.getUsage(customerId, cleanApp, metric);
        var limit = (typeof planLimit === 'number') ? planLimit : 10000;
        var mode = (enforcementMode || 'HARD_LIMIT').toUpperCase(); // SOFT_LIMIT, HARD_LIMIT, OVERAGE

        var pct = Math.round((current / limit) * 100);
        var exceeded = (current > limit);

        var alert = null;
        if (pct >= 100) alert = '100%_LIMIT_EXCEEDED';
        else if (pct >= 90) alert = '90%_THRESHOLD_REACHED';
        else if (pct >= 75) alert = '75%_THRESHOLD_REACHED';
        else if (pct >= 50) alert = '50%_THRESHOLD_REACHED';

        if (exceeded && mode === 'HARD_LIMIT') {
            return {
                allowed: false,
                errorCode: 'USAGE_LIMIT_EXCEEDED',
                error: 'Usage limit exceeded for ' + metric + ' (' + current + '/' + limit + ')',
                current: current,
                limit: limit,
                percentage: pct,
                alert: alert,
                mode: mode
            };
        }

        return {
            allowed: true,
            current: current,
            limit: limit,
            percentage: pct,
            alert: alert,
            mode: mode,
            overage_units: exceeded ? (current - limit) : 0
        };
    },

    /**
     * Aggregates usage dashboard metrics for an application.
     */
    aggregateUsage: function(customerId, appKey) {
        'use strict';
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var metrics = ['API_CALLS', 'ACTIVE_USERS', 'REST_EXECUTIONS', 'WEBHOOK_EXECUTIONS', 'STORAGE'];
        var summary = {};

        for (var i = 0; i < metrics.length; i++) {
            var m = metrics[i];
            summary[m] = this.getUsage(customerId, cleanApp, m);
        }

        return {
            customer_id: customerId,
            application_key: cleanApp,
            metrics: summary,
            last_updated: new Date().toISOString()
        };
    },

    resetPeriod: function(customerId, appKey) {
        'use strict';
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var prefix = customerId + '_' + cleanApp + '_';
        for (var k in AppForgeUsageMeteringService._store.usage_aggregates) {
            if (k.indexOf(prefix) === 0) {
                AppForgeUsageMeteringService._store.usage_aggregates[k] = 0;
            }
        }
        return { success: true, message: 'Usage period reset for ' + cleanApp };
    },

    resetStore: function() {
        'use strict';
        AppForgeUsageMeteringService._store = {
            usage_records: [],
            usage_aggregates: {},
            processed_correlations: {}
        };
        this._store = AppForgeUsageMeteringService._store;
        this.auditService.resetStore();
    },

    type: 'AppForgeUsageMeteringService'
};
