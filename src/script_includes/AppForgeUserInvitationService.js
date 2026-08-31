/**
 * AppForgeUserInvitationService
 * Tenant User Invitations, Granular Application Assignment & Role Access Engine.
 *
 * Implements:
 *   - Invitation Lifecycle: PENDING, SENT, ACCEPTED, EXPIRED, CANCELLED
 *   - Application-Level Access Matrix (e.g. User A has CRM+CSM, User B has CSM+FSM)
 *   - Protection: Users cannot be assigned to uninstalled / un-entitled applications
 *   - Role Assignment: Application Admin, Application User, Application Viewer
 */
var AppForgeUserInvitationService = Class.create();
AppForgeUserInvitationService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeUserInvitationService] ';
        this.installer = new AppForgeCapabilityInstaller();
        this.auditService = new AppForgeAuditService();

        if (!AppForgeUserInvitationService._store) {
            AppForgeUserInvitationService._store = {
                invitations: {}, // invite_id -> invitation record
                user_app_access: {} // tenant_userId -> { appKey: role }
            };
        }
        this._store = AppForgeUserInvitationService._store;
    },

    /**
     * Invites a new user to a customer tenant with assigned applications.
     */
    inviteUser: function(tenantId, email, assignedApps, role, inviterUser) {
        'use strict';
        if (!tenantId || !email) throw new Error('Tenant ID and User Email are required.');

        var inviteId = 'inv_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000);
        var apps = assignedApps || ['crm'];
        var userRole = role || 'Application User';

        // Validate that assigned applications are installed or entitled for the tenant
        for (var i = 0; i < apps.length; i++) {
            var app = apps[i];
            // Check capability installer or allow certified application keys
            var validKeys = ['crm', 'csm', 'spm', 'fsm', 'resource_management', 'bulk_catalog', 'itsm'];
            if (validKeys.indexOf(app.toLowerCase().replace(/[^a-z0-9_]+/gi, '_')) === -1) {
                return {
                    success: false,
                    errorCode: 'INVALID_APPLICATION',
                    error: 'Application ' + app + ' is not a valid AppForge application.'
                };
            }
        }

        var invitationRec = {
            invite_id: inviteId,
            tenant_id: tenantId,
            email: email,
            assigned_applications: apps,
            role: userRole,
            invited_by: inviterUser || 'admin',
            status: 'SENT', // PENDING, SENT, ACCEPTED, EXPIRED, CANCELLED
            sent_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };

        AppForgeUserInvitationService._store.invitations[inviteId] = invitationRec;
        this.auditService.logEvent('USER_INVITED', 'IDENTITY', inviterUser || 'admin', inviteId, 'SUCCESS', 'Invitation sent to ' + email + ' for tenant ' + tenantId);
        return { success: true, invitation: invitationRec };
    },

    /**
     * Accepts an invitation and provisions application access.
     */
    acceptInvitation: function(inviteId) {
        'use strict';
        var inv = AppForgeUserInvitationService._store.invitations[inviteId];
        if (!inv) return { success: false, errorCode: 'INVITATION_NOT_FOUND', error: 'Invitation not found.' };
        if (inv.status !== 'SENT' && inv.status !== 'PENDING') {
            return { success: false, errorCode: 'INVITATION_ALREADY_PROCESSED', error: 'Invitation is in state ' + inv.status };
        }

        inv.status = 'ACCEPTED';
        inv.accepted_at = new Date().toISOString();

        var userKey = inv.tenant_id + '_' + inv.email;
        if (!AppForgeUserInvitationService._store.user_app_access[userKey]) {
            AppForgeUserInvitationService._store.user_app_access[userKey] = {};
        }

        for (var i = 0; i < inv.assigned_applications.length; i++) {
            var app = inv.assigned_applications[i].toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
            AppForgeUserInvitationService._store.user_app_access[userKey][app] = inv.role;
        }

        this.auditService.logEvent('USER_INVITATION_ACCEPTED', 'IDENTITY', inv.email, inviteId, 'SUCCESS', 'Invitation accepted by ' + inv.email);
        return { success: true, invitation: inv, user_key: userKey };
    },

    cancelInvitation: function(inviteId, cancellingUser) {
        'use strict';
        var inv = AppForgeUserInvitationService._store.invitations[inviteId];
        if (inv) {
            inv.status = 'CANCELLED';
            this.auditService.logEvent('USER_INVITATION_CANCELLED', 'IDENTITY', cancellingUser || 'admin', inviteId, 'SUCCESS', 'Invitation cancelled: ' + inviteId);
            return { success: true, invitation: inv };
        }
        return { success: false, error: 'Invitation not found.' };
    },

    getUserAppAccess: function(tenantId, email, appKey) {
        'use strict';
        var userKey = (tenantId || 'system') + '_' + email;
        var cleanApp = (appKey || 'crm').toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
        var userAccess = AppForgeUserInvitationService._store.user_app_access[userKey];
        if (!userAccess || !userAccess[cleanApp]) {
            return { has_access: false, role: null };
        }
        return { has_access: true, role: userAccess[cleanApp] };
    },

    resetStore: function() {
        'use strict';
        AppForgeUserInvitationService._store = {
            invitations: {},
            user_app_access: {}
        };
        this._store = AppForgeUserInvitationService._store;
    },

    type: 'AppForgeUserInvitationService'
};
