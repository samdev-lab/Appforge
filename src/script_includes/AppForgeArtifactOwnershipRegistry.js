/**
 * AppForgeArtifactOwnershipRegistry
 * Authoritative Registry for Application-Level Artifact Ownership & Cross-Application Protection.
 *
 * Enforces:
 *  - Immutable ownership for every table, field, role, ACL, menu, module, business rule, and flow.
 *  - Cross-application modification blocking -> CROSS_APPLICATION_MODIFICATION_BLOCKED
 *  - Package inventory validation -> FOREIGN_ARTIFACT_DETECTED, ARTIFACT_COLLISION
 */
var AppForgeArtifactOwnershipRegistry = Class.create();
AppForgeArtifactOwnershipRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeArtifactOwnershipRegistry] ';

        if (!AppForgeArtifactOwnershipRegistry._store) {
            AppForgeArtifactOwnershipRegistry._store = {
                artifacts: {}, // artifactId -> ownership record
                app_artifacts: {}, // appKey -> array of artifactIds
                shared_artifacts: {}
            };
        }
        this._store = AppForgeArtifactOwnershipRegistry._store;
    },

    /**
     * Registers ownership of an artifact to a specific application.
     */
    registerArtifact: function(appKey, packageVersion, artifactType, artifactId, isShared) {
        'use strict';
        if (!appKey || !artifactId) throw new Error('Application key and Artifact ID are required.');
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var id = String(artifactId).trim();

        // Collision Check: Check if artifact already registered to a different application
        if (this._store.artifacts[id] && this._store.artifacts[id].owner !== key && !isShared) {
            return {
                success: false,
                errorCode: 'ARTIFACT_COLLISION',
                error: 'Artifact ' + id + ' is already owned by ' + this._store.artifacts[id].owner
            };
        }

        var record = {
            id: id,
            owner: key,
            version: packageVersion || '1.0.0',
            type: artifactType || 'unknown',
            is_shared: !!isShared,
            registered_at: new Date().toISOString()
        };

        this._store.artifacts[id] = record;
        if (!this._store.app_artifacts[key]) this._store.app_artifacts[key] = [];
        if (this._store.app_artifacts[key].indexOf(id) === -1) {
            this._store.app_artifacts[key].push(id);
        }

        if (isShared) {
            this._store.shared_artifacts[id] = true;
        }

        return { success: true, artifact: record };
    },

    /**
     * Returns ownership record for an artifact.
     */
    getArtifactOwner: function(artifactId) {
        'use strict';
        if (!artifactId) return null;
        return this._store.artifacts[String(artifactId).trim()] || null;
    },

    /**
     * Lists all artifacts owned by an application.
     */
    listArtifactsByApplication: function(appKey) {
        'use strict';
        if (!appKey) return [];
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var ids = this._store.app_artifacts[key] || [];
        var self = this;
        return ids.map(function(id) {
            return self._store.artifacts[id];
        }).filter(Boolean);
    },

    /**
     * Validates whether a requesting application has permission to mutate a target artifact.
     */
    validateModificationPermission: function(requestingAppKey, targetArtifactId) {
        'use strict';
        if (!requestingAppKey || !targetArtifactId) {
            return { permitted: false, error: 'Requesting app and target artifact are required.' };
        }
        var reqKey = requestingAppKey.toLowerCase().replace(/[\s-]+/g, '_');
        var ownerRec = this.getArtifactOwner(targetArtifactId);

        // If artifact is not registered, or is shared, allow
        if (!ownerRec || ownerRec.is_shared) {
            return { permitted: true, owner: ownerRec ? ownerRec.owner : 'unregistered' };
        }

        // If owned by requesting app, allow
        if (ownerRec.owner === reqKey) {
            return { permitted: true, owner: ownerRec.owner };
        }

        // Otherwise block cross-application mutation
        return {
            permitted: false,
            errorCode: 'CROSS_APPLICATION_MODIFICATION_BLOCKED',
            owner: ownerRec.owner,
            targetArtifact: targetArtifactId,
            error: 'Cross-application mutation blocked: ' + reqKey + ' cannot modify artifact ' + targetArtifactId + ' owned by ' + ownerRec.owner
        };
    },

    /**
     * Validates package inventory for foreign artifacts or collisions.
     */
    validatePackageInventory: function(appKey, declaredArtifacts) {
        'use strict';
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var foreign = [];
        var collisions = [];

        for (var i = 0; i < declaredArtifacts.length; i++) {
            var item = declaredArtifacts[i];
            var id = typeof item === 'string' ? item : item.id;
            var owner = this.getArtifactOwner(id);

            if (owner && owner.owner !== key && !owner.is_shared) {
                foreign.push({ artifactId: id, currentOwner: owner.owner });
                collisions.push(id);
            }
        }

        if (foreign.length > 0) {
            return {
                valid: false,
                errorCode: 'FOREIGN_ARTIFACT_DETECTED',
                foreignArtifacts: foreign,
                collisions: collisions,
                error: 'Package contains ' + foreign.length + ' foreign artifacts owned by other applications.'
            };
        }

        return { valid: true };
    },

    /**
     * Unregisters all artifacts owned by an application on uninstall.
     */
    unregisterApplicationArtifacts: function(appKey) {
        'use strict';
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var ids = this._store.app_artifacts[key] || [];

        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            // Only unregister non-shared artifacts
            if (this._store.artifacts[id] && !this._store.artifacts[id].is_shared) {
                delete this._store.artifacts[id];
            }
        }
        delete this._store.app_artifacts[key];
        return { success: true, unregistered_count: ids.length };
    },

    resetStore: function() {
        'use strict';
        AppForgeArtifactOwnershipRegistry._store = {
            artifacts: {},
            app_artifacts: {},
            shared_artifacts: {}
        };
        this._store = AppForgeArtifactOwnershipRegistry._store;
    },

    type: 'AppForgeArtifactOwnershipRegistry'
};
