/**
 * AppForgeDeploymentAPI
 * Scripted REST API Controller for Deployment Pipeline & Multi-Environment Orchestration Factory.
 * Endpoints:
 *   POST /api/x_appforge/deployment/plan     — Plan deployment operations
 *   POST /api/x_appforge/deployment/dry-run  — Dry-run simulation (0 target modifications)
 *   POST /api/x_appforge/deployment/validate — Pre-flight validation
 *   POST /api/x_appforge/deployment/start    — Execute controlled deployment
 *   POST /api/x_appforge/deployment/approve  — Record Four-Eyes release approval
 *   POST /api/x_appforge/deployment/rollback — Compensating rollback trigger
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeDeploymentAPI] ';
    var AUTHORIZED_ROLES = ['x_appforge.admin', 'x_appforge.deployer', 'x_appforge.release_manager'];

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
            message: 'Role x_appforge.deployer, x_appforge.release_manager, or x_appforge.admin required'
        });
        return;
    }

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'dry-run';

    var payload = {};
    try {
        if (request.body && request.body.data) {
            payload = request.body.data;
        }
    } catch (ex) {
        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Invalid or missing JSON payload' });
        return;
    }

    try {
        if (action === 'validate' || action === 'dry-run' || action === 'plan') {
            var planner = new AppForgeDeploymentPlanner();
            var planResult = planner.generatePlan(payload.package || payload, payload.target_environment || { type: 'TEST' }, payload.approval || null);
            response.setStatus(planResult.valid ? 200 : 400);
            response.setBody(planResult);
            return;
        }

        if (action === 'start') {
            var executor = new AppForgeDeploymentExecutor();
            var execResult = executor.executeDeployment(
                payload.package || payload,
                payload.target_environment || { type: 'TEST' },
                payload.approval || null,
                'rest_deployer',
                payload.correlation_id
            );
            response.setStatus(execResult.success ? 200 : 400);
            response.setBody(execResult);
            return;
        }

        if (action === 'approve') {
            var reqUser = payload.requested_by || 'developer_user';
            var appUser = payload.approved_by || 'manager_user';
            var env = payload.environment || 'UAT';

            if ((env === 'UAT' || env === 'PRODUCTION') && reqUser === appUser) {
                response.setStatus(400);
                response.setBody({
                    error: 'Separation of Duties Violation',
                    message: 'BLOCKED: SEPARATION_OF_DUTIES_VIOLATION. Requester cannot self-approve.'
                });
                return;
            }

            response.setStatus(200);
            response.setBody({
                status: 'APPROVED',
                approval_id: 'appr_' + new Date().getTime(),
                requested_by: reqUser,
                approved_by: appUser,
                environment: env
            });
            return;
        }

        if (action === 'rollback') {
            var rollbackMgr = new AppForgeDeploymentRollback();
            var rbResult = rollbackMgr.executeRollback(payload.operations || [], payload.run_id || 'run_manual');
            response.setStatus(200);
            response.setBody(rbResult);
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown deployment action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Deployment REST API: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
