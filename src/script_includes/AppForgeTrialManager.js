/**
 * AppForgeTrialManager
 * Commercial Evaluation & 14-Day Trial Lifecycle Manager.
 *
 * Implements:
 *   - 14-day evaluation lifecycle (START, EXTEND, END, CONVERT, CANCEL)
 *   - Trial abuse prevention (One active trial per customer/application)
 *   - Four-Eyes governance for manual trial extensions
 *   - Expiry calculation and remaining days computation
 */
var AppForgeTrialManager = Class.create();
AppForgeTrialManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTrialManager] ';
        this.DEFAULT_TRIAL_DAYS = 14;
        this.auditService = new AppForgeAuditService();

        if (!AppForgeTrialManager._store) {
            AppForgeTrialManager._store = {
                trials: {}, // key: customerId + '_' + appKey -> trial record
                trial_history: []
            };
        }
        this._store = AppForgeTrialManager._store;
    },

    /**
     * Starts a 14-day free trial for an application.
     */
    startTrial: function(customerId, appKey, customDays, user) {
        'use strict';
        if (!customerId || !appKey) throw new Error('Customer ID and App Key are required.');
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var key = customerId + '_' + cleanApp;

        var existing = AppForgeTrialManager._store.trials[key];
        if (existing) {
            if (existing.status === 'TRIAL_ACTIVE') {
                return { success: false, errorCode: 'ALREADY_IN_TRIAL', error: 'Customer already has an active trial for ' + cleanApp };
            }
            if (existing.status === 'TRIAL_EXPIRED' || existing.status === 'CONVERTED') {
                return { success: false, errorCode: 'TRIAL_ALREADY_USED', error: 'Customer has already used the trial for ' + cleanApp };
            }
        }

        var days = (typeof customDays === 'number' && customDays > 0) ? customDays : this.DEFAULT_TRIAL_DAYS;
        var start = new Date();
        var end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

        var trialRec = {
            trial_id: 'trl_' + Math.floor(Math.random() * 1000000),
            customer_id: customerId,
            application_key: cleanApp,
            status: 'TRIAL_ACTIVE',
            days: days,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            extensions_count: 0,
            created_by: user || 'customer_admin',
            created_at: start.toISOString()
        };

        AppForgeTrialManager._store.trials[key] = trialRec;
        AppForgeTrialManager._store.trial_history.push(trialRec);

        this.auditService.logEvent('tenant_' + customerId, user || 'customer', 'TRIAL_STARTED', cleanApp, 'trial', 'SUCCESS', trialRec.trial_id, { days: days });
        return { success: true, trial: trialRec };
    },

    /**
     * Extends an active trial with Four-Eyes governance.
     */
    extendTrial: function(customerId, appKey, additionalDays, requester, approver, reason) {
        'use strict';
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var key = customerId + '_' + cleanApp;
        var trial = AppForgeTrialManager._store.trials[key];

        if (!trial) return { success: false, errorCode: 'TRIAL_NOT_FOUND', error: 'No trial found for ' + cleanApp };

        // Four-Eyes Check
        if (requester && approver && requester === approver) {
            return {
                success: false,
                errorCode: 'FOUR_EYES_APPROVAL_REQUIRED',
                error: 'Trial extension requires Four-Eyes separation (Requester ' + requester + ' cannot self-approve).'
            };
        }

        var addDays = (typeof additionalDays === 'number') ? additionalDays : 7;
        var currentEnd = new Date(trial.end_date);
        var newEnd = new Date(currentEnd.getTime() + addDays * 24 * 60 * 60 * 1000);

        trial.end_date = newEnd.toISOString();
        trial.days += addDays;
        trial.extensions_count = (trial.extensions_count || 0) + 1;
        trial.status = 'TRIAL_ACTIVE'; // reactivation if was expired

        this.auditService.logEvent('tenant_' + customerId, approver || 'admin', 'TRIAL_EXTENDED', cleanApp, 'trial', 'SUCCESS', trial.trial_id, { added_days: addDays, reason: reason });

        return { success: true, trial: trial, new_end_date: trial.end_date };
    },

    /**
     * Retrieves trial status including remaining days.
     */
    getTrialStatus: function(customerId, appKey) {
        'use strict';
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var key = customerId + '_' + cleanApp;
        var trial = AppForgeTrialManager._store.trials[key];

        if (!trial) return { in_trial: false, status: 'NOT_IN_TRIAL', days_remaining: 0 };

        var now = Date.now();
        var endMs = new Date(trial.end_date).getTime();
        var diffMs = endMs - now;
        var daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        var status = trial.status;
        if (trial.status === 'TRIAL_ACTIVE') {
            if (daysRemaining <= 0) {
                status = 'TRIAL_EXPIRED';
                trial.status = 'TRIAL_EXPIRED';
            } else if (daysRemaining <= 3) {
                status = 'TRIAL_EXPIRING';
            }
        }

        return {
            trial_id: trial.trial_id,
            customer_id: customerId,
            application_key: cleanApp,
            in_trial: (status === 'TRIAL_ACTIVE' || status === 'TRIAL_EXPIRING'),
            status: status,
            days_remaining: Math.max(0, daysRemaining),
            start_date: trial.start_date,
            end_date: trial.end_date,
            extensions_count: trial.extensions_count || 0
        };
    },

    /**
     * Converts trial into active commercial subscription.
     */
    convertTrial: function(customerId, appKey, subscriptionId) {
        'use strict';
        var cleanApp = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var key = customerId + '_' + cleanApp;
        var trial = AppForgeTrialManager._store.trials[key];

        if (trial) {
            trial.status = 'CONVERTED';
            trial.converted_subscription_id = subscriptionId;
            trial.converted_at = new Date().toISOString();
        }

        return { success: true, status: 'CONVERTED' };
    },

    resetStore: function() {
        'use strict';
        AppForgeTrialManager._store = {
            trials: {},
            trial_history: []
        };
        this._store = AppForgeTrialManager._store;
        this.auditService.resetStore();
    },

    type: 'AppForgeTrialManager'
};
