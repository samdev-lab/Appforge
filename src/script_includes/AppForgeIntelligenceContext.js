/**
 * AppForgeIntelligenceContext
 * Prepares sanitized, secret-free, deterministic context packages for AI reasoning.
 * Ensures zero credential leakage, prompt injection guardrails, and scope boundaries.
 */
var AppForgeIntelligenceContext = Class.create();
AppForgeIntelligenceContext.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeIntelligenceContext] ';
        this.telemetryService = new AppForgeTelemetryService();
        this.checksumEngine = new AppForgeChecksumEngine();
    },

    /**
     * Builds AI context representation for an application.
     * @param {Object} appMetadata - Application metadata.
     * @param {Object} diagnosticReport - Output from AppForgeDiagnosticEngine.
     * @return {Object} Sanitized AI-ready context payload.
     */
    buildContext: function(appMetadata, diagnosticReport) {
        'use strict';
        var app = appMetadata || { name: 'Employee Onboarding', scope: 'x_appforge_employee', version: '1.2.0' };
        var diag = diagnosticReport || {};

        var rawContext = {
            application: {
                name: app.name,
                scope: app.scope,
                version: app.version
            },
            health: {
                status: diag.health_status || 'HEALTHY',
                score: diag.health_score || 100
            },
            anomalies_count: diag.anomalies_count || 0,
            incidents_count: diag.incidents_count || 0,
            probable_root_cause: diag.probable_root_cause || 'NONE',
            confidence: diag.confidence || 1.0,
            affected_components: diag.affected_components || [],
            recommendations: (diag.recommendations || []).map(function(r) {
                return {
                    action: r.action_type,
                    priority: r.priority,
                    safety: r.safety_classification
                };
            }),
            timestamp: new GlideDateTime().getValue()
        };

        var sanitized = this.telemetryService.sanitizeMetadata(rawContext);
        var contextHash = this.checksumEngine.generateChecksum(sanitized);

        return {
            context_hash: contextHash,
            payload: sanitized,
            sanitized: true,
            contains_raw_secrets: false
        };
    },

    type: 'AppForgeIntelligenceContext'
};
