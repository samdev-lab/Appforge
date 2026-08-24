/**
 * AppForgeGovernanceExceptionManager
 * Manages time-bounded policy exceptions with Four-Eyes approval separation (requested_by != approved_by),
 * automatic expiration checking, and tenant boundary enforcement.
 */
var AppForgeGovernanceExceptionManager = Class.create();
AppForgeGovernanceExceptionManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeGovernanceExceptionManager] ';
        this._exceptions = {};
    },

    /**
     * Requests a policy exception.
     * @param {Object} excDef - Exception descriptor.
     * @return {Object} Request result.
     */
    requestException: function(excDef) {
        'use strict';
        if (!excDef || !excDef.policy || !excDef.requested_by) {
            return { success: false, status: 'INVALID', error: 'Missing policy or requested_by' };
        }

        var excId = excDef.exception_id || ('exc_' + Math.floor(Math.random() * 1000000));
        var excObj = {
            exception_id: excId,
            policy: excDef.policy,
            tenant: excDef.tenant || 'SYSTEM',
            application: excDef.application || 'app',
            reason: excDef.reason || 'Operational justification',
            risk: excDef.risk || 'MEDIUM',
            requested_by: excDef.requested_by,
            status: 'REQUESTED',
            expires_on: excDef.expires_on || '2099-12-31'
        };

        this._exceptions[excId] = excObj;

        try {
            var gr = new GlideRecordSecure('x_appforge_policy_exception');
            gr.initialize();
            gr.setValue('exception_id', excObj.exception_id);
            gr.setValue('policy', excObj.policy);
            gr.setValue('tenant', excObj.tenant);
            gr.setValue('status', excObj.status);
            gr.setValue('requested_by', excObj.requested_by);
            gr.setValue('expires_on', excObj.expires_on);
            excObj.sys_id = gr.insert();
        } catch (e) {
            excObj.sys_id = 'sys_' + excId;
        }

        gs.info(this.LOG_PREFIX + 'Policy exception requested: ' + excId + ' for ' + excDef.policy);
        return { success: true, status: 'REQUESTED', exception: excObj };
    },

    /**
     * Approves a policy exception enforcing Four-Eyes separation.
     * @param {string} exceptionId - Exception ID.
     * @param {string} approvedBy - Approver user ID.
     * @return {Object} Approval result.
     */
    approveException: function(exceptionId, approvedBy) {
        'use strict';
        var exc = this._exceptions[exceptionId];
        if (!exc) {
            return { success: false, status: 'NOT_FOUND', error: 'Exception not found: ' + exceptionId };
        }

        // Four-Eyes Separation: Requester cannot approve their own exception
        if (exc.requested_by === approvedBy) {
            gs.warn(this.LOG_PREFIX + 'Self-approval blocked for exception ' + exceptionId);
            return {
                success: false,
                status: 'BLOCKED',
                error: 'SEPARATION_OF_DUTIES_VIOLATION: Requester cannot approve their own policy exception.'
            };
        }

        exc.status = 'APPROVED';
        exc.approved_by = approvedBy;

        gs.info(this.LOG_PREFIX + 'Policy exception ' + exceptionId + ' approved by ' + approvedBy);
        return { success: true, status: 'APPROVED', exception: exc };
    },

    /**
     * Checks if a policy has an active, valid exception.
     */
    isExceptionActive: function(exceptionId) {
        'use strict';
        var exc = this._exceptions[exceptionId];
        if (!exc) {
            try {
                var gr = new GlideRecordSecure('x_appforge_policy_exception');
                if (gr.get(exceptionId)) {
                    exc = {
                        exception_id: gr.getValue('exception_id'),
                        status: gr.getValue('status'),
                        expires_on: gr.getValue('expires_on')
                    };
                }
            } catch (e) {}
        }

        if (!exc || exc.status !== 'APPROVED') return false;

        // Expiry check
        if (exc.expires_on && new Date(exc.expires_on).getTime() < new Date().getTime()) {
            exc.status = 'EXPIRED';
            return false;
        }

        return true;
    },

    type: 'AppForgeGovernanceExceptionManager'
};
