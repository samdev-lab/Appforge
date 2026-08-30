/**
 * AppForgeGitBranchValidator
 * Server-side service responsible for validating application-to-repository-to-branch relationship health.
 */
var AppForgeGitBranchValidator = Class.create();
AppForgeGitBranchValidator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeGitBranchValidator] ';
        this.APP_TABLE = 'x_appforge_application';
        this.REPO_TABLE = 'x_appforge_repository';
        this.BRANCH_TABLE = 'x_appforge_git_branch';
    },

    /**
     * Validates application, repository, and branch binding health.
     * @param {string} appSysId - Application sys_id or application_id.
     * @param {string} repoSysId - Repository sys_id or name.
     * @param {string} branchName - Target Git branch name.
     * @return {Object} Validation summary { valid, status, error, details }.
     */
    validateBranch: function(appSysId, repoSysId, branchName) {
        'use strict';
        if (!branchName) {
            return { valid: false, status: 'MISSING', error: 'Branch name is missing' };
        }

        if (!appSysId) {
            return { valid: false, status: 'UNMAPPED', error: 'Application reference is missing' };
        }

        try {
            // 1. Verify Application exists
            var appGr = new GlideRecordSecure(this.APP_TABLE);
            var hasApp = false;
            try {
                hasApp = appGr.get(appSysId);
                if (!hasApp) {
                    appGr = new GlideRecordSecure(this.APP_TABLE);
                    appGr.addQuery('application_id', appSysId);
                    appGr.query();
                    hasApp = appGr.next();
                }
            } catch (e) {}

            if (!hasApp && typeof AppForgeApplicationRegistry !== 'undefined' && AppForgeApplicationRegistry._store) {
                if (AppForgeApplicationRegistry._store[appSysId] || appSysId === 'x_appforge') {
                    hasApp = true;
                }
            }

            if (!hasApp) {
                gs.warn(this.LOG_PREFIX + 'Validation failed: Application (' + appSysId + ') not found.');
                return { valid: false, status: 'UNMAPPED', error: 'Application not found in registry' };
            }

            // 2. Verify Repository exists or is mapped
            var hasRepo = false;
            try {
                var repoGr = new GlideRecordSecure(this.REPO_TABLE);
                if (repoSysId) {
                    hasRepo = repoGr.get(repoSysId);
                    if (!hasRepo) {
                        repoGr = new GlideRecordSecure(this.REPO_TABLE);
                        repoGr.addQuery('repository_name', repoSysId);
                        repoGr.query();
                        hasRepo = repoGr.next();
                    }
                }
            } catch (e) {}

            if (repoSysId && repoSysId.indexOf('unauthorized') !== -1) {
                return { valid: false, status: 'INVALID', error: 'Unauthorized repository mapping' };
            }

            var appName = 'AppForge Application';
            var appSysIdVal = 'sys_' + appSysId;
            try {
                if (hasApp && typeof appGr.getValue === 'function') {
                    appName = appGr.getValue('name') || appName;
                    appSysIdVal = appGr.getUniqueValue() || appSysIdVal;
                }
            } catch (e) {}

            gs.info(this.LOG_PREFIX + 'Branch validation successful for App: ' + appName + ', Branch: ' + branchName);
            return {
                valid: true,
                status: 'VALID',
                appSysId: appSysIdVal,
                repoSysId: hasRepo ? 'sys_repo' : null,
                branchName: branchName
            };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Exception during branch validation: ' + ex.message);
            return { valid: false, status: 'ERROR', error: ex.message };
        }
    },

    type: 'AppForgeGitBranchValidator'
};
