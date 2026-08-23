/**
 * AppForgeDiagnosticEngine
 * Master diagnostic evaluator coordinating health calculation, anomaly detection,
 * incident correlation, root cause analysis, change correlation, and recommendations.
 */
var AppForgeDiagnosticEngine = Class.create();
AppForgeDiagnosticEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeDiagnosticEngine] ';
        this.healthEngine = new AppForgeApplicationHealthEngine();
        this.anomalyDetector = new AppForgeAnomalyDetector();
        this.incidentEngine = new AppForgeIncidentCorrelationEngine();
        this.rootCauseEngine = new AppForgeRootCauseEngine();
        this.changeCorrelation = new AppForgeChangeCorrelationEngine();
        this.recommendationEngine = new AppForgeRecommendationEngine();
    },

    /**
     * Performs comprehensive application diagnostics.
     * @param {Object} metrics - Current metrics summary.
     * @param {Object} baseline - Baseline statistics.
     * @param {Array<Object>} telemetryEvents - Recent telemetry events.
     * @param {Array<Object>} [recentChanges] - Recent migrations/deployments.
     * @param {string} [appId] - Application ID.
     * @return {Object} Unified diagnostic report.
     */
    diagnose: function(metrics, baseline, telemetryEvents, recentChanges, appId) {
        'use strict';
        var t0 = new Date().getTime();
        var application = appId || 'Employee Onboarding';

        // 1. Anomaly Detection
        var anomalies = this.anomalyDetector.detectAnomalies(metrics, baseline);

        // 2. Health Calculation
        var health = this.healthEngine.evaluateHealth(metrics, anomalies);

        // 3. Incident Correlation
        var incidents = this.incidentEngine.correlateIncidents(telemetryEvents, application);

        // 4. Root Cause Analysis
        var primaryIncident = incidents.length > 0 ? incidents[0] : null;
        var rootCause = this.rootCauseEngine.analyzeRootCause(primaryIncident, recentChanges);

        // 5. Change Correlation
        var changeCorr = this.changeCorrelation.correlateWithChanges(primaryIncident, recentChanges);

        // 6. Recommendations
        var recommendations = this.recommendationEngine.generateRecommendations(health, rootCause, anomalies);

        var t1 = new Date().getTime();
        var runId = 'run_diag_' + t0;

        // Record Intelligence Run
        this._recordRun(runId, application, health.score, anomalies.length, rootCause.confidence, t1 - t0);

        return {
            run_id: runId,
            application: application,
            health_status: health.health_status,
            health_score: health.score,
            health_breakdown: health.layer_breakdown,
            anomalies: anomalies,
            anomalies_count: anomalies.length,
            incidents: incidents,
            incidents_count: incidents.length,
            probable_root_cause: rootCause.probable_root_cause,
            confidence: rootCause.confidence,
            affected_components: rootCause.affected_components,
            change_correlation: changeCorr,
            recommendations: recommendations,
            duration_ms: t1 - t0,
            timestamp: new GlideDateTime().getValue()
        };
    },

    _recordRun: function(runId, app, score, anomalyCount, conf, duration) {
        'use strict';
        try {
            var gr = new GlideRecordSecure('x_appforge_intelligence_run');
            gr.initialize();
            gr.setValue('run_id', runId);
            gr.setValue('application', app);
            gr.setValue('health_score', score);
            gr.setValue('anomalies_detected', anomalyCount);
            gr.setValue('confidence', conf);
            gr.setValue('duration_ms', duration);
            gr.setValue('status', 'SUCCESS');
            gr.setValue('timestamp', new GlideDateTime().getValue());
            return gr.insert();
        } catch (e) {
            return 'sys_id_mock_run';
        }
    },

    type: 'AppForgeDiagnosticEngine'
};
