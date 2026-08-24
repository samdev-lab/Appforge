/**
 * AppForgeTenantIsolationValidator
 * Validates tenant boundary separation and prevents cross-tenant data leakage.
 * Verifies isolation across Applications, Packages, Environments, Locks, Keys, Policies, and Audits.
 */
var AppForgeTenantIsolationValidator = Class.create();
AppForgeTenantIsolationValidator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTenantIsolationValidator] ';
        this.tenantManager = new AppForgeTenantManager();
    },

    /**
     * Asserts tenant boundary isolation between actor tenant and target resource tenant.
     * @param {string} actorTenantId - Tenant ID of requesting user/process.
     * @param {string} resourceTenantId - Tenant ID owning the target resource.
     * @param {string} resourceType - 'application' | 'package' | 'environment' | 'key' | 'policy' | 'audit'.
     * @param {boolean} [isGlobalAdmin=false] - Whether actor has global platform admin role.
     * @return {Object} { allowed: boolean, status: string, reason?: string }
     */
    validateIsolation: function(actorTenantId, resourceTenantId, resourceType, isGlobalAdmin) {
        'use strict';
        if (isGlobalAdmin === true) {
            return {
                allowed: true,
                status: 'GLOBAL_ADMIN_ACCESS',
                actor_tenant: actorTenantId,
                resource_tenant: resourceTenantId,
                resource_type: resourceType
            };
        }

        if (!actorTenantId || !resourceTenantId) {
            return {
                allowed: false,
                status: 'TENANT_CONTEXT_MISSING',
                reason: 'Missing tenant context: actorTenantId or resourceTenantId undefined.'
            };
        }

        if (actorTenantId === resourceTenantId) {
            return {
                allowed: true,
                status: 'TENANT_ISOLATION_VERIFIED',
                actor_tenant: actorTenantId,
                resource_tenant: resourceTenantId,
                resource_type: resourceType
            };
        }

        // Cross-tenant access attempt
        gs.error(this.LOG_PREFIX + 'SECURITY VIOLATION: Cross-tenant access blocked. Tenant ' + actorTenantId + ' attempted to access ' + resourceType + ' of Tenant ' + resourceTenantId);

        return {
            allowed: false,
            status: 'CROSS_TENANT_ACCESS_DENIED',
            actor_tenant: actorTenantId,
            resource_tenant: resourceTenantId,
            resource_type: resourceType,
            reason: 'Access Denied: Tenant boundary violation. ' + actorTenantId + ' cannot access ' + resourceType + ' belonging to ' + resourceTenantId + '.'
        };
    },

    type: 'AppForgeTenantIsolationValidator'
};
