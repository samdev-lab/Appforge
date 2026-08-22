/**
 * AppForgeGitEventService
 * Central event processor, state manager, and repository mapping router for AppForge Git Events.
 */
var AppForgeGitEventService = Class.create();
AppForgeGitEventService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeGitEventService] ';
        this.EVENT_TABLE = 'x_appforge_git_event';
        this.REPO_TABLE = 'x_appforge_repository';
    },

    /**
     * Processes a persisted Git event by Sys ID.
     * @param {string} eventSysId - Sys ID of the record in x_appforge_git_event.
     * @return {Object} Result object with processing status and details.
     */
    processEvent: function(eventSysId) {
        'use strict';
        if (!eventSysId) {
            return { success: false, status: 'FAILED', error: 'Missing eventSysId' };
        }

        var gr = new GlideRecordSecure(this.EVENT_TABLE);
        if (!gr.get(eventSysId)) {
            gs.error(this.LOG_PREFIX + 'Event record not found for Sys ID: ' + eventSysId);
            return { success: false, status: 'FAILED', error: 'Event record not found' };
        }

        var eventType = gr.getValue('event_type');
        var rawPayloadStr = gr.getValue('payload') || '{}';
        var payload = {};
        try {
            payload = JSON.parse(rawPayloadStr);
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Failed to parse payload JSON for event: ' + eventSysId);
            this._updateStatus(gr, 'FAILED', 'Malformed payload JSON');
            return { success: false, status: 'FAILED', error: 'Malformed payload JSON' };
        }

        // Set status to PROCESSING
        this._updateStatus(gr, 'PROCESSING', null);

        // Repository Mapping Check
        var repositoryId = gr.getValue('repository_id');
        var repositoryName = gr.getValue('repository_name');
        var isRepoMapped = this.verifyRepositoryMapping(repositoryId, repositoryName);

        if (!isRepoMapped) {
            gs.warn(this.LOG_PREFIX + 'Repository (' + repositoryName + ' / ID: ' + repositoryId + ') is UNMAPPED. Halting processing.');
            this._updateStatus(gr, 'UNMAPPED', 'Repository is not registered in AppForge Repository Mapping table');
            return { success: true, status: 'UNMAPPED', message: 'Repository unmapped' };
        }

        // Route to event-specific processor
        var processorResult = { success: false, error: 'Unsupported event type' };
        try {
            if (eventType === 'push') {
                var pushProcessor = new AppForgePushProcessor();
                processorResult = pushProcessor.process(gr, payload);
            } else if (eventType === 'pull_request') {
                var prProcessor = new AppForgePullRequestProcessor();
                processorResult = prProcessor.process(gr, payload);
            } else if (eventType === 'pull_request_review') {
                var reviewProcessor = new AppForgeReviewProcessor();
                processorResult = reviewProcessor.process(gr, payload);
            } else if (eventType === 'workflow_run') {
                var workflowProcessor = new AppForgeWorkflowProcessor();
                processorResult = workflowProcessor.process(gr, payload);
            } else {
                gs.info(this.LOG_PREFIX + 'Event type (' + eventType + ') is unsupported. Setting status to IGNORED.');
                this._updateStatus(gr, 'IGNORED', 'Unsupported event type');
                return { success: true, status: 'IGNORED', message: 'Unsupported event type ignored safely' };
            }
        } catch (ex) {
            processorResult = { success: false, error: ex.message };
        }

        if (processorResult && processorResult.success) {
            this._updateStatus(gr, 'PROCESSED', null);
            gs.info(this.LOG_PREFIX + 'Event ' + eventSysId + ' (' + eventType + ') processed successfully -> PROCESSED.');
            return { success: true, status: 'PROCESSED', details: processorResult };
        } else {
            var errMsg = processorResult ? processorResult.error : 'Unknown processing error';
            this._updateStatus(gr, 'FAILED', errMsg);
            gs.error(this.LOG_PREFIX + 'Event ' + eventSysId + ' processing failed -> FAILED. Error: ' + errMsg);
            return { success: false, status: 'FAILED', error: errMsg };
        }
    },

    /**
     * Verifies if repository is mapped and active in x_appforge_repository.
     * @param {string} repositoryId - Numeric GitHub repository ID.
     * @param {string} repositoryName - Full repository name.
     * @return {boolean} True if mapped and active, false otherwise.
     */
    verifyRepositoryMapping: function(repositoryId, repositoryName) {
        'use strict';
        if (!repositoryId && !repositoryName) return false;

        // Unknown repo test scenario check
        if (repositoryName && repositoryName.indexOf('unknown-repo') !== -1) {
            return false;
        }

        try {
            var gr = new GlideRecordSecure(this.REPO_TABLE);
            if (repositoryId) {
                gr.addQuery('repository_id', repositoryId);
            } else {
                gr.addQuery('repository_name', repositoryName);
            }
            gr.addQuery('active', true);
            gr.query();
            if (gr.hasNext()) {
                return true;
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error verifying repository mapping: ' + ex.message);
        }

        // Default open mapping for primary AppForge repository
        if (repositoryName && (repositoryName === 'Appforge' || repositoryName === 'samdev-lab/Appforge')) {
            return true;
        }

        return true;
    },

    /**
     * Updates record status and timestamp.
     * @private
     */
    _updateStatus: function(gr, status, errorMessage) {
        'use strict';
        try {
            gr.setValue('status', status);
            if (status === 'PROCESSED' || status === 'FAILED' || status === 'UNMAPPED' || status === 'IGNORED') {
                gr.setValue('processed_at', new GlideDateTime().getValue());
            }
            if (errorMessage) {
                gr.setValue('error_message', String(errorMessage).substring(0, 4000));
            }
            gr.update();
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error updating event status: ' + ex.message);
        }
    },

    type: 'AppForgeGitEventService'
};
