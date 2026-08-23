/**
 * AppForgeReleaseNotesGenerator
 * Generates structured, deterministic release notes from package difference analysis.
 */
var AppForgeReleaseNotesGenerator = Class.create();
AppForgeReleaseNotesGenerator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeReleaseNotesGenerator] ';
    },

    /**
     * Generates markdown release notes for an application version upgrade.
     * @param {string} appName - Application name.
     * @param {string} version - New version string.
     * @param {Object} diff - Output from AppForgePackageDiffEngine.
     * @return {string} Formatted release notes markdown.
     */
    generateReleaseNotes: function(appName, version, diff) {
        'use strict';
        var lines = [];
        lines.push('# Release Notes — ' + (appName || 'Application') + ' ' + (version || 'v1.0.0'));
        lines.push('');

        if (diff.breaking && diff.breaking.length > 0) {
            lines.push('### ⚠️ Breaking Changes');
            for (var b = 0; b < diff.breaking.length; b++) {
                lines.push('- **' + diff.breaking[b].type + '**: ' + diff.breaking[b].name + ' (' + diff.breaking[b].detail + ')');
            }
            lines.push('');
        }

        if (diff.added && diff.added.length > 0) {
            lines.push('### 🚀 What\'s New');
            for (var a = 0; a < diff.added.length; a++) {
                lines.push('- Added ' + diff.added[a].type + ': `' + diff.added[a].name + '`');
            }
            lines.push('');
        }

        if (diff.modified && diff.modified.length > 0) {
            lines.push('### 🔄 Changes & Improvements');
            for (var m = 0; m < diff.modified.length; m++) {
                lines.push('- Updated ' + diff.modified[m].type + ': `' + diff.modified[m].name + '` (' + (diff.modified[m].detail || 'modified') + ')');
            }
            lines.push('');
        }

        if (diff.removed && diff.removed.length > 0) {
            lines.push('### 🗑️ Deprecations & Removals');
            for (var r = 0; r < diff.removed.length; r++) {
                lines.push('- Removed ' + diff.removed[r].type + ': `' + diff.removed[r].name + '`');
            }
            lines.push('');
        }

        if (!diff.has_changes) {
            lines.push('No functional changes in this release.');
        }

        return lines.join('\n');
    },

    type: 'AppForgeReleaseNotesGenerator'
};
