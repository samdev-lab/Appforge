/**
 * AppForgeModuleRegistry
 * Authoritative Server-Side Service for managing AppForge Modules with composite application uniqueness constraints.
 */
var AppForgeModuleRegistry = Class.create();
AppForgeModuleRegistry._store = {};

AppForgeModuleRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeModuleRegistry] ';
        this.TABLE_NAME = 'x_appforge_module';
        if (!AppForgeModuleRegistry._store) {
            AppForgeModuleRegistry._store = {};
        }
        this._store = AppForgeModuleRegistry._store;
    },

    create: function(moduleData) {
        'use strict';
        var valResult = this.validate(moduleData, false);
        if (!valResult.valid) {
            return { success: false, error: valResult.error };
        }

        var modId = moduleData.module_id || ('mod_' + moduleData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'));
        var sysId = 'sys_id_' + modId;
        var modRecord = {
            sys_id: sysId,
            module_id: modId,
            name: moduleData.name,
            display_name: moduleData.display_name || moduleData.name,
            application: moduleData.application,
            description: moduleData.description || '',
            type: moduleData.type || 'CORE',
            version: moduleData.version || '1.0.0',
            status: moduleData.status || 'ACTIVE',
            owner: moduleData.owner || '',
            active: moduleData.active !== undefined ? moduleData.active : true
        };

        this._store[sysId] = modRecord;
        this._store[modId + '_' + moduleData.application] = modRecord;
        this._store['name_' + moduleData.name + '_' + moduleData.application] = modRecord;

        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.initialize();
            gr.setValue('module_id', modId);
            gr.setValue('name', moduleData.name);
            gr.setValue('display_name', modRecord.display_name);
            gr.setValue('application', moduleData.application);
            gr.setValue('description', modRecord.description);
            gr.setValue('type', modRecord.type);
            gr.setValue('version', modRecord.version);
            gr.setValue('status', modRecord.status);
            gr.setValue('owner', modRecord.owner);
            gr.setValue('active', modRecord.active);

            var insertedId = gr.insert();
            if (insertedId) {
                sysId = insertedId;
                modRecord.sys_id = sysId;
                this._store[sysId] = modRecord;
            }
        } catch (ex) {}

        gs.info(this.LOG_PREFIX + 'Module created: ' + moduleData.name + ' (' + modId + ') [Sys ID: ' + sysId + ']');
        return { success: true, sys_id: sysId, module_id: modId, name: moduleData.name };
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

    getByModuleId: function(applicationSysId, moduleId) {
        'use strict';
        if (!applicationSysId || !moduleId) return null;
        var key = moduleId + '_' + applicationSysId;
        if (this._store[key]) return this._store[key];
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.addQuery('application', applicationSysId);
            gr.addQuery('module_id', moduleId);
            gr.query();
            if (gr.next()) {
                var mapped = this._mapRecord(gr);
                this._store[key] = mapped;
                return mapped;
            }
        } catch (ex) {}
        return null;
    },

    exists: function(appSysId, moduleIdOrName) {
        'use strict';
        if (!appSysId || !moduleIdOrName) return false;
        if (this._store[moduleIdOrName + '_' + appSysId] || this._store['name_' + moduleIdOrName + '_' + appSysId]) {
            return true;
        }
        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.addQuery('application', appSysId);
            var qc = gr.addQuery('module_id', moduleIdOrName);
            qc.addOrCondition('name', moduleIdOrName);
            gr.query();
            return gr.hasNext();
        } catch (ex) {
            return false;
        }
    },

    validate: function(moduleData, isUpdate) {
        'use strict';
        if (!moduleData) return { valid: false, error: 'Module data is required' };
        if (!isUpdate) {
            if (!moduleData.application) return { valid: false, error: 'application is mandatory' };
            if (!moduleData.name) return { valid: false, error: 'name is mandatory' };

            var modId = moduleData.module_id || ('mod_' + moduleData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'));
            if (this.exists(moduleData.application, modId)) {
                return { valid: false, error: 'Module (' + modId + ') already exists within this application' };
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
                if (this._store.hasOwnProperty(k) && this._store[k].sys_id) {
                    var rec = this._store[k];
                    if (!seen[rec.sys_id]) {
                        seen[rec.sys_id] = true;
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
            module_id: gr.getValue('module_id'),
            name: gr.getValue('name'),
            display_name: gr.getValue('display_name'),
            application: gr.getValue('application'),
            description: gr.getValue('description'),
            type: gr.getValue('type'),
            version: gr.getValue('version'),
            status: gr.getValue('status'),
            owner: gr.getValue('owner'),
            active: gr.getValue('active') === '1' || gr.getValue('active') === true
        };
    },

    type: 'AppForgeModuleRegistry'
};
