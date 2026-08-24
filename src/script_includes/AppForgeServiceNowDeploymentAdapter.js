/**
 * AppForgeServiceNowDeploymentAdapter
 * Standardized ServiceNow deployment adapter executing governed package installations,
 * instance validation, mutex locking, post-deployment smoke tests, and audit logging.
 */
var AppForgeServiceNowDeploymentAdapter = Class.create();
AppForgeServiceNowDeploymentAdapter.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeServiceNowDeploymentAdapter] ';
        this.envRegistry = new AppForgeEnvironmentRegistry();
        this.lockManager = new AppForgeDeploymentLockManager();
        this.asymSigner = new AppForgeAsymmetricSigner();
        this.factoryExecutor = new AppForgeFactoryExecutor();
        this.smokeTest = new AppForgeDeploymentSmokeTest();
    },

    /**
     * Executes deployment to a target environment.
     * @param {string} targetEnvId - DEV, TEST, PROD.
     * @param {Object} signedPackage - Signed package manifest with payload.
     * @param {string} runId - Deployment run identifier.
     * @param {string} actor - Deployer username.
     * @return {Object} Deployment result descriptor.
     */
    deploy: function(targetEnvId, signedPackage, runId, actor) {
        'use strict';
        var t0 = new Date().getTime();
        var envId = (targetEnvId || 'DEV').toUpperCase();
        var rId = runId || ('dep_run_' + new Date().getTime());
        var user = actor || 'deployer';

        // 1. Environment validation
        var env = this.envRegistry.getEnvironment(envId);
        if (!env) {
            return { success: false, status: 'ENVIRONMENT_NOT_FOUND', error: 'Target environment ' + envId + ' not found.' };
        }

        // 2. Package verification
        var verifyRes = this.asymSigner.verifyPackage(signedPackage);
        if (!verifyRes.valid) {
            return { success: false, status: 'PACKAGE_VERIFICATION_FAILED', error: verifyRes.reason || 'Package signature invalid.' };
        }

        // 3. Mutex Lock acquisition
        var lockRes = this.lockManager.acquireLock(envId, rId, user);
        if (!lockRes.acquired) {
            return { success: false, status: 'DEPLOYMENT_LOCKED', error: lockRes.error };
        }

        try {
            // 4. Execute application compilation
            var appDef = (signedPackage.payload && signedPackage.payload.definition) ? signedPackage.payload.definition : (signedPackage.payload || signedPackage);
            var execRes = this.factoryExecutor.execute(appDef, user);

            if (!execRes.success) {
                throw new Error('Factory execution failed: ' + (execRes.error || 'Metadata compilation error'));
            }

            // 5. Post-deployment smoke test
            var smokeRes = this.smokeTest.runSmokeTests(appDef.application ? appDef.application.name : 'DeployedApp');

            // 6. Record successful deployment in Environment Registry
            this.envRegistry.recordDeployment(envId, signedPackage.payload ? signedPackage.payload.version : '1.0.0', rId, 'SUCCESS');

            // 7. Release Mutex Lock
            this.lockManager.releaseLock(envId, rId);

            var t1 = new Date().getTime();
            gs.info(this.LOG_PREFIX + 'Deployment ' + rId + ' to ' + envId + ' COMPLETED successfully in ' + (t1 - t0) + 'ms');

            return {
                success: true,
                status: 'DEPLOYED_SUCCESSFULLY',
                environment: envId,
                run_id: rId,
                version: signedPackage.payload ? signedPackage.payload.version : '1.0.0',
                smoke_tests_passed: smokeRes.passed,
                correlation_id: 'AF-DEPLOY-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000),
                duration_ms: t1 - t0
            };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Deployment ' + rId + ' failed: ' + ex.message + '. Releasing mutex lock.');
            this.lockManager.releaseLock(envId, rId);
            this.envRegistry.recordDeployment(envId, signedPackage.payload ? signedPackage.payload.version : '1.0.0', rId, 'FAILED');

            return {
                success: false,
                status: 'DEPLOYMENT_FAILED',
                environment: envId,
                run_id: rId,
                error: ex.message
            };
        }
    },

    type: 'AppForgeServiceNowDeploymentAdapter'
};
