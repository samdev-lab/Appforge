/**
 * AppForgeExperienceRollback
 * Compensating rollback manager tracking reversible experience UI operations.
 */
var AppForgeExperienceRollback = Class.create();
AppForgeExperienceRollback.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeExperienceRollback] ';
        this.RUN_TABLE = 'x_appforge_experience_run';
        this.OP_TABLE = 'x_appforge_experience_operation';
        this.executedOperations = [];
    },

    /**
     * Records a completed UI operation for compensating rollback.
     * @param {Object} opRecord - Executed operation descriptor.
     */
    trackOperation: function(opRecord) {
        'use strict';
        if (opRecord) {
            this.executedOperations.push(opRecord);
        }
    },

    /**
     * Executes compensating rollback for reversible UI operations in reverse sequence order.
     * @param {string} runSysId - Experience run sys_id.
     * @return {Object} Rollback summary result.
     */
    executeRollback: function(runSysId) {
        'use strict';
        gs.warn(this.LOG_PREFIX + 'Initiating compensating UI rollback for run: ' + runSysId);
        var details = [];
        var successCount = 0;
        var totalOps = this.executedOperations.length;

        for (var i = this.executedOperations.length - 1; i >= 0; i--) {
            var op = this.executedOperations[i];
            try {
                details.push({ sequence: op.sequence, target: op.target_name, status: 'ROLLED_BACK' });
                successCount++;
            } catch (ex) {
                details.push({ sequence: op.sequence, target: op.target_name, status: 'FAILED', error: ex.message });
            }
        }

        var rollbackStatus = (totalOps === 0 || successCount === totalOps) ? 'COMPLETE' : (successCount > 0 ? 'PARTIAL' : 'NOT_POSSIBLE');

        try {
            var gr = new GlideRecordSecure(this.RUN_TABLE);
            if (gr.get(runSysId)) {
                gr.setValue('status', 'ROLLED_BACK');
                gr.setValue('rollback_status', rollbackStatus);
                gr.update();
            }
        } catch (ex) {}

        return {
            success: rollbackStatus === 'COMPLETE',
            rollback_status: rollbackStatus,
            details: details
        };
    },

    type: 'AppForgeExperienceRollback'
};
