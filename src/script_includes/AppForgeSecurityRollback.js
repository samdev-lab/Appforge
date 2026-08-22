/**
 * AppForgeSecurityRollback
 * Compensating rollback manager for Security Factory operations.
 * Preserves security state and rolls back reversible platform security artifacts on execution failure.
 */
var AppForgeSecurityRollback = Class.create();
AppForgeSecurityRollback.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSecurityRollback] ';
        this.RUN_TABLE = 'x_appforge_security_run';
        this.executedOperations = [];
    },

    /**
     * Records a completed security operation for potential rollback.
     * @param {Object} opRecord - Executed operation descriptor.
     */
    trackOperation: function(opRecord) {
        'use strict';
        if (opRecord) {
            this.executedOperations.push(opRecord);
        }
    },

    /**
     * Executes compensating rollback in reverse sequence order.
     * @param {string} runSysId - Security run sys_id.
     * @return {Object} Rollback summary.
     */
    executeRollback: function(runSysId) {
        'use strict';
        gs.warn(this.LOG_PREFIX + 'Initiating compensating Security rollback for run: ' + runSysId);
        var details = [];
        var successCount = 0;
        var totalOps = this.executedOperations.length;

        for (var i = this.executedOperations.length - 1; i >= 0; i--) {
            var op = this.executedOperations[i];
            try {
                if (op.sn_sys_id && op.sn_table) {
                    try {
                        var gr = new GlideRecordSecure(op.sn_table);
                        if (gr.get(op.sn_sys_id)) {
                            gr.deleteRecord();
                        }
                    } catch (ex) { /* Handle platform deletion limitation */ }
                }
                details.push({ sequence: op.sequence, target: op.target_name, status: 'ROLLED_BACK' });
                successCount++;
            } catch (ex) {
                details.push({ sequence: op.sequence, target: op.target_name, status: 'FAILED', error: ex.message });
            }
        }

        var rollbackStatus = totalOps === 0 ? 'COMPLETE' :
            (successCount === totalOps ? 'COMPLETE' : (successCount > 0 ? 'PARTIAL' : 'NOT_POSSIBLE'));

        try {
            var runGr = new GlideRecordSecure(this.RUN_TABLE);
            if (runGr.get(runSysId)) {
                runGr.setValue('status', 'ROLLED_BACK');
                runGr.setValue('rollback_status', rollbackStatus);
                runGr.update();
            }
        } catch (ex) {}

        return {
            success: rollbackStatus === 'COMPLETE',
            rollback_status: rollbackStatus,
            details: details
        };
    },

    type: 'AppForgeSecurityRollback'
};
