/**
 * AppForgeEnvironmentRegistry
 * Formalizes and manages enterprise deployment targets across DEV, TEST, and PROD.
 * Enforces environment channels, instance verification, and active deployment lock tracking.
 */
var AppForgeEnvironmentRegistry = Class.create();
AppForgeEnvironmentRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeEnvironmentRegistry] ';
        this._environments = this._initDefaultEnvironments();
    },

    _initDefaultEnvironments: function() {
        'use strict';
        return {
            'DEV': {
                environment_id: 'DEV',
                name: 'Development Environment',
                instance_url: 'https://dev280961.service-now.com',
                ServiceNow_release: 'WashingtonDC',
                tenant: 'PLATFORM_DEFAULT',
                status: 'ONLINE',
                allowed_release_channel: ['DRAFT', 'VALIDATING', 'CERTIFIED', 'RELEASE_CANDIDATE'],
                deployment_lock: null,
                last_deployment: null,
                last_verified_release: 'v0.18.0'
            },
            'TEST': {
                environment_id: 'TEST',
                name: 'Quality Assurance & Staging Environment',
                instance_url: 'https://test-dev280961.service-now.com',
                ServiceNow_release: 'WashingtonDC',
                tenant: 'PLATFORM_DEFAULT',
                status: 'ONLINE',
                allowed_release_channel: ['CERTIFIED', 'RELEASE_CANDIDATE', 'DEV_VALIDATED'],
                deployment_lock: null,
                last_deployment: null,
                last_verified_release: 'v0.18.0'
            },
            'PROD': {
                environment_id: 'PROD',
                name: 'Production Enterprise Runtime',
                instance_url: 'https://prod-dev280961.service-now.com',
                ServiceNow_release: 'WashingtonDC',
                tenant: 'PLATFORM_DEFAULT',
                status: 'ONLINE',
                allowed_release_channel: ['PRODUCTION_APPROVED', 'EMERGENCY_APPROVED'],
                deployment_lock: null,
                last_deployment: null,
                last_verified_release: 'v0.18.0'
            }
        };
    },

    /**
     * Retrieves an environment descriptor.
     */
    getEnvironment: function(envId) {
        'use strict';
        var id = (envId || '').toUpperCase();
        return this._environments[id] || null;
    },

    /**
     * Validates whether a release state is permitted to deploy to target environment.
     */
    validateDeploymentTarget: function(envId, releaseState) {
        'use strict';
        var env = this.getEnvironment(envId);
        if (!env) {
            return { allowed: false, status: 'ENVIRONMENT_NOT_FOUND', error: 'Target environment ' + envId + ' does not exist in registry.' };
        }

        if (env.status !== 'ONLINE') {
            return { allowed: false, status: 'ENVIRONMENT_UNAVAILABLE', error: 'Target environment ' + envId + ' is ' + env.status + '.' };
        }

        var allowedChannels = env.allowed_release_channel || [];
        if (allowedChannels.indexOf(releaseState) === -1) {
            gs.error(this.LOG_PREFIX + 'PROMOTION_BLOCKED: Release in state ' + releaseState + ' is not permitted on ' + envId);
            return {
                allowed: false,
                status: 'WRONG_ENVIRONMENT_CHANNEL',
                error: 'Promotion blocked: Environment ' + envId + ' requires release state in [' + allowedChannels.join(', ') + '], but got ' + releaseState + '.'
            };
        }

        return { allowed: true, status: 'TARGET_VERIFIED', environment: env };
    },

    /**
     * Updates environment runtime state after deployment.
     */
    recordDeployment: function(envId, releaseVersion, runId, status) {
        'use strict';
        var env = this.getEnvironment(envId);
        if (env) {
            env.last_deployment = {
                version: releaseVersion,
                run_id: runId,
                status: status,
                timestamp: new GlideDateTime().getValue()
            };
            if (status === 'SUCCESS') env.last_verified_release = releaseVersion;
        }
    },

    type: 'AppForgeEnvironmentRegistry'
};
