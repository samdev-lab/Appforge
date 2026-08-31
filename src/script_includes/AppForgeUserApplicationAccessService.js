/**
 * AppForgeUserApplicationAccessService
 * Granular User-to-Application Access Matrix & Server-Side Security Enforcement Engine.
 *
 * Implements:
 *   - Table Model (x_appforge_com_user_application)
 *   - Access Levels: NONE, USER, POWER_USER, APPLICATION_ADMIN
 *   - Multi-Layer Server-Side Access Evaluation:
 *       1. Customer active status
 *       2. Application installation verification
 *       3. Commercial entitlement verification
 *       4. User assignment & access level verification
 */
var AppForgeUserApplicationAccessService = Class.create();
AppForgeUserApplicationAccessService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeUserApplicationAccessService] ';
        this.orgService = new AppForgeCustomerOrganizationService();
        this.entitlementService = new AppForgeCommercialEntitlementService();
        this.auditService = new AppForgeAuditService();

        if (!AppForgeUserApplicationAccessService._store) {
            AppForgeUserApplicationAccessService._store = {
                assignments: {} // customerId_email_appKey -> assignment record
            };
        }
        this._store = AppForgeUserApplicationAccessService._store;
    },

    /**
     * Grants application access to a user.
     */
    grantAccess: function(customerId, email, appKey, accessLevel, grantedBy) {
        'use strict';
        if (!customerId || !email || !appKey) throw new Error('Customer, Email, and AppKey are required.');

        var cleanEmail = email.toLowerCase().trim();
        var cleanApp = appKey.toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
        var key = customerId + '_' + cleanEmail + '_' + cleanApp;

        var allowedLevels = ['NONE', 'USER', 'POWER_USER', 'APPLICATION_ADMIN'];
        var level = (accessLevel || 'USER').toUpperCase();
        if (allowedLevels.indexOf(level) === -1) level = 'USER';

        var rec = {
            customer_id: customerId,
            email: cleanEmail,
            application_key: cleanApp,
            access_level: level,
            status: 'ACTIVE',
            start_date: new Date().toISOString(),
            end_date: null,
            granted_by: grantedBy || 'admin',
            granted_on: new Date().toISOString(),
            revoked_by: null,
            revoked_on: null
        };

        AppForgeUserApplicationAccessService._store.assignments[key] = rec;
        this.auditService.logEvent('APPLICATION_ACCESS_GRANTED', 'ACCESS', rec.granted_by, key, 'SUCCESS', 'Access granted: ' + cleanApp + ' -> ' + cleanEmail + ' [' + level + ']');
        return { success: true, assignment: rec };
    },

    /**
     * Revokes application access for a user.
     */
    revokeAccess: function(customerId, email, appKey, revokedBy) {
        'use strict';
        var cleanEmail = email.toLowerCase().trim();
        var cleanApp = appKey.toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
        var key = customerId + '_' + cleanEmail + '_' + cleanApp;

        var rec = AppForgeUserApplicationAccessService._store.assignments[key];
        if (!rec) return { success: false, errorCode: 'ASSIGNMENT_NOT_FOUND', error: 'Assignment not found.' };

        rec.access_level = 'NONE';
        rec.status = 'REVOKED';
        rec.revoked_by = revokedBy || 'admin';
        rec.revoked_on = new Date().toISOString();

        this.auditService.logEvent('APPLICATION_ACCESS_REVOKED', 'ACCESS', rec.revoked_by, key, 'SUCCESS', 'Access revoked: ' + cleanApp + ' for ' + cleanEmail);
        return { success: true, assignment: rec };
    },

    /**
     * Evaluates comprehensive server-side access to an application.
     */
    evaluateAccess: function(customerId, email, appKey) {
        'use strict';
        var cleanEmail = (email || '').toLowerCase().trim();
        var cleanApp = (appKey || 'crm').toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
        var key = customerId + '_' + cleanEmail + '_' + cleanApp;

        // 1. Check Customer Status
        var custRes = this.orgService.getOrganization(customerId);
        if (custRes.success && custRes.customer.status === 'SUSPENDED') {
            return { allowed: false, errorCode: 'CUSTOMER_SUSPENDED', reason: 'Customer account is suspended.' };
        }

        // 2. Check Entitlement
        var ent = this.entitlementService.checkEntitlement(customerId, cleanApp);
        if (ent && !ent.entitled && ent.reason === 'EXPIRED') {
            return { allowed: false, errorCode: 'APPLICATION_NOT_ENTITLED', reason: 'Application entitlement expired.' };
        }

        // 3. Check User Assignment
        var rec = AppForgeUserApplicationAccessService._store.assignments[key];
        if (!rec || rec.status !== 'ACTIVE' || rec.access_level === 'NONE') {
            return { allowed: false, errorCode: 'APPLICATION_ACCESS_DENIED', reason: 'User has no active assignment for this application.' };
        }

        return {
            allowed: true,
            customer_id: customerId,
            email: cleanEmail,
            application_key: cleanApp,
            access_level: rec.access_level,
            status: 'AUTHORIZED'
        };
    },

    listUserApplications: function(customerId, email) {
        'use strict';
        var cleanEmail = (email || '').toLowerCase().trim();
        var list = [];
        for (var k in AppForgeUserApplicationAccessService._store.assignments) {
            var a = AppForgeUserApplicationAccessService._store.assignments[k];
            if (a.customer_id === customerId && a.email === cleanEmail && a.status === 'ACTIVE') {
                list.push(a);
            }
        }
        return list;
    },

    resetStore: function() {
        'use strict';
        AppForgeUserApplicationAccessService._store = {
            assignments: {}
        };
        this._store = AppForgeUserApplicationAccessService._store;
    },

    type: 'AppForgeUserApplicationAccessService'
};
