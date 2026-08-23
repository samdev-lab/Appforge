/**
 * AppForgeIntelligenceAPI
 * Scripted REST Controller for Application Intelligence & Observability Factory.
 * Endpoints:
 *   POST /api/x_appforge/intelligence/health     — Evaluates 0–100 health score
 *   POST /api/x_appforge/intelligence/anomalies  — Detects operational anomalies
 *   POST /api/x_appforge/intelligence/diagnose   — Runs full diagnostic & root cause analysis
 *   POST /api/x_appforge/intelligence/recommend  — Generates prioritized recommendations
 *   GET  /api/x_appforge/intelligence/summary/{id}
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeIntelligenceAPI] ';
    var AUTHORIZED_ROLES = [
        'x_appforge.admin', 'x_appforge.intelligence_viewer',
        'x_appforge.intelligence_analyst', 'x_appforge.intelligence_admin'
    ];

    var isAuthorized = false;
    for (var r = 0; r < AUTHORIZED_ROLES.length; r++) {
        if (gs.hasRole(AUTHORIZED_ROLES[r])) {
            isAuthorized = true;
            break;
        }
    }

    if (!isAuthorized) {
        response.setStatus(403);
        response.setBody({ error: 'Forbidden', message: 'Intelligence role required to access Intelligence APIs' });
        return;
    }

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'diagnose';
    var appId = pathParams.id || '';

    var payload = {};
    try {
        if (request.body && request.body.data) {
            payload = request.body.data;
        }
    } catch (ex) {
        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Invalid JSON payload' });
        return;
    }

    try {
        var diagnosticEngine = new AppForgeDiagnosticEngine();
        var healthEngine = new AppForgeApplicationHealthEngine();
        var anomalyDetector = new AppForgeAnomalyDetector();
        var recommendationEngine = new AppForgeRecommendationEngine();

        if (action === 'health') {
            var healthRes = healthEngine.evaluateHealth(payload.metrics || {}, payload.anomalies || []);
            response.setStatus(200);
            response.setBody(healthRes);
            return;
        }

        if (action === 'anomalies') {
            var anomRes = anomalyDetector.detectAnomalies(payload.metrics || {}, payload.baseline || {});
            response.setStatus(200);
            response.setBody({ anomalies: anomRes, count: anomRes.length });
            return;
        }

        if (action === 'diagnose') {
            var diagRes = diagnosticEngine.diagnose(
                payload.metrics || {},
                payload.baseline || {},
                payload.telemetry || [],
                payload.recent_changes || [],
                payload.application_id || appId
            );
            response.setStatus(200);
            response.setBody(diagRes);
            return;
        }

        if (action === 'recommend') {
            var recRes = recommendationEngine.generateRecommendations(payload.health || {}, payload.root_cause || {}, payload.anomalies || []);
            response.setStatus(200);
            response.setBody({ recommendations: recRes, count: recRes.length });
            return;
        }

        if (action === 'summary') {
            var contextEngine = new AppForgeIntelligenceContext();
            var mockProvider = new MockIntelligenceProvider();
            var ctx = contextEngine.buildContext({ name: appId || 'Employee Onboarding' }, payload.diagnostic || {});
            var summary = mockProvider.summarize(ctx);
            response.setStatus(200);
            response.setBody(summary);
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown intelligence action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Intelligence REST API: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
