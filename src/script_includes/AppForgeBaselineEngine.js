/**
 * AppForgeBaselineEngine
 * Builds historical statistical baselines (min, max, average, median, p95, standard deviation)
 * for latency, error rate, and request volume across configurable time windows without claiming ML.
 */
var AppForgeBaselineEngine = Class.create();
AppForgeBaselineEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeBaselineEngine] ';
    },

    /**
     * Calculates statistical baseline from an array of sample numeric values.
     * @param {Array<number>} values - Array of numerical samples.
     * @param {string} [window='24h'] - Baseline window.
     * @return {Object} Statistical summary.
     */
    calculateBaseline: function(values, window) {
        'use strict';
        if (!values || !Array.isArray(values) || values.length === 0) {
            return { window: window || '24h', count: 0, min: 0, max: 0, average: 0, median: 0, p95: 0, std_dev: 0 };
        }

        var sorted = values.slice().sort(function(a, b) { return a - b; });
        var n = sorted.length;
        var min = sorted[0];
        var max = sorted[n - 1];
        var sum = sorted.reduce(function(a, b) { return a + b; }, 0);
        var avg = sum / n;
        var median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
        var p95 = sorted[Math.min(Math.floor(n * 0.95), n - 1)];

        var varianceSum = sorted.reduce(function(a, b) { return a + Math.pow(b - avg, 2); }, 0);
        var stdDev = Math.sqrt(varianceSum / n);

        return {
            window: window || '24h',
            count: n,
            min: min,
            max: max,
            average: Math.round(avg * 100) / 100,
            median: Math.round(median * 100) / 100,
            p95: Math.round(p95 * 100) / 100,
            std_dev: Math.round(stdDev * 100) / 100
        };
    },

    type: 'AppForgeBaselineEngine'
};
