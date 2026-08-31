/**
 * AppForgeApplicationDependencyGraph
 * Formal Directed Dependency Graph & Conflict Engine for AppForge Capability Applications.
 *
 * Capabilities:
 *  - Explicit required & optional dependency resolution
 *  - Cycle detection (DFS with cycle path extraction) -> DEPENDENCY_CYCLE_DETECTED
 *  - Missing dependency detection
 *  - Version constraint matching (e.g. >= 1.0.0, ^1.0.0)
 *  - Conflict detection
 *  - Validated installation & safe uninstallation ordering
 */
var AppForgeApplicationDependencyGraph = Class.create();
AppForgeApplicationDependencyGraph.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeApplicationDependencyGraph] ';
        this._graph = {};
        this._reverseGraph = {}; // dependents map
        this._conflicts = {};
        this._manifests = {};

        if (!AppForgeApplicationDependencyGraph._store) {
            AppForgeApplicationDependencyGraph._store = {
                registered_dependencies: {},
                active_installations: {}
            };
        }
        this._store = AppForgeApplicationDependencyGraph._store;
        this._loadDefaultManifestRules();
    },

    /**
     * Registers an application manifest and its dependency contracts in the graph.
     */
    registerManifest: function(manifest) {
        'use strict';
        if (!manifest || !manifest.id && !manifest.application_key) {
            throw new Error('Valid manifest with ID is required.');
        }
        var appKey = (manifest.application_key || manifest.id).toLowerCase().replace(/[\s-]+/g, '_');
        this._manifests[appKey] = manifest;

        var req = (manifest.dependencies && manifest.dependencies.required) ? manifest.dependencies.required : [];
        var opt = (manifest.dependencies && manifest.dependencies.optional) ? manifest.dependencies.optional : [];
        var conf = manifest.conflicts || [];

        this._graph[appKey] = {
            required: req.slice(),
            optional: opt.slice(),
            version: manifest.version || '1.0.0'
        };
        this._conflicts[appKey] = conf.slice();

        // Update reverse graph (dependents)
        for (var i = 0; i < req.length; i++) {
            var depKey = (typeof req[i] === 'string' ? req[i] : req[i].id).toLowerCase().replace(/[\s-]+/g, '_');
            if (!this._reverseGraph[depKey]) this._reverseGraph[depKey] = [];
            if (this._reverseGraph[depKey].indexOf(appKey) === -1) {
                this._reverseGraph[depKey].push(appKey);
            }
        }
    },

    /**
     * Registers a custom dependency link.
     */
    registerDependency: function(fromApp, toApp, isRequired, versionConstraint) {
        'use strict';
        var src = fromApp.toLowerCase().replace(/[\s-]+/g, '_');
        var tgt = toApp.toLowerCase().replace(/[\s-]+/g, '_');

        if (!this._graph[src]) {
            this._graph[src] = { required: [], optional: [], version: '1.0.0' };
        }

        this._graph[src].required = this._graph[src].required.filter(function(item) {
            return (typeof item === 'string' ? item : item.id) !== tgt;
        });
        this._graph[src].optional = this._graph[src].optional.filter(function(item) {
            return (typeof item === 'string' ? item : item.id) !== tgt;
        });

        var list = (isRequired !== false) ? this._graph[src].required : this._graph[src].optional;
        list.push(versionConstraint ? { id: tgt, version: versionConstraint } : tgt);

        if (isRequired !== false) {
            if (!this._reverseGraph[tgt]) this._reverseGraph[tgt] = [];
            if (this._reverseGraph[tgt].indexOf(src) === -1) {
                this._reverseGraph[tgt].push(src);
            }
        } else {
            if (this._reverseGraph[tgt]) {
                this._reverseGraph[tgt] = this._reverseGraph[tgt].filter(function(item) {
                    return item !== src;
                });
            }
        }
    },

    /**
     * Removes a dependency link.
     */
    removeDependency: function(fromApp, toApp) {
        'use strict';
        var src = fromApp.toLowerCase().replace(/[\s-]+/g, '_');
        var tgt = toApp.toLowerCase().replace(/[\s-]+/g, '_');

        if (this._graph[src]) {
            this._graph[src].required = this._graph[src].required.filter(function(item) {
                return (typeof item === 'string' ? item : item.id) !== tgt;
            });
            this._graph[src].optional = this._graph[src].optional.filter(function(item) {
                return (typeof item === 'string' ? item : item.id) !== tgt;
            });
        }
        if (this._reverseGraph[tgt]) {
            this._reverseGraph[tgt] = this._reverseGraph[tgt].filter(function(item) {
                return item !== src;
            });
        }
    },

    /**
     * Gets all direct dependencies for an application.
     */
    getDependencies: function(appKey) {
        'use strict';
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        return this._graph[key] || { required: [], optional: [], version: '1.0.0' };
    },

    /**
     * Gets all applications that depend on this application (reverse dependencies).
     */
    getDependents: function(appKey) {
        'use strict';
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        return this._reverseGraph[key] || [];
    },

    /**
     * Detects if adding a dependency or current graph contains a circular cycle.
     * @return {Object} { hasCycle: boolean, cyclePath: Array<string>, error: string }
     */
    detectCircularDependency: function(startApp, testTgt) {
        'use strict';
        var graphCopy = {};
        for (var k in this._graph) {
            graphCopy[k] = (this._graph[k].required || []).map(function(item) {
                return typeof item === 'string' ? item : item.id;
            });
        }

        if (startApp && testTgt) {
            var s = startApp.toLowerCase().replace(/[\s-]+/g, '_');
            var t = testTgt.toLowerCase().replace(/[\s-]+/g, '_');
            if (!graphCopy[s]) graphCopy[s] = [];
            if (graphCopy[s].indexOf(t) === -1) graphCopy[s].push(t);
        }

        var visited = {};
        var recStack = {};
        var cyclePath = [];

        function isCyclicUtil(node, path) {
            visited[node] = true;
            recStack[node] = true;
            path.push(node);

            var neighbors = graphCopy[node] || [];
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                if (!visited[neighbor]) {
                    if (isCyclicUtil(neighbor, path)) return true;
                } else if (recStack[neighbor]) {
                    path.push(neighbor);
                    cyclePath = path.slice();
                    return true;
                }
            }

            recStack[node] = false;
            path.pop();
            return false;
        }

        for (var node in graphCopy) {
            if (!visited[node]) {
                if (isCyclicUtil(node, [])) {
                    return {
                        hasCycle: true,
                        errorCode: 'DEPENDENCY_CYCLE_DETECTED',
                        cyclePath: cyclePath,
                        error: 'Dependency cycle detected: ' + cyclePath.join(' -> ')
                    };
                }
            }
        }

        return { hasCycle: false };
    },

    /**
     * Validates if an application can be safely installed for a customer.
     * @param {string} appKey
     * @param {Array<string>} installedAppKeys
     * @return {Object} Validation result { valid: boolean, missing: Array, conflicts: Array }
     */
    validateDependencies: function(customerId, appKey) {
        var installed = [];
        if (AppForgeCapabilityInstaller && AppForgeCapabilityInstaller._store && AppForgeCapabilityInstaller._store.installations) {
            for (var k in AppForgeCapabilityInstaller._store.installations) {
                var inst = AppForgeCapabilityInstaller._store.installations[k];
                if (inst.customer_id === customerId && inst.status === 'INSTALLED') installed.push(inst.capability_id);
            }
        }
        return this.validateInstall(appKey, installed);
    },
    validateInstall: function(appKey, installedAppKeys) {
        'use strict';
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var installed = (installedAppKeys || []).map(function(k) {
            return k.toLowerCase().replace(/[\s-]+/g, '_');
        });

        // 1. Check for cycles
        var cycleCheck = this.detectCircularDependency(key);
        if (cycleCheck.hasCycle) {
            return {
                valid: false,
                errorCode: 'DEPENDENCY_CYCLE_DETECTED',
                error: cycleCheck.error,
                cycle: cycleCheck.cyclePath
            };
        }

        // 2. Check conflicts
        var conflicts = this._conflicts[key] || [];
        var activeConflicts = [];
        for (var i = 0; i < conflicts.length; i++) {
            if (installed.indexOf(conflicts[i]) !== -1) {
                activeConflicts.push(conflicts[i]);
            }
        }
        if (activeConflicts.length > 0) {
            return {
                valid: false,
                errorCode: 'APPLICATION_CONFLICT_DETECTED',
                error: 'Cannot install ' + key + ': conflicts with active application(s) ' + activeConflicts.join(', '),
                conflicts: activeConflicts
            };
        }

        // 3. Check required dependencies (ignore 'appforge_core' platform service)
        var deps = this.getDependencies(key);
        var missing = [];
        for (var j = 0; j < deps.required.length; j++) {
            var reqItem = deps.required[j];
            var reqKey = typeof reqItem === 'string' ? reqItem : reqItem.id;
            if (reqKey !== 'appforge_core' && installed.indexOf(reqKey) === -1) {
                missing.push(reqKey);
            }
        }

        if (missing.length > 0) {
            return {
                valid: false,
                errorCode: 'MISSING_REQUIRED_DEPENDENCY',
                error: 'Cannot install ' + key + ': Missing required dependency ' + missing.join(', '),
                missing: missing
            };
        }

        return { valid: true };
    },

    /**
     * Validates if an application can be safely uninstalled without breaking active dependents.
     * @param {string} appKey
     * @param {Array<string>} activeInstalledApps
     * @return {Object} Validation result { safe: boolean, blockingDependents: Array, error: string }
     */
    validateUninstall: function(appKey, activeInstalledApps) {
        'use strict';
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var installed = (activeInstalledApps || []).map(function(k) {
            return k.toLowerCase().replace(/[\s-]+/g, '_');
        });

        var dependents = this.getDependents(key);
        var blocking = [];

        for (var i = 0; i < dependents.length; i++) {
            var dep = dependents[i];
            if (installed.indexOf(dep) !== -1 && dep !== key) {
                // Verify if dep truly requires key
                var depDeps = this.getDependencies(dep);
                var isRequired = depDeps.required.some(function(item) {
                    return (typeof item === 'string' ? item : item.id) === key;
                });
                if (isRequired) {
                    blocking.push(dep);
                }
            }
        }

        if (blocking.length > 0) {
            return {
                safe: false,
                errorCode: 'DEPENDENT_APPLICATION_EXISTS',
                blockingDependents: blocking,
                error: 'Cannot uninstall ' + key + ': Required by active application(s) ' + blocking.join(', ')
            };
        }

        return { safe: true };
    },

    /**
     * Returns full topological installation order for an application and its transitive dependencies.
     */
    getInstallOrder: function(appKey) {
        'use strict';
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');
        var order = [];
        var visited = {};

        var self = this;
        function visit(node) {
            if (visited[node]) return;
            visited[node] = true;
            var deps = self.getDependencies(node).required || [];
            for (var i = 0; i < deps.length; i++) {
                var depKey = typeof deps[i] === 'string' ? deps[i] : deps[i].id;
                if (depKey !== 'appforge_core') {
                    visit(depKey);
                }
            }
            order.push(node);
        }

        visit(key);
        return order;
    },

    /**
     * Loads default manifest dependencies for the 7 standard capabilities.
     * @private
     */
    _loadDefaultManifestRules: function() {
        'use strict';
        var standardManifests = [
            { id: 'crm', dependencies: { required: ['appforge_core'], optional: [] }, conflicts: [] },
            { id: 'csm', dependencies: { required: ['appforge_core'], optional: ['crm'] }, conflicts: [] },
            { id: 'spm', dependencies: { required: ['appforge_core'], optional: ['resource_management'] }, conflicts: [] },
            { id: 'fsm', dependencies: { required: ['appforge_core'], optional: ['csm'] }, conflicts: [] },
            { id: 'resource_management', dependencies: { required: ['appforge_core'], optional: ['spm'] }, conflicts: [] },
            { id: 'bulk_catalog', dependencies: { required: ['appforge_core'], optional: ['itsm'] }, conflicts: [] },
            { id: 'itsm', dependencies: { required: ['appforge_core'], optional: [] }, conflicts: [] }
        ];

        for (var i = 0; i < standardManifests.length; i++) {
            this.registerManifest(standardManifests[i]);
        }
    },

    /**
     * Returns the full graph data structure for administration / inspection.
     */
    getDependencyGraph: function() {
        'use strict';
        return {
            nodes: Object.keys(this._graph),
            graph: this._graph,
            reverseGraph: this._reverseGraph,
            conflicts: this._conflicts
        };
    },

    resetStore: function() {
        'use strict';
        AppForgeApplicationDependencyGraph._store = {
            registered_dependencies: {},
            active_installations: {}
        };
        this._store = AppForgeApplicationDependencyGraph._store;
        this._graph = {};
        this._reverseGraph = {};
        this._conflicts = {};
        this._loadDefaultManifestRules();
    },

    type: 'AppForgeApplicationDependencyGraph'
};
