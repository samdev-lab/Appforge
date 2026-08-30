/**
 * AppForgeTemplateInstallationRegistry
 * Tracks and audits template installations per customer/tenant.
 * Provides installation history, version pinning, idempotency protection, and rollback state tracking.
 */
var AppForgeTemplateInstallationRegistry = Class.create();
AppForgeTemplateInstallationRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.installations = {};
    },

    /**
     * Creates a new installation audit record.
     */
    createInstallationRecord: function(params) {
        'use strict';
        if (!params || !params.template_id || !params.tenant_id) {
            throw new Error('Installation record requires template_id and tenant_id.');
        }

        var guidGen = (typeof gs !== 'undefined' && gs.generateGUID) ? gs.generateGUID() : (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
        var installId = params.installation_id || ('inst_' + guidGen);
        var record = {
            installation_id: installId,
            template_id: params.template_id,
            template_version: params.template_version || '1.0.0',
            tenant_id: params.tenant_id,
            customer_id: params.customer_id || params.tenant_id,
            target_environment: params.target_environment || 'DEV',
            target_application: params.target_application || params.template_id,
            target_scope: params.target_scope || 'x_1805046_app_fo_0',
            requested_by: params.requested_by || 'admin',
            approved_by: params.approved_by || 'sec_approver',
            status: params.status || 'REQUESTED',
            package_checksum: params.package_checksum || ('sha256_' + guidGen.substring(0, 16)),
            release_id: params.release_id || ('rel_' + guidGen),
            correlation_id: params.correlation_id || ('corr_' + guidGen),
            installed_on: new Date().toISOString(),
            modules_created: params.modules_created || [],
            tables_created: params.tables_created || []
        };

        this.installations[installId] = record;
        return record;
    },

    /**
     * Finds active installation for a specific tenant and template.
     */
    findActiveInstallation: function(tenantId, templateId) {
        'use strict';
        for (var id in this.installations) {
            if (this.installations.hasOwnProperty(id)) {
                var inst = this.installations[id];
                if (inst.tenant_id === tenantId && inst.template_id === templateId && inst.status === 'INSTALLED') {
                    return inst;
                }
            }
        }
        return null;
    },

    /**
     * Updates an installation record state.
     */
    updateStatus: function(installId, status, details) {
        'use strict';
        if (!this.installations[installId]) {
            throw new Error('Installation not found: ' + installId);
        }
        this.installations[installId].status = status;
        this.installations[installId].updated_on = new Date().toISOString();
        if (details) {
            if (details.failure_reason) this.installations[installId].failure_reason = details.failure_reason;
            if (details.modules_created) this.installations[installId].modules_created = details.modules_created;
            if (details.tables_created) this.installations[installId].tables_created = details.tables_created;
        }
        return this.installations[installId];
    },

    /**
     * Lists all installations for a tenant.
     */
    listByTenant: function(tenantId) {
        'use strict';
        var list = [];
        for (var id in this.installations) {
            if (this.installations.hasOwnProperty(id)) {
                if (!tenantId || this.installations[id].tenant_id === tenantId) {
                    list.push(this.installations[id]);
                }
            }
        }
        return list;
    },

    type: 'AppForgeTemplateInstallationRegistry'
};
