/**
 * AppForgeInstalledApplicationRegistry
 * Manages full lifecycle tracking and enterprise traceability for installed ServiceNow applications.
 * Traceability: Customer -> Tenant -> Template -> Version -> Package -> Release -> Deployment -> Application.
 */
var AppForgeInstalledApplicationRegistry = Class.create();
AppForgeInstalledApplicationRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.installedApps = {};
    },

    /**
     * Registers an installed application record.
     */
    registerInstalledApp: function(params) {
        'use strict';
        if (!params || !params.tenant_id || !params.template_id) {
            throw new Error('Tenant ID and Template ID are required.');
        }

        var guidGen = (typeof gs !== 'undefined' && gs.generateGUID) ? gs.generateGUID() : (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
        var installId = params.installation_id || ('inst_' + guidGen);

        var record = {
            installation_id: installId,
            tenant_id: params.tenant_id,
            customer_id: params.customer_id || params.tenant_id,
            template_id: params.template_id,
            template_version: params.template_version || '1.0.0',
            application_id: params.application_id || ('app_' + params.template_id),
            application_name: params.application_name || params.template_id,
            package_id: params.package_id || ('pkg_' + guidGen.substring(0, 10)),
            package_checksum: params.package_checksum || ('sha256_' + guidGen.substring(0, 16)),
            installation_status: params.installation_status || 'INSTALLED',
            installed_by: params.installed_by || 'admin',
            installed_at: new Date().toISOString(),
            environment: params.environment || 'DEV',
            license_status: params.license_status || 'ACTIVE',
            subscription_status: params.subscription_status || 'ACTIVE',
            last_upgrade: null,
            next_upgrade: null,
            health_status: 'HEALTHY',
            tables: params.tables || [],
            modules: params.modules || [],
            correlation_id: 'AF-INSTALL-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
        };

        this.installedApps[installId] = record;
        return record;
    },

    /**
     * Retrieves an installed application by installation ID.
     */
    getInstalledApp: function(installId) {
        'use strict';
        return this.installedApps[installId] || null;
    },

    /**
     * Finds active installation by tenant and template.
     */
    findByTenantAndTemplate: function(tenantId, templateId) {
        'use strict';
        for (var id in this.installedApps) {
            if (this.installedApps.hasOwnProperty(id)) {
                var app = this.installedApps[id];
                if (app.tenant_id === tenantId && app.template_id === templateId && app.installation_status !== 'DECOMMISSIONED') {
                    return app;
                }
            }
        }
        return null;
    },

    /**
     * Updates the status of an installed application.
     * Allowed: INSTALLING, INSTALLED, UPGRADE_AVAILABLE, UPGRADING, SUSPENDED, DECOMMISSION_REQUESTED, DECOMMISSIONED, FAILED.
     */
    updateStatus: function(installId, status, details) {
        'use strict';
        var app = this.getInstalledApp(installId);
        if (!app) {
            throw new Error('Installed application not found: ' + installId);
        }

        var validStatuses = [
            'INSTALLING', 'INSTALLED', 'UPGRADE_AVAILABLE', 'UPGRADING',
            'SUSPENDED', 'DECOMMISSION_REQUESTED', 'DECOMMISSIONED', 'FAILED'
        ];

        if (validStatuses.indexOf(status) === -1) {
            throw new Error('Invalid installation status: ' + status);
        }

        app.installation_status = status;
        app.updated_at = new Date().toISOString();
        if (details) {
            if (details.template_version) app.template_version = details.template_version;
            if (details.last_upgrade) app.last_upgrade = details.last_upgrade;
            if (details.decommission_reason) app.decommission_reason = details.decommission_reason;
        }

        return app;
    },

    /**
     * Lists all installed applications for a customer or tenant.
     */
    listByTenantOrCustomer: function(tenantId, customerId) {
        'use strict';
        var list = [];
        for (var id in this.installedApps) {
            if (this.installedApps.hasOwnProperty(id)) {
                var app = this.installedApps[id];
                var matchTenant = !tenantId || app.tenant_id === tenantId;
                var matchCustomer = !customerId || app.customer_id === customerId;
                if (matchTenant && matchCustomer) {
                    list.push(app);
                }
            }
        }
        return list;
    },

    type: 'AppForgeInstalledApplicationRegistry'
};
