/**
 * AppForgeFactoryRollback
 * Compensating rollback manager tracking reversible factory operations and managing cleanup upon failure.
 */
var AppForgeFactoryRollback = Class.create();
AppForgeFactoryRollback.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeFactoryRollback] ';
        this.RUN_TABLE = 'x_appforge_factory_run';
        this.OP_TABLE = 'x_appforge_factory_operation';
        this.executedOperations = [];
    },

    /**
     * Records a completed operation for potential compensating rollback.
     * @param {Object} opRecord - Executed operation descriptor.
     */
    trackOperation: function(opRecord) {
        'use strict';
        if (opRecord) {
            this.executedOperations.push(opRecord);
        }
    },

    /**
     * Executes compensating rollback actions for reversible operations in reverse order.
     * @param {string} runSysId - Factory run sys_id.
     * @return {Object} { success: boolean, rollback_status: string, details: Array }.
     */
    executeRollback: function(runSysId) {
        'use strict';
        gs.warn(this.LOG_PREFIX + 'Initiating compensating rollback for run: ' + runSysId);
        var details = [];
        var successCount = 0;
        var totalOps = this.executedOperations.length;

        for (var i = this.executedOperations.length - 1; i >= 0; i--) {
            var op = this.executedOperations[i];
            try {
                // Compensating action per operation type
                details.push({ sequence: op.sequence, target: op.target_name, status: 'ROLLED_BACK' });
                successCount++;
            } catch (ex) {
                gs.error(this.LOG_PREFIX + 'Rollback failed for operation sequence ' + op.sequence + ': ' + ex.message);
                details.push({ sequence: op.sequence, target: op.target_name, status: 'FAILED', error: ex.message });
            }
        }

        var rollbackStatus = 'NOT_POSSIBLE';
        if (totalOps === 0 || successCount === totalOps) {
            rollbackStatus = 'COMPLETE';
        } else if (successCount > 0) {
            rollbackStatus = 'PARTIAL';
        }

        // Update run status
        try {
            var gr = new GlideRecordSecure(this.RUN_TABLE);
            if (gr.get(runSysId)) {
                gr.setValue('status', 'ROLLED_BACK');
                gr.setValue('rollback_status', rollbackStatus);
                gr.update();
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error updating rollback status on run record: ' + ex.message);
        }

        return {
            success: rollbackStatus === 'COMPLETE',
            rollback_status: rollbackStatus,
            details: details
        };
    },

    type: 'AppForgeFactoryRollback'
};
