/**
 * AppForgeMarketplaceAPI
 * Scripted REST Controller for Enterprise Capability Marketplace, Dashboards & Integration Platform.
 *
 * Endpoints for:
 *   - Solution Marketplace catalog & capability status
 *   - Real 25-step installation via AppForgeCapabilityInstaller
 *   - Application-specific dashboards (CRM, CSM, SPM, FSM, Resource Mgmt, Bulk Catalog, ITSM)
 *   - Universal REST Integrations & Health
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeMarketplaceAPI] ';
    var AUTHORIZED_ROLES = [
        'admin', 'x_appforge.admin', 'x_appforge.tenant_admin',
        'x_appforge.marketplace_publisher', 'x_appforge.marketplace_reviewer',
        'x_appforge.marketplace_consumer', 'x_appforge.integration_admin'
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
        response.setBody({ error: 'Forbidden', message: 'Authorized AppForge role required.' });
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
        var capInstaller = new AppForgeCapabilityInstaller();
        var manifestRegistry = new AppForgeApplicationManifestRegistry();
        var dashboardService = new AppForgeApplicationDashboardService();
        var intRegistry = new AppForgeIntegrationRegistry();

        // 1. List All Capability Applications with Status for Customer/Tenant
        if (action === 'catalog' || action === 'capabilities') {
            var customerId = request.queryParams.customer_id || payload.customer_id || 'default_customer';
            var manifests = manifestRegistry.listManifests();
            var results = manifests.map(function(m) {
                var isInst = capInstaller.hasCapability(customerId, m.application_key);
                var instRec = capInstaller._store.installations[customerId + '_' + m.application_key];
                var status = isInst ? 'ACTIVE' : (instRec ? instRec.status : 'AVAILABLE');
                return {
                    id: m.id,
                    application_key: m.application_key,
                    name: m.name,
                    short_description: m.short_description,
                    category: m.category,
                    version: m.version,
                    price: m.price,
                    billing_model: m.billing_model,
                    status: status,
                    dependencies: m.dependencies,
                    is_installed: isInst,
                    native_url: instRec ? instRec.native_url : null,
                    features: m.features
                };
            });
            response.setStatus(200);
            response.setBody({ success: true, count: results.length, capabilities: results });
            return;
        }

        // 2. Real Capability Installation via AppForgeCapabilityInstaller
        if (action === 'install' || action === 'capability-install') {
            var installReq = {
                customer_id: payload.customer_id || 'default_customer',
                tenant_id: payload.tenant_id || ('tenant_' + (payload.customer_id || 'default_customer')),
                capability_id: payload.capability_id || targetId,
                edition: payload.edition || 'Enterprise',
                target_release: payload.target_release || 'WashingtonDC',
                configuration_overrides: payload.configuration_overrides || {}
            };

            var instRes = capInstaller.installCapability(installReq);
            response.setStatus(instRes.success ? 200 : 400);
            response.setBody(instRes);
            return;
        }

        // 3. Application Dashboards
        if (action === 'dashboard') {
            var custId = request.queryParams.customer_id || payload.customer_id || 'default_customer';
            var capId = request.queryParams.capability_id || payload.capability_id || targetId;
            var dashRes = dashboardService.getDashboard(custId, capId);
            response.setStatus(dashRes.success ? 200 : 400);
            response.setBody(dashRes);
            return;
        }

        // 4. Integration Platform Endpoints
        if (action === 'integrations') {
            var tId = request.queryParams.tenant_id || payload.tenant_id || 'default_tenant';
            var appK = request.queryParams.application_key || payload.application_key || null;
            var ints = intRegistry.listIntegrations(tId, appK);
            response.setStatus(200);
            response.setBody({ success: true, count: ints.length, integrations: ints });
            return;
        }

        if (action === 'integration-health') {
            var tenant = request.queryParams.tenant_id || payload.tenant_id || 'default_tenant';
            var health = intRegistry.getIntegrationHealthDashboard(tenant);
            response.setStatus(200);
            response.setBody({ success: true, health: health });
            return;
        }

        response.setStatus(200);
        response.setBody({ status: 'OK', message: 'AppForge Marketplace & Integration Platform operational' });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during REST execution: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
