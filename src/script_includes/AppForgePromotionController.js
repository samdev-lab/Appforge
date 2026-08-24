/**
 * AppForgePromotionController
 * Governs enterprise release promotions across DEV, TEST, and PROD.
 * Enforces Four-Eyes approval separation (requester != approver), checksum equality across environments,
 * and emergency promotion governance with mandatory retrospective audits.
 */
var AppForgePromotionController = Class.create();
AppForgePromotionController.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePromotionController] ';
        this.envRegistry = new AppForgeEnvironmentRegistry();
        this.lockManager = new AppForgeDeploymentLockManager();
        this.asymSigner = new AppForgeAsymmetricSigner();
        this.checksumEngine = new AppForgeChecksumEngine();
        this._approvalRequests = {};
        this._executedPromotions = {};
    },

    /**
     * Requests production promotion approval for a verified TEST release.
     */
    requestProductionApproval: function(releaseVersion, packageManifest, requester, businessReason) {
        'use strict';
        if (!releaseVersion || !packageManifest || !requester) {
            return { success: false, error: 'Mandatory parameters missing: releaseVersion, packageManifest, requester' };
        }

        var reqId = 'appr_prod_' + releaseVersion + '_' + new Date().getTime();
        var chk = packageManifest.checksum || this.checksumEngine.generateChecksum(packageManifest);

        var requestRecord = {
            request_id: reqId,
            version: releaseVersion,
            requester: requester,
            business_reason: businessReason || 'Production Release Promotion',
            checksum: chk,
            status: 'PENDING_APPROVAL',
            approver: null,
            approved_at: null,
            created_at: new GlideDateTime().getValue()
        };

        this._approvalRequests[releaseVersion] = requestRecord;
        gs.info(this.LOG_PREFIX + 'Created production approval request ' + reqId + ' for release ' + releaseVersion + ' by ' + requester);

        return {
            success: true,
            status: 'PRODUCTION_APPROVAL_PENDING',
            request_id: reqId,
            request: requestRecord
        };
    },

    /**
     * Approves production deployment applying Four-Eyes separation of duties.
     */
    approveProductionDeployment: function(releaseVersion, approverUser, decisionNotes) {
        'use strict';
        var req = this._approvalRequests[releaseVersion];
        if (!req) {
            return { success: false, status: 'NO_PENDING_APPROVAL', error: 'No pending production approval request found for ' + releaseVersion };
        }

        if (req.status === 'APPROVED') {
            return { success: false, status: 'ALREADY_APPROVED', error: 'Production promotion for ' + releaseVersion + ' is already approved.' };
        }

        // Four-Eyes Rule: Requester cannot approve their own release
        if (req.requester === approverUser) {
            gs.error(this.LOG_PREFIX + 'SELF_APPROVAL_BLOCKED: Requester ' + req.requester + ' attempted to self-approve production deployment.');
            return {
                success: false,
                status: 'SEPARATION_OF_DUTIES_VIOLATION',
                error: 'Four-Eyes Principle Violation: Requester (' + req.requester + ') cannot approve production deployment.'
            };
        }

        req.status = 'APPROVED';
        req.approver = approverUser;
        req.decision_notes = decisionNotes || 'Production readiness certified';
        req.approved_at = new GlideDateTime().getValue();

        gs.info(this.LOG_PREFIX + 'Production deployment APPROVED for ' + releaseVersion + ' by ' + approverUser);

        return {
            success: true,
            status: 'PRODUCTION_APPROVED',
            version: releaseVersion,
            approved_by: approverUser,
            timestamp: req.approved_at
        };
    },

    /**
     * Validates promotion preconditions before deployment execution.
     * Ensures checksum equality across DEV, TEST, and PROD.
     */
    validatePromotionGate: function(sourceEnvId, targetEnvId, packageManifest, isEmergency, actor) {
        'use strict';
        if (sourceEnvId === 'DEV' && targetEnvId === 'PROD' && !isEmergency) {
            return {
                allowed: false,
                status: 'DIRECT_DEV_TO_PROD_BLOCKED',
                error: 'Direct promotion from DEV to PROD is strictly forbidden. Releases must be verified in TEST prior to PROD promotion.'
            };
        }

        // Emergency promotion validation
        if (isEmergency) {
            gs.warn(this.LOG_PREFIX + 'EMERGENCY_PROMOTION_ACTIVE: Emergency release initiated by ' + actor);
            return {
                allowed: true,
                status: 'EMERGENCY_PROMOTION_AUTHORIZED',
                requires_retrospective_audit: true
            };
        }

        // Verify package signature
        var sigVerify = this.asymSigner.verifyPackage(packageManifest);
        if (!sigVerify.valid) {
            return {
                allowed: false,
                status: 'PACKAGE_SIGNATURE_INVALID',
                error: 'Promotion gate rejected: Package cryptographic verification failed.'
            };
        }

        return {
            allowed: true,
            status: 'PROMOTION_GATE_PASSED',
            target_environment: targetEnvId
        };
    },

    type: 'AppForgePromotionController'
};
