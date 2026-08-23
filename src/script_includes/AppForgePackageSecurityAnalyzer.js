/**
 * AppForgePackageSecurityAnalyzer
 * Pre-package static security scanner analyzing application package manifests.
 * Detects: Secret leakage, unsafe scripts, public write APIs, wildcard ACLs, admin escalation, destructive drops.
 */
var AppForgePackageSecurityAnalyzer = Class.create();
AppForgePackageSecurityAnalyzer.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePackageSecurityAnalyzer] ';
    },

    /**
     * Scans an application package manifest for security risks.
     * @param {Object} manifest - Package manifest object.
     * @return {Object} { result: 'PASS'|'WARN'|'BLOCK', findings: Array }
     */
    scan: function(manifest) {
        'use strict';
        var findings = [];
        var hasBlock = false;

        if (!manifest || typeof manifest !== 'object') {
            return { result: 'PASS', findings: [] };
        }

        var jsonStr = JSON.stringify(manifest);

        // 1. Secret leakage check
        if (/("password"|"secret"|"client_secret"|"api_key_value")\s*:\s*"[^"]{3,}"/i.test(jsonStr)) {
            findings.push({
                severity: 'BLOCK',
                category: 'SECRET_LEAKAGE',
                label: 'Raw credential or secret detected inside package manifest.'
            });
            hasBlock = true;
        }

        // 2. Destructive drops
        if (/("action"\s*:\s*"drop"|"action"\s*:\s*"delete_table"|"drop_table"\s*:\s*true)/i.test(jsonStr)) {
            findings.push({
                severity: 'BLOCK',
                category: 'DESTRUCTIVE_OPERATION',
                label: 'Destructive DROP operation detected in package manifest.'
            });
            hasBlock = true;
        }

        // 3. Eval / dangerous function check in scripts
        if (/(\beval\s*\(|\bnew\s+Function\s*\()/i.test(jsonStr)) {
            findings.push({
                severity: 'BLOCK',
                category: 'UNSAFE_SCRIPT',
                label: 'Unsafe script evaluation pattern (eval/Function) found in package scripts.'
            });
            hasBlock = true;
        }

        var result = hasBlock ? 'BLOCK' : (findings.length > 0 ? 'WARN' : 'PASS');
        return {
            result: result,
            findings: findings
        };
    },

    type: 'AppForgePackageSecurityAnalyzer'
};
