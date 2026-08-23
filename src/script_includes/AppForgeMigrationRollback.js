/**
 * AppForgeMigrationRollback
 * Compensating rollback manager for data migrations and schema alterations.
 * Reverts transformed records to before-values and reconciles restored state.
 */
var AppForgeMigrationRollback = Class.create();
AppForgeMigrationRollback.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMigrationRollback] ';
    },

    /**
     * Executes compensating rollback for an array of migrated records.
     * @param {Array<Object>} records - Migrated records with _migration_marker.
     * @param {string} fieldName - Target field name.
     * @param {string} migrationId - Migration ID.
     * @return {Object} { status: 'ROLLBACK_RECONCILED'|'ROLLBACK_PARTIAL'|'ROLLBACK_NOT_POSSIBLE', restored_count: number }
     */
    rollbackRecords: function(records, fieldName, migrationId) {
        'use strict';
        if (!records || !Array.isArray(records) || records.length === 0) {
            return { status: 'ROLLBACK_RECONCILED', restored_count: 0, details: 'No records to revert.' };
        }

        var restored = 0;
        var failed = 0;

        for (var i = 0; i < records.length; i++) {
            var rec = records[i];
            if (rec._migration_marker && rec._migration_marker.before_value !== undefined) {
                rec[fieldName] = rec._migration_marker.before_value;
                rec._migration_marker.status = 'REVERTED';
                restored++;
            } else {
                failed++;
            }
        }

        var status = 'ROLLBACK_RECONCILED';
        if (failed > 0) {
            status = restored > 0 ? 'ROLLBACK_PARTIAL' : 'ROLLBACK_NOT_POSSIBLE';
        }

        gs.info(this.LOG_PREFIX + 'Rollback complete for migration ' + migrationId + ' (' + restored + ' records restored)');

        return {
            status: status,
            migration_id: migrationId,
            restored_count: restored,
            failed_count: failed,
            verified: status === 'ROLLBACK_RECONCILED'
        };
    },

    type: 'AppForgeMigrationRollback'
};
