/**
 * AppForgeCatalogLifecycleManager
 * Manages the complete lifecycle states, versioning, rollback, cloning, and diff comparisons of Catalog Factory definitions.
 */
var AppForgeCatalogLifecycleManager = Class.create();
AppForgeCatalogLifecycleManager.prototype = {
    initialize: function() {
        'use strict';
        this.STATES = [
            'Draft', 'Validation', 'Pending Approval', 'Approved',
            'Generating', 'Generated', 'Testing', 'Published', 'Retired'
        ];
    },

    /**
     * Transitions a catalog request to the next valid lifecycle state.
     */
    transitionState: function(currentRecord, targetState, actor) {
        'use strict';
        if (!currentRecord) {
            throw new Error('Current record must be provided for state transition.');
        }

        if (this.STATES.indexOf(targetState) === -1) {
            throw new Error('Invalid lifecycle state: "' + targetState + '".');
        }

        var prevState = currentRecord.state || 'Draft';
        currentRecord.state = targetState;
        currentRecord.updated_by = actor || 'admin';
        currentRecord.updated_on = new Date().toISOString();

        if (!currentRecord.state_history) {
            currentRecord.state_history = [];
        }

        currentRecord.state_history.push({
            from: prevState,
            to: targetState,
            actor: actor || 'admin',
            timestamp: new Date().toISOString()
        });

        return currentRecord;
    },

    /**
     * Creates a new version of an existing Catalog Item configuration.
     */
    createVersion: function(existingSpec, versionType) {
        'use strict';
        if (!existingSpec) {
            throw new Error('Existing specification required to increment version.');
        }

        var currentVersion = existingSpec.version || '1.0';
        var parts = currentVersion.split('.');
        var major = parseInt(parts[0], 10) || 1;
        var minor = parseInt(parts[1], 10) || 0;

        if (versionType === 'major') {
            major += 1;
            minor = 0;
        } else {
            minor += 1;
        }

        var newSpec = JSON.parse(JSON.stringify(existingSpec));
        newSpec.version = major + '.' + minor;
        newSpec.previous_version = currentVersion;
        newSpec.state = 'Draft';
        newSpec.version_created_on = new Date().toISOString();

        return newSpec;
    },

    /**
     * Compares two versions and returns structural diff.
     */
    compareVersions: function(oldSpec, newSpec) {
        'use strict';
        oldSpec = oldSpec || {};
        newSpec = newSpec || {};

        var diff = {
            old_version: oldSpec.version || '1.0',
            new_version: newSpec.version || '1.1',
            variables_added: [],
            variables_removed: [],
            tasks_added: [],
            tasks_removed: [],
            property_changes: []
        };

        var oldVars = (oldSpec.variables || []).map(function(v) { return v.name; });
        var newVars = (newSpec.variables || []).map(function(v) { return v.name; });

        for (var i = 0; i < newVars.length; i++) {
            if (oldVars.indexOf(newVars[i]) === -1) diff.variables_added.push(newVars[i]);
        }
        for (var j = 0; j < oldVars.length; j++) {
            if (newVars.indexOf(oldVars[j]) === -1) diff.variables_removed.push(oldVars[j]);
        }

        if (oldSpec.name !== newSpec.name) {
            diff.property_changes.push({ property: 'name', old_val: oldSpec.name, new_val: newSpec.name });
        }
        if (oldSpec.category !== newSpec.category) {
            diff.property_changes.push({ property: 'category', old_val: oldSpec.category, new_val: newSpec.category });
        }

        return diff;
    },

    /**
     * Clones an existing catalog specification into a new item definition.
     */
    cloneCatalog: function(sourceSpec, newName, options) {
        'use strict';
        if (!sourceSpec) throw new Error('Source specification is required for cloning.');
        options = options || {};

        var cloned = JSON.parse(JSON.stringify(sourceSpec));
        cloned.name = newName || (sourceSpec.name + ' (Copy)');
        cloned.version = '1.0';
        cloned.state = 'Draft';
        cloned.cloned_from = sourceSpec.name;

        if (options.exclude_variables === true) cloned.variables = [];
        if (options.exclude_tasks === true) cloned.tasks = [];
        if (options.exclude_approvals === true) cloned.approvals = [];

        return cloned;
    },

    type: 'AppForgeCatalogLifecycleManager'
};
