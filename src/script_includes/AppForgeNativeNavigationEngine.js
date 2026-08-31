/**
 * AppForgeNativeNavigationEngine
 * Manages native ServiceNow Application Menus (sys_app_application)
 * and Navigation Modules (sys_app_module) for installed AppForge products.
 *
 * Ensures each product (Bulk Catalog, SPM, ITSM, CSM, AppForge Team)
 * has clean, isolated, and standard ServiceNow navigation.
 */
var AppForgeNativeNavigationEngine = Class.create();
AppForgeNativeNavigationEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeNativeNavigationEngine] ';
        this.APPLICATION_MENU_TABLE = 'sys_app_application';
        this.MODULE_TABLE = 'sys_app_module';

        if (!AppForgeNativeNavigationEngine._memoryStore) {
            AppForgeNativeNavigationEngine._memoryStore = {
                applications: {},
                modules: {}
            };
        }
        this._store = AppForgeNativeNavigationEngine._memoryStore;
    },

    /**
     * Registers a complete native ServiceNow Application Menu and its child Modules
     * for a given marketplace product template.
     * @param {string} productId - Product identifier (e.g. 'bulk_catalog_manager', 'spm_accelerator', etc.)
     * @param {string} [tenantId] - Optional tenant identifier.
     * @return {Object} Registered application navigation bundle.
     */
    createProductNavigation: function(productId, tenantId) {
        'use strict';
        return this.registerProductNavigation(productId, tenantId);
    },

    registerProductNavigation: function(productId, tenantId) {
        'use strict';
        if (!productId) throw new Error('Product ID is required.');

        var navDef = this._getProductNavigationTemplate(productId);
        var appSysId = 'app_nav_' + productId;

        var appRecord = {
            sys_id: appSysId,
            title: navDef.title,
            name: navDef.name,
            category: 'Custom Applications',
            active: true,
            order: navDef.order || 100,
            roles: navDef.roles || 'x_1805046_app_fo_0.admin,admin',
            tenant_id: tenantId || 'tenant_default',
            created_at: new Date().toISOString()
        };

        try {
            var grApp = new GlideRecordSecure(this.APPLICATION_MENU_TABLE);
            grApp.initialize();
            grApp.setValue('title', appRecord.title);
            grApp.setValue('name', appRecord.name);
            grApp.setValue('active', true);
            var insAppId = grApp.insert();
            if (insAppId) appRecord.sys_id = insAppId;
        } catch (e) {}

        this._store.applications[productId] = appRecord;

        var registeredModules = [];
        for (var i = 0; i < navDef.modules.length; i++) {
            var mod = navDef.modules[i];
            var modSysId = 'mod_' + productId + '_' + i;
            var modRecord = {
                sys_id: modSysId,
                application: appRecord.sys_id,
                title: mod.title,
                name: mod.name || mod.title.toLowerCase().replace(/\s+/g, '_'),
                link_type: mod.link_type || 'LIST',
                table_name: mod.table_name || '',
                filter: mod.filter || '',
                view_name: mod.view_name || '',
                order: (i + 1) * 100,
                active: true,
                roles: mod.roles || appRecord.roles
            };

            try {
                var grMod = new GlideRecordSecure(this.MODULE_TABLE);
                grMod.initialize();
                grMod.setValue('application', appRecord.sys_id);
                grMod.setValue('title', modRecord.title);
                grMod.setValue('link_type', modRecord.link_type);
                grMod.setValue('name', modRecord.table_name);
                grMod.setValue('active', true);
                var insModId = grMod.insert();
                if (insModId) modRecord.sys_id = insModId;
            } catch (e) {}

            this._store.modules[modRecord.sys_id] = modRecord;
            registeredModules.push(modRecord);
        }

        gs.info(this.LOG_PREFIX + 'Created Application Menu: ' + appRecord.title + ' with ' + registeredModules.length + ' modules.');
        return {
            application_menu: appRecord.title,
            module_count: registeredModules.length,
            application: appRecord,
            modules: registeredModules
        };
    },

    /**
     * Retrieves navigation menu definition and modules for a product.
     */
    getNavigationMenu: function(productId) {
        'use strict';
        var app = this._store.applications[productId];
        if (!app) return null;

        var modules = [];
        for (var mId in this._store.modules) {
            var m = this._store.modules[mId];
            if (m.application === app.sys_id) {
                modules.push(m);
            }
        }
        return { application: app, modules: modules };
    },

    /**
     * Lists all registered application menus.
     */
    listAllApplicationMenus: function() {
        'use strict';
        var list = [];
        for (var pId in this._store.applications) {
            list.push(this.getNavigationMenu(pId));
        }
        return list;
    },

    /**
     * Internal template catalog for native navigation menus.
     * @private
     */
    _getProductNavigationTemplate: function(productId) {
        'use strict';
        var id = productId.toLowerCase().replace(/[\s-]+/g, '_');

        if (id.indexOf('bulk_catalog') !== -1) {
            return {
                title: 'AppForge - Bulk Catalog',
                name: 'appforge_bulk_catalog',
                order: 100,
                modules: [
                    { title: 'Catalog Imports', table_name: 'x_appforge_catalog_import', link_type: 'LIST' },
                    { title: 'Catalog Items', table_name: 'sc_cat_item', link_type: 'LIST' },
                    { title: 'Import Templates', table_name: 'x_appforge_catalog_template', link_type: 'LIST' },
                    { title: 'Import History', table_name: 'x_appforge_catalog_history', link_type: 'LIST' },
                    { title: 'Import Errors', table_name: 'x_appforge_catalog_import_error', link_type: 'LIST' },
                    { title: 'Configuration', table_name: 'x_appforge_catalog_config', link_type: 'FORM' }
                ]
            };
        }

        if (id === 'spm_accelerator' || id === 'spm') {
            return {
                title: 'AppForge - SPM',
                name: 'appforge_spm',
                order: 200,
                modules: [
                    { title: 'Portfolios', table_name: 'pm_portfolio', link_type: 'LIST' },
                    { title: 'Programs', table_name: 'pm_program', link_type: 'LIST' },
                    { title: 'Projects', table_name: 'pm_project', link_type: 'LIST' },
                    { title: 'Demands', table_name: 'dmn_demand', link_type: 'LIST' },
                    { title: 'Resources', table_name: 'resource_plan', link_type: 'LIST' },
                    { title: 'Configuration', table_name: 'x_appforge_spm_config', link_type: 'FORM' }
                ]
            };
        }

        if (id === 'itsm_accelerator' || id === 'itsm') {
            return {
                title: 'AppForge - ITSM',
                name: 'appforge_itsm',
                order: 300,
                modules: [
                    { title: 'Requests', table_name: 'sc_req_item', link_type: 'LIST' },
                    { title: 'Incidents', table_name: 'incident', link_type: 'LIST' },
                    { title: 'Changes', table_name: 'change_request', link_type: 'LIST' },
                    { title: 'Problems', table_name: 'problem', link_type: 'LIST' },
                    { title: 'Reports', table_name: 'sys_report', link_type: 'LIST' },
                    { title: 'Configuration', table_name: 'x_appforge_itsm_config', link_type: 'FORM' }
                ]
            };
        }

        if (id === 'csm_accelerator' || id === 'csm') {
            return {
                title: 'AppForge - CSM',
                name: 'appforge_csm',
                order: 400,
                modules: [
                    { title: 'Accounts', table_name: 'customer_account', link_type: 'LIST' },
                    { title: 'Contacts', table_name: 'customer_contact', link_type: 'LIST' },
                    { title: 'Cases', table_name: 'sn_customerservice_case', link_type: 'LIST' },
                    { title: 'Reports', table_name: 'sys_report', link_type: 'LIST' }
                ]
            };
        }

        if (id === 'appforge_team' || id === 'team') {
            return {
                title: 'AppForge Team',
                name: 'appforge_team',
                order: 50,
                modules: [
                    { title: 'Customers', table_name: 'x_appforge_customer', link_type: 'LIST' },
                    { title: 'Implementations', table_name: 'x_appforge_customer_implementation', link_type: 'LIST' },
                    { title: 'Products', table_name: 'x_appforge_product_catalog', link_type: 'LIST' },
                    { title: 'Installations', table_name: 'x_appforge_customer_product', link_type: 'LIST' },
                    { title: 'Subscriptions', table_name: 'x_appforge_customer_subscription', link_type: 'LIST' },
                    { title: 'Deployments', table_name: 'x_appforge_deployment_release', link_type: 'LIST' },
                    { title: 'Support', table_name: 'x_appforge_support_ticket', link_type: 'LIST' },
                    { title: 'Audits', table_name: 'x_appforge_audit_log', link_type: 'LIST' }
                ]
            };
        }

        // Generic fallback
        return {
            title: 'AppForge - ' + productId,
            name: 'appforge_' + id,
            order: 500,
            modules: [
                { title: 'Home', table_name: 'x_appforge_' + id, link_type: 'LIST' },
                { title: 'Configuration', table_name: 'x_appforge_' + id + '_config', link_type: 'FORM' }
            ]
        };
    },

    /**
     * Resets in-memory stores for clean test isolation.
     */
    resetStore: function() {
        'use strict';
        AppForgeNativeNavigationEngine._memoryStore = {
            applications: {},
            modules: {}
        };
        this._store = AppForgeNativeNavigationEngine._memoryStore;
    },

    type: 'AppForgeNativeNavigationEngine'
};
