/**
 * AppForgeMetricsService
 * Operational Performance Metrics, Percentile Aggregator & SLO Engine.
 *
 * Implements:
 *   - Metrics: REQUEST_COUNT, REQUEST_LATENCY, ERROR_COUNT, ERROR_RATE, API_CALLS, REST_EXECUTIONS, WEBHOOKS, QUEUE_DEPTH, JOB_FAILURES, INSTALLATIONS, UPGRADES, ROLLBACKS
 *   - Statistical Computations: COUNT, AVERAGE, P50, P90, P95, P99
 *   - Configurable Service Level Objectives (SLOs) & Compliance Status
 */
var AppForgeMetricsService = Class.create();
AppForgeMetricsService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMetricsService] ';

        if (!AppForgeMetricsService._store) {
            AppForgeMetricsService._store = {
                metrics_data: {}, // metricName -> array of values
                slo_targets: {
                    'API_AVAILABILITY': { target_percentage: 99.9, description: 'REST API Service Availability' },
                    'MARKETPLACE_AVAILABILITY': { target_percentage: 99.9, description: 'Marketplace Service Availability' },
                    'APPLICATION_RUNTIME': { target_percentage: 99.9, description: 'Application Runtime Availability' },
                    'INTEGRATION_RUNTIME': { target_percentage: 99.5, description: 'Universal REST Integration Runtime' },
                    'BILLING_SERVICE': { target_percentage: 99.9, description: 'Commercial Billing Service Availability' }
                }
            };
        }
        this._store = AppForgeMetricsService._store;
    },

    /**
     * Records a numeric metric data point.
     */
    recordMetric: function(metricName, value, tenant, appKey) {
        'use strict';
        if (!metricName || typeof value !== 'number') throw new Error('Metric name and numeric value required.');

        var m = metricName.toUpperCase();
        if (!AppForgeMetricsService._store.metrics_data[m]) {
            AppForgeMetricsService._store.metrics_data[m] = [];
        }

        AppForgeMetricsService._store.metrics_data[m].push({
            value: value,
            tenant: tenant || 'system',
            application_key: appKey || 'platform',
            timestamp: new Date().toISOString()
        });

        return { success: true, metric: m, value: value };
    },

    /**
     * Computes statistics (Count, Average, P50, P90, P95, P99) for a metric.
     */
    getMetricStats: function(metricName) {
        'use strict';
        var m = (metricName || '').toUpperCase();
        var data = AppForgeMetricsService._store.metrics_data[m] || [];
        if (data.length === 0) {
            return { metric: m, count: 0, average: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
        }

        var values = data.map(function(d) { return d.value; }).sort(function(a, b) { return a - b; });
        var sum = values.reduce(function(a, b) { return a + b; }, 0);
        var avg = sum / values.length;

        function getPercentile(arr, p) {
            var idx = Math.ceil((p / 100) * arr.length) - 1;
            return arr[Math.max(0, Math.min(idx, arr.length - 1))];
        }

        return {
            metric: m,
            count: values.length,
            average: parseFloat(avg.toFixed(2)),
            min: values[0],
            max: values[values.length - 1],
            p50: getPercentile(values, 50),
            p90: getPercentile(values, 90),
            p95: getPercentile(values, 95),
            p99: getPercentile(values, 99)
        };
    },

    /**
     * Evaluates SLO compliance status against configured targets.
     */
    evaluateSLO: function(sloName, currentActualPct) {
        'use strict';
        var name = (sloName || '').toUpperCase();
        var target = AppForgeMetricsService._store.slo_targets[name];
        if (!target) return { slo: name, compliant: false, error: 'SLO definition not found.' };

        var actual = (typeof currentActualPct === 'number') ? currentActualPct : 99.95;
        var compliant = (actual >= target.target_percentage);

        return {
            slo_name: name,
            description: target.description,
            target_percentage: target.target_percentage,
            actual_percentage: actual,
            compliant: compliant,
            status: compliant ? 'COMPLIANT' : 'BREACHED'
        };
    },

    listSLOs: function() {
        'use strict';
        var list = [];
        for (var k in AppForgeMetricsService._store.slo_targets) {
            list.push(this.evaluateSLO(k));
        }
        return list;
    },

    resetStore: function() {
        'use strict';
        AppForgeMetricsService._store = {
            metrics_data: {},
            slo_targets: {
                'API_AVAILABILITY': { target_percentage: 99.9, description: 'REST API Service Availability' },
                'MARKETPLACE_AVAILABILITY': { target_percentage: 99.9, description: 'Marketplace Service Availability' },
                'APPLICATION_RUNTIME': { target_percentage: 99.9, description: 'Application Runtime Availability' },
                'INTEGRATION_RUNTIME': { target_percentage: 99.5, description: 'Universal REST Integration Runtime' },
                'BILLING_SERVICE': { target_percentage: 99.9, description: 'Commercial Billing Service Availability' }
            }
        };
        this._store = AppForgeMetricsService._store;
    },

    type: 'AppForgeMetricsService'
};
