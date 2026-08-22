/**
 * AppForgeDifferenceDetector
 * Server-side metadata comparison service comparing registered metadata vs actual platform/Git state.
 * Reports MATCH, DIFFERENCE, MISSING, or ERROR without executing unauthorized modifications.
 */
var AppForgeDifferenceDetector = Class.create();
AppForgeDifferenceDetector.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeDifferenceDetector] ';
    },

    /**
     * Compares registered metadata against actual platform or Git state.
     * @param {Object} registered - Registered metadata object.
     * @param {Object} actual - Actual platform or Git metadata object.
     * @return {Object} Comparison report containing overallStatus and field-by-field statuses.
     */
    compare: function(registered, actual) {
        'use strict';
        if (!registered || !actual) {
            return {
                overallStatus: 'ERROR',
                error: 'Registered or actual metadata object is missing',
                details: {}
            };
        }

        var details = {};
        var hasDifference = false;

        var keys = ['name', 'scope', 'version', 'repository', 'branch', 'latest_commit'];

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var regVal = registered[key];
            var actVal = actual[key];

            if (regVal === undefined || regVal === null) {
                details[key] = { status: 'MISSING', registered: null, actual: actVal };
                hasDifference = true;
            } else if (actVal === undefined || actVal === null) {
                details[key] = { status: 'MISSING', registered: regVal, actual: null };
                hasDifference = true;
            } else if (String(regVal).trim() === String(actVal).trim()) {
                details[key] = { status: 'MATCH', registered: regVal, actual: actVal };
            } else {
                details[key] = { status: 'DIFFERENCE', registered: regVal, actual: actVal };
                hasDifference = true;
            }
        }

        return {
            overallStatus: hasDifference ? 'DIFFERENCE' : 'MATCH',
            details: details
        };
    },

    type: 'AppForgeDifferenceDetector'
};
