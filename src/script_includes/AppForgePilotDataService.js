/**
 * AppForgePilotDataService
 * Pilot Demo Dataset Seeder, Product Feedback Repository & Feature Flag Engine.
 *
 * Implements:
 *   - Controlled Pilot Dataset Seeding (1 Customer, 5 Contacts, 10 Leads, 5 Opps, 3 Cases, 3 WOs, 3 Projects, 5 Requests, 5 Incidents)
 *   - Test-Only Governed Data Reset with Production Safety Protection
 *   - Product Feedback Collection (x_appforge_product_feedback)
 *   - Multi-Tier Feature Flag Engine (Platform, App, Tenant, User)
 */
var AppForgePilotDataService = Class.create();
AppForgePilotDataService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePilotDataService] ';
        this.auditService = new AppForgeAuditService();

        if (!AppForgePilotDataService._store) {
            AppForgePilotDataService._store = {
                feedback: [],
                feature_flags: {
                    'advanced_analytics': { state: 'ENABLED', tier: 'PLATFORM' },
                    'beta_ai_copilot': { state: 'DISABLED', tier: 'INTERNAL' },
                    'custom_export_v2': { state: 'PERCENTAGE', percentage: 50, tier: 'TENANT' }
                },
                pilot_datasets: {} // tenantId -> dataset details
            };
        }
        this._store = AppForgePilotDataService._store;
    },

    /**
     * Seeds controlled pilot/demo data into a customer tenant.
     */
    seedPilotData: function(tenantId, options) {
        'use strict';
        var t = tenantId || 'tenant_pilot';
        var o = options || {};

        var dataset = {
            tenant_id: t,
            seeded_at: new Date().toISOString(),
            customer_accounts: [{ id: 'CUST-001', name: 'Global Zenith Enterprises' }],
            contacts: [
                { id: 'CON-01', name: 'Alice Walker', email: 'alice@zenith.com' },
                { id: 'CON-02', name: 'Bob Martinez', email: 'bob@zenith.com' },
                { id: 'CON-03', name: 'Carol Danvers', email: 'carol@zenith.com' },
                { id: 'CON-04', name: 'David Kim', email: 'david@zenith.com' },
                { id: 'CON-05', name: 'Emma Watson', email: 'emma@zenith.com' }
            ],
            leads: Array.from({ length: 10 }, function(_, i) {
                return { id: 'LEAD-' + (i + 1), company: 'Prospect ' + (i + 1), value_usd: 10000 * (i + 1) };
            }),
            opportunities: Array.from({ length: 5 }, function(_, i) {
                return { id: 'OPP-' + (i + 1), stage: 'Proposal', amount_usd: 25000 * (i + 1) };
            }),
            cases: Array.from({ length: 3 }, function(_, i) {
                return { id: 'CASE-' + (i + 1), priority: 'P2', subject: 'Integration Sync Inquiry ' + (i + 1) };
            }),
            work_orders: Array.from({ length: 3 }, function(_, i) {
                return { id: 'WO-' + (i + 1), territory: 'North America', status: 'PENDING_DISPATCH' };
            }),
            projects: Array.from({ length: 3 }, function(_, i) {
                return { id: 'PRJ-' + (i + 1), name: 'Enterprise Digital Transformation ' + (i + 1), budget: 100000 };
            }),
            requests: Array.from({ length: 5 }, function(_, i) {
                return { id: 'REQ-' + (i + 1), item: 'Standard Enterprise Workspace', status: 'APPROVED' };
            }),
            incidents: Array.from({ length: 5 }, function(_, i) {
                return { id: 'INC-' + (i + 1), category: 'Software', priority: 'P3', state: 'RESOLVED' };
            })
        };

        AppForgePilotDataService._store.pilot_datasets[t] = dataset;
        this.auditService.logEvent('PILOT_DATA_SEEDED', 'DATA', 'admin', t, 'SUCCESS', 'Seeded pilot dataset for ' + t);
        return { success: true, tenant_id: t, records_seeded: 37, dataset: dataset };
    },

    /**
     * Resets test pilot data for a tenant (protected against accidental production wipe).
     */
    resetPilotData: function(tenantId, confirmationCode, isProduction) {
        'use strict';
        if (isProduction === true) {
            return {
                success: false,
                errorCode: 'RESET_PROHIBITED_IN_PROD',
                error: 'Pilot data reset is strictly prohibited in production environments.'
            };
        }

        if (confirmationCode !== 'CONFIRM_RESET_PILOT_DATA') {
            return {
                success: false,
                errorCode: 'INVALID_CONFIRMATION_CODE',
                error: 'Explicit confirmation code is required to reset pilot data.'
            };
        }

        var t = tenantId || 'tenant_pilot';
        delete AppForgePilotDataService._store.pilot_datasets[t];
        this.auditService.logEvent('PILOT_DATA_RESET', 'DATA', 'admin', t, 'SUCCESS', 'Reset pilot data for ' + t);
        return { success: true, message: 'Pilot data cleanly reset for tenant ' + t };
    },

    /**
     * Captures customer product feedback (x_appforge_product_feedback).
     */
    submitFeedback: function(tenantId, appKey, user, page, feature, rating, comment) {
        'use strict';
        var fbNum = 'FB-' + Math.floor(100000 + Math.random() * 900000);
        var entry = {
            number: fbNum,
            tenant: tenantId || 'system',
            application: (appKey || 'platform').toLowerCase(),
            user: user || 'anonymous',
            page: page || 'dashboard',
            feature: feature || 'general',
            rating: rating || 'YES', // YES, NO, 1-5
            comment: comment || '',
            correlation_id: 'corr_fb_' + Date.now().toString(36),
            created_at: new Date().toISOString(),
            status: 'NEW'
        };

        AppForgePilotDataService._store.feedback.push(entry);
        this.auditService.logEvent('PRODUCT_FEEDBACK_SUBMITTED', 'FEEDBACK', user || 'anonymous', fbNum, 'SUCCESS', 'Feedback submitted for ' + entry.application);
        return { success: true, feedback: entry };
    },

    /**
     * Evaluates whether a feature flag is enabled for a given tenant/user.
     */
    isFeatureEnabled: function(flagKey, tenantId, user) {
        'use strict';
        var flag = AppForgePilotDataService._store.feature_flags[flagKey];
        if (!flag) return false;
        if (flag.state === 'ENABLED') return true;
        if (flag.state === 'DISABLED') return false;
        if (flag.state === 'PERCENTAGE') {
            var hash = (tenantId || 'sys').split('').reduce(function(acc, c) { return acc + c.charCodeAt(0); }, 0);
            return (hash % 100) < (flag.percentage || 50);
        }
        return false;
    },

    setFeatureFlag: function(flagKey, state, tier, percentage) {
        'use strict';
        AppForgePilotDataService._store.feature_flags[flagKey] = {
            state: state,
            tier: tier || 'PLATFORM',
            percentage: percentage || 100
        };
        return { success: true, flag: flagKey, state: state };
    },

    resetStore: function() {
        'use strict';
        AppForgePilotDataService._store = {
            feedback: [],
            feature_flags: {
                'advanced_analytics': { state: 'ENABLED', tier: 'PLATFORM' },
                'beta_ai_copilot': { state: 'DISABLED', tier: 'INTERNAL' },
                'custom_export_v2': { state: 'PERCENTAGE', percentage: 50, tier: 'TENANT' }
            },
            pilot_datasets: {}
        };
        this._store = AppForgePilotDataService._store;
    },

    type: 'AppForgePilotDataService'
};
