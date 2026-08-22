/**
 * AppForgeWorkflowProcessor
 * Dedicated processor for GitHub 'workflow_run' webhook events.
 * Prepares workflow run status tracking without executing automated deployments.
 */
var AppForgeWorkflowProcessor = Class.create();
AppForgeWorkflowProcessor.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeWorkflowProcessor] ';
    },

    /**
     * Processes workflow_run event payload.
     * @param {Object} eventRecordGr - GlideRecord of x_appforge_git_event.
     * @param {Object} payload - Parsed JSON webhook payload.
     * @return {Object} Processing status result.
     */
    process: function(eventRecordGr, payload) {
        'use strict';
        if (!eventRecordGr || !payload) {
            return { success: false, error: 'Invalid record or payload for workflow processing' };
        }

        try {
            var workflowRun = payload.workflow_run || {};
            var action = payload.action || '';
            var name = workflowRun.name || '';
            var status = workflowRun.status || '';
            var conclusion = workflowRun.conclusion || '';
            var branch = workflowRun.head_branch || '';
            var commitSha = workflowRun.head_sha || '';
            var actor = workflowRun.actor ? workflowRun.actor.login : '';

            eventRecordGr.setValue('action', action + ' (' + status + '/' + conclusion + ')');
            eventRecordGr.setValue('branch', branch);
            eventRecordGr.setValue('commit_sha', commitSha);
            eventRecordGr.setValue('author', actor);
            eventRecordGr.setValue('github_username', actor);
            eventRecordGr.setValue('commit_message', 'Workflow Run: ' + name + ' [' + status + ' - ' + conclusion + ']');

            gs.info(this.LOG_PREFIX + 'Processed workflow_run event. Workflow: ' + name + ', Status: ' + status + ', Conclusion: ' + conclusion + '. Deployment NOT triggered (Scope Rule).');
            return { success: true, workflowName: name, status: status, conclusion: conclusion };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error processing workflow_run event: ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    type: 'AppForgeWorkflowProcessor'
};
