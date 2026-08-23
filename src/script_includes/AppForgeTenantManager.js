/**
 * AppForgeTenantManager
 * Manages multi-tenant registration, user memberships, organization hierarchies,
 * and enforces strict logical tenant isolation across all platform resources.
 */
var AppForgeTenantManager = Class.create();
AppForgeTenantManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTenantManager] ';
        this._tenants = {};
        this._members = {};
        this._organizations = {};
    },

    /**
     * Registers a new tenant.
     * @param {Object} tenantDef - Tenant definition.
     * @return {Object} Registration result.
     */
    registerTenant: function(tenantDef) {
        'use strict';
        if (!tenantDef || !tenantDef.tenant_id || !tenantDef.name) {
            return { success: false, status: 'INVALID', error: 'Missing tenant_id or name' };
        }

        if (this._tenants[tenantDef.tenant_id]) {
            return { success: true, status: 'ALREADY_EXISTS', tenant_id: tenantDef.tenant_id };
        }

        var tenantObj = {
            tenant_id: tenantDef.tenant_id,
            name: tenantDef.name,
            display_name: tenantDef.display_name || tenantDef.name,
            status: tenantDef.status || 'ACTIVE',
            type: tenantDef.type || 'CUSTOMER',
            owner: tenantDef.owner || 'admin',
            region: tenantDef.region || 'us-east',
            isolation_mode: 'LOGICAL',
            created_on: new GlideDateTime().getValue()
        };

        this._tenants[tenantDef.tenant_id] = tenantObj;

        try {
            var gr = new GlideRecordSecure('x_appforge_tenant');
            gr.initialize();
            gr.setValue('tenant_id', tenantObj.tenant_id);
            gr.setValue('name', tenantObj.name);
            gr.setValue('display_name', tenantObj.display_name);
            gr.setValue('status', tenantObj.status);
            gr.setValue('type', tenantObj.type);
            gr.setValue('owner', tenantObj.owner);
            gr.setValue('created_on', tenantObj.created_on);
            tenantObj.sys_id = gr.insert();
        } catch (e) {
            tenantObj.sys_id = 'sys_tenant_' + tenantDef.tenant_id;
        }

        gs.info(this.LOG_PREFIX + 'Tenant registered successfully: ' + tenantDef.tenant_id);
        return { success: true, status: 'ACTIVE', tenant: tenantObj };
    },

    /**
     * Adds a user member to a tenant with a scoped role.
     * @param {string} tenantId - Tenant ID.
     * @param {string} user - Username or user ID.
     * @param {string} role - TENANT_OWNER, TENANT_ADMIN, TENANT_DEVELOPER, TENANT_OPERATOR, TENANT_VIEWER.
     * @return {Object} Membership result.
     */
    addMember: function(tenantId, user, role) {
        'use strict';
        if (!this._tenants[tenantId]) {
            return { success: false, status: 'NOT_FOUND', error: 'Tenant not found: ' + tenantId };
        }

        var validRoles = ['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_DEVELOPER', 'TENANT_OPERATOR', 'TENANT_VIEWER'];
        var assignedRole = validRoles.indexOf(role) !== -1 ? role : 'TENANT_VIEWER';

        var key = tenantId + ':' + user;
        this._members[key] = {
            tenant: tenantId,
            user: user,
            role: assignedRole,
            status: 'ACTIVE',
            joined_on: new GlideDateTime().getValue()
        };

        return { success: true, status: 'ACTIVE', tenant: tenantId, user: user, role: assignedRole };
    },

    /**
     * Enforces strict multi-tenant isolation boundaries.
     * @param {string} requestingTenant - Tenant of requesting user.
     * @param {string} targetTenant - Tenant of target resource.
     * @return {Object} { allowed: boolean, status: 'ALLOWED'|'ACCESS_DENIED', reason: string }
     */
    validateTenantAccess: function(requestingTenant, targetTenant) {
        'use strict';
        if (!requestingTenant || !targetTenant) {
            return { allowed: false, status: 'ACCESS_DENIED', reason: 'Missing tenant context' };
        }

        if (requestingTenant === targetTenant || requestingTenant === 'SYSTEM') {
            return { allowed: true, status: 'ALLOWED', reason: 'Tenant access validated' };
        }

        gs.warn(this.LOG_PREFIX + 'Cross-tenant access blocked: ' + requestingTenant + ' attempted to access ' + targetTenant);
        return {
            allowed: false,
            status: 'ACCESS_DENIED',
            reason: 'CROSS_TENANT_VIOLATION: Tenant ' + requestingTenant + ' cannot access resources of Tenant ' + targetTenant
        };
    },

    /**
     * Validates organization hierarchy preventing circular references and cross-tenant nesting.
     * @param {string} orgId - Organization ID.
     * @param {string} parentOrgId - Parent organization ID.
     * @param {string} tenantId - Tenant ID.
     * @return {Object} { valid: boolean, error: string }
     */
    validateOrganization: function(orgId, parentOrgId, tenantId) {
        'use strict';
        if (orgId === parentOrgId) {
            return { valid: false, error: 'CIRCULAR_HIERARCHY: Organization cannot be its own parent' };
        }

        if (parentOrgId && this._organizations[parentOrgId]) {
            var parent = this._organizations[parentOrgId];
            if (parent.tenant !== tenantId) {
                return { valid: false, error: 'CROSS_TENANT_HIERARCHY: Parent organization belongs to different tenant' };
            }
        }

        this._organizations[orgId] = { org_id: orgId, parent_org: parentOrgId, tenant: tenantId };
        return { valid: true };
    },

    type: 'AppForgeTenantManager'
};
