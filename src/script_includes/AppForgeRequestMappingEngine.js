/**
 * AppForgeRequestMappingEngine
 * Evaluates declarative request mapping templates into outbound HTTP payloads.
 * Template syntax: ${current.field_name}
 */
var AppForgeRequestMappingEngine = Class.create();
AppForgeRequestMappingEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeRequestMappingEngine] ';
        this.transformEngine = new AppForgeTransformationEngine();
    },

    /**
     * Validates a request mapping definition.
     * @param {Object} mapping - Mapping definition object.
     * @return {Object} { valid: boolean, errors: Array }
     */
    validate: function(mapping) {
        'use strict';
        var errors = [];
        if (!mapping || typeof mapping !== 'object') {
            return { valid: false, errors: ['Request mapping must be an object'] };
        }

        for (var targetKey in mapping) {
            var val = mapping[targetKey];
            if (typeof val === 'string' && val.indexOf('${') !== -1) {
                if (!/^\$\{current\.[a-zA-Z0-9_]+\}$/.test(val)) {
                    errors.push('Invalid template syntax for key (' + targetKey + '): ' + val + '. Expected ${current.<field_name>}');
                }
            }
        }

        return { valid: errors.length === 0, errors: errors };
    },

    /**
     * Builds request payload from source record and mapping definition.
     * @param {Object} sourceRecord - Source data record (e.g. current GlideRecord or POJO).
     * @param {Object} mapping - Declarative mapping definition.
     * @return {Object} Evaluated outbound payload object.
     */
    buildPayload: function(sourceRecord, mapping) {
        'use strict';
        var payload = {};
        if (!mapping || !sourceRecord) return payload;

        for (var targetKey in mapping) {
            var expr = mapping[targetKey];

            if (typeof expr === 'object' && expr !== null && expr.field) {
                // Object syntax: { field: "name", transform: "UPPERCASE" }
                var fieldName = expr.field.replace('${current.', '').replace('}', '');
                var rawVal = typeof sourceRecord.getValue === 'function' ? sourceRecord.getValue(fieldName) : sourceRecord[fieldName];
                payload[targetKey] = this.transformEngine.transform(rawVal, expr.transform);

            } else if (typeof expr === 'string' && expr.indexOf('${current.') === 0) {
                // String template syntax: "${current.email}"
                var fName = expr.substring(10, expr.length - 1);
                var fVal = typeof sourceRecord.getValue === 'function' ? sourceRecord.getValue(fName) : sourceRecord[fName];
                payload[targetKey] = fVal !== undefined ? fVal : '';

            } else {
                // Literal value
                payload[targetKey] = expr;
            }
        }

        return payload;
    },

    type: 'AppForgeRequestMappingEngine'
};
