/**
 * AppForgeConcurrencyManager
 * Manages optimistic locking, multi-developer edit conflict detection,
 * deployment mutex race resolution, replay & unauthorized downgrade protection,
 * and API idempotency verification.
 */
var AppForgeConcurrencyManager = Class.create();
AppForgeConcurrencyManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeConcurrencyManager] ';
        this.lockManager = new AppForgeDeploymentLockManager();
        this._idempotencyCache = {};
        this._approvalRegistry = {};
    },

    /**
     * Resolves concurrent edits to an application definition.
     * @param {string} appId - Application ID.
     * @param {number} baseRevision - Client's base revision number.
     * @param {number} currentRevision - Database's current revision number.
     * @param {Object} updatedDef - New application definition.
     * @param {string} actor - User attempting update.
     * @return {Object} { success: boolean, status: string, error?: string, current_revision?: number }
     */
    resolveConcurrentEdit: function(appId, baseRevision, currentRevision, updatedDef, actor) {
        'use strict';
        if (baseRevision !== currentRevision) {
            return {
                success: false,
                status: 'CONFLICT_DETECTED',
                error: 'Concurrent modification detected. Client base revision (' + baseRevision + ') is behind current platform revision (' + currentRevision + '). Refresh required.',
                app_id: appId,
                current_revision: currentRevision,
                actor: actor
            };
        }

        return {
            success: true,
            status: 'UPDATE_COMMITTED',
            app_id: appId,
            new_revision: currentRevision + 1,
            actor: actor
        };
    },

    /**
     * Verifies replay and unauthorized downgrade protection.
     * Prevents deploying an older version over a newer version unless explicitly marked as an authorized rollback.
     * @param {string} targetEnv - Target environment ('TEST', 'PRODUCTION').
     * @param {string} currentDeployedVersion - Currently active deployed version ('2.0.0').
     * @param {string} incomingVersion - Version attempting deployment ('1.0.0').
     * @param {boolean} isAuthorizedRollback - Whether this run is an explicit, approved rollback.
     * @return {Object} { allowed: boolean, status: string, reason?: string }
     */
    verifyDowngradeProtection: function(targetEnv, currentDeployedVersion, incomingVersion, isAuthorizedRollback) {
        'use strict';
        if (!currentDeployedVersion || !incomingVersion) {
            return { allowed: true, status: 'ALLOWED' };
        }

        var currParts = currentDeployedVersion.replace(/^v/, '').split('.').map(Number);
        var inParts = incomingVersion.replace(/^v/, '').split('.').map(Number);

        var isDowngrade = false;
        if (inParts[0] < currParts[0]) isDowngrade = true;
        else if (inParts[0] === currParts[0] && inParts[1] < currParts[1]) isDowngrade = true;
        else if (inParts[0] === currParts[0] && inParts[1] === currParts[1] && inParts[2] < currParts[2]) isDowngrade = true;

        if (isDowngrade && !isAuthorizedRollback) {
            return {
                allowed: false,
                status: 'DOWNGRADE_BLOCKED',
                reason: 'Unauthorized downgrade attempt: Cannot deploy version ' + incomingVersion + ' over current version ' + currentDeployedVersion + ' without an authorized rollback ticket.'
            };
        }

        return {
            allowed: true,
            status: isDowngrade ? 'AUTHORIZED_ROLLBACK_ALLOWED' : 'PROMOTION_ALLOWED'
        };
    },

    /**
     * Ensures deterministic single-winner deployment approval.
     */
    processApproval: function(deploymentId, approverUser, decision) {
        'use strict';
        if (this._approvalRegistry[deploymentId]) {
            return {
                success: false,
                status: 'ALREADY_PROCESSED',
                error: 'Deployment approval has already been recorded by ' + this._approvalRegistry[deploymentId].approver,
                existing_approval: this._approvalRegistry[deploymentId]
            };
        }

        this._approvalRegistry[deploymentId] = {
            deployment_id: deploymentId,
            approver: approverUser,
            decision: decision || 'APPROVED',
            timestamp: new GlideDateTime().getValue()
        };

        return {
            success: true,
            status: 'APPROVAL_RECORDED',
            deployment_id: deploymentId,
            approver: approverUser
        };
    },

    /**
     * Enforces idempotency for API requests.
     */
    checkIdempotencyKey: function(idempotencyKey, requestPayload) {
        'use strict';
        if (!idempotencyKey) {
            return { isDuplicate: false, status: 'NO_KEY' };
        }

        if (this._idempotencyCache[idempotencyKey]) {
            return {
                isDuplicate: true,
                status: 'IDEMPOTENT_REPLAY',
                cached_response: this._idempotencyCache[idempotencyKey].response
            };
        }

        return { isDuplicate: false, status: 'NEW_REQUEST' };
    },

    recordIdempotentResponse: function(idempotencyKey, responseData) {
        'use strict';
        if (idempotencyKey) {
            this._idempotencyCache[idempotencyKey] = {
                response: responseData,
                timestamp: new GlideDateTime().getValue()
            };
        }
    },

    type: 'AppForgeConcurrencyManager'
};
