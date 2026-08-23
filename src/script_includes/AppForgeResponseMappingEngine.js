/**
 * AppForgeResponseMappingEngine
 * Maps external HTTP response payloads into ServiceNow target record attributes.
 * Example mapping: { "external_id": "employeeId", "status": { "source": "state", "transform": "UPPERCASE" } }
 */
var AppForgeResponseMappingEngine = Class.create();
AppForgeResponseMappingEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeResponseMappingEngine] ';
        this.transformEngine = new AppForgeTransformationEngine();
    },

    /**
     * Validates a response mapping definition.
     * @param {Object} mapping - Mapping definition.
     * @return {Object} { valid: boolean, errors: Array }
     */
    validate: function(mapping) {
        'use strict';
        var errors = [];
        if (!mapping || typeof mapping !== 'object') {
            return { valid: false, errors: ['Response mapping must be an object'] };
        }
        return { valid: true, errors: [] };
    },

    /**
     * Maps response payload to target record attributes.
     * @param {Object} responsePayload - Parsed external response JSON.
     * @param {Object} mapping - Declarative response mapping object.
     * @return {Object} Key-value pairs ready to be set on ServiceNow target record.
     */
    applyMapping: function(responsePayload, mapping) {
        'use strict';
        var result = {};
        if (!responsePayload || !mapping) return result;

        for (var targetField in mapping) {
            var mapSpec = mapping[targetField];

            if (typeof mapSpec === 'object' && mapSpec !== null && mapSpec.source) {
                var rawVal = this._extractJsonPath(responsePayload, mapSpec.source);
                result[targetField] = this.transformEngine.transform(rawVal, mapSpec.transform);

            } else if (typeof mapSpec === 'string') {
                var simpleVal = this._extractJsonPath(responsePayload, mapSpec);
                result[targetField] = simpleVal !== undefined ? simpleVal : null;
            }
        }

        return result;
    },

    /**
     * Extracts value from object via dot-notation path (e.g. "data.employee.id").
     * @private
     */
    _extractJsonPath: function(obj, pathStr) {
        'use strict';
        if (!obj || !pathStr) return undefined;
        var parts = pathStr.split('.');
        var curr = obj;
        for (var i = 0; i < parts.length; i++) {
            if (curr === undefined || curr === null) return undefined;
            curr = curr[parts[i]];
        }
        return curr;
    },

    type: 'AppForgeResponseMappingEngine'
};
