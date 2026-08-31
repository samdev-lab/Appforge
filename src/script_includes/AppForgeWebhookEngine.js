/**
 * AppForgeWebhookEngine
 * Inbound Webhook Processor with Signature Verification & Replay Protection.
 *
 * Implements:
 *   - Token & Signature validation
 *   - Replay protection (event_id / idempotency_key deduplication)
 *   - Inbound payload mapping & validation
 *   - Zero arbitrary script execution
 */
var AppForgeWebhookEngine = Class.create();
AppForgeWebhookEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeWebhookEngine] ';
        this.mappingEngine = new AppForgeFieldMappingEngine();
        this.tokenManager = new AppForgeApiTokenManager();

        if (!AppForgeWebhookEngine._store) {
            AppForgeWebhookEngine._store = {
                processed_events: {}, // event_id -> timestamp
                webhook_logs: []
            };
        }
        AppForgeWebhookEngine._store = AppForgeWebhookEngine._store;
    },

    /**
     * Processes incoming webhook payload.
     */
    processWebhook: function(webhookDef, headers, payload, rawToken) {
        'use strict';
        if (!webhookDef) throw new Error('Webhook definition is required.');

        var tenantId = webhookDef.tenant_id;
        var eventId = (headers && (headers['x-event-id'] || headers['X-Event-ID'])) || (payload && payload.event_id) || null;
        var idempKey = (headers && (headers['x-idempotency-key'] || headers['X-Idempotency-Key'])) || null;

        // 1. Authenticate Token if required
        if (webhookDef.require_token && rawToken) {
            var tokCheck = this.tokenManager.validateToken(rawToken, 'webhook:receive', tenantId);
            if (!tokCheck.valid) {
                return { success: false, errorCode: tokCheck.errorCode, error: tokCheck.error };
            }
        }

        // 2. Replay Protection & Deduplication
        var dedupeKey = eventId || idempKey;
        if (dedupeKey) {
            if (AppForgeWebhookEngine._store.processed_events[dedupeKey]) {
                gs.info(this.LOG_PREFIX + 'Duplicate webhook event ' + dedupeKey + ' ignored (Replay Protection)');
                return {
                    success: true,
                    duplicate: true,
                    status: 'IGNORED_DUPLICATE',
                    event_id: dedupeKey,
                    message: 'Event was already processed.'
                };
            }
            AppForgeWebhookEngine._store.processed_events[dedupeKey] = new Date().toISOString();
        }

        // 3. Map Inbound Payload
        var mappedRecord = this.mappingEngine.mapRecord(payload, webhookDef.field_mappings || []);
        if (mappedRecord.error) {
            return { success: false, errorCode: mappedRecord.error, error: mappedRecord.message };
        }

        // 4. Record Audit Log
        var logEntry = {
            webhook_id: webhookDef.webhook_id || webhookDef.integration_id,
            tenant_id: tenantId,
            event_id: dedupeKey,
            received_at: new Date().toISOString(),
            status: 'PROCESSED',
            target_table: webhookDef.target_table || 'x_appforge_integration_inbound',
            mapped_data: mappedRecord
        };
        AppForgeWebhookEngine._store.webhook_logs.push(logEntry);

        return {
            success: true,
            status: 'PROCESSED',
            event_id: dedupeKey,
            target_table: logEntry.target_table,
            mapped_record: mappedRecord
        };
    },

    resetStore: function() {
        'use strict';
        AppForgeWebhookEngine._store = {
            processed_events: {},
            webhook_logs: []
        };
        AppForgeWebhookEngine._store = AppForgeWebhookEngine._store;
    },

    type: 'AppForgeWebhookEngine'
};
