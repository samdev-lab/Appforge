/**
 * AppForgeMigrationLockManager
 * Manages mutex locks on application, table, and field targets during data migration.
 * Prevents concurrent colliding transformations and schema alterations.
 */
var AppForgeMigrationLockManager = Class.create();
AppForgeMigrationLockManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMigrationLockManager] ';
        this.LOCK_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
        this._activeLocks = {};
    },

    /**
     * Acquires lock for a migration target.
     * @param {string} targetKey - Unique target (e.g. app:x_appforge_employee or table:employee).
     * @param {string} migrationId - Migration ID.
     * @param {string} user - Requesting user.
     * @return {Object} { acquired: boolean, error: string }
     */
    acquireLock: function(targetKey, migrationId, user) {
        'use strict';
        var now = new Date().getTime();
        var lock = this._activeLocks[targetKey];

        if (lock) {
            if (now - lock.timestamp > this.LOCK_TIMEOUT_MS) {
                gs.warn(this.LOG_PREFIX + 'Expired migration lock on ' + targetKey + ' cleared.');
            } else if (lock.migration_id !== migrationId) {
                return {
                    acquired: false,
                    error: 'MIGRATION_CONFLICT: Target ' + targetKey + ' is already locked by migration ' + lock.migration_id + ' (' + lock.user + ').'
                };
            }
        }

        this._activeLocks[targetKey] = {
            migration_id: migrationId,
            user: user,
            timestamp: now
        };

        gs.info(this.LOG_PREFIX + 'Acquired migration lock on ' + targetKey + ' for migration ' + migrationId);
        return { acquired: true };
    },

    /**
     * Releases migration lock.
     * @param {string} targetKey - Unique target key.
     * @param {string} migrationId - Migration ID.
     * @return {boolean} True if released.
     */
    releaseLock: function(targetKey, migrationId) {
        'use strict';
        if (this._activeLocks[targetKey] && this._activeLocks[targetKey].migration_id === migrationId) {
            delete this._activeLocks[targetKey];
            gs.info(this.LOG_PREFIX + 'Released migration lock on ' + targetKey);
            return true;
        }
        return false;
    },

    type: 'AppForgeMigrationLockManager'
};
