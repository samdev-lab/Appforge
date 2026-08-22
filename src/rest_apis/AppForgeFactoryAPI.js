/**
 * AppForgeFactoryAPI
 * Scripted REST API Resource Controller for AppForge Application Factory operations.
 * Endpoints: POST /api/x_appforge/factory/plan (Dry Run) & POST /api/x_appforge/factory/execute (Execution)
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeFactoryAPI] ';

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'plan';

    var definitionPayload = {};
    try {
        if (request.body && request.body.data) {
            definitionPayload = request.body.data;
        }
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Failed to parse request body: ' + ex.message);
        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Invalid or missing JSON payload' });
        return;
    }

    try {
        if (action === 'plan') {
            var planner = new AppForgeFactoryPlanner();
            var planResult = planner.generatePlan(definitionPayload);

            if (planResult.status === 'BLOCKED' || planResult.status === 'FAILED') {
                response.setStatus(400);
                response.setBody(planResult);
                return;
            }

            response.setStatus(200);
            response.setBody(planResult);
            return;
        }

        if (action === 'execute') {
            var executor = new AppForgeFactoryExecutor();
            var execResult = executor.execute(definitionPayload, 'rest_user');

            if (!execResult.success) {
                response.setStatus(400);
                response.setBody(execResult);
                return;
            }

            response.setStatus(200);
            response.setBody(execResult);
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown factory action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Factory REST API execution: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
