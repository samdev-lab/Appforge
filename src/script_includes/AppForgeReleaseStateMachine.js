/**
 * AppForgeReleaseStateMachine
 * Manages the formal lifecycle state transitions and cryptographic immutability of AppForge releases.
 *
 * States:
 *   DRAFT -> VALIDATING -> CERTIFIED -> RELEASE_CANDIDATE -> DEV_DEPLOYED -> DEV_VALIDATED
 *   -> TEST_DEPLOYED -> TEST_VALIDATED -> PRODUCTION_APPROVAL_PENDING -> PRODUCTION_APPROVED
 *   -> PRODUCTION_DEPLOYED -> PRODUCTION_VERIFIED
 *
 * Failure States:
 *   VALIDATION_FAILED, DEPLOYMENT_FAILED, ROLLBACK_REQUIRED, ROLLED_BACK, BLOCKED
 */
var AppForgeReleaseStateMachine = Class.create();
AppForgeReleaseStateMachine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeReleaseStateMachine] ';
        this.checksumEngine = new AppForgeChecksumEngine();
        this._releases = {};

        this.ALLOWED_TRANSITIONS = {
            'DRAFT': ['VALIDATING', 'BLOCKED'],
            'VALIDATING': ['CERTIFIED', 'VALIDATION_FAILED', 'BLOCKED'],
            'VALIDATION_FAILED': ['DRAFT', 'VALIDATING', 'BLOCKED'],
            'CERTIFIED': ['RELEASE_CANDIDATE', 'BLOCKED'],
            'RELEASE_CANDIDATE': ['DEV_DEPLOYED', 'DEPLOYMENT_FAILED', 'BLOCKED'],
            'DEV_DEPLOYED': ['DEV_VALIDATED', 'DEPLOYMENT_FAILED', 'ROLLBACK_REQUIRED'],
            'DEV_VALIDATED': ['TEST_DEPLOYED', 'DEPLOYMENT_FAILED', 'BLOCKED'],
            'TEST_DEPLOYED': ['TEST_VALIDATED', 'DEPLOYMENT_FAILED', 'ROLLBACK_REQUIRED'],
            'TEST_VALIDATED': ['PRODUCTION_APPROVAL_PENDING', 'BLOCKED'],
            'PRODUCTION_APPROVAL_PENDING': ['PRODUCTION_APPROVED', 'BLOCKED', 'TEST_VALIDATED'],
            'PRODUCTION_APPROVED': ['PRODUCTION_DEPLOYED', 'DEPLOYMENT_FAILED', 'BLOCKED'],
            'PRODUCTION_DEPLOYED': ['PRODUCTION_VERIFIED', 'DEPLOYMENT_FAILED', 'ROLLBACK_REQUIRED'],
            'PRODUCTION_VERIFIED': [], // Terminal success state
            'ROLLBACK_REQUIRED': ['ROLLED_BACK', 'DEPLOYMENT_FAILED'],
            'ROLLED_BACK': ['DRAFT', 'VALIDATING', 'BLOCKED'],
            'DEPLOYMENT_FAILED': ['ROLLBACK_REQUIRED', 'ROLLED_BACK', 'DRAFT', 'BLOCKED'],
            'BLOCKED': ['DRAFT', 'VALIDATING']
        };
    },

    /**
     * Creates a new release descriptor in DRAFT state.
     */
    createRelease: function(version, gitCommit, packageData, creator) {
        'use strict';
        if (!version || !gitCommit) {
            return { success: false, error: 'Mandatory parameters missing: version, gitCommit' };
        }

        if (this._releases[version]) {
            return { success: false, status: 'RELEASE_EXISTS', error: 'Release ' + version + ' already exists.' };
        }

        var pkg = packageData || {};
        var checksum = this.checksumEngine.generateChecksum(pkg);

        var releaseRecord = {
            version: version,
            git_commit: gitCommit,
            state: 'DRAFT',
            checksum: checksum,
            package_data: JSON.parse(JSON.stringify(pkg)),
            is_immutable: false,
            created_by: creator || 'release_engineer',
            created_at: new GlideDateTime().getValue(),
            updated_at: new GlideDateTime().getValue(),
            history: [{ state: 'DRAFT', actor: creator || 'release_engineer', timestamp: new GlideDateTime().getValue() }]
        };

        this._releases[version] = releaseRecord;
        gs.info(this.LOG_PREFIX + 'Created release ' + version + ' in DRAFT state (Commit: ' + gitCommit + ')');

        return {
            success: true,
            status: 'DRAFT',
            release: releaseRecord
        };
    },

    /**
     * Transitions a release to a new lifecycle state.
     */
    transitionState: function(version, targetState, actor, notes) {
        'use strict';
        var rel = this._releases[version];
        if (!rel) return { success: false, status: 'RELEASE_NOT_FOUND', error: 'Release ' + version + ' not found.' };

        var currentState = rel.state;
        var allowed = this.ALLOWED_TRANSITIONS[currentState] || [];

        if (allowed.indexOf(targetState) === -1) {
            gs.error(this.LOG_PREFIX + 'Invalid state transition for release ' + version + ': ' + currentState + ' -> ' + targetState);
            return {
                success: false,
                status: 'INVALID_STATE_TRANSITION',
                current_state: currentState,
                target_state: targetState,
                error: 'Transition from ' + currentState + ' to ' + targetState + ' is not permitted.'
            };
        }

        rel.state = targetState;
        rel.updated_at = new GlideDateTime().getValue();

        // Seal immutability when reaching CERTIFIED
        if (targetState === 'CERTIFIED') {
            rel.is_immutable = true;
            rel.sealed_checksum = rel.checksum;
            gs.info(this.LOG_PREFIX + 'Release ' + version + ' is now CERTIFIED and cryptographically SEALED (Immutable).');
        }

        rel.history.push({
            from_state: currentState,
            state: targetState,
            actor: actor || 'release_engineer',
            notes: notes || '',
            timestamp: new GlideDateTime().getValue()
        });

        return {
            success: true,
            status: targetState,
            version: version,
            previous_state: currentState,
            is_immutable: rel.is_immutable
        };
    },

    /**
     * Attempts to mutate release payload; blocked if release is CERTIFIED (immutable).
     */
    updateReleasePayload: function(version, newPayload, actor) {
        'use strict';
        var rel = this._releases[version];
        if (!rel) return { success: false, status: 'RELEASE_NOT_FOUND', error: 'Release not found.' };

        if (rel.is_immutable) {
            gs.error(this.LOG_PREFIX + 'IMMUTABILITY_VIOLATION: Attempted to mutate certified release ' + version);
            return {
                success: false,
                status: 'RELEASE_IMMUTABLE',
                error: 'Release ' + version + ' is certified and immutable. Mutating certified releases is forbidden. Create a new semver release.'
            };
        }

        rel.package_data = JSON.parse(JSON.stringify(newPayload));
        rel.checksum = this.checksumEngine.generateChecksum(newPayload);
        rel.updated_at = new GlideDateTime().getValue();

        return {
            success: true,
            status: 'UPDATED',
            version: version,
            new_checksum: rel.checksum
        };
    },

    /**
     * Retrieves release descriptor.
     */
    getRelease: function(version) {
        'use strict';
        return this._releases[version] || null;
    },

    type: 'AppForgeReleaseStateMachine'
};
