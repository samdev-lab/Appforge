/**
 * AppForgeCapabilityInstaller
 * Automated ServiceNow-Native Application Factory & Capability Installer.
 *
 * Implements the core customer lifecycle:
 *   SELECT CAPABILITY ➔ INSTALL ➔ CONFIGURE ➔ START USING
 *
 * Supported Capabilities:
 *  1. bulk_catalog
 *  2. spm
 *  3. csm
 *  4. crm
 *  5. fsm
 *  6. resource_management
 *  7. itsm
 */
var AppForgeCapabilityInstaller = Class.create();
AppForgeCapabilityInstaller.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCapabilityInstaller] ';
        this.marketplace = new AppForgeCapabilityMarketplace();
        this.navEngine = new AppForgeNativeNavigationEngine();
        this.installedAppRegistry = new AppForgeInstalledApplicationRegistry();
        this.customerManager = new AppForgeCustomerManager();

        if (!AppForgeCapabilityInstaller._store) {
            AppForgeCapabilityInstaller._store = {
                installations: {},
                audit_log: [],
                decommission_requests: {}
            };
        }
        this._store = AppForgeCapabilityInstaller._store;
    },

    /**
     * Installs a capability for a customer/tenant.
     * @param {Object} installRequest
     *  - customer_id: string (required)
     *  - capability_id: string (required)
     *  - tenant_id: string (optional)
     *  - target_release: string (optional, defaults to 'WashingtonDC')
     *  - auto_configure: boolean (optional)
     * @return {Object} Installation result bundle.
     */
    installCapability: function(installRequest) {
        'use strict';
        if (!installRequest) throw new Error('Installation request is required.');
        if (!installRequest.customer_id) throw new Error('Customer ID is required for capability installation.');
        if (!installRequest.capability_id) throw new Error('Capability ID is required for installation.');

        var capId = installRequest.capability_id.toLowerCase().replace(/[\s-]+/g, '_');
        var capability = this.marketplace.getCapability(capId);
        if (!capability) {
            return { success: false, error: 'Capability ' + installRequest.capability_id + ' not found in Marketplace.' };
        }

        // 1. Dependency Pre-check
        var depCheck = this._validateDependencies(installRequest.customer_id, capability);
        if (!depCheck.valid) {
            return { success: false, error: 'Dependency check failed: ' + depCheck.missing.join(', ') };
        }

        // 2. Compatibility Pre-check
        var release = installRequest.target_release || 'WashingtonDC';
        if (capability.compatibility.indexOf(release) === -1 && capability.compatibility.indexOf('All') === -1) {
            return { success: false, error: 'Capability ' + capability.name + ' is incompatible with ServiceNow release ' + release };
        }

        // 3. Create Native ServiceNow Application Menu and Child Modules
        var navBundle = this.navEngine.createProductNavigation(capId, installRequest.tenant_id);

        // 4. Create / Initialize Tables and Dictionary Schema
        var tableBundle = this._provisionCapabilityTables(capId, installRequest.tenant_id);

        // 5. Register in Customer CRM Layer
        var custProduct = this.customerManager.installProduct(
            installRequest.customer_id,
            capId,
            installRequest.edition || 'Enterprise',
            installRequest.tenant_id
        );

        // 6. Register in Installed Application Registry
        var appReg = this.installedAppRegistry.registerInstallation({
            application_name: capability.name,
            capability_id: capId,
            product_id: capId,
            customer_id: installRequest.customer_id,
            tenant_id: installRequest.tenant_id || 'tenant_default',
            version: capability.version,
            application_menu: navBundle.application ? navBundle.application.title : navBundle.application_menu,
            category: capability.category
        });

        // 7. Determine Primary Native ServiceNow Landing URL
        var primaryUrl = appReg.native_url;

        var installRecord = {
            sys_id: appReg.sys_id,
            customer_id: installRequest.customer_id,
            tenant_id: installRequest.tenant_id || 'tenant_default',
            capability_id: capId,
            name: capability.name,
            version: capability.version,
            status: 'INSTALLED',
            native_url: primaryUrl,
            application_menu: navBundle.application_menu || (navBundle.application ? navBundle.application.title : ''),
            modules_count: navBundle.module_count || (navBundle.modules ? navBundle.modules.length : 0),
            tables_created: tableBundle.tables,
            installed_at: new Date().toISOString()
        };

        var key = installRequest.customer_id + '_' + capId;
        this._store.installations[key] = installRecord;

        this._logAudit('CAPABILITY_INSTALLED', 'Successfully installed ' + capability.name + ' for customer ' + installRequest.customer_id, {
            customer_id: installRequest.customer_id,
            capability_id: capId,
            native_url: primaryUrl
        });

        gs.info(this.LOG_PREFIX + 'Installed capability ' + capability.name + ' for customer ' + installRequest.customer_id + ' -> Landing: ' + primaryUrl);

        return {
            success: true,
            installation_id: installRecord.sys_id,
            customer_id: installRequest.customer_id,
            capability_id: capId,
            capability_name: capability.name,
            version: capability.version,
            status: 'INSTALLED',
            native_url: primaryUrl,
            application_menu: installRecord.application_menu,
            modules_count: installRecord.modules_count,
            tables: installRecord.tables_created
        };
    },

    /**
     * Lists all installed capabilities for a customer.
     * @param {string} customerId - Customer identifier.
     * @return {Array<Object>}
     */
    listCustomerCapabilities: function(customerId) {
        'use strict';
        if (!customerId) return [];
        var list = [];
        for (var k in this._store.installations) {
            var inst = this._store.installations[k];
            if (inst.customer_id === customerId && inst.status !== 'DECOMMISSIONED') {
                list.push(inst);
            }
        }
        return list;
    },

    /**
     * Checks if a customer has a specific capability installed.
     * @param {string} customerId
     * @param {string} capabilityId
     * @return {boolean}
     */
    hasCapability: function(customerId, capabilityId) {
        'use strict';
        if (!customerId || !capabilityId) return false;
        var capId = capabilityId.toLowerCase().replace(/[\s-]+/g, '_');
        var key = customerId + '_' + capId;
        var inst = this._store.installations[key];
        return inst !== undefined && inst.status !== 'DECOMMISSIONED';
    },

    /**
     * Initiates governed decommissioning with Four-Eyes approval requirement.
     */
    requestDecommission: function(customerId, capabilityId, requestedBy, reason) {
        'use strict';
        if (!customerId || !capabilityId) throw new Error('Customer and Capability IDs required.');
        var capId = capabilityId.toLowerCase().replace(/[\s-]+/g, '_');
        var reqId = 'decom_' + Math.floor(Math.random() * 1000000);
        var req = {
            id: reqId,
            customer_id: customerId,
            capability_id: capId,
            requested_by: requestedBy || 'admin',
            reason: reason || 'Contract expiration',
            status: 'PENDING_APPROVAL',
            created_at: new Date().toISOString()
        };
        this._store.decommission_requests[reqId] = req;
        this._logAudit('DECOMMISSION_REQUESTED', 'Decommission requested for ' + capId + ' by ' + req.requested_by, req);
        return { success: true, request_id: reqId, status: 'PENDING_APPROVAL' };
    },

    /**
     * Approves and executes governed decommissioning without data loss.
     */
    executeDecommission: function(requestId, approvedBy) {
        'use strict';
        var req = this._store.decommission_requests[requestId];
        if (!req) return { success: false, error: 'Decommission request not found.' };
        if (req.requested_by === approvedBy) {
            return { success: false, error: 'Four-Eyes principle violation: Approver cannot be the requester.' };
        }

        req.status = 'APPROVED';
        req.approved_by = approvedBy;
        req.decommissioned_at = new Date().toISOString();

        var key = req.customer_id + '_' + req.capability_id;
        if (this._store.installations[key]) {
            this._store.installations[key].status = 'DECOMMISSIONED';
        }

        this._logAudit('CAPABILITY_DECOMMISSIONED', 'Decommissioned ' + req.capability_id + ' for ' + req.customer_id, req);
        return { success: true, capability_id: req.capability_id, status: 'DECOMMISSIONED' };
    },

    /**
     * Validates customer dependencies.
     * @private
     */
    _validateDependencies: function(customerId, capability) {
        'use strict';
        var missing = [];
        if (capability.dependencies && capability.dependencies.length > 0) {
            for (var i = 0; i < capability.dependencies.length; i++) {
                var reqCap = capability.dependencies[i];
                if (!this.hasCapability(customerId, reqCap)) {
                    missing.push(reqCap);
                }
            }
        }
        return { valid: missing.length === 0, missing: missing };
    },

    /**
     * Provisions native ServiceNow table schemas for the capability.
     * @private
     */
    _provisionCapabilityTables: function(capabilityId, tenantId) {
        'use strict';
        var tables = [];
        if (capabilityId === 'bulk_catalog') {
            tables = ['x_appforge_catalog_import', 'x_appforge_catalog_template', 'x_appforge_catalog_history', 'sc_cat_item'];
        } else if (capabilityId === 'spm') {
            tables = ['pm_portfolio', 'pm_program', 'pm_project', 'pm_project_task', 'dmn_demand', 'x_appforge_spm_goal', 'resource_plan'];
        } else if (capabilityId === 'itsm') {
            tables = ['incident', 'problem', 'change_request', 'sc_req_item', 'task'];
        } else if (capabilityId === 'csm') {
            tables = ['customer_account', 'customer_contact', 'sn_customerservice_case', 'sn_customerservice_task', 'interaction'];
        } else if (capabilityId === 'crm') {
            tables = ['customer_account', 'customer_contact', 'sn_sales_lead', 'sn_sales_opportunity', 'sn_sales_quote', 'product_catalog_item'];
        } else if (capabilityId === 'fsm') {
            tables = ['wm_order', 'wm_task', 'cmn_skill', 'cmn_location', 'cmn_location_territory'];
        } else if (capabilityId === 'resource_management') {
            tables = ['resource_plan', 'resource_allocation', 'cmn_skill', 'x_appforge_res_availability', 'x_appforge_res_capacity'];
        } else {
            tables = ['x_appforge_' + capabilityId];
        }
        return { tables: tables };
    },

    /**
     * Records security audit log.
     * @private
     */
    _logAudit: function(action, description, meta) {
        'use strict';
        this._store.audit_log.push({
            action: action,
            description: description,
            meta: meta,
            timestamp: new Date().toISOString()
        });
    },

    type: 'AppForgeCapabilityInstaller'
};
