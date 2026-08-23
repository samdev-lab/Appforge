/**
 * AppForgeTransformationEngine
 * Declarative transformation service for data mapping.
 * Supported transformations: STRING, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME, UPPERCASE, LOWERCASE, TRIM.
 * Strictly avoids arbitrary code execution.
 */
var AppForgeTransformationEngine = Class.create();
AppForgeTransformationEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTransformationEngine] ';
        this.SUPPORTED_TRANSFORMS = [
            'STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN',
            'DATE', 'DATETIME', 'UPPERCASE', 'LOWERCASE', 'TRIM'
        ];
    },

    /**
     * Transforms an input value according to specified transformation type.
     * @param {*} value - Raw input value.
     * @param {string} transformType - Transformation identifier.
     * @return {*} Transformed value.
     */
    transform: function(value, transformType) {
        'use strict';
        if (value === undefined || value === null) return value;
        if (!transformType) return value;

        var type = String(transformType).toUpperCase();

        switch (type) {
            case 'STRING':
                return String(value);

            case 'INTEGER':
                var intVal = parseInt(value, 10);
                return isNaN(intVal) ? 0 : intVal;

            case 'DECIMAL':
                var decVal = parseFloat(value);
                return isNaN(decVal) ? 0.0 : decVal;

            case 'BOOLEAN':
                if (typeof value === 'boolean') return value;
                var strVal = String(value).toLowerCase().trim();
                return strVal === 'true' || strVal === '1' || strVal === 'yes';

            case 'UPPERCASE':
                return String(value).toUpperCase();

            case 'LOWERCASE':
                return String(value).toLowerCase();

            case 'TRIM':
                return String(value).trim();

            case 'DATE':
                try {
                    var d = new Date(value);
                    return isNaN(d.getTime()) ? String(value) : d.toISOString().split('T')[0];
                } catch (e) {
                    return String(value);
                }

            case 'DATETIME':
                try {
                    var dt = new Date(value);
                    return isNaN(dt.getTime()) ? String(value) : dt.toISOString();
                } catch (e) {
                    return String(value);
                }

            default:
                gs.warn(this.LOG_PREFIX + 'Unsupported transformation: ' + type);
                return value;
        }
    },

    type: 'AppForgeTransformationEngine'
};
