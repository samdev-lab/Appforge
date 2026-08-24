/**
 * AppForgeStudioAPI
 * Unified Scripted REST API Controller for AppForge Visual Studio,
 * Workspace Dashboard, Template Factory, Designer, Deployment Center, and Audit Operations.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeStudioAPI] ';
    var AUTHORIZED_ROLES = [
        'x_appforge.admin', 'x_appforge.developer',
        'x_appforge.deployer', 'x_appforge.governance_viewer',
        'x_appforge.governance_analyst', 'x_appforge.governance_manager'
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
        response.setBody({ error: 'Forbidden', message: 'Studio role required to access AppForge Studio APIs' });
        return;
    }

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'dashboard';
    var targetId = pathParams.id || '';

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
        var workspaceSvc = new AppForgeStudioWorkspaceService();
        var templateFactory = new AppForgeTemplateFactory();
        var designerEngine = new AppForgeDeclarativeDesignerEngine();
        var governanceGate = new AppForgeGovernanceGate();
        var remediationEngine = new AppForgeGovernanceRemediationEngine();
        var deploymentRollback = new AppForgeDeploymentRollback();

        if (action === 'dashboard') {
            var metrics = workspaceSvc.getDashboardMetrics();
            response.setStatus(200);
            response.setBody(metrics);
            return;
        }

        if (action === 'applications') {
            var apps = workspaceSvc.getApplicationCatalog();
            response.setStatus(200);
            response.setBody({ total: apps.length, applications: apps });
            return;
        }

        if (action === 'templates') {
            if (targetId) {
                var tmpl = templateFactory.getTemplate(targetId);
                response.setStatus(tmpl ? 200 : 404);
                response.setBody(tmpl || { error: 'Template not found' });
            } else {
                var tmpls = templateFactory.getTemplates();
                response.setStatus(200);
                response.setBody({ total: tmpls.length, templates: tmpls });
            }
            return;
        }

        if (action === 'instantiate-template' && request.httpMethod === 'POST') {
            var instRes = templateFactory.instantiateTemplate(targetId || payload.template_id, payload.overrides);
            response.setStatus(instRes.success ? 200 : 400);
            response.setBody(instRes);
            return;
        }

        if (action === 'designer-update' && request.httpMethod === 'POST') {
            var updatedDef = payload.definition;
            if (payload.table) {
                var tblRes = designerEngine.addOrUpdateTable(updatedDef, payload.table);
                response.setStatus(tblRes.success ? 200 : 400);
                response.setBody(tblRes);
                return;
            }
            response.setStatus(200);
            response.setBody({ success: true, definition: updatedDef });
            return;
        }

        if (action === 'deployments') {
            response.setStatus(200);
            response.setBody({ status: 'ACTIVE', pipeline: 'DEV -> TEST -> PROD', active_locks: 0 });
            return;
        }

        if (action === 'governance') {
            var compEngine = new AppForgeComplianceEngine();
            var ass = compEngine.runAssessment('tenant_prod', 'APPFORGE_BASELINE', {});
            response.setStatus(200);
            response.setBody(ass);
            return;
        }

        if (action === 'drift-remediate' && request.httpMethod === 'POST') {
            var remRes = remediationEngine.executeRemediation(payload.action, payload.target_context, payload.is_approved);
            response.setStatus(remRes.success ? 200 : 400);
            response.setBody(remRes);
            return;
        }

        if (action === 'rollback' && request.httpMethod === 'POST') {
            var rollRes = deploymentRollback.rollback(payload.deployment_run_id || targetId, payload.requested_by);
            response.setStatus(rollRes.success ? 200 : 400);
            response.setBody(rollRes);
            return;
        }

        if (action === 'audit') {
            var auditList = workspaceSvc.getAuditTimeline(payload.limit || 20);
            response.setStatus(200);
            response.setBody({ total: auditList.length, timeline: auditList });
            return;
        }

        response.setStatus(200);
        response.setBody({ status: 'OK', message: 'Studio API processed successfully.' });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Studio API: ' + ex.message);
        var errObj = new AppForgeStudioWorkspaceService().formatError('Studio Request', ex.message, 'Check system logs.');
        response.setStatus(500);
        response.setBody(errObj);
    }

})(request, response);
