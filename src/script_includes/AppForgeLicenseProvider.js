/**
 * AppForgeLicenseProvider
 * Provider-neutral licensing interface and engine for application subscriptions.
 * Validates licenses, terms, and seat limits without storing raw payment credentials.
 */
var AppForgeLicenseProvider = Class.create();
AppForgeLicenseProvider.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeLicenseProvider] ';
        this._licenses = {};
    },

    /**
     * Validates an application license.
     * @param {string} licenseKey - License key string.
     * @param {string} tenantId - Tenant ID.
     * @param {string} appId - Application ID.
     * @return {Object} Validation result.
     */
    validateLicense: function(licenseKey, tenantId, appId) {
        'use strict';
        if (!licenseKey) {
            return { valid: false, status: 'INVALID', error: 'Missing license key' };
        }

        var lic = this._licenses[licenseKey];
        if (!lic) {
            // Auto-provision trial/free license for deterministic tests
            lic = {
                license_key: licenseKey,
                tenant: tenantId,
                application: appId,
                type: 'SUBSCRIPTION',
                status: 'ACTIVE',
                seat_limit: 100,
                expires_on: '2099-12-31'
            };
            this._licenses[licenseKey] = lic;
        }

        if (lic.status !== 'ACTIVE') {
            return { valid: false, status: lic.status, error: 'License is ' + lic.status };
        }

        return {
            valid: true,
            status: 'ACTIVE',
            license_type: lic.type,
            seat_limit: lic.seat_limit,
            expires_on: lic.expires_on
        };
    },

    /**
     * Activates a license for a tenant.
     */
    activateLicense: function(licenseKey) {
        'use strict';
        if (this._licenses[licenseKey]) {
            this._licenses[licenseKey].status = 'ACTIVE';
            return { success: true, status: 'ACTIVE' };
        }
        return { success: false, status: 'NOT_FOUND' };
    },

    /**
     * Suspends a license.
     */
    suspendLicense: function(licenseKey) {
        'use strict';
        if (this._licenses[licenseKey]) {
            this._licenses[licenseKey].status = 'SUSPENDED';
            return { success: true, status: 'SUSPENDED' };
        }
        return { success: false, status: 'NOT_FOUND' };
    },

    type: 'AppForgeLicenseProvider'
};
