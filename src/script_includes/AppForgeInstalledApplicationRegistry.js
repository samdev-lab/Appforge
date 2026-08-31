/**
 * AppForgeInstalledApplicationRegistry
 * Manages full lifecycle tracking, enterprise traceability, and native ServiceNow navigation
 * for installed ServiceNow applications (x_appforge_installed_application).
 *
 * Traceability: Customer -> Tenant -> Template -> Version -> Package -> Release -> Deployment -> Application -> Native Navigation.
 */
var AppForgeInstalledApplicationRegistry = Class.create();
AppForgeInstalledApplicationRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeInstalledApplicationRegistry] ';
        this.TABLE_NAME = 'x_appforge_installed_application';

        if (!AppForgeInstalledApplicationRegistry._memoryStore) {
            AppForgeInstalledApplicationRegistry._memoryStore = {};
        }
        this.installedApps = AppForgeInstalledApplicationRegistry._memoryStore;
    },

    /**
     * Registers an installed application record with native ServiceNow application and menu linkage.
     */
    registerInstallation: function(params) {
        'use strict';
        var p = params || {};
        if (!p.template_id && (p.capability_id || p.product_id)) {
            p.template_id = p.capability_id || p.product_id;
        }
        if (!p.tenant_id && p.customer_id) {
            p.tenant_id = 'tenant_' + p.customer_id;
        }
        return this.registerInstalledApp(p);
    },

    registerInstalledApp: function(params) {
        'use strict';
        if (!params || !params.tenant_id || !params.template_id) {
            throw new Error('Tenant ID and Template ID are required.');
        }

        var guidGen = (typeof gs !== 'undefined' && gs.generateGUID) ? gs.generateGUID() : (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
        var installId = params.installation_id || ('inst_' + guidGen);
        var templateId = params.template_id;
        var nativeUrl = params.native_url || this.getNativeUrl(templateId);
        var appMenu = params.application_menu || this._getDefaultMenuName(templateId);

        var record = {
            installation_id: installId,
            sys_id: installId,
            tenant_id: params.tenant_id,
            customer_id: params.customer_id || params.tenant_id,
            customer_name: params.customer_name || params.customer || 'Acme Global Enterprises',
            template_id: templateId,
            template_version: params.template_version || '1.0.0',
            application_id: params.application_id || ('app_' + templateId),
            application_name: params.application_name || this._getPrettyAppName(templateId),
            servicenow_application: params.servicenow_application || this._getPrettyAppName(templateId),
            application_menu: appMenu,
            native_url: nativeUrl,
            package_id: params.package_id || ('pkg_' + guidGen.substring(0, 10)),
            package_checksum: params.package_checksum || ('sha256_' + guidGen.substring(0, 16)),
            installation_status: params.installation_status || 'INSTALLED',
            installed_by: params.installed_by || 'admin',
            installed_at: new Date().toISOString(),
            environment: params.environment || 'DEV',
            license_status: params.license_status || 'ACTIVE',
            subscription_status: params.subscription_status || 'ACTIVE',
            active: (params.active !== false),
            last_upgrade: null,
            next_upgrade: null,
            health_status: 'HEALTHY',
            tables: params.tables || [],
            modules: params.modules || [],
            correlation_id: 'AF-INSTALL-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
        };

        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.initialize();
            gr.setValue('customer', record.customer_name);
            gr.setValue('tenant', record.tenant_id);
            gr.setValue('template', record.template_id);
            gr.setValue('application_name', record.application_name);
            gr.setValue('application_menu', record.application_menu);
            gr.setValue('native_url', record.native_url);
            gr.setValue('version', record.template_version);
            gr.setValue('installation_status', record.installation_status);
            gr.setValue('active', record.active);
            var insId = gr.insert();
            if (insId) record.sys_id = insId;
        } catch (e) {}

        this.installedApps[installId] = record;
        gs.info(this.LOG_PREFIX + 'Registered installed application: ' + record.application_name + ' (' + record.application_menu + ') -> ' + record.native_url);
        return record;
    },

    /**
     * Resolves the native ServiceNow landing URL for a given template.
     */
    getNativeUrl: function(templateId) {
        'use strict';
        var id = String(templateId || '').toLowerCase().replace(/[\s-]+/g, '_');
        if (id.indexOf('bulk_catalog') !== -1) {
            return '/sc_cat_item_list.do?sysparm_query=category=d258b953c611227a0146101fb1be7c31';
        }
        if (id.indexOf('spm') !== -1) {
            return '/pm_project_list.do';
        }
        if (id.indexOf('itsm') !== -1) {
            return '/incident_list.do';
        }
        if (id.indexOf('csm') !== -1) {
            return '/customer_account_list.do';
        }
        if (id.indexOf('crm') !== -1) {
            return '/customer_account_list.do';
        }
        if (id.indexOf('fsm') !== -1) {
            return '/wm_order_list.do';
        }
        if (id.indexOf('resource') !== -1) {
            return '/resource_plan_list.do';
        }
        return '/sc_cat_item_list.do';
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

    /**
     * Resets in-memory stores for clean test isolation.
     */
    resetStore: function() {
        'use strict';
        AppForgeInstalledApplicationRegistry._memoryStore = {};
        this.installedApps = AppForgeInstalledApplicationRegistry._memoryStore;
    },

    _getPrettyAppName: function(templateId) {
        'use strict';
        var id = String(templateId || '').toLowerCase().replace(/[\s-]+/g, '_');
        if (id.indexOf('bulk_catalog') !== -1) return 'Bulk Catalog Manager';
        if (id.indexOf('spm') !== -1) return 'SPM Accelerator';
        if (id.indexOf('itsm') !== -1) return 'ITSM Foundation';
        if (id.indexOf('csm') !== -1) return 'CSM Accelerator';
        return 'AppForge Application - ' + templateId;
    },

    _getDefaultMenuName: function(templateId) {
        'use strict';
        var id = String(templateId || '').toLowerCase().replace(/[\s-]+/g, '_');
        if (id.indexOf('bulk_catalog') !== -1) return 'Bulk Catalog Management';
        if (id.indexOf('spm') !== -1) return 'SPM';
        if (id.indexOf('itsm') !== -1) return 'ITSM';
        if (id.indexOf('csm') !== -1) return 'Customer Service';
        return 'AppForge - ' + templateId;
    },

    type: 'AppForgeInstalledApplicationRegistry'
};
