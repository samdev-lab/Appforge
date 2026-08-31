/**
 * AppForgeIntegrationRetryEngine
 * Retry Policy & Rate Limit Handling for AppForge Universal Integrations.
 *
 * Implements:
 *   - Transient failure detection (408, 429, 500, 502, 503, 504)
 *   - Exponential & linear backoff calculation
 *   - HTTP 429 Retry-After parsing
 *   - Deterministic Idempotency Key Generation
 */
var AppForgeIntegrationRetryEngine = Class.create();
AppForgeIntegrationRetryEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeIntegrationRetryEngine] ';
        this.DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504];
    },

    /**
     * Determines whether a failed HTTP response should be retried.
     */
    shouldRetry: function(httpStatus, currentAttempt, retryConfig) {
        'use strict';
        var config = retryConfig || {};
        var maxAttempts = config.max_attempts || 3;
        var retryStatuses = config.retry_on_status || this.DEFAULT_RETRY_STATUSES;

        if (currentAttempt >= maxAttempts) {
            return false;
        }

        return retryStatuses.indexOf(parseInt(httpStatus, 10)) !== -1;
    },

    /**
     * Calculates delay before next retry attempt.
     */
    calculateDelay: function(attempt, retryConfig, responseHeaders) {
        'use strict';
        var config = retryConfig || {};
        var initDelay = config.initial_delay_ms || 1000;
        var maxDelay = config.max_delay_ms || 30000;
        var backoffType = (config.backoff_type || 'EXPONENTIAL').toUpperCase();

        // Respect 429 Retry-After header if present
        if (responseHeaders && (responseHeaders['retry-after'] || responseHeaders['Retry-After'])) {
            var rawHeader = responseHeaders['retry-after'] || responseHeaders['Retry-After'];
            var parsed = parseInt(rawHeader, 10);
            if (!isNaN(parsed)) {
                return Math.min(parsed * 1000, maxDelay);
            }
        }

        var delay = initDelay;
        if (backoffType === 'EXPONENTIAL') {
            delay = initDelay * Math.pow(2, attempt - 1);
        } else if (backoffType === 'LINEAR') {
            delay = initDelay * attempt;
        }

        return Math.min(delay, maxDelay);
    },

    /**
     * Generates a deterministic idempotency key.
     */
    generateIdempotencyKey: function(integrationId, recordId, operation) {
        'use strict';
        var base = (integrationId || 'int') + '_' + (recordId || 'rec') + '_' + (operation || 'op');
        var hash = 0;
        for (var i = 0; i < base.length; i++) {
            var char = base.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        var hex = Math.abs(hash).toString(16);
        return 'idemp_' + hex + '_' + Date.now().toString(36);
    },

    type: 'AppForgeIntegrationRetryEngine'
};
