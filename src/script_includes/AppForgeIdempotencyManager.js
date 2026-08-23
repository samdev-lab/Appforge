/**
 * AppForgeIdempotencyManager
 * Ensures integration requests with identical idempotency keys (e.g. X-Request-ID, delivery_id)
 * return identical results without redundant database mutations.
 */
var AppForgeIdempotencyManager = Class.create();
AppForgeIdempotencyManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeIdempotencyManager] ';
        this.cache = {};
    },

    /**
     * Checks if a request key has already been processed.
     * @param {string} key - Idempotency key / delivery ID.
     * @return {Object|null} Cached response if previously processed, or null.
     */
    check: function(key) {
        'use strict';
        if (!key) return null;
        if (this.cache[key]) {
            gs.info(this.LOG_PREFIX + 'Duplicate request detected for key: ' + key);
            return {
                duplicate: true,
                cached_response: this.cache[key].response,
                processed_at: this.cache[key].timestamp
            };
        }
        return null;
    },

    /**
     * Records a processed request and its result.
     * @param {string} key - Idempotency key.
     * @param {Object} response - Processed response data.
     */
    record: function(key, response) {
        'use strict';
        if (!key) return;
        this.cache[key] = {
            response: response,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Clears cache (useful for test resets).
     */
    clear: function() {
        'use strict';
        this.cache = {};
    },

    type: 'AppForgeIdempotencyManager'
};
