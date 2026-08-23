/**
 * AppForgeMetricsEngine
 * Aggregates multi-dimensional metrics (Counter, Gauge, Histogram, Latency percentiles, Error Rates).
 */
var AppForgeMetricsEngine = Class.create();
AppForgeMetricsEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMetricsEngine] ';
        this._metrics = {};
        this._latencies = [];
    },

    /**
     * Records a telemetry metric sample.
     * @param {string} metricName - Metric identifier.
     * @param {number} value - Metric value.
     * @param {Object} [tags] - Metric dimensions ({ app, env, op }).
     */
    record: function(metricName, value, tags) {
        'use strict';
        var key = metricName;
        if (!this._metrics[key]) {
            this._metrics[key] = { count: 0, sum: 0, min: Infinity, max: -Infinity, last: 0 };
        }
        var m = this._metrics[key];
        m.count++;
        m.sum += value;
        m.last = value;
        if (value < m.min) m.min = value;
        if (value > m.max) m.max = value;

        if (metricName === 'latency_ms') {
            this._latencies.push(value);
        }
    },

    increment: function(metricName, amount) {
        'use strict';
        this.record(metricName, amount || 1);
    },

    decrement: function(metricName, amount) {
        'use strict';
        this.record(metricName, -(amount || 1));
    },

    /**
     * Calculates summary metrics and latency percentiles.
     * @return {Object} Application metrics snapshot.
     */
    calculate: function() {
        'use strict';
        var totalReq = (this._metrics['request_count'] && this._metrics['request_count'].sum) || 0;
        var failCount = (this._metrics['failure_count'] && this._metrics['failure_count'].sum) || 0;
        var successCount = (this._metrics['success_count'] && this._metrics['success_count'].sum) || (totalReq - failCount);
        if (successCount < 0) successCount = 0;

        var errRate = totalReq > 0 ? (failCount / totalReq) : 0;
        var successRate = totalReq > 0 ? (successCount / totalReq) : 1.0;

        var lat = this._latencies.slice().sort(function(a, b) { return a - b; });
        var count = lat.length;
        var avg = count > 0 ? (lat.reduce(function(acc, v) { return acc + v; }, 0) / count) : 0;
        var p50 = count > 0 ? lat[Math.floor(count * 0.50)] : 0;
        var p95 = count > 0 ? lat[Math.min(Math.floor(count * 0.95), count - 1)] : 0;
        var p99 = count > 0 ? lat[Math.min(Math.floor(count * 0.99), count - 1)] : 0;

        return {
            request_count: totalReq,
            success_count: successCount,
            failure_count: failCount,
            error_rate: errRate,
            success_rate: successRate,
            average_latency_ms: avg,
            p50_latency_ms: p50,
            p95_latency_ms: p95,
            p99_latency_ms: p99,
            integration_failures: (this._metrics['integration_failure_count'] && this._metrics['integration_failure_count'].sum) || 0,
            security_violations: (this._metrics['security_violation_count'] && this._metrics['security_violation_count'].sum) || 0
        };
    },

    type: 'AppForgeMetricsEngine'
};
