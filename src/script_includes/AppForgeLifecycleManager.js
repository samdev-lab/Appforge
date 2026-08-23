/**
 * AppForgeLifecycleManager
 * Governs application lifecycle transitions and release approval gates:
 * PLANNED -> DEVELOPMENT -> TESTING -> UAT -> PRODUCTION-READY -> RETIRED.
 */
var AppForgeLifecycleManager = Class.create();
AppForgeLifecycleManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeLifecycleManager] ';
        this.LIFECYCLE_STATES = ['PLANNED', 'DEVELOPMENT', 'TESTING', 'UAT', 'PRODUCTION-READY', 'RETIRED'];
    },

    /**
     * Validates if a lifecycle transition is allowed.
     * @param {string} fromState - Current lifecycle state.
     * @param {string} toState - Target lifecycle state.
     * @param {boolean} [isApproved] - True if formal release approval exists.
     * @return {Object} { allowed: boolean, error: string }
     */
    validateTransition: function(fromState, toState, isApproved) {
        'use strict';
        var from = (fromState || 'PLANNED').toUpperCase();
        var to = (toState || 'DEVELOPMENT').toUpperCase();

        if (from === to) return { allowed: true };

        // Disallow direct jump to production-ready from dev
        if ((from === 'DEVELOPMENT' || from === 'PLANNED') && to === 'PRODUCTION-READY') {
            return {
                allowed: false,
                error: 'INVALID LIFECYCLE TRANSITION: Direct jump from ' + from + ' to PRODUCTION-READY is blocked. Must proceed through TESTING -> UAT.'
            };
        }

        // Promotion to UAT or PRODUCTION-READY requires approval
        if ((to === 'UAT' || to === 'PRODUCTION-READY') && !isApproved) {
            return {
                allowed: false,
                error: 'APPROVAL REQUIRED: Promoting application to ' + to + ' requires formal release approval.'
            };
        }

        return { allowed: true };
    },

    /**
     * Creates or updates a formal release approval record.
     * @param {string} appRef - Application reference.
     * @param {string} version - Version string.
     * @param {string} targetEnv - Target environment (TEST, UAT, PRODUCTION).
     * @param {string} user - Requesting/Approving user.
     * @param {string} status - Status (PENDING, APPROVED, REJECTED).
     * @return {string} Approval record sys_id.
     */
    recordApproval: function(appRef, version, targetEnv, user, status) {
        'use strict';
        try {
            var approvalId = 'appr_' + version + '_' + targetEnv + '_' + new Date().getTime();
            var gr = new GlideRecordSecure('x_appforge_release_approval');
            gr.initialize();
            gr.setValue('approval_id', approvalId);
            gr.setValue('application', appRef);
            gr.setValue('version', version);
            gr.setValue('target_environment', targetEnv);
            gr.setValue('requested_by', user);
            gr.setValue('approved_by', status === 'APPROVED' ? user : '');
            gr.setValue('approval_status', status || 'PENDING');
            gr.setValue('approval_date', new GlideDateTime().getValue());
            return gr.insert();
        } catch (ex) {
            return 'sys_id_mock_approval';
        }
    },

    type: 'AppForgeLifecycleManager'
};
