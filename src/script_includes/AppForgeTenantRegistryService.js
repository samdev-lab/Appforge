/**
 * AppForgeTenantRegistryService
 * Manages tenant registration, membership, lifecycle status transitions,
 * role hierarchy, and governed deletion flows with Four-Eyes checks.
 *
 * Backed by x_appforge_tenant and x_appforge_tenant_member.
 */
var AppForgeTenantRegistryService = Class.create();
AppForgeTenantRegistryService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTenantRegistryService] ';
        this.TENANT_TABLE = 'x_appforge_tenant';
        this.MEMBER_TABLE = 'x_appforge_tenant_member';
        this.VALID_TENANT_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'DELETION_REQUESTED', 'DELETED'];
        this.VALID_MEMBER_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED'];
        this.VALID_ROLES = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'TENANT_DEVELOPER', 'TENANT_RELEASE_MANAGER', 'TENANT_SECURITY_APPROVER', 'TENANT_VIEWER'];
        this._tenants = {};
        this._members = {};
        this._deletionRequests = {};
    },

    /**
     * Creates a new tenant record in PENDING or ACTIVE status.
     */
    createTenant: function(tenantDef, actor) {
        'use strict';
        if (!tenantDef || !tenantDef.tenant_id) {
            return { success: false, error: 'Mandatory parameter missing: tenant_id' };
        }

        var tId = tenantDef.tenant_id;
        if (this._tenants[tId] && this._tenants[tId].status !== 'DELETED') {
            return { success: false, status: 'TENANT_EXISTS', error: 'Tenant ' + tId + ' already exists.' };
        }

        var record = {
            tenant_id: tId,
            tenant_code: tenantDef.tenant_code || tId.toUpperCase(),
            tenant_name: tenantDef.tenant_name || ('Tenant ' + tId),
            status: tenantDef.status || 'ACTIVE',
            subscription_plan: tenantDef.subscription_plan || 'ENTERPRISE',
            region: tenantDef.region || 'us-east-1',
            owner: tenantDef.owner || actor || 'admin',
            created_at: new GlideDateTime().getValue(),
            updated_at: new GlideDateTime().getValue(),
            suspended_at: null,
            deleted_at: null
        };

        this._tenants[tId] = record;
        this._members[tId] = {};

        gs.info(this.LOG_PREFIX + 'Created tenant: ' + tId + ' (' + record.status + ')');

        return {
            success: true,
            status: record.status,
            tenant: record
        };
    },

    /**
     * Retrieves tenant record.
     */
    getTenant: function(tenantId) {
        'use strict';
        var t = this._tenants[tenantId];
        return (t && t.status !== 'DELETED') ? t : null;
    },

    /**
     * Updates tenant status (ACTIVE, SUSPENDED, DEACTIVATED).
     */
    updateTenantStatus: function(tenantId, newStatus, actor, reason) {
        'use strict';
        var t = this._tenants[tenantId];
        if (!t) return { success: false, status: 'TENANT_NOT_FOUND', error: 'Tenant ' + tenantId + ' not found.' };

        if (this.VALID_TENANT_STATUSES.indexOf(newStatus) === -1) {
            return { success: false, error: 'Invalid tenant status: ' + newStatus };
        }

        t.status = newStatus;
        t.updated_at = new GlideDateTime().getValue();
        if (newStatus === 'SUSPENDED') t.suspended_at = new GlideDateTime().getValue();

        gs.warn(this.LOG_PREFIX + 'Tenant ' + tenantId + ' status changed to ' + newStatus + ' by ' + (actor || 'admin'));

        return { success: true, status: newStatus, tenant_id: tenantId, reason: reason };
    },

    /**
     * Adds or invites a member to a tenant.
     */
    addMember: function(tenantId, userId, role, actor) {
        'use strict';
        var t = this.getTenant(tenantId);
        if (!t) return { success: false, status: 'TENANT_NOT_FOUND', error: 'Tenant ' + tenantId + ' not found.' };

        var r = role || 'TENANT_VIEWER';
        if (this.VALID_ROLES.indexOf(r) === -1) {
            return { success: false, error: 'Invalid role: ' + r };
        }

        // Privilege escalation guard: Tenant Admin cannot grant Platform Admin
        if (r === 'PLATFORM_ADMIN' && actor !== 'platform_super_admin') {
            gs.error(this.LOG_PREFIX + 'PRIVILEGE_ESCALATION_BLOCKED: Tenant admin cannot assign PLATFORM_ADMIN.');
            return {
                success: false,
                status: 'PRIVILEGE_ESCALATION_DENIED',
                error: 'Security Violation: PLATFORM_ADMIN role can only be assigned by Platform Super Admin.'
            };
        }

        if (!this._members[tenantId]) this._members[tenantId] = {};

        var memberRecord = {
            tenant_id: tenantId,
            user_id: userId,
            role: r,
            status: 'ACTIVE',
            invited_by: actor || 'admin',
            joined_at: new GlideDateTime().getValue(),
            removed_at: null
        };

        this._members[tenantId][userId] = memberRecord;

        return { success: true, status: 'ACTIVE', member: memberRecord };
    },

    /**
     * Retrieves member record for a tenant.
     */
    getMember: function(tenantId, userId) {
        'use strict';
        if (this._members[tenantId] && this._members[tenantId][userId]) {
            var m = this._members[tenantId][userId];
            return m.status === 'REMOVED' ? null : m;
        }
        return null;
    },

    /**
     * Suspends or removes a tenant member.
     */
    updateMemberStatus: function(tenantId, userId, newStatus, actor) {
        'use strict';
        if (!this._members[tenantId] || !this._members[tenantId][userId]) {
            return { success: false, status: 'MEMBER_NOT_FOUND', error: 'Member ' + userId + ' not found in tenant ' + tenantId };
        }

        var m = this._members[tenantId][userId];
        m.status = newStatus;
        if (newStatus === 'REMOVED') m.removed_at = new GlideDateTime().getValue();

        return { success: true, status: newStatus, user_id: userId, tenant_id: tenantId };
    },

    /**
     * Initiates governed tenant deletion flow (Requires Four-Eyes approval).
     */
    requestTenantDeletion: function(tenantId, requestedBy, reason) {
        'use strict';
        var t = this.getTenant(tenantId);
        if (!t) return { success: false, status: 'TENANT_NOT_FOUND', error: 'Tenant not found.' };

        this._deletionRequests[tenantId] = {
            tenant_id: tenantId,
            requested_by: requestedBy || 'admin',
            reason: reason || 'Customer Offboarding',
            status: 'PENDING_APPROVAL',
            approved_by: null,
            requested_at: new GlideDateTime().getValue()
        };

        t.status = 'DELETION_REQUESTED';

        return {
            success: true,
            status: 'DELETION_REQUESTED',
            tenant_id: tenantId,
            request: this._deletionRequests[tenantId]
        };
    },

    /**
     * Approves tenant deletion using Four-Eyes separation.
     */
    approveTenantDeletion: function(tenantId, approverUser, activeDeploymentCount) {
        'use strict';
        var req = this._deletionRequests[tenantId];
        if (!req) return { success: false, error: 'No pending deletion request for tenant ' + tenantId };

        // Four-Eyes principle: Requester != Approver
        if (req.requested_by === approverUser) {
            return {
                success: false,
                status: 'SEPARATION_OF_DUTIES_VIOLATION',
                error: 'Four-Eyes Principle Violation: Requester (' + req.requested_by + ') cannot approve tenant deletion.'
            };
        }

        // Active operations guard
        if (activeDeploymentCount > 0) {
            return {
                success: false,
                status: 'TENANT_DELETION_BLOCKED',
                error: 'Tenant deletion blocked: ' + activeDeploymentCount + ' active deployments or locks detected.'
            };
        }

        req.status = 'APPROVED';
        req.approved_by = approverUser;
        req.approved_at = new GlideDateTime().getValue();

        var t = this._tenants[tenantId];
        t.status = 'DELETED';
        t.deleted_at = new GlideDateTime().getValue();

        gs.warn(this.LOG_PREFIX + 'Tenant ' + tenantId + ' successfully deleted with Four-Eyes approval by ' + approverUser);

        return {
            success: true,
            status: 'DELETED',
            tenant_id: tenantId,
            approved_by: approverUser
        };
    },

    type: 'AppForgeTenantRegistryService'
};
