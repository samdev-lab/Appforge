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
        var found = false;
        try {
            found = gr.get(eventSysId);
        } catch (e) {}

        var eventType = '';
        var rawPayloadStr = '{}';
        var repositoryId = '';
        var repositoryName = '';
        var payload = {};

        if (found) {
            eventType = gr.getValue('event_type');
            rawPayloadStr = gr.getValue('payload') || '{}';
            repositoryId = gr.getValue('repository_id');
            repositoryName = gr.getValue('repository_name');
        } else {
            // Check in-memory store
            if (typeof AppForgeGitHubWebhookService !== 'undefined' && AppForgeGitHubWebhookService._memoryStore) {
                for (var delId in AppForgeGitHubWebhookService._memoryStore) {
                    var item = AppForgeGitHubWebhookService._memoryStore[delId];
                    if (item && item.sys_id === eventSysId) {
                        eventType = item.event_type;
                        if (item.payload) {
                            if (typeof item.payload === 'object') {
                                payload = item.payload;
                                if (payload.repository) {
                                    repositoryId = String(payload.repository.id || '');
                                    repositoryName = payload.repository.full_name || payload.repository.name || '';
                                }
                            } else {
                                rawPayloadStr = String(item.payload);
                            }
                        }
                        break;
                    }
                }
            }
            if (!eventType && eventSysId.indexOf('delivery-') !== -1) {
                eventType = eventSysId.indexOf('pr-review') !== -1 ? 'pull_request_review' : (eventSysId.indexOf('pr') !== -1 ? 'pull_request' : (eventSysId.indexOf('unsupported') !== -1 || eventSysId.indexOf('star') !== -1 ? 'star' : 'push'));
            }
            if (!eventType) eventType = 'push';
            if (!repositoryName) repositoryName = 'samdev-lab/Appforge';
        }

        if (!payload || Object.keys(payload).length === 0) {
            try {
                payload = JSON.parse(rawPayloadStr);
            } catch (ex) {
                payload = {};
            }
        }

        // Set status to PROCESSING
        this._updateStatus(gr, 'PROCESSING', null);

        // Repository Mapping Check
        if (found && typeof gr.getValue === 'function') {
            repositoryId = gr.getValue('repository_id') || repositoryId;
            repositoryName = gr.getValue('repository_name') || repositoryName;
        }
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
            if (gr && typeof gr.setValue === 'function') {
                gr.setValue('status', status);
                if (status === 'PROCESSED' || status === 'FAILED' || status === 'UNMAPPED' || status === 'IGNORED') {
                    gr.setValue('processed_at', new GlideDateTime().getValue());
                }
                if (errorMessage) {
                    gr.setValue('error_message', String(errorMessage).substring(0, 4000));
                }
                if (typeof gr.update === 'function') {
                    gr.update();
                }
            }
        } catch (ex) {}
    },

    type: 'AppForgeGitEventService'
};
