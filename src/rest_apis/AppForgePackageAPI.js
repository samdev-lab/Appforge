/**
 * AppForgePackageAPI
 * Scripted REST API Resource Controller for AppForge Application Packaging & Lifecycle Governance Factory.
 * Endpoints:
 *   POST /api/x_appforge/package/export   — Generate & export application package
 *   POST /api/x_appforge/package/plan     — Dry-run import/upgrade planning & compatibility check
 *   POST /api/x_appforge/package/import   — Staged package import validation
 *   POST /api/x_appforge/package/approve  — Release approval governance
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgePackageAPI] ';
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
            message: 'Role x_appforge.developer or x_appforge.admin required to access Packaging Factory APIs'
        });
        return;
    }

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
        if (action === 'export') {
            var executor = new AppForgePackageExecutor();
            var expResult = executor.buildPackage(payload.application_definition || payload, payload.version || '1.0.0', payload.change_type || 'MINOR', 'rest_user');
            response.setStatus(expResult.success ? 200 : 400);
            response.setBody(expResult);
            return;
        }

        if (action === 'plan') {
            var planner = new AppForgePackagePlanner();
            var planResult = planner.generatePlan(payload.package || payload, payload.installed_definition || null, payload.target_environment || 'TEST');
            response.setStatus(planResult.valid ? 200 : 400);
            response.setBody(planResult);
            return;
        }

        if (action === 'import') {
            var signer = new AppForgePackageSigner();
            var manifest = payload.manifest || payload;
            var sig = payload.signature || '';
            var isSigValid = signer.verifySignature(manifest, sig);

            response.setStatus(isSigValid ? 200 : 400);
            response.setBody({
                status: isSigValid ? 'STAGED' : 'SIGNATURE_VERIFICATION_FAILED',
                signature_valid: isSigValid,
                message: isSigValid ? 'Package staged successfully for dry-run and approval' : 'Package signature verification failed'
            });
            return;
        }

        if (action === 'approve') {
            var lifecycleMgr = new AppForgeLifecycleManager();
            var apprId = lifecycleMgr.recordApproval(payload.application_id || 'app_ref', payload.version || '1.0.0', payload.target_environment || 'UAT', 'approver_admin', payload.status || 'APPROVED');
            response.setStatus(200);
            response.setBody({ status: 'SUCCESS', approval_sys_id: apprId });
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown packaging action: ' + action });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Packaging REST API execution: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
