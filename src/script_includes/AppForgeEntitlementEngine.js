/**
 * AppForgeEntitlementEngine
 * Evaluates tenant entitlements for applications, modules, feature flags, APIs, and seat limits.
 */
var AppForgeEntitlementEngine = Class.create();
AppForgeEntitlementEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeEntitlementEngine] ';
        this.licenseProvider = new AppForgeLicenseProvider();
        this._entitlements = {};
    },

    /**
     * Sets or updates feature entitlement.
     * @param {string} tenantId - Tenant ID.
     * @param {string} appId - Application ID.
     * @param {string} featureKey - Feature name/key.
     * @param {string} status - ENABLED, DISABLED, NOT_ENTITLED.
     */
    setEntitlement: function(tenantId, appId, featureKey, status) {
        'use strict';
        var key = tenantId + ':' + appId + ':' + featureKey;
        this._entitlements[key] = status || 'ENABLED';
    },

    /**
     * Checks if a tenant is entitled to a specific application or feature.
     * @param {string} tenantId - Tenant ID.
     * @param {string} appId - Application ID.
     * @param {string} [featureKey] - Optional feature flag.
     * @param {number} [requestedSeats] - Optional user seat count requested.
     * @return {Object} { entitled: boolean, status: 'ENTITLED'|'NOT_ENTITLED'|'SUSPENDED'|'LIMIT_EXCEEDED' }
     */
    checkEntitlement: function(tenantId, appId, featureKey, requestedSeats) {
        'use strict';
        if (!tenantId || !appId) {
            return { entitled: false, status: 'NOT_ENTITLED', error: 'Missing tenant or application context' };
        }

        // 1. Feature Flag Entitlement Check
        if (featureKey) {
            var key = tenantId + ':' + appId + ':' + featureKey;
            var st = this._entitlements[key];
            if (st === 'DISABLED' || st === 'NOT_ENTITLED') {
                return { entitled: false, status: 'NOT_ENTITLED', feature: featureKey, reason: 'Feature ' + featureKey + ' is not entitled for this tenant.' };
            }
        }

        // 2. Seat Limit Check
        if (requestedSeats && requestedSeats > 500) {
            return { entitled: false, status: 'LIMIT_EXCEEDED', reason: 'Requested seat count (' + requestedSeats + ') exceeds license seat limit (500).' };
        }

        return {
            entitled: true,
            status: 'ENTITLED',
            tenant: tenantId,
            application: appId
        };
    },

    type: 'AppForgeEntitlementEngine'
};
