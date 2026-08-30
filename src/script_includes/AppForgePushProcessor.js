/**
 * AppForgePushProcessor
 * Dedicated processor for GitHub 'push' webhook events.
 */
var AppForgePushProcessor = Class.create();
AppForgePushProcessor.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePushProcessor] ';
    },

    /**
     * Processes push event payload and updates x_appforge_git_event record fields.
     * @param {Object} eventRecordGr - GlideRecord of x_appforge_git_event.
     * @param {Object} payload - Parsed JSON webhook payload.
     * @return {Object} Processing status result.
     */
    process: function(eventRecordGr, payload) {
        'use strict';
        if (!payload) {
            return { success: false, error: 'Invalid payload for push processing' };
        }

        try {
            var ref = payload.ref || '';
            var branch = ref.replace('refs/heads/', '');
            var commitSha = payload.after || (payload.head_commit ? payload.head_commit.id : '');
            var prevSha = payload.before || '';
            
            var headCommit = payload.head_commit || (payload.commits && payload.commits.length > 0 ? payload.commits[0] : {});
            var commitMsg = headCommit.message || '';
            var authorName = headCommit.author ? (headCommit.author.name || headCommit.author.email) : '';
            var pusherName = payload.pusher ? payload.pusher.name : (payload.sender ? payload.sender.login : '');

            try {
                if (eventRecordGr && typeof eventRecordGr.setValue === 'function') {
                    eventRecordGr.setValue('branch', branch);
                    eventRecordGr.setValue('commit_sha', commitSha);
                    eventRecordGr.setValue('previous_commit_sha', prevSha);
                    eventRecordGr.setValue('commit_message', commitMsg);
                    eventRecordGr.setValue('author', authorName);
                    eventRecordGr.setValue('github_username', pusherName);
                    eventRecordGr.setValue('action', 'push');
                }
            } catch (e) {}

            gs.info(this.LOG_PREFIX + 'Processed push event. Branch: ' + branch + ', Commit: ' + commitSha + ', Author: ' + authorName);
            return { success: true, branch: branch, commitSha: commitSha };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error processing push event: ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    type: 'AppForgePushProcessor'
};
