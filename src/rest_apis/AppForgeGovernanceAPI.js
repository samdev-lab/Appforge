/**
 * AppForgeGovernanceAPI
 * Scripted REST API Controller for Policy-as-Code, Compliance Assessments,
 * Exceptions, Drift Scanning, and Safe Governance Remediation.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeGovernanceAPI] ';
    var AUTHORIZED_ROLES = [
        'x_appforge.admin', 'x_appforge.governance_viewer',
        'x_appforge.governance_analyst', 'x_appforge.governance_manager',
        'x_appforge.governance_approver', 'x_appforge.governance_admin'
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
        response.setBody({ error: 'Forbidden', message: 'Governance role required to access Governance APIs' });
        return;
    }

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'status';
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
        var policyEngine = new AppForgePolicyEngine();
        var complianceEngine = new AppForgeComplianceEngine();
        var exceptionMgr = new AppForgeGovernanceExceptionManager();
        var remediationEngine = new AppForgeGovernanceRemediationEngine();

        if (action === 'status') {
            response.setStatus(200);
            response.setBody({ status: 'OPERATIONAL', service: 'AppForge Governance Factory', version: '0.15.0' });
            return;
        }

        if (action === 'policies' && request.httpMethod === 'POST') {
            var polRes = policyEngine.registerPolicy(payload);
            response.setStatus(polRes.success ? 200 : 400);
            response.setBody(polRes);
            return;
        }

        if (action === 'assess') {
            var assRes = complianceEngine.runAssessment(payload.tenant_id, payload.policy_pack, payload.application_context);
            response.setStatus(200);
            response.setBody(assRes);
            return;
        }

        if (action === 'exception' && request.httpMethod === 'POST') {
            var excRes = exceptionMgr.requestException(payload);
            response.setStatus(excRes.success ? 200 : 400);
            response.setBody(excRes);
            return;
        }

        if (action === 'exception-approve') {
            var appExcRes = exceptionMgr.approveException(payload.exception_id || targetId, payload.approved_by);
            response.setStatus(appExcRes.success ? 200 : 400);
            response.setBody(appExcRes);
            return;
        }

        if (action === 'remediation') {
            var remRes = remediationEngine.executeRemediation(payload.action, payload.target_context, payload.is_approved);
            response.setStatus(remRes.success ? 200 : 400);
            response.setBody(remRes);
            return;
        }

        response.setStatus(200);
        response.setBody({ status: 'OK', message: 'Governance API processed.' });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Governance REST API: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
