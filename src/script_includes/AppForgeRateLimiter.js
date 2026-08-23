/**
 * AppForgeRateLimiter
 * In-memory / rolling window rate limiter enforcing integration and webhook request thresholds.
 */
var AppForgeRateLimiter = Class.create();
AppForgeRateLimiter.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeRateLimiter] ';
        this.requestWindows = {};
    },

    /**
     * Checks if a client/integration identifier exceeds rate limit.
     * @param {string} identifier - Client ID or Integration ID.
     * @param {number} limitPerMinute - Maximum requests per 60 seconds.
     * @return {Object} { allowed: boolean, current_count: number, limit: number, retry_after: number }
     */
    checkRateLimit: function(identifier, limitPerMinute) {
        'use strict';
        var limit = limitPerMinute || 60;
        var now = new Date().getTime();
        var windowStart = now - 60000;

        if (!this.requestWindows[identifier]) {
            this.requestWindows[identifier] = [];
        }

        // Evict timestamps older than 60 seconds
        this.requestWindows[identifier] = this.requestWindows[identifier].filter(function(ts) {
            return ts > windowStart;
        });

        var count = this.requestWindows[identifier].length;

        if (count >= limit) {
            gs.warn(this.LOG_PREFIX + 'Rate limit exceeded for ' + identifier + ' (' + count + '/' + limit + ' req/min)');
            return {
                allowed: false,
                current_count: count,
                limit: limit,
                status_code: 429,
                error: 'Too Many Requests',
                retry_after: 60
            };
        }

        this.requestWindows[identifier].push(now);
        return {
            allowed: true,
            current_count: count + 1,
            limit: limit,
            remaining: limit - (count + 1)
        };
    },

    /**
     * Resets rate limiter tracking.
     */
    reset: function() {
        'use strict';
        this.requestWindows = {};
    },

    type: 'AppForgeRateLimiter'
};
