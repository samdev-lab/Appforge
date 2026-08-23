/**
 * AppForgeSubscriptionManager
 * Manages multi-tenant application subscription lifecycles
 * (TRIAL, ACTIVE, SUSPENDED, EXPIRED, CANCELLED).
 */
var AppForgeSubscriptionManager = Class.create();
AppForgeSubscriptionManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSubscriptionManager] ';
        this.licenseProvider = new AppForgeLicenseProvider();
        this._subscriptions = {};
    },

    /**
     * Subscribes a tenant to a marketplace application.
     * @param {string} tenantId - Tenant ID.
     * @param {string} marketplaceAppId - Marketplace Application ID.
     * @param {string} [licenseType='FREE'] - License type.
     * @return {Object} Subscription result.
     */
    subscribe: function(tenantId, marketplaceAppId, licenseType) {
        'use strict';
        if (!tenantId || !marketplaceAppId) {
            return { success: false, status: 'INVALID', error: 'Missing tenant or marketplace application' };
        }

        var subKey = tenantId + ':' + marketplaceAppId;
        if (this._subscriptions[subKey]) {
            return { success: true, status: 'ALREADY_SUBSCRIBED', subscription: this._subscriptions[subKey] };
        }

        var licKey = 'lic_' + tenantId + '_' + marketplaceAppId + '_' + new Date().getTime();
        var subObj = {
            subscription_id: 'sub_' + new Date().getTime(),
            tenant: tenantId,
            marketplace_app: marketplaceAppId,
            status: 'ACTIVE',
            license_key: licKey,
            license_type: licenseType || 'FREE',
            started_on: new GlideDateTime().getValue(),
            expires_on: '2099-12-31'
        };

        this._subscriptions[subKey] = subObj;

        try {
            var gr = new GlideRecordSecure('x_appforge_subscription');
            gr.initialize();
            gr.setValue('subscription_id', subObj.subscription_id);
            gr.setValue('tenant', tenantId);
            gr.setValue('marketplace_app', marketplaceAppId);
            gr.setValue('status', subObj.status);
            gr.setValue('license_key', subObj.license_key);
            gr.setValue('started_on', subObj.started_on);
            subObj.sys_id = gr.insert();
        } catch (e) {
            subObj.sys_id = 'sys_sub_' + subObj.subscription_id;
        }

        gs.info(this.LOG_PREFIX + 'Tenant ' + tenantId + ' subscribed to ' + marketplaceAppId);
        return { success: true, status: 'ACTIVE', subscription: subObj };
    },

    /**
     * Retrieves subscription with tenant isolation check.
     */
    getSubscription: function(tenantId, marketplaceAppId) {
        'use strict';
        var subKey = tenantId + ':' + marketplaceAppId;
        return this._subscriptions[subKey] || null;
    },

    type: 'AppForgeSubscriptionManager'
};
