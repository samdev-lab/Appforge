/**
 * AppForgeSecurityAPI
 * Scripted REST API Resource Controller for AppForge Security Factory.
 * Endpoints:
 *   POST /api/x_appforge/security/plan    — Dry-run plan generation & security analysis
 *   POST /api/x_appforge/security/execute — Security provisioning execution
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeSecurityAPI] ';
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
            message: 'Role x_appforge.developer or x_appforge.admin required to access Security Factory APIs'
        });
        return;
    }

    var secPayload = {};
    var appScope = '';
    try {
        if (request.body && request.body.data) {
            var body = request.body.data;
            secPayload = body.security || body;
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
            var planner = new AppForgeSecurityPlanner();
            var planResult = planner.generatePlan(secPayload, appScope);

            response.setStatus(planResult.valid ? 200 : 400);
            response.setBody(planResult);
            return;
        }

        if (action === 'execute') {
            var executor = new AppForgeSecurityExecutor();
            var execResult = executor.execute(secPayload, appScope, 'rest_user');

            response.setStatus(execResult.success ? 200 : 400);
            response.setBody(execResult);
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown security action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Security REST API execution: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
