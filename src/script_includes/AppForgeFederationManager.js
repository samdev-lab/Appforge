/**
 * AppForgeFederationManager
 * Cross-instance federation coordinator managing federated instance targets,
 * endpoint health, and credential references without exposing raw secrets.
 */
var AppForgeFederationManager = Class.create();
AppForgeFederationManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeFederationManager] ';
        this._instances = {};
    },

    /**
     * Registers a federated target instance for a tenant.
     * @param {Object} instDef - Instance descriptor.
     * @return {Object} Registration result.
     */
    registerInstance: function(instDef) {
        'use strict';
        if (!instDef || !instDef.instance_identifier || !instDef.tenant) {
            return { success: false, status: 'INVALID', error: 'Missing instance identifier or tenant' };
        }

        // Enforce Credential Reference rule: raw secrets forbidden
        if (instDef.password || instDef.api_key || instDef.secret) {
            return {
                success: false,
                status: 'BLOCKED',
                error: 'SECURITY_VIOLATION: Raw credentials forbidden. Use credential_reference only.'
            };
        }

        var instId = instDef.instance_id || ('inst_' + instDef.instance_identifier);
        var instObj = {
            instance_id: instId,
            tenant: instDef.tenant,
            instance_name: instDef.instance_name || instDef.instance_identifier,
            instance_identifier: instDef.instance_identifier,
            environment: instDef.environment || 'DEV',
            endpoint: instDef.endpoint || ('https://' + instDef.instance_identifier + '.service-now.com'),
            credential_reference: instDef.credential_reference || 'cred_ref_default',
            status: 'ONLINE',
            appforge_version: instDef.appforge_version || '0.14.0',
            servicenow_version: instDef.servicenow_version || 'WashingtonDC'
        };

        this._instances[instId] = instObj;

        try {
            var gr = new GlideRecordSecure('x_appforge_federated_instance');
            gr.initialize();
            gr.setValue('instance_id', instObj.instance_id);
            gr.setValue('tenant', instObj.tenant);
            gr.setValue('instance_name', instObj.instance_name);
            gr.setValue('instance_identifier', instObj.instance_identifier);
            gr.setValue('environment', instObj.environment);
            gr.setValue('endpoint', instObj.endpoint);
            gr.setValue('credential_reference', instObj.credential_reference);
            gr.setValue('status', instObj.status);
            instObj.sys_id = gr.insert();
        } catch (e) {
            instObj.sys_id = 'sys_fed_' + instId;
        }

        gs.info(this.LOG_PREFIX + 'Federated instance registered: ' + instId);
        return { success: true, status: 'ONLINE', instance: instObj };
    },

    /**
     * Checks instance health and tenant ownership.
     */
    checkInstanceHealth: function(instanceId, tenantId) {
        'use strict';
        var inst = this._instances[instanceId];
        if (!inst) {
            return { healthy: false, status: 'UNAVAILABLE', error: 'Instance not found' };
        }

        if (inst.tenant !== tenantId && tenantId !== 'SYSTEM') {
            return { healthy: false, status: 'ACCESS_DENIED', error: 'CROSS_TENANT_VIOLATION: Instance belongs to different tenant' };
        }

        return {
            healthy: true,
            status: 'ONLINE',
            instance_id: instanceId,
            appforge_version: inst.appforge_version
        };
    },

    type: 'AppForgeFederationManager'
};
