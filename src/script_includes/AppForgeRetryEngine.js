/**
 * AppForgeRetryEngine
 * Manages retry calculations and policies for outbound integration executions.
 * Policies: NONE, FIXED, EXPONENTIAL.
 * Enforces non-retry rules for authentication (401/403) and validation (400/422) failures.
 */
var AppForgeRetryEngine = Class.create();
AppForgeRetryEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeRetryEngine] ';
        this.NON_RETRYABLE_STATUSES = [400, 401, 403, 404, 405, 422];
    },

    /**
     * Determines whether a failed request should be retried based on status and attempt count.
     * @param {number} statusCode - HTTP response status code (or 0 for network timeout).
     * @param {number} currentAttempt - Current 1-based attempt index.
     * @param {Object} policy - Retry policy configuration { type, max_retries, initial_delay_ms }.
     * @return {boolean} True if request should be retried.
     */
    shouldRetry: function(statusCode, currentAttempt, policy) {
        'use strict';
        if (!policy || policy.type === 'NONE') return false;

        var maxRetries = policy.max_retries !== undefined ? policy.max_retries : 3;
        if (currentAttempt > maxRetries) return false;

        // Non-retryable permanent client errors
        if (this.NON_RETRYABLE_STATUSES.indexOf(statusCode) !== -1) {
            return false;
        }

        return true;
    },

    /**
     * Calculates delay in milliseconds before next retry attempt.
     * @param {number} attempt - Attempt index (1, 2, 3...).
     * @param {Object} policy - Retry policy configuration.
     * @return {number} Delay in milliseconds.
     */
    calculateDelayMs: function(attempt, policy) {
        'use strict';
        if (!policy || policy.type === 'NONE') return 0;

        var baseDelay = policy.initial_delay_ms || 1000;
        var maxDelay = policy.max_delay_ms || 30000;

        if (policy.type === 'FIXED') {
            return Math.min(baseDelay, maxDelay);
        }

        if (policy.type === 'EXPONENTIAL') {
            var delay = baseDelay * Math.pow(2, attempt - 1);
            return Math.min(delay, maxDelay);
        }

        return baseDelay;
    },

    type: 'AppForgeRetryEngine'
};
