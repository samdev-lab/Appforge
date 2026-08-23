/**
 * AppForgePackageCompatibilityChecker
 * Validates package compatibility with target environment, platform version, and enforces downgrade protection.
 */
var AppForgePackageCompatibilityChecker = Class.create();
AppForgePackageCompatibilityChecker.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePackageCompatibilityChecker] ';
        this.SUPPORTED_ENVIRONMENTS = ['DEV', 'TEST', 'UAT', 'PRODUCTION'];
    },

    /**
     * Checks if a package is compatible with the target environment and version state.
     * @param {Object} packageManifest - Package manifest.
     * @param {string} targetEnvironment - Environment name (e.g. TEST, UAT, PRODUCTION).
     * @param {string} [currentInstalledVersion] - Existing installed version in target instance.
     * @return {Object} { compatible: boolean, status: string, issues: Array }
     */
    checkCompatibility: function(packageManifest, targetEnvironment, currentInstalledVersion) {
        'use strict';
        var issues = [];

        if (!packageManifest) {
            return { compatible: false, status: 'INCOMPATIBLE', issues: ['Package manifest missing'] };
        }

        var env = (targetEnvironment || 'TEST').toUpperCase();
        if (this.SUPPORTED_ENVIRONMENTS.indexOf(env) === -1) {
            issues.push('Invalid target environment: ' + targetEnvironment + '. Supported: ' + this.SUPPORTED_ENVIRONMENTS.join(', '));
        }

        // Downgrade protection
        if (currentInstalledVersion && packageManifest.version) {
            var cmp = this._compareSemver(packageManifest.version, currentInstalledVersion);
            if (cmp < 0) {
                issues.push('DOWNGRADE NOT PERMITTED: Cannot downgrade from ' + currentInstalledVersion + ' to ' + packageManifest.version);
            }
        }

        var isCompatible = issues.length === 0;
        return {
            compatible: isCompatible,
            status: isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE',
            target_environment: env,
            issues: issues
        };
    },

    /**
     * Helper to compare semantic versions.
     * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
     * @private
     */
    _compareSemver: function(v1, v2) {
        'use strict';
        var p1 = v1.replace(/^v/, '').split('.').map(function(x) { return parseInt(x, 10) || 0; });
        var p2 = v2.replace(/^v/, '').split('.').map(function(x) { return parseInt(x, 10) || 0; });

        for (var i = 0; i < 3; i++) {
            var a = p1[i] || 0;
            var b = p2[i] || 0;
            if (a > b) return 1;
            if (a < b) return -1;
        }
        return 0;
    },

    type: 'AppForgePackageCompatibilityChecker'
};
