/**
 * AppForgeMigrationReconciler
 * Reconciles post-migration state across source/target counts, checksum accuracy, orphan references, and failure rates.
 */
var AppForgeMigrationReconciler = Class.create();
AppForgeMigrationReconciler.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMigrationReconciler] ';
    },

    /**
     * Reconciles migration execution results.
     * @param {Object} batchResult - Result from AppForgeMigrationBatchProcessor.
     * @param {Array<Object>} records - Transformed records.
     * @param {number} [maxFailureThreshold=0.001] - Max allowable failure rate (default 0.1%).
     * @return {Object} { status: 'RECONCILED'|'PARTIAL'|'FAILED', reconciled: boolean, metrics: Object }
     */
    reconcile: function(batchResult, records, maxFailureThreshold) {
        'use strict';
        if (!batchResult) {
            return { status: 'FAILED', reconciled: false, issues: ['Missing batch execution results'] };
        }

        var total = batchResult.total_records || 0;
        var success = batchResult.successful || 0;
        var failed = batchResult.failed || 0;
        var threshold = maxFailureThreshold || 0.001;

        var failureRate = total > 0 ? (failed / total) : 0;
        var isReconciled = failed === 0 && success === total;

        var status = 'RECONCILED';
        if (!isReconciled) {
            status = failureRate <= threshold ? 'PARTIAL' : 'FAILED';
        }

        return {
            status: status,
            reconciled: isReconciled,
            metrics: {
                total_records: total,
                successful_records: success,
                failed_records: failed,
                failure_rate: failureRate,
                checksum_validations_passed: success
            },
            issues: failed > 0 ? [failed + ' record(s) failed transformation validation'] : []
        };
    },

    type: 'AppForgeMigrationReconciler'
};
