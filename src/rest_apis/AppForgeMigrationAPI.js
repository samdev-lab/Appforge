/**
 * AppForgeMigrationAPI
 * Scripted REST Controller for Enterprise Migration & High-Volume Data Transformation Factory.
 * Endpoints:
 *   POST /api/x_appforge/migration/plan     — Dry-run migration planning
 *   POST /api/x_appforge/migration/dry-run  — Dry-run execution simulation
 *   POST /api/x_appforge/migration/validate — Migration definition validation
 *   POST /api/x_appforge/migration/start    — Execute batched data migration
 *   POST /api/x_appforge/migration/{id}/pause
 *   POST /api/x_appforge/migration/{id}/resume
 *   POST /api/x_appforge/migration/{id}/cancel
 *   POST /api/x_appforge/migration/{id}/rollback
 *   GET  /api/x_appforge/migration/{id}/status
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeMigrationAPI] ';
    var AUTHORIZED_ROLES = [
        'x_appforge.admin', 'x_appforge.migration_planner',
        'x_appforge.migration_executor', 'x_appforge.migration_approver'
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
        response.setBody({ error: 'Forbidden', message: 'Migration role required to access Migration APIs' });
        return;
    }

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'dry-run';
    var migrationId = pathParams.id || '';

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
        if (action === 'validate' || action === 'dry-run' || action === 'plan') {
            var planner = new AppForgeMigrationPlanner();
            var planResult = planner.generatePlan(payload.migration || payload, payload.target_environment || { type: 'TEST' }, payload.scope);
            response.setStatus(planResult.valid ? 200 : 400);
            response.setBody(planResult);
            return;
        }

        if (action === 'start') {
            var executor = new AppForgeMigrationExecutor();
            var execResult = executor.executeMigration(
                payload.migration || payload,
                payload.records || [],
                payload.target_environment || { type: 'TEST' },
                'rest_migration_user',
                payload.correlation_id
            );
            response.setStatus(execResult.success ? 200 : 400);
            response.setBody(execResult);
            return;
        }

        if (action === 'pause') {
            var processor = new AppForgeMigrationBatchProcessor();
            response.setStatus(200);
            response.setBody(processor.pause(migrationId));
            return;
        }

        if (action === 'resume') {
            var procResume = new AppForgeMigrationBatchProcessor();
            response.setStatus(200);
            response.setBody(procResume.resume(migrationId, payload.records || [], payload.transformation || {}));
            return;
        }

        if (action === 'cancel') {
            var procCancel = new AppForgeMigrationBatchProcessor();
            response.setStatus(200);
            response.setBody(procCancel.cancel(migrationId));
            return;
        }

        if (action === 'rollback') {
            var rollbackMgr = new AppForgeMigrationRollback();
            var rbRes = rollbackMgr.rollbackRecords(payload.records || [], payload.target_field || 'department', migrationId);
            response.setStatus(200);
            response.setBody(rbRes);
            return;
        }

        if (action === 'status') {
            var procStatus = new AppForgeMigrationBatchProcessor();
            response.setStatus(200);
            response.setBody(procStatus.getStatus(migrationId));
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown migration action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Migration REST API: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
