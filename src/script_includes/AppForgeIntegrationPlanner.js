/**
 * AppForgeIntegrationPlanner
 * Dry-run planning engine for Integration & API Factory.
 * Generates dependency-ordered plans: Authentications → Integrations → Inbound APIs & Resources → Outbound REST & Mappings → Webhooks.
 */
var AppForgeIntegrationPlanner = Class.create();
AppForgeIntegrationPlanner.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeIntegrationPlanner] ';
        this.validator = new AppForgeIntegrationValidator();
        this.securityAnalyzer = new AppForgeIntegrationSecurityAnalyzer();
    },

    /**
     * Generates a structured dry-run integration execution plan.
     * @param {Object} intDef - Integration definition payload.
     * @param {string} [appScope] - Application scope prefix.
     * @return {Object} Structured integration execution plan.
     */
    generatePlan: function(intDef, appScope) {
        'use strict';
        var valResult = this.validator.validate(intDef, appScope);
        if (!valResult.valid) {
            var isBlocked = valResult.errors.some(function(e) {
                return e.indexOf('BLOCKED') !== -1 || e.indexOf('CROSS-SCOPE') !== -1 || e.indexOf('RAW SECRET') !== -1;
            });
            return {
                valid: false,
                status: isBlocked ? 'BLOCKED' : 'FAILED',
                errors: valResult.errors,
                warnings: valResult.warnings || [],
                operations: []
            };
        }

        var secAnalysis = this.securityAnalyzer.analyze(intDef, appScope);
        if (secAnalysis.result === 'BLOCK') {
            return {
                valid: false,
                status: 'BLOCKED',
                errors: secAnalysis.findings.map(function(f) { return '[' + f.severity + '] ' + f.label; }),
                warnings: valResult.warnings || [],
                operations: []
            };
        }

        var operations = [];
        var sequence = 1;

        // 1. Plan Authentication references
        var auths = intDef.authentications || [];
        for (var au = 0; au < auths.length; au++) {
            operations.push({
                sequence: sequence++,
                operation_type: 'CREATE_AUTH',
                target_type: 'Authentication',
                target_name: auths[au].name,
                auth_type: auths[au].type || 'BASIC',
                credential_reference: auths[au].credential_reference,
                status: 'CREATE'
            });
        }

        // 2. Plan Inbound APIs and Resources
        var apis = intDef.apis || [];
        for (var a = 0; a < apis.length; a++) {
            var api = apis[a];
            operations.push({
                sequence: sequence++,
                operation_type: 'CREATE_API',
                target_type: 'ScriptedRESTAPI',
                target_name: api.name,
                base_path: api.base_path,
                version: api.version || 'v1',
                authentication_type: api.authentication_type || 'BASIC',
                status: 'CREATE'
            });

            var resources = api.resources || [];
            for (var r = 0; r < resources.length; r++) {
                var res = resources[r];
                operations.push({
                    sequence: sequence++,
                    operation_type: 'CREATE_RESOURCE',
                    target_type: 'APIResource',
                    target_name: (res.http_method || 'POST') + ' ' + api.base_path + res.path,
                    api_name: api.name,
                    http_method: res.http_method || 'POST',
                    path: res.path,
                    table_name: res.table_name,
                    operation: res.operation || 'create',
                    status: 'CREATE'
                });
            }
        }

        // 3. Plan Outbound Integrations
        var outbounds = intDef.outbounds || [];
        for (var o = 0; o < outbounds.length; o++) {
            var out = outbounds[o];
            operations.push({
                sequence: sequence++,
                operation_type: 'CREATE_OUTBOUND',
                target_type: 'OutboundREST',
                target_name: out.name,
                endpoint: out.endpoint,
                http_method: out.http_method || 'POST',
                timeout_seconds: out.timeout_seconds || 30,
                retry_policy: out.retry_policy || 'EXPONENTIAL',
                max_retries: out.max_retries || 3,
                status: 'CREATE'
            });
        }

        // 4. Plan Webhooks
        var webhooks = intDef.webhooks || [];
        for (var w = 0; w < webhooks.length; w++) {
            var wh = webhooks[w];
            operations.push({
                sequence: sequence++,
                operation_type: 'CREATE_WEBHOOK',
                target_type: 'Webhook',
                target_name: wh.name,
                endpoint_path: wh.endpoint_path,
                signature_method: wh.signature_method || 'HMAC-SHA256',
                status: 'CREATE'
            });
        }

        gs.info(this.LOG_PREFIX + 'Integration plan generated cleanly (' + operations.length + ' operations)');
        return {
            valid: true,
            status: 'READY',
            operations: operations,
            summary: {
                operations_total: operations.length,
                authentications_count: auths.length,
                apis_count: apis.length,
                outbounds_count: outbounds.length,
                webhooks_count: webhooks.length
            },
            security_analysis: secAnalysis.result,
            security_findings: secAnalysis.findings,
            warnings: valResult.warnings || [],
            errors: []
        };
    },

    type: 'AppForgeIntegrationPlanner'
};
