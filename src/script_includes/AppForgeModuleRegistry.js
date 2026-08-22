/**
 * AppForgeModuleRegistry
 * Authoritative Server-Side Service for managing AppForge Modules with composite application uniqueness constraints.
 */
var AppForgeModuleRegistry = Class.create();
AppForgeModuleRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeModuleRegistry] ';
        this.TABLE_NAME = 'x_appforge_module';
    },

    /**
     * Creates a new module record.
     * @param {Object} moduleData - Module fields map.
     * @return {Object} Result status object.
     */
    create: function(moduleData) {
        'use strict';
        var valResult = this.validate(moduleData, false);
        if (!valResult.valid) {
            return { success: false, error: valResult.error };
        }

        try {
            var gr = new GlideRecordSecure(this.TABLE_NAME);
            gr.initialize();
            gr.setValue('module_id', moduleData.module_id);
            gr.setValue('name', moduleData.name);
            gr.setValue('display_name', moduleData.display_name || moduleData.name);
            gr.setValue('application', moduleData.application);
            gr.setValue('description', moduleData.description || '');
            gr.setValue('type', moduleData.type || 'CORE');
            gr.setValue('version', moduleData.version || '1.0.0');
            gr.setValue('status', moduleData.status || 'ACTIVE');
            gr.setValue('owner', moduleData.owner || '');
            gr.setValue('active', moduleData.active !== undefined ? moduleData.active : true);

            var sysId = gr.insert();
            if (sysId) {
                gs.info(this.LOG_PREFIX + 'Module created: ' + moduleData.name + ' (' + moduleData.module_id + ') [Sys ID: ' + sysId + ']');
                return { success: true, sys_id: sysId, module_id: moduleData.module_id };
            }
            return { success: false, error: 'Database insertion failed' };
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error creating module: ' + ex.message);
            return { success: false, error: ex.message };
        }
    },

    /**
     * Retrieves module by sys_id or module_id within an application.
     * @param {string} sysId - Module sys_id.
     * @return {Object|null} Module object or null if not found.
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
            gs.error(this.LOG_PREFIX + 'Error getting module: ' + ex.message);
        }
        return null;
    },

    /**
     * Checks if module exists within a specific application (Composite Uniqueness).
     * @param {string} appSysId - Parent application sys_id.
     * @param {string} moduleIdOrName - module_id or name.
     * @return {boolean} True if exists in that application.
     */
    exists: function(appSysId, moduleIdOrName) {
        'use strict';
        if (!appSysId || !moduleIdOrName) return false;
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

    /**
     * Validates module metadata and checks application reference constraint.
     * @param {Object} moduleData - Module data.
     * @param {boolean} isUpdate - Update mode flag.
     * @return {Object} Validation result { valid: boolean, error: string }.
     */
    validate: function(moduleData, isUpdate) {
        'use strict';
        if (!moduleData) return { valid: false, error: 'Module data is required' };
        if (!isUpdate) {
            if (!moduleData.application) return { valid: false, error: 'application is mandatory for module' };
            if (!moduleData.name) return { valid: false, error: 'name is mandatory' };
            if (!moduleData.module_id) return { valid: false, error: 'module_id is mandatory' };

            // Check composite uniqueness per application
            if (this.exists(moduleData.application, moduleData.module_id)) {
                return { valid: false, error: 'module_id (' + moduleData.module_id + ') already exists within this application' };
            }
            if (this.exists(moduleData.application, moduleData.name)) {
                return { valid: false, error: 'module name (' + moduleData.name + ') already exists within this application' };
            }
        }
        return { valid: true };
    },

    /**
     * Lists modules for a given application.
     * @param {string} appSysId - Application sys_id.
     * @return {Array} List of modules.
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
            gs.error(this.LOG_PREFIX + 'Error listing modules: ' + ex.message);
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
            module_id: gr.getValue('module_id'),
            name: gr.getValue('name'),
            display_name: gr.getValue('display_name'),
            application: gr.getValue('application'),
            description: gr.getValue('description'),
            type: gr.getValue('type'),
            version: gr.getValue('version'),
            status: gr.getValue('status'),
            owner: gr.getValue('owner'),
            active: gr.getValue('active') == '1'
        };
    },

    type: 'AppForgeModuleRegistry'
};
