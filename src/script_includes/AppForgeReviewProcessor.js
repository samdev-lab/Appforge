/**
 * AppForgeReviewProcessor
 * Dedicated processor for GitHub 'pull_request_review' webhook events.
 */
var AppForgeReviewProcessor = Class.create();
AppForgeReviewProcessor.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeReviewProcessor] ';
    },

    /**
     * Processes pull_request_review event payload.
     * @param {Object} eventRecordGr - GlideRecord of x_appforge_git_event.
     * @param {Object} payload - Parsed JSON webhook payload.
     * @return {Object} Processing status result.
     */
    process: function(eventRecordGr, payload) {
        'use strict';
        if (!payload) {
            return { success: false, error: 'Invalid payload for PR review processing' };
        }

        try {
            var review = payload.review || {};
            var pr = payload.pull_request || {};
            var action = payload.action || '';
            var reviewer = review.user ? review.user.login : '';
            var reviewState = review.state || '';
            var prNumber = payload.number || pr.number || 0;
            var commitSha = review.commit_id || (pr.head ? pr.head.sha : '');

            try {
                if (eventRecordGr && typeof eventRecordGr.setValue === 'function') {
                    eventRecordGr.setValue('action', action + ' (' + reviewState + ')');
                    eventRecordGr.setValue('pull_request_number', prNumber);
                    eventRecordGr.setValue('pull_request_url', pr.html_url || '');
                    eventRecordGr.setValue('author', reviewer);
                    eventRecordGr.setValue('github_username', reviewer);
                    eventRecordGr.setValue('commit_sha', commitSha);
                    eventRecordGr.setValue('commit_message', 'PR Review (' + reviewState + ') by ' + reviewer);
                }
            } catch (e) {}

            gs.info(this.LOG_PREFIX + 'Processed pull_request_review event. Reviewer: ' + reviewer + ', State: ' + reviewState + ', PR #' + prNumber);
            return { success: true, reviewer: reviewer, reviewState: reviewState, prNumber: prNumber };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error processing PR review event: ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    type: 'AppForgeReviewProcessor'
};
