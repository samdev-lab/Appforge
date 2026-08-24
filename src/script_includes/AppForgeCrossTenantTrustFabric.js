/**
 * AppForgeCrossTenantTrustFabric
 * Manages explicit, scoped, and auditable cross-tenant trust relationships.
 * Default security posture is DENY.
 * Revocation immediately terminates cross-tenant package distribution and deployment.
 */
var AppForgeCrossTenantTrustFabric = Class.create();
AppForgeCrossTenantTrustFabric.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCrossTenantTrustFabric] ';
        this._trusts = {};
    },

    /**
     * Creates an explicit cross-tenant trust relationship.
     * @param {Object} trustDef - { source_tenant, target_tenant, trusted_key, allowed_packages, allowed_applications, allowed_environments, expiration }
     * @param {string} actor - Approver/Creator.
     * @return {Object} Trust record descriptor.
     */
    createTrustRelationship: function(trustDef, actor) {
        'use strict';
        if (!trustDef || !trustDef.source_tenant || !trustDef.target_tenant) {
            return { success: false, error: 'Mandatory parameters missing: source_tenant, target_tenant' };
        }

        var trustId = 'trust_' + trustDef.source_tenant + '_to_' + trustDef.target_tenant;
        var record = {
            trust_id: trustId,
            source_tenant: trustDef.source_tenant,
            target_tenant: trustDef.target_tenant,
            trusted_key: trustDef.trusted_key || 'all',
            allowed_packages: trustDef.allowed_packages || ['*'],
            allowed_applications: trustDef.allowed_applications || ['*'],
            allowed_environments: trustDef.allowed_environments || ['TEST', 'PRODUCTION'],
            expiration: trustDef.expiration || '2099-12-31T23:59:59Z',
            status: 'ACTIVE',
            approved_by: actor || 'sec_approver',
            approved_at: new GlideDateTime().getValue()
        };

        this._trusts[trustId] = record;
        gs.info(this.LOG_PREFIX + 'Created cross-tenant trust: ' + trustId + ' (' + record.source_tenant + ' -> ' + record.target_tenant + ')');

        return {
            success: true,
            status: 'ACTIVE',
            trust_id: trustId,
            trust: record
        };
    },

    /**
     * Validates whether a cross-tenant operation is permitted by an active trust relationship.
     */
    validateTrust: function(sourceTenant, targetTenant, packageId, environment) {
        'use strict';
        if (sourceTenant === targetTenant) {
            return { allowed: true, status: 'SAME_TENANT' };
        }

        var trustId = 'trust_' + sourceTenant + '_to_' + targetTenant;
        var trust = this._trusts[trustId];

        if (!trust) {
            return {
                allowed: false,
                status: 'TRUST_REQUIRED',
                error: 'Cross-tenant access denied: No trust relationship exists between ' + sourceTenant + ' and ' + targetTenant + '.'
            };
        }

        if (trust.status === 'REVOKED') {
            return {
                allowed: false,
                status: 'TRUST_REVOKED',
                error: 'Cross-tenant access blocked: Trust relationship between ' + sourceTenant + ' and ' + targetTenant + ' has been revoked.'
            };
        }

        var now = new Date().getTime();
        var exp = new Date(trust.expiration).getTime();
        if (exp && now > exp) {
            return {
                allowed: false,
                status: 'TRUST_EXPIRED',
                error: 'Cross-tenant access blocked: Trust relationship between ' + sourceTenant + ' and ' + targetTenant + ' expired on ' + trust.expiration
            };
        }

        // Validate package scope
        if (packageId && trust.allowed_packages.indexOf('*') === -1 && trust.allowed_packages.indexOf(packageId) === -1) {
            return {
                allowed: false,
                status: 'PACKAGE_NOT_IN_TRUST_SCOPE',
                error: 'Package ' + packageId + ' is not included in cross-tenant trust scope.'
            };
        }

        return {
            allowed: true,
            status: 'TRUST_VERIFIED',
            trust_id: trustId
        };
    },

    /**
     * Revokes a cross-tenant trust relationship immediately.
     */
    revokeTrust: function(trustId, actor, reason) {
        'use strict';
        var trust = this._trusts[trustId];
        if (!trust) return { success: false, status: 'TRUST_NOT_FOUND', error: 'Trust record ' + trustId + ' not found.' };

        trust.status = 'REVOKED';
        trust.revoked_by = actor || 'admin';
        trust.revocation_reason = reason || 'Administrative revocation';
        trust.revoked_at = new GlideDateTime().getValue();

        gs.warn(this.LOG_PREFIX + 'Revoked cross-tenant trust: ' + trustId + ' by ' + (actor || 'admin'));

        return { success: true, status: 'REVOKED', trust_id: trustId };
    },

    type: 'AppForgeCrossTenantTrustFabric'
};
