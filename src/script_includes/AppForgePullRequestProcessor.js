/**
 * AppForgePullRequestProcessor
 * Dedicated processor for GitHub 'pull_request' webhook events.
 */
var AppForgePullRequestProcessor = Class.create();
AppForgePullRequestProcessor.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePullRequestProcessor] ';
    },

    /**
     * Processes pull_request event payload and updates x_appforge_git_event record fields.
     * @param {Object} eventRecordGr - GlideRecord of x_appforge_git_event.
     * @param {Object} payload - Parsed JSON webhook payload.
     * @return {Object} Processing status result.
     */
    process: function(eventRecordGr, payload) {
        'use strict';
        if (!payload) {
            return { success: false, error: 'Invalid payload for PR processing' };
        }

        try {
            var pr = payload.pull_request || {};
            var action = payload.action || '';
            var prNumber = payload.number || pr.number || 0;
            var prUrl = pr.html_url || '';
            var sourceBranch = pr.head ? pr.head.ref : '';
            var targetBranch = pr.base ? pr.base.ref : '';
            var commitSha = pr.head ? pr.head.sha : '';
            var author = pr.user ? pr.user.login : '';
            var title = pr.title || '';

            try {
                if (eventRecordGr && typeof eventRecordGr.setValue === 'function') {
                    eventRecordGr.setValue('action', action);
                    eventRecordGr.setValue('pull_request_number', prNumber);
                    eventRecordGr.setValue('pull_request_url', prUrl);
                    eventRecordGr.setValue('source_branch', sourceBranch);
                    eventRecordGr.setValue('target_branch', targetBranch);
                    eventRecordGr.setValue('commit_sha', commitSha);
                    eventRecordGr.setValue('author', author);
                    eventRecordGr.setValue('github_username', author);
                    eventRecordGr.setValue('commit_message', 'PR #' + prNumber + ': ' + title);
                }
            } catch (e) {}

            gs.info(this.LOG_PREFIX + 'Processed pull_request event. Action: ' + action + ', PR #' + prNumber + ', Source: ' + sourceBranch + ' -> Target: ' + targetBranch);
            return { success: true, action: action, prNumber: prNumber, sourceBranch: sourceBranch, targetBranch: targetBranch };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error processing pull_request event: ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    type: 'AppForgePullRequestProcessor'
};
