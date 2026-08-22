/**
 * AppForgeTableNameGenerator
 * Centralized service for generating physical ServiceNow table names enforcing scope prefixes,
 * snake_case formatting, maximum length constraints, and reserved-word protection.
 */
var AppForgeTableNameGenerator = Class.create();
AppForgeTableNameGenerator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTableNameGenerator] ';
        this.RESERVED_NAMES = [
            'sys_user', 'task', 'cmdb', 'cmdb_ci', 'incident',
            'problem', 'change_request', 'sys_metadata', 'sys_app',
            'sys_audit', 'sys_log', 'sys_journal_field'
        ];
    },

    /**
     * Generates a valid physical table name for a schema.
     * @param {string} scope - Application scope (e.g. x_appforge).
     * @param {string} appName - Application name.
     * @param {string} schemaName - Schema entity name.
     * @return {Object} { valid: boolean, physical_table: string, error: string }.
     */
    generate: function(scope, appName, schemaName) {
        'use strict';
        if (!schemaName) {
            return { valid: false, physical_table: '', error: 'schemaName is mandatory' };
        }

        var prefix = scope ? scope.toLowerCase().trim() : 'x_appforge';
        if (prefix.indexOf('x_') !== 0) {
            prefix = 'x_appforge_' + prefix;
        }

        var cleanApp = (appName || '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        var cleanSchema = schemaName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');

        var physicalTable = prefix;
        if (cleanApp && cleanApp !== 'appforge') {
            physicalTable += '_' + cleanApp;
        }
        physicalTable += '_' + cleanSchema;

        // Truncate to maximum ServiceNow table name length (80 chars)
        if (physicalTable.length > 80) {
            physicalTable = physicalTable.substring(0, 80);
        }

        // Reserved word check
        if (this.RESERVED_NAMES.indexOf(cleanSchema) !== -1 || this.RESERVED_NAMES.indexOf(physicalTable) !== -1) {
            return {
                valid: false,
                physical_table: physicalTable,
                error: 'Physical table name (' + physicalTable + ') collides with a reserved ServiceNow core table'
            };
        }

        return {
            valid: true,
            physical_table: physicalTable,
            error: null
        };
    },

    type: 'AppForgeTableNameGenerator'
};
