/**
 * AppForgeDeploymentLockManager
 * Manages environment-level deployment locks to prevent concurrent write operations.
 * Includes timeout recovery to ensure abandoned/crashed locks are safely expired.
 */
var AppForgeDeploymentLockManager = Class.create();
AppForgeDeploymentLockManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeDeploymentLockManager] ';
        this.LOCK_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
        this._activeLocks = {};
    },

    /**
     * Attempts to acquire an exclusive deployment lock for a target environment.
     * @param {string} envId - Environment identifier (e.g. DEV, TEST, UAT, PRODUCTION).
     * @param {string} runId - Deployment run ID.
     * @param {string} user - Requesting user.
     * @return {Object} { acquired: boolean, error: string }
     */
    acquireLock: function(envId, runId, user) {
        'use strict';
        var now = new Date().getTime();
        var currentLock = this._activeLocks[envId];

        if (currentLock) {
            // Check if lock expired
            if (now - currentLock.timestamp > this.LOCK_TIMEOUT_MS) {
                gs.warn(this.LOG_PREFIX + 'Expired lock for environment ' + envId + ' cleared.');
            } else if (currentLock.run_id !== runId) {
                return {
                    acquired: false,
                    error: 'DEPLOYMENT_BLOCKED: TARGET_ALREADY_LOCKED. Environment ' + envId + ' is currently locked by run ' + currentLock.run_id + ' (' + currentLock.user + ').'
                };
            }
        }

        this._activeLocks[envId] = {
            run_id: runId,
            user: user,
            timestamp: now
        };

        gs.info(this.LOG_PREFIX + 'Acquired deployment lock on ' + envId + ' for run ' + runId);
        return { acquired: true };
    },

    /**
     * Releases deployment lock for a target environment.
     * @param {string} envId - Environment identifier.
     * @param {string} runId - Deployment run ID.
     * @return {boolean} True if released, false otherwise.
     */
    releaseLock: function(envId, runId) {
        'use strict';
        if (this._activeLocks[envId] && this._activeLocks[envId].run_id === runId) {
            delete this._activeLocks[envId];
            gs.info(this.LOG_PREFIX + 'Released deployment lock on ' + envId + ' for run ' + runId);
            return true;
        }
        return false;
    },

    /**
     * Checks if environment is locked.
     * @param {string} envId - Environment identifier.
     * @return {boolean} True if locked, false otherwise.
     */
    isLocked: function(envId) {
        'use strict';
        var lock = this._activeLocks[envId];
        if (!lock) return false;
        var now = new Date().getTime();
        return (now - lock.timestamp) <= this.LOCK_TIMEOUT_MS;
    },

    type: 'AppForgeDeploymentLockManager'
};
