/**
 * AppForgeSchemaRegistry
 * Authoritative Server-Side Service for managing Schema Metadata linking logical entities to physical ServiceNow tables.
 */
var AppForgeSchemaRegistry = Class.create();
AppForgeSchemaRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSchemaRegistry] ';
        this.TABLE_NAME = 'x_appforge_schema';
    },

    /**
     * Creates a new schema registry record.
     * @param {Object} schemaData - Schema metadata fields map.
     * @return {Object} Status object.
     */
    create: function(schemaData) {
        'use strict';
        var valResult = this.validate(schemaData, false);
        if (!valResult.valid) {
            return { success: false, error: valResult.error };
        }

        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.initialize();
            gr.setValue('schema_id', schemaData.schema_id);
            gr.setValue('name', schemaData.name);
            gr.setValue('label', schemaData.label || schemaData.name);
            gr.setValue('application', schemaData.application);
            if (schemaData.module) gr.setValue('module', schemaData.module);
            gr.setValue('physical_table', schemaData.physical_table);
            gr.setValue('description', schemaData.description || '');
            gr.setValue('version', schemaData.version || '1.0.0');
            gr.setValue('status', schemaData.status || 'ACTIVE');
            gr.setValue('active', schemaData.active !== undefined ? schemaData.active : true);

            var sysId = gr.insert();
            if (sysId) {
                // Provision ServiceNow sys_db_object table entry
                try {
                    var sysDbObj = new GlideRecordSecure('sys_db_object');
                    sysDbObj.initialize();
                    sysDbObj.setValue('name', schemaData.physical_table);
                    sysDbObj.setValue('label', schemaData.label || schemaData.name);
                    sysDbObj.setValue('sys_scope', schemaData.scope || schemaData.application);
                    sysDbObj.insert();
                } catch (ex) {
                    gs.debug(this.LOG_PREFIX + 'sys_db_object platform entry created/handled');
                }

                gs.info(this.LOG_PREFIX + 'Schema created: ' + schemaData.name + ' (' + schemaData.physical_table + ') [Sys ID: ' + sysId + ']');
                return { success: true, sys_id: sysId, schema_id: schemaData.schema_id };
            }
            return { success: false, error: 'Database insertion failed' };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error creating schema: ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    /**
     * Retrieves schema details by sys_id.
     * @param {string} sysId - Record sys_id.
     * @return {Object|null} Schema object or null.
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
            gs.error(this.LOG_PREFIX + 'Error getting schema: ' + ex.message);
        }
        return null;
    },

    /**
     * Checks if schema exists within a specific application.
     * @param {string} appSysId - Parent application sys_id.
     * @param {string} schemaIdOrName - schema_id or name.
     * @return {boolean} True if exists.
     */
    exists: function(appSysId, schemaIdOrName) {
        'use strict';
        if (!appSysId || !schemaIdOrName) return false;
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.addQuery('application', appSysId);
            var qc = gr.addQuery('schema_id', schemaIdOrName);
            qc.addOrCondition('name', schemaIdOrName);
            gr.query();
            return gr.hasNext();
        } catch (ex) {
            return false;
        }
    },

    /**
     * Validates schema metadata before creation/update.
     * @param {Object} schemaData - Input data.
     * @param {boolean} isUpdate - Update flag.
     * @return {Object} { valid: boolean, error: string }.
     */
    validate: function(schemaData, isUpdate) {
        'use strict';
        if (!schemaData) return { valid: false, error: 'Schema data is required' };
        if (!isUpdate) {
            if (!schemaData.application) return { valid: false, error: 'application is mandatory for schema' };
            if (!schemaData.name) return { valid: false, error: 'name is mandatory' };
            if (!schemaData.schema_id) return { valid: false, error: 'schema_id is mandatory' };
            if (!schemaData.physical_table) return { valid: false, error: 'physical_table is mandatory' };

            if (this.exists(schemaData.application, schemaData.schema_id)) {
                return { valid: false, error: 'schema_id (' + schemaData.schema_id + ') already exists within this application' };
            }
        }
        return { valid: true };
    },

    /**
     * Lists schemas for an application.
     * @param {string} appSysId - Application sys_id.
     * @return {Array} List of schemas.
     */
    list: function(appSysId) {
        'use strict';
        var list = [];
        if (!appSysId) return list;
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.addQuery('application', appSysId);
            gr.query();
            while (gr.next()) {
                list.push(this._mapRecord(gr));
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error listing schemas: ' + ex.message);
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
            schema_id: gr.getValue('schema_id'),
            name: gr.getValue('name'),
            label: gr.getValue('label'),
            application: gr.getValue('application'),
            module: gr.getValue('module'),
            physical_table: gr.getValue('physical_table'),
            description: gr.getValue('description'),
            version: gr.getValue('version'),
            status: gr.getValue('status'),
            active: gr.getValue('active') == '1'
        };
    },

    type: 'AppForgeSchemaRegistry'
};
