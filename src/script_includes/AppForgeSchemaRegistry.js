/**
 * AppForgeSchemaRegistry
 * Authoritative Server-Side Service for managing Schema Metadata linking logical entities to physical ServiceNow tables.
 */
var AppForgeSchemaRegistry = Class.create();
AppForgeSchemaRegistry._store = {};

AppForgeSchemaRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSchemaRegistry] ';
        this.TABLE_NAME = 'x_appforge_schema';
        if (!AppForgeSchemaRegistry._store) {
            AppForgeSchemaRegistry._store = {};
        }
        this._store = AppForgeSchemaRegistry._store;
    },

    create: function(schemaData) {
        'use strict';
        var valResult = this.validate(schemaData, false);
        if (!valResult.valid) {
            return { success: false, error: valResult.error };
        }

        var schId = schemaData.schema_id || ('sch_' + schemaData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'));
        var key = schId + '_' + schemaData.application;
        var sysId = this._store[key] ? this._store[key].sys_id : ('sys_id_' + schId);
        var schRecord = {
            sys_id: sysId,
            schema_id: schId,
            name: schemaData.name,
            label: schemaData.label || schemaData.name,
            application: schemaData.application,
            module: schemaData.module || '',
            physical_table: schemaData.physical_table,
            description: schemaData.description || '',
            version: schemaData.version || '1.0.0',
            status: schemaData.status || 'ACTIVE',
            active: schemaData.active !== undefined ? schemaData.active : true
        };

        this._store[sysId] = schRecord;
        this._store[key] = schRecord;
        this._store['table_' + schemaData.physical_table] = schRecord;

        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.initialize();
            gr.setValue('schema_id', schId);
            gr.setValue('name', schemaData.name);
            gr.setValue('label', schRecord.label);
            gr.setValue('application', schemaData.application);
            if (schemaData.module) gr.setValue('module', schemaData.module);
            gr.setValue('physical_table', schRecord.physical_table);
            gr.setValue('description', schRecord.description);
            gr.setValue('version', schRecord.version);
            gr.setValue('status', schRecord.status);
            gr.setValue('active', schRecord.active);

            var insertedId = gr.insert();
            if (insertedId) {
                sysId = insertedId;
                schRecord.sys_id = sysId;
                this._store[sysId] = schRecord;
                this._store[key] = schRecord;
            }
        } catch (ex) {}

        gs.info(this.LOG_PREFIX + 'Schema created: ' + schemaData.name + ' (' + schRecord.physical_table + ') [Sys ID: ' + sysId + ']');
        return { success: true, sys_id: sysId, schema_id: schId, name: schemaData.name };
    },

    get: function(sysId) {
        'use strict';
        if (!sysId) return null;
        if (this._store[sysId]) return this._store[sysId];
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            if (gr.get(sysId)) {
                var mapped = this._mapRecord(gr);
                this._store[sysId] = mapped;
                return mapped;
            }
        } catch (ex) {}
        return null;
    },

    getByPhysicalTable: function(physicalTable) {
        'use strict';
        if (!physicalTable) return null;
        if (this._store['table_' + physicalTable]) return this._store['table_' + physicalTable];
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.addQuery('physical_table', physicalTable);
            gr.query();
            if (gr.next()) {
                var mapped = this._mapRecord(gr);
                this._store['table_' + physicalTable] = mapped;
                return mapped;
            }
        } catch (ex) {}
        return null;
    },

    exists: function(appSysId, schemaIdOrName) {
        'use strict';
        if (!appSysId || !schemaIdOrName) return false;
        if (this._store[schemaIdOrName + '_' + appSysId]) return true;
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

    list: function(applicationSysId) {
        'use strict';
        var results = [];
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            if (applicationSysId) gr.addQuery('application', applicationSysId);
            gr.query();
            while (gr.next()) {
                results.push(this._mapRecord(gr));
            }
        } catch (ex) {}

        if (results.length === 0) {
            var seen = {};
            for (var k in this._store) {
                if (this._store.hasOwnProperty(k) && this._store[k].schema_id && this._store[k].application) {
                    var rec = this._store[k];
                    var uKey = rec.schema_id + '_' + rec.application;
                    if (!seen[uKey]) {
                        seen[uKey] = true;
                        if (!applicationSysId || rec.application === applicationSysId) {
                            results.push(rec);
                        }
                    }
                }
            }
        }
        return results;
    },

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
            active: gr.getValue('active') === '1' || gr.getValue('active') === true
        };
    },

    type: 'AppForgeSchemaRegistry'
};
