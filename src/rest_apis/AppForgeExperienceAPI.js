/**
 * AppForgeExperienceAPI
 * Scripted REST API Resource Controller for AppForge Experience Factory operations.
 * Endpoints: POST /api/x_appforge/experience/plan & POST /api/x_appforge/experience/execute
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeExperienceAPI] ';

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'plan';

    var expPayload = {};
    try {
        if (request.body && request.body.data) {
            expPayload = request.body.data;
        }
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Failed to parse request body: ' + ex.message);
        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Invalid or missing JSON payload' });
        return;
    }

    try {
        if (action === 'plan') {
            var planner = new AppForgeExperiencePlanner();
            var planResult = planner.generatePlan(expPayload);

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
            var executor = new AppForgeExperienceExecutor();
            var execResult = executor.execute(expPayload, 'rest_user');

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
        response.setBody({ error: 'Bad Request', message: 'Unknown experience action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Experience REST API execution: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
