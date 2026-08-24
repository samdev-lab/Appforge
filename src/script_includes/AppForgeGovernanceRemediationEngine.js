/**
 * AppForgeGovernanceRemediationEngine
 * Executes safe compliance remediations enforcing safety classifications:
 * READ_ONLY, SAFE_AUTOMATION, APPROVAL_REQUIRED, FORBIDDEN.
 */
var AppForgeGovernanceRemediationEngine = Class.create();
AppForgeGovernanceRemediationEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeGovernanceRemediationEngine] ';
    },

    /**
     * Classifies a remediation action for safety.
     * @param {string} actionName - Remediation action type.
     * @return {Object} Safety classification descriptor.
     */
    classifyAction: function(actionName) {
        'use strict';
        var act = (actionName || '').toUpperCase();

        if (act === 'DROP_TABLE' || act === 'DELETE_DATA' || act === 'REMOVE_TENANT' || act === 'DELETE_APPLICATION' || act === 'DISABLE_SECURITY') {
            return { classification: 'FORBIDDEN', allowed_automatic: false, reason: 'Destructive operation is strictly forbidden.' };
        }

        if (act === 'REINSTALL_PACKAGE' || act === 'EXECUTE_MIGRATION' || act === 'RESTART_SERVICE') {
            return { classification: 'APPROVAL_REQUIRED', allowed_automatic: false, reason: 'Stateful operational change requires human approval.' };
        }

        if (act === 'REAPPLY_ACL' || act === 'RESTORE_CONFIGURATION' || act === 'ENABLE_SECURITY_CONTROL' || act === 'AUDIT_POLICY') {
            return { classification: 'SAFE_AUTOMATION', allowed_automatic: true, reason: 'Idempotent, non-destructive configuration correction.' };
        }

        return { classification: 'READ_ONLY', allowed_automatic: true, reason: 'Read-only diagnostic inquiry.' };
    },

    /**
     * Executes a safe governance remediation.
     */
    executeRemediation: function(actionName, targetContext, isApproved) {
        'use strict';
        var safety = this.classifyAction(actionName);

        if (safety.classification === 'FORBIDDEN') {
            gs.error(this.LOG_PREFIX + 'Forbidden remediation blocked: ' + actionName);
            return { success: false, status: 'FORBIDDEN', error: 'FORBIDDEN_ACTION: ' + safety.reason };
        }

        if (safety.classification === 'APPROVAL_REQUIRED' && !isApproved) {
            return { success: false, status: 'APPROVAL_REQUIRED', error: 'Action requires explicit human approval.' };
        }

        gs.info(this.LOG_PREFIX + 'Remediation executed cleanly: ' + actionName);
        return { success: true, status: 'DRIFT_REMEDIATED', action: actionName };
    },

    type: 'AppForgeGovernanceRemediationEngine'
};
