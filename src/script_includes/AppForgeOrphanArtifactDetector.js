/**
 * AppForgeOrphanArtifactDetector
 * Non-destructive Orphan Artifact Detection and Reporting Engine for AppForge Applications.
 *
 * Scans, classifies, and reports orphan tables, fields, roles, ACLs, menus, modules,
 * business rules, and configuration records without automated destruction.
 */
var AppForgeOrphanArtifactDetector = Class.create();
AppForgeOrphanArtifactDetector.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeOrphanArtifactDetector] ';
        this.ownershipRegistry = new AppForgeArtifactOwnershipRegistry();
    },

    /**
     * Scans registered artifacts against active installed application keys.
     * @param {Array<string>} activeInstalledApps
     * @return {Object} Orphan report bundle
     */
    scanForOrphans: function(activeInstalledApps) {
        'use strict';
        var activeSet = (activeInstalledApps || []).map(function(k) {
            return k.toLowerCase().replace(/[\s-]+/g, '_');
        });

        var store = (AppForgeArtifactOwnershipRegistry._store && AppForgeArtifactOwnershipRegistry._store.artifacts) || (this.ownershipRegistry && this.ownershipRegistry._store && this.ownershipRegistry._store.artifacts) || {};
        var orphans = [];
        var categorized = {
            tables: [],
            fields: [],
            roles: [],
            acls: [],
            menus: [],
            modules: [],
            flows: [],
            business_rules: [],
            configurations: [],
            other: []
        };

        for (var artifactId in store) {
            var item = store[artifactId];
            // If item is not shared and its owner application is not active, classify as orphan
            if (!item.is_shared && activeSet.indexOf(item.owner) === -1) {
                var orphanObj = {
                    id: item.id,
                    owner: item.owner,
                    type: item.type,
                    registered_version: item.version,
                    status: 'ORPHAN_DETECTED'
                };
                orphans.push(orphanObj);

                var cat = item.type.toLowerCase();
                if (!cat.endsWith('s')) cat += 's';
                if (categorized[cat]) {
                    categorized[cat].push(item.id);
                } else {
                    categorized.other.push(item.id);
                }
            }
        }

        return {
            timestamp: new Date().toISOString(),
            total_scanned: Object.keys(store).length,
            orphan_count: orphans.length,
            has_orphans: orphans.length > 0,
            orphans: orphans,
            by_category: categorized,
            governance_action_required: orphans.length > 0 ? 'REVIEW_AND_APPROVE_CLEANUP' : 'NONE'
        };
    },

    type: 'AppForgeOrphanArtifactDetector'
};
