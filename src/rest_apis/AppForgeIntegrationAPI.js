/**
 * AppForgeIntegrationAPI
 * Scripted REST API Resource Controller for AppForge Integration & API Factory.
 * Endpoints:
 *   POST /api/x_appforge/integration/plan    — Dry-run plan generation & security analysis
 *   POST /api/x_appforge/integration/execute — Integration provisioning execution
 *   POST /api/x_appforge/integration/test    — Endpoint connectivity & authentication test
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeIntegrationAPI] ';
    var AUTHORIZED_ROLES = ['x_appforge.admin', 'x_appforge.developer'];

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'plan';

    // Strict RBAC check
    var isAuthorized = false;
    for (var r = 0; r < AUTHORIZED_ROLES.length; r++) {
        if (gs.hasRole(AUTHORIZED_ROLES[r])) {
            isAuthorized = true;
            break;
        }
    }

    if (!isAuthorized) {
        response.setStatus(403);
        response.setBody({
            error: 'Forbidden',
            message: 'Role x_appforge.developer or x_appforge.admin required to access Integration Factory APIs'
        });
        return;
    }

    var intPayload = {};
    var appScope = '';
    try {
        if (request.body && request.body.data) {
            var body = request.body.data;
            intPayload = body.integration || body;
            appScope = body.scope || body.app_scope || '';
        }
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Failed to parse request body: ' + ex.message);
        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Invalid or missing JSON payload' });
        return;
    }

    try {
        if (action === 'plan') {
            var planner = new AppForgeIntegrationPlanner();
            var planResult = planner.generatePlan(intPayload, appScope);

            response.setStatus(planResult.valid ? 200 : 400);
            response.setBody(planResult);
            return;
        }

        if (action === 'execute') {
            var executor = new AppForgeIntegrationExecutor();
            var execResult = executor.execute(intPayload, appScope, 'rest_user');

            response.setStatus(execResult.success ? 200 : 400);
            response.setBody(execResult);
            return;
        }

        if (action === 'test') {
            var mockProvider = new MockEmployeeHRProvider();
            var endpoint = intPayload.endpoint || 'https://api.example.test/v1/health';
            var testRes = mockProvider.executeRequest(endpoint, 'GET', {}, {});

            response.setStatus(testRes.status_code === 200 ? 200 : 502);
            response.setBody({
                status: testRes.status_code === 200 ? 'CONNECTED' : 'FAILED',
                status_code: testRes.status_code,
                duration_ms: testRes.duration_ms
            });
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown integration action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Integration REST API execution: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
