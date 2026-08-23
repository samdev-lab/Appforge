/**
 * AppForgeAnomalyDetector
 * Deterministic anomaly detection engine detecting latency spikes, error rate spikes,
 * unusual volumes, and failure patterns against baselines.
 */
var AppForgeAnomalyDetector = Class.create();
AppForgeAnomalyDetector.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeAnomalyDetector] ';
    },

    /**
     * Evaluates current metrics against baseline to detect anomalies.
     * @param {Object} currentMetrics - Current metrics snapshot from AppForgeMetricsEngine.
     * @param {Object} baseline - Baseline statistics from AppForgeBaselineEngine.
     * @return {Array<Object>} List of detected anomalies.
     */
    detectAnomalies: function(currentMetrics, baseline) {
        'use strict';
        var anomalies = [];
        if (!currentMetrics) return anomalies;

        // 1. Latency Spike Detection
        var observedLat = currentMetrics.average_latency_ms || currentMetrics.p95_latency_ms || 0;
        var expectedLat = (baseline && baseline.p95) || 300;
        if (observedLat > expectedLat * 2.0 && observedLat > 500) {
            anomalies.push({
                anomaly_id: 'anom_lat_' + new Date().getTime(),
                type: 'LATENCY_SPIKE',
                severity: observedLat > expectedLat * 5.0 ? 'CRITICAL' : 'HIGH',
                metric: 'latency_ms',
                observed_value: observedLat + ' ms',
                expected_value: expectedLat + ' ms',
                threshold: (expectedLat * 2.0) + ' ms',
                confidence: 0.95,
                evidence: 'Observed latency (' + observedLat + ' ms) significantly exceeds baseline (' + expectedLat + ' ms)',
                status: 'OPEN'
            });
        }

        // 2. Error Rate Spike Detection
        var errRate = currentMetrics.error_rate || 0;
        var maxErrThreshold = 0.05; // 5%
        if (errRate > maxErrThreshold) {
            anomalies.push({
                anomaly_id: 'anom_err_' + new Date().getTime(),
                type: 'ERROR_SPIKE',
                severity: errRate > 0.15 ? 'CRITICAL' : 'HIGH',
                metric: 'error_rate',
                observed_value: (Math.round(errRate * 10000) / 100) + '%',
                expected_value: '< 1%',
                threshold: (maxErrThreshold * 100) + '%',
                confidence: 0.98,
                evidence: 'Current error rate (' + (Math.round(errRate * 100) / 100) + ') exceeds allowable threshold (0.05)',
                status: 'OPEN'
            });
        }

        // 3. Integration Failure Anomaly
        if (currentMetrics.integration_failures > 0) {
            anomalies.push({
                anomaly_id: 'anom_int_' + new Date().getTime(),
                type: 'FAILURE_PATTERN',
                severity: 'HIGH',
                metric: 'integration_failure_count',
                observed_value: String(currentMetrics.integration_failures),
                expected_value: '0',
                threshold: '0',
                confidence: 0.99,
                evidence: currentMetrics.integration_failures + ' integration failure(s) detected.',
                status: 'OPEN'
            });
        }

        // 4. Security Violations Anomaly
        if (currentMetrics.security_violations > 0) {
            anomalies.push({
                anomaly_id: 'anom_sec_' + new Date().getTime(),
                type: 'THRESHOLD',
                severity: 'CRITICAL',
                metric: 'security_violation_count',
                observed_value: String(currentMetrics.security_violations),
                expected_value: '0',
                threshold: '0',
                confidence: 1.0,
                evidence: currentMetrics.security_violations + ' security violation(s) detected.',
                status: 'OPEN'
            });
        }

        return anomalies;
    },

    type: 'AppForgeAnomalyDetector'
};
