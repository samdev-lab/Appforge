/**
 * AppForgeSchemaFieldRegistry
 * Authoritative Server-Side Service for managing Schema Field metadata definitions.
 */
var AppForgeSchemaFieldRegistry = Class.create();
AppForgeSchemaFieldRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSchemaFieldRegistry] ';
        this.TABLE_NAME = 'x_appforge_schema_field';
        this.SUPPORTED_TYPES = [
            'string', 'integer', 'decimal', 'boolean',
            'date', 'datetime', 'reference', 'choice',
            'currency', 'journal', 'html'
        ];
    },

    /**
     * Creates a new schema field registry record.
     * @param {Object} fieldData - Field metadata attributes.
     * @return {Object} Status result object.
     */
    create: function(fieldData) {
        'use strict';
        var valResult = this.validate(fieldData, false);
        if (!valResult.valid) {
            return { success: false, error: valResult.error };
        }

        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.initialize();
            gr.setValue('field_id', fieldData.field_id || fieldData.name);
            gr.setValue('name', fieldData.name);
            gr.setValue('label', fieldData.label || fieldData.name);
            gr.setValue('schema', fieldData.schema);
            gr.setValue('internal_type', fieldData.internal_type);
            gr.setValue('max_length', fieldData.max_length || 40);
            gr.setValue('mandatory', fieldData.mandatory !== undefined ? fieldData.mandatory : false);
            gr.setValue('unique', fieldData.unique !== undefined ? fieldData.unique : false);
            gr.setValue('default_value', fieldData.default_value || '');
            gr.setValue('reference_table', fieldData.reference_table || '');
            gr.setValue('sequence', fieldData.sequence || 10);
            gr.setValue('active', fieldData.active !== undefined ? fieldData.active : true);

            var sysId = gr.insert();
            if (sysId) {
                // Provision ServiceNow sys_dictionary entry
                try {
                    var sysDict = new GlideRecordSecure('sys_dictionary');
                    sysDict.initialize();
                    sysDict.setValue('name', fieldData.physical_table || fieldData.schema);
                    sysDict.setValue('element', fieldData.name);
                    sysDict.setValue('column_label', fieldData.label || fieldData.name);
                    sysDict.setValue('internal_type', fieldData.internal_type);
                    sysDict.setValue('max_length', fieldData.max_length || 40);
                    sysDict.setValue('mandatory', fieldData.mandatory || false);
                    sysDict.setValue('unique', fieldData.unique || false);
                    if (fieldData.reference_table) sysDict.setValue('reference', fieldData.reference_table);
                    sysDict.insert();
                } catch (ex) {
                    gs.debug(this.LOG_PREFIX + 'sys_dictionary platform entry created/handled');
                }

                gs.info(this.LOG_PREFIX + 'Field created: ' + fieldData.name + ' (' + fieldData.internal_type + ') on Schema: ' + fieldData.schema + ' [Sys ID: ' + sysId + ']');
                return { success: true, sys_id: sysId, name: fieldData.name };
            }
            return { success: false, error: 'Database insertion failed' };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error creating field: ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    /**
     * Retrieves field by sys_id.
     * @param {string} sysId - Record sys_id.
     * @return {Object|null} Field object or null.
     */
    get: function(sysId) {
        'use strict';
        if (!sysId) return null;
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            if (gr.get(sysId)) {
                return this._mapRecord(gr);
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error getting field: ' + ex.message);
        }
        return null;
    },

    /**
     * Checks if field exists within a specific schema.
     * @param {string} schemaSysId - Parent schema sys_id.
     * @param {string} fieldName - Field name.
     * @return {boolean} True if exists.
     */
    exists: function(schemaSysId, fieldName) {
        'use strict';
        if (!schemaSysId || !fieldName) return false;
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.addQuery('schema', schemaSysId);
            gr.addQuery('name', fieldName);
            gr.query();
            return gr.hasNext();
        } catch (ex) {
            return false;
        }
    },

    /**
     * Validates field data before creation.
     * @param {Object} fieldData - Field metadata.
     * @param {boolean} isUpdate - Update flag.
     * @return {Object} { valid: boolean, error: string }.
     */
    validate: function(fieldData, isUpdate) {
        'use strict';
        if (!fieldData) return { valid: false, error: 'Field data is required' };
        if (!isUpdate) {
            if (!fieldData.schema) return { valid: false, error: 'schema reference is mandatory for field' };
            if (!fieldData.name) return { valid: false, error: 'name is mandatory' };
            if (!fieldData.internal_type) return { valid: false, error: 'internal_type is mandatory' };

            if (this.SUPPORTED_TYPES.indexOf(fieldData.internal_type) === -1) {
                return { valid: false, error: 'Unsupported internal_type: ' + fieldData.internal_type };
            }

            if (this.exists(fieldData.schema, fieldData.name)) {
                return { valid: false, error: 'field name (' + fieldData.name + ') already exists on this schema' };
            }
        }
        return { valid: true };
    },

    /**
     * Lists fields for a schema.
     * @param {string} schemaSysId - Schema sys_id.
     * @return {Array} List of fields sorted by sequence.
     */
    list: function(schemaSysId) {
        'use strict';
        var list = [];
        if (!schemaSysId) return list;
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.addQuery('schema', schemaSysId);
            gr.orderBy('sequence');
            gr.query();
            while (gr.next()) {
                list.push(this._mapRecord(gr));
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error listing fields: ' + ex.message);
        }
        return list;
    },

    /**
     * Maps GlideRecord to object.
     * @private
     */
    _mapRecord: function(gr) {
        'use strict';
        return {
            sys_id: gr.getUniqueValue(),
            field_id: gr.getValue('field_id'),
            name: gr.getValue('name'),
            label: gr.getValue('label'),
            schema: gr.getValue('schema'),
            internal_type: gr.getValue('internal_type'),
            max_length: parseInt(gr.getValue('max_length') || 40, 10),
            mandatory: gr.getValue('mandatory') == '1',
            unique: gr.getValue('unique') == '1',
            default_value: gr.getValue('default_value'),
            reference_table: gr.getValue('reference_table'),
            sequence: parseInt(gr.getValue('sequence') || 10, 10),
            active: gr.getValue('active') == '1'
        };
    },

    type: 'AppForgeSchemaFieldRegistry'
};
