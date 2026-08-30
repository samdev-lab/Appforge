/**
 * AppForgeTelemetryService
 * Captures, normalizes, sanitizes, and deduplicates application telemetry events.
 * Fail-open design: Telemetry errors never disrupt application execution.
 */
var AppForgeTelemetryService = Class.create();
AppForgeTelemetryService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTelemetryService] ';
        this.SECRET_PATTERNS = [
            /(?:password|passwd|pwd|secret|api[_-]?key|bearer|authorization|token|private[_-]?key)\s*[:=]\s*["']?([^"',\s]+)["']?/gi
        ];
        this._seenEvents = {};
    },

    /**
     * Records a normalized telemetry event.
     * @param {Object} eventData - Telemetry event descriptor.
     * @return {Object} { success: boolean, telemetry_id: string, deduplicated: boolean }
     */
    recordEvent: function(eventData) {
        'use strict';
        try {
            if (!eventData || typeof eventData !== 'object') {
                return { success: false, error: 'Invalid event data' };
            }

            var telId = eventData.telemetry_id || ('tel_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000));
            var corrId = eventData.correlation_id || ('corr_' + new Date().getTime());
            var dedupKey = (eventData.event_id || telId) + ':' + corrId + ':' + (eventData.source || 'default');

            if (this._seenEvents[dedupKey]) {
                return { success: true, telemetry_id: telId, deduplicated: true };
            }
            this._seenEvents[dedupKey] = true;

            var sysId = 'sys_tel_' + telId;
            try {
                var gr = new GlideRecordSecure('x_appforge_telemetry');
                gr.initialize();
                gr.setValue('telemetry_id', telId);
                gr.setValue('application', eventData.application || 'Employee Onboarding');
                gr.setValue('module', eventData.module || '');
                gr.setValue('schema', eventData.schema || '');
                gr.setValue('environment', eventData.environment || 'DEV');
                gr.setValue('event_type', eventData.event_type || 'APPLICATION');
                gr.setValue('severity', eventData.severity || 'INFO');
                gr.setValue('source', eventData.source || 'AppEngine');
                gr.setValue('correlation_id', corrId);
                gr.setValue('transaction_id', eventData.transaction_id || '');
                gr.setValue('duration_ms', eventData.duration_ms || 0);
                gr.setValue('status', eventData.status || 'SUCCESS');
                gr.setValue('operation', eventData.operation || 'EXECUTE');
                gr.setValue('actor', eventData.actor || 'system');
                gr.setValue('metadata_json', JSON.stringify(sanitizedMeta));
                gr.setValue('timestamp', new GlideDateTime().getValue());
                var insId = gr.insert();
                if (insId) sysId = insId;
            } catch (e) {}

            return {
                success: true,
                sys_id: sysId,
                telemetry_id: telId,
                deduplicated: false
            };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Failed to record telemetry (Fail-Open): ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    /**
     * Sanitizes secret keywords and tokens from payload objects.
     * @param {Object|string} metadata - Object or string metadata.
     * @return {Object} Sanitized object.
     */
    sanitizeMetadata: function(metadata) {
        'use strict';
        if (!metadata) return {};
        if (typeof metadata === 'object') {
            var clone = JSON.parse(JSON.stringify(metadata));
            var sanitizeObj = function(obj) {
                for (var k in obj) {
                    if (typeof obj[k] === 'object' && obj[k] !== null) {
                        sanitizeObj(obj[k]);
                    } else if (/(?:password|passwd|pwd|secret|api[_-]?key|bearer|authorization|token|private[_-]?key)/i.test(k)) {
                        obj[k] = '[REDACTED_SECRET]';
                    }
                }
            };
            sanitizeObj(clone);
            return clone;
        }
        var str = String(metadata);
        return str.replace(/(["']?(?:password|passwd|pwd|secret|api[_-]?key|bearer|authorization|token|private[_-]?key)["']?\s*[:=]\s*["']?)([^"',}\s]+)(["']?)/gi, '$1[REDACTED_SECRET]$3');
    },

    type: 'AppForgeTelemetryService'
};
