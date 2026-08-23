/**
 * AppForgeMarketplaceAPI
 * Scripted REST Controller for Enterprise Federation & Multi-Tenant Marketplace Foundation.
 * Endpoints for Tenant management, Marketplace publishing, Catalog search, Subscriptions,
 * Licensing, Installation, and Cross-instance Federation.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeMarketplaceAPI] ';
    var AUTHORIZED_ROLES = [
        'x_appforge.admin', 'x_appforge.tenant_admin',
        'x_appforge.marketplace_publisher', 'x_appforge.marketplace_reviewer',
        'x_appforge.marketplace_consumer'
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
        response.setBody({ error: 'Forbidden', message: 'Marketplace role required to access Marketplace APIs' });
        return;
    }

    var pathParams = request.pathParams || {};
    var action = pathParams.action || 'catalog';
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
        var tenantMgr = new AppForgeTenantManager();
        var publisher = new AppForgeMarketplacePublisher();
        var subMgr = new AppForgeSubscriptionManager();
        var licProvider = new AppForgeLicenseProvider();
        var installer = new AppForgeApplicationInstaller();
        var fedMgr = new AppForgeFederationManager();

        if (action === 'tenant') {
            var tRes = tenantMgr.registerTenant(payload);
            response.setStatus(tRes.success ? 200 : 400);
            response.setBody(tRes);
            return;
        }

        if (action === 'tenant-member') {
            var mRes = tenantMgr.addMember(payload.tenant_id, payload.user, payload.role);
            response.setStatus(mRes.success ? 200 : 400);
            response.setBody(mRes);
            return;
        }

        if (action === 'marketplace-publish' || action === 'submit') {
            var pubRes = publisher.submitForPublish(payload.application, payload.package_manifest, payload.requested_by);
            response.setStatus(pubRes.success ? 200 : 400);
            response.setBody(pubRes);
            return;
        }

        if (action === 'marketplace-approve') {
            var appRes = publisher.approvePublish(payload.marketplace_app_id || targetId, payload.approved_by);
            response.setStatus(appRes.success ? 200 : 400);
            response.setBody(appRes);
            return;
        }

        if (action === 'subscription') {
            var subRes = subMgr.subscribe(payload.tenant_id, payload.marketplace_app_id, payload.license_type);
            response.setStatus(subRes.success ? 200 : 400);
            response.setBody(subRes);
            return;
        }

        if (action === 'license-validate') {
            var licRes = licProvider.validateLicense(payload.license_key, payload.tenant_id, payload.app_id);
            response.setStatus(licRes.valid ? 200 : 400);
            response.setBody(licRes);
            return;
        }

        if (action === 'install') {
            var instRes = installer.installApplication(payload.tenant_id, payload.marketplace_app, payload.package_manifest, payload.installed_by);
            response.setStatus(instRes.success ? 200 : 400);
            response.setBody(instRes);
            return;
        }

        if (action === 'federation-register') {
            var fedRes = fedMgr.registerInstance(payload);
            response.setStatus(fedRes.success ? 200 : 400);
            response.setBody(fedRes);
            return;
        }

        response.setStatus(200);
        response.setBody({ status: 'OK', message: 'Marketplace operational' });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during Marketplace REST API: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
