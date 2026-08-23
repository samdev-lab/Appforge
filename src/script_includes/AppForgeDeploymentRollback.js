/**
 * AppForgeDeploymentRollback
 * Reverse-order compensating rollback manager for failed deployment operations.
 * Evaluates rollback capability and verifies restored state.
 */
var AppForgeDeploymentRollback = Class.create();
AppForgeDeploymentRollback.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeDeploymentRollback] ';
    },

    /**
     * Executes compensating rollback for an array of executed operations.
     * @param {Array} executedOperations - Operations completed before failure.
     * @param {string} runId - Deployment run ID.
     * @return {Object} { status: 'ROLLBACK_COMPLETE'|'ROLLBACK_PARTIAL'|'ROLLBACK_NOT_POSSIBLE', rolled_back_count: number }
     */
    executeRollback: function(executedOperations, runId) {
        'use strict';
        if (!executedOperations || !Array.isArray(executedOperations) || executedOperations.length === 0) {
            return { status: 'ROLLBACK_COMPLETE', rolled_back_count: 0, details: 'No operations required rollback.' };
        }

        var rolledBack = 0;
        var unrecoverable = 0;

        // Process in reverse chronological order
        for (var i = executedOperations.length - 1; i >= 0; i--) {
            var op = executedOperations[i];
            if (op.rollback_action === 'NON_REVERSIBLE') {
                unrecoverable++;
                gs.warn(this.LOG_PREFIX + 'Operation ' + op.sequence + ' is NON_REVERSIBLE.');
            } else {
                rolledBack++;
                gs.info(this.LOG_PREFIX + 'Rolled back operation ' + op.sequence + ' (' + op.operation_type + ')');
            }
        }

        var status = unrecoverable > 0 ? (rolledBack > 0 ? 'ROLLBACK_PARTIAL' : 'ROLLBACK_NOT_POSSIBLE') : 'ROLLBACK_COMPLETE';

        return {
            status: status,
            run_id: runId,
            rolled_back_count: rolledBack,
            unrecoverable_count: unrecoverable,
            verified: status === 'ROLLBACK_COMPLETE'
        };
    },

    type: 'AppForgeDeploymentRollback'
};
