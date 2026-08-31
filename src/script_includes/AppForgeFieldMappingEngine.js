/**
 * AppForgeFieldMappingEngine
 * Declarative Field Mapping & Scriptless Transformation Engine for AppForge Integrations.
 *
 * Supports:
 *   - Mapping Types: DIRECT, CONSTANT, DEFAULT, TRANSFORM, LOOKUP, CONDITIONAL, FORMULA
 *   - Transformations: LOWERCASE, UPPERCASE, TRIM, CONCAT, SPLIT, SUBSTRING,
 *     DATE_FORMAT, NUMBER_FORMAT, BOOLEAN_CONVERT, NULL_IF_EMPTY, DEFAULT_IF_EMPTY
 *   - Reference Lookup & External Identity mapping
 *   - Safe conditional logic (Zero eval)
 */
var AppForgeFieldMappingEngine = Class.create();
AppForgeFieldMappingEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeFieldMappingEngine] ';
    },

    /**
     * Maps a source record into target payload according to field mappings.
     * @param {Object} sourceRecord
     * @param {Array<Object>} fieldMappings
     * @return {Object} Mapped payload or error
     */
    mapRecord: function(sourceRecord, fieldMappings) {
        'use strict';
        if (!sourceRecord) return {};
        if (!fieldMappings || !fieldMappings.length) return Object.assign({}, sourceRecord);

        var target = {};
        for (var i = 0; i < fieldMappings.length; i++) {
            var m = fieldMappings[i];
            if (m.active === false) continue;

            var targetField = m.target_field;
            var sourceVal = m.source_field ? sourceRecord[m.source_field] : undefined;
            var mappedVal = undefined;

            switch ((m.mapping_type || 'DIRECT').toUpperCase()) {
                case 'DIRECT':
                    mappedVal = (sourceVal !== undefined) ? sourceVal : null;
                    break;

                case 'CONSTANT':
                    mappedVal = m.default_value !== undefined ? m.default_value : m.value;
                    break;

                case 'DEFAULT':
                    mappedVal = (sourceVal !== undefined && sourceVal !== null && sourceVal !== '') ? sourceVal : m.default_value;
                    break;

                case 'TRANSFORM':
                    mappedVal = this.applyTransformation(sourceVal, m.transformation, m.transform_params);
                    break;

                case 'LOOKUP':
                    var lookupTable = m.lookup_table || {};
                    mappedVal = lookupTable[sourceVal] !== undefined ? lookupTable[sourceVal] : (m.default_value || sourceVal);
                    break;

                case 'CONDITIONAL':
                    mappedVal = this.evaluateCondition(sourceRecord, m.condition, m.if_true, m.if_false);
                    break;

                case 'FORMULA':
                    if (m.concat_fields && Array.isArray(m.concat_fields)) {
                        var parts = [];
                        for (var f = 0; f < m.concat_fields.length; f++) {
                            var fn = m.concat_fields[f];
                            if (sourceRecord[fn] !== undefined) parts.push(sourceRecord[fn]);
                        }
                        mappedVal = parts.join(m.delimiter || ' ');
                    } else {
                        mappedVal = sourceVal;
                    }
                    break;

                default:
                    mappedVal = sourceVal;
            }

            if (m.required && (mappedVal === undefined || mappedVal === null || mappedVal === '')) {
                return {
                    error: 'FIELD_MAPPING_INVALID',
                    message: 'Required target field ' + targetField + ' is empty or unmapped.'
                };
            }

            target[targetField] = mappedVal;
        }

        return target;
    },

    /**
     * Applies safe scriptless transformations.
     */
    applyTransformation: function(val, transformType, params) {
        'use strict';
        if (val === undefined || val === null) {
            return (transformType === 'DEFAULT_IF_EMPTY' && params) ? params.default_value : null;
        }

        var str = String(val);
        var p = params || {};

        switch ((transformType || '').toUpperCase()) {
            case 'LOWERCASE':
                return str.toLowerCase();

            case 'UPPERCASE':
                return str.toUpperCase();

            case 'TRIM':
                return str.trim();

            case 'CONCAT':
                return str + (p.suffix || '');

            case 'SPLIT':
                var delimiter = p.delimiter || ',';
                var index = p.index !== undefined ? p.index : 0;
                var parts = str.split(delimiter);
                return parts[index] !== undefined ? parts[index].trim() : '';

            case 'SUBSTRING':
                var start = p.start || 0;
                var length = p.length || str.length;
                return str.substring(start, start + length);

            case 'DATE_FORMAT':
                try {
                    var d = new Date(val);
                    if (isNaN(d.getTime())) return str;
                    return d.toISOString().split('T')[0];
                } catch (e) {
                    return str;
                }

            case 'NUMBER_FORMAT':
                var num = parseFloat(val);
                if (isNaN(num)) return 0;
                return p.decimals !== undefined ? parseFloat(num.toFixed(p.decimals)) : num;

            case 'BOOLEAN_CONVERT':
                if (typeof val === 'boolean') return val;
                var low = str.toLowerCase().trim();
                return (low === 'true' || low === '1' || low === 'yes' || low === 'active');

            case 'NULL_IF_EMPTY':
                return (str.trim() === '') ? null : val;

            case 'DEFAULT_IF_EMPTY':
                return (str.trim() === '') ? (p.default_value || '') : val;

            default:
                return val;
        }
    },

    /**
     * Evaluates simple declarative conditions safely without eval.
     */
    evaluateCondition: function(record, condition, ifTrue, ifFalse) {
        'use strict';
        if (!condition || !condition.field) return ifTrue;
        var fieldVal = record[condition.field];
        var targetVal = condition.value;
        var op = condition.operator || 'EQUALS';
        var isMatch = false;

        switch (op.toUpperCase()) {
            case 'EQUALS':
            case 'EQ':
                isMatch = (String(fieldVal) === String(targetVal));
                break;
            case 'NOT_EQUALS':
            case 'NEQ':
                isMatch = (String(fieldVal) !== String(targetVal));
                break;
            case 'CONTAINS':
                isMatch = (String(fieldVal).indexOf(String(targetVal)) !== -1);
                break;
            case 'GREATER_THAN':
            case 'GT':
                isMatch = (parseFloat(fieldVal) > parseFloat(targetVal));
                break;
            case 'LESS_THAN':
            case 'LT':
                isMatch = (parseFloat(fieldVal) < parseFloat(targetVal));
                break;
            case 'IS_EMPTY':
                isMatch = (fieldVal === undefined || fieldVal === null || String(fieldVal).trim() === '');
                break;
            case 'IS_NOT_EMPTY':
                isMatch = (fieldVal !== undefined && fieldVal !== null && String(fieldVal).trim() !== '');
                break;
            default:
                isMatch = (fieldVal == targetVal);
        }

        return isMatch ? ifTrue : ifFalse;
    },

    type: 'AppForgeFieldMappingEngine'
};
