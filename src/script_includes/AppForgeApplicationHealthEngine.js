/**
 * AppForgeApplicationHealthEngine
 * Deterministic application health calculator producing 0–100 scores and states
 * (HEALTHY, DEGRADED, WARNING, CRITICAL, UNKNOWN) across weighted architectural layers.
 */
var AppForgeApplicationHealthEngine = Class.create();
AppForgeApplicationHealthEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeApplicationHealthEngine] ';
        this.DEFAULT_WEIGHTS = {
            availability: 0.20,
            performance: 0.20,
            reliability: 0.20,
            integration: 0.15,
            security: 0.15,
            data_integrity: 0.10
        };
    },

    /**
     * Calculates application health score and classification.
     * @param {Object} metrics - Metric summary from AppForgeMetricsEngine.
     * @param {Array<Object>} [anomalies] - Detected anomalies.
     * @param {Object} [customWeights] - Optional layer weight overrides.
     * @return {Object} Structured health evaluation.
     */
    evaluateHealth: function(metrics, anomalies, customWeights) {
        'use strict';
        var w = customWeights || this.DEFAULT_WEIGHTS;
        var reasons = [];
        var layerScores = {
            availability: 100,
            performance: 100,
            reliability: 100,
            integration: 100,
            security: 100,
            data_integrity: 100
        };

        if (metrics) {
            // Error Rate Penalty on Reliability
            if (metrics.error_rate > 0.10) {
                layerScores.reliability = 20;
                reasons.push('High error rate (' + (Math.round(metrics.error_rate * 100)) + '%)');
            } else if (metrics.error_rate > 0.02) {
                layerScores.reliability = 60;
                reasons.push('Elevated error rate (' + (Math.round(metrics.error_rate * 100)) + '%)');
            }

            // Latency Penalty on Performance
            if (metrics.average_latency_ms > 2000) {
                layerScores.performance = 30;
                reasons.push('Severe latency degradation (>2,000ms)');
            } else if (metrics.average_latency_ms > 800) {
                layerScores.performance = 70;
                reasons.push('Moderate latency elevation (>800ms)');
            }

            // Integration Failures Penalty
            if (metrics.integration_failures > 0) {
                layerScores.integration = 40;
                reasons.push(metrics.integration_failures + ' integration failure(s)');
            }

            // Security Violations Penalty
            if (metrics.security_violations > 0) {
                layerScores.security = 0;
                reasons.push(metrics.security_violations + ' critical security violation(s)');
            }
        }

        // Anomaly Penalties
        if (anomalies && Array.isArray(anomalies) && anomalies.length > 0) {
            reasons.push(anomalies.length + ' active anomaly/anomalies detected');
        }

        // Calculate weighted score
        var totalScore = Math.round(
            (layerScores.availability * (w.availability || 0.20)) +
            (layerScores.performance * (w.performance || 0.20)) +
            (layerScores.reliability * (w.reliability || 0.20)) +
            (layerScores.integration * (w.integration || 0.15)) +
            (layerScores.security * (w.security || 0.15)) +
            (layerScores.data_integrity * (w.data_integrity || 0.10))
        );

        var healthStatus = 'HEALTHY';
        if (totalScore < 50 || layerScores.security === 0) {
            healthStatus = 'CRITICAL';
        } else if (totalScore < 70) {
            healthStatus = 'WARNING';
        } else if (totalScore < 90) {
            healthStatus = 'DEGRADED';
        }

        return {
            health_status: healthStatus,
            score: totalScore,
            layer_breakdown: layerScores,
            reasons: reasons.length > 0 ? reasons : ['All architectural layers operating within optimal baselines'],
            timestamp: new GlideDateTime().getValue()
        };
    },

    type: 'AppForgeApplicationHealthEngine'
};
