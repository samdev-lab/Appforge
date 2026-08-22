/**
 * AppForgeFieldTypeMapper
 * Service mapping AppForge internal field types to ServiceNow platform field type definitions.
 */
var AppForgeFieldTypeMapper = Class.create();
AppForgeFieldTypeMapper.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeFieldTypeMapper] ';
        this.TYPE_MAP = {
            'string': 'String',
            'integer': 'Integer',
            'decimal': 'Decimal',
            'boolean': 'True/False',
            'date': 'Date',
            'datetime': 'Date/Time',
            'reference': 'Reference',
            'choice': 'Choice',
            'currency': 'Currency',
            'journal': 'Journal Input',
            'html': 'HTML'
        };
    },

    /**
     * Maps an internal AppForge type to ServiceNow platform dictionary type.
     * @param {string} internalType - Internal field type name.
     * @return {Object} { valid: boolean, platform_type: string, error: string }.
     */
    map: function(internalType) {
        'use strict';
        if (!internalType) {
            return { valid: false, platform_type: null, error: 'internalType is mandatory' };
        }

        var key = String(internalType).toLowerCase().trim();
        var platformType = this.TYPE_MAP[key];

        if (!platformType) {
            return {
                valid: false,
                platform_type: null,
                error: 'Unsupported internal field type: ' + internalType
            };
        }

        return {
            valid: true,
            platform_type: platformType,
            error: null
        };
    },

    type: 'AppForgeFieldTypeMapper'
};
