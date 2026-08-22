/**
 * AppForgeGitHubWebhookService
 * Responsible for webhook payload ingestion, mandatory idempotency verification (X-GitHub-Delivery),
 * and event record initialization in x_appforge_git_event.
 */
var AppForgeGitHubWebhookService = Class.create();
AppForgeGitHubWebhookService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeGitHubWebhookService] ';
        this.EVENT_TABLE = 'x_appforge_git_event';
    },

    /**
     * Ingests a GitHub Webhook event payload and enforces idempotency via delivery_id.
     * @param {Object} headers - Key-value map of HTTP headers.
     * @param {Object|string} payload - Webhook JSON payload object or raw JSON string.
     * @return {Object} Ingestion result object containing status code, message, and record sys_id.
     */
    ingestEvent: function(headers, payload) {
        'use strict';
        if (!headers) {
            return { success: false, statusCode: 400, message: 'Missing HTTP headers' };
        }

        var deliveryId = this._getHeaderValue(headers, 'X-GitHub-Delivery');
        var eventType = this._getHeaderValue(headers, 'X-GitHub-Event');

        if (!deliveryId) {
            gs.warn(this.LOG_PREFIX + 'Ingestion rejected: Missing X-GitHub-Delivery header.');
            return { success: false, statusCode: 400, message: 'Missing X-GitHub-Delivery header' };
        }

        if (!eventType) {
            gs.warn(this.LOG_PREFIX + 'Ingestion rejected: Missing X-GitHub-Event header.');
            return { success: false, statusCode: 400, message: 'Missing X-GitHub-Event header' };
        }

        var parsedPayload = payload;
        if (typeof payload === 'string') {
            try {
                parsedPayload = JSON.parse(payload);
            } catch (ex) {
                gs.error(this.LOG_PREFIX + 'Ingestion rejected: Invalid JSON payload body.');
                return { success: false, statusCode: 400, message: 'Malformed JSON payload' };
            }
        }

        // Mandatory Idempotency Check
        var existingEvent = this.findEventByDeliveryId(deliveryId);
        if (existingEvent) {
            gs.info(this.LOG_PREFIX + 'Idempotency check: Duplicate delivery detected for X-GitHub-Delivery: ' + deliveryId);
            return {
                success: true,
                isDuplicate: true,
                statusCode: 200,
                message: 'Event delivery already processed (Idempotent skip)',
                deliveryId: deliveryId,
                eventSysId: existingEvent.sys_id,
                status: existingEvent.status
            };
        }

        // Create new Git Event record with status RECEIVED
        try {
            var gr = new GlideRecordSecure(this.EVENT_TABLE);
            gr.initialize();
            gr.setValue('delivery_id', deliveryId);
            gr.setValue('event_type', eventType);
            gr.setValue('status', 'RECEIVED');
            gr.setValue('received_at', new GlideDateTime().getValue());
            gr.setValue('payload', typeof payload === 'string' ? payload : JSON.stringify(payload));
            
            // Extract basic repository metadata if present
            if (parsedPayload.repository) {
                gr.setValue('repository_id', String(parsedPayload.repository.id || ''));
                gr.setValue('repository_name', parsedPayload.repository.full_name || parsedPayload.repository.name || '');
                gr.setValue('repository_url', parsedPayload.repository.html_url || '');
            }

            var newSysId = gr.insert();
            if (newSysId) {
                gs.info(this.LOG_PREFIX + 'Git event persisted successfully. Delivery ID: ' + deliveryId + ', Sys ID: ' + newSysId);
                return {
                    success: true,
                    isDuplicate: false,
                    statusCode: 200,
                    message: 'Event received and persisted',
                    deliveryId: deliveryId,
                    eventType: eventType,
                    eventSysId: newSysId,
                    payload: parsedPayload
                };
            } else {
                gs.error(this.LOG_PREFIX + 'Failed to persist git event record.');
                return { success: false, statusCode: 500, message: 'Database failure during event persistence' };
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Exception persisting event record: ' + ex.message);
            return { success: false, statusCode: 500, message: 'Internal server error during event persistence' };
        }
    },

    /**
     * Looks up existing event record by delivery_id.
     * @param {string} deliveryId - X-GitHub-Delivery header value.
     * @return {Object|null} Record metadata or null if not found.
     */
    findEventByDeliveryId: function(deliveryId) {
        'use strict';
        if (!deliveryId) return null;

        try {
            var gr = new GlideRecordSecure(this.EVENT_TABLE);
            gr.addQuery('delivery_id', deliveryId);
            gr.query();
            if (gr.next()) {
                return {
                    sys_id: gr.getUniqueValue(),
                    delivery_id: gr.getValue('delivery_id'),
                    status: gr.getValue('status'),
                    event_type: gr.getValue('event_type')
                };
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error looking up delivery_id: ' + ex.message);
        }
        return null;
    },

    /**
     * Case-insensitive header value lookup helper.
     * @private
     */
    _getHeaderValue: function(headers, headerName) {
        'use strict';
        if (!headers || !headerName) return null;
        var targetKey = headerName.toLowerCase();
        for (var key in headers) {
            if (headers.hasOwnProperty(key) && key.toLowerCase() === targetKey) {
                return headers[key];
            }
        }
        return null;
    },

    type: 'AppForgeGitHubWebhookService'
};
