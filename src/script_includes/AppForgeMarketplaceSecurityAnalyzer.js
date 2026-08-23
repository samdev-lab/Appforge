/**
 * AppForgeMarketplaceSecurityAnalyzer
 * Scans marketplace applications and packages for dangerous code, credentials,
 * unapproved cross-scope modifications, and SQL/eval injection patterns.
 */
var AppForgeMarketplaceSecurityAnalyzer = Class.create();
AppForgeMarketplaceSecurityAnalyzer.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMarketplaceSecurityAnalyzer] ';
    },

    /**
     * Scans an application package manifest for security violations.
     * @param {Object} packageManifest - Package manifest.
     * @return {Object} Security scan analysis result.
     */
    analyzePackage: function(packageManifest) {
        'use strict';
        var findings = [];
        var maxSev = 'INFO';
        var passed = true;

        if (!packageManifest) {
            return { passed: false, max_severity: 'CRITICAL', findings: [{ severity: 'CRITICAL', rule: 'MISSING_PACKAGE', message: 'Package manifest is missing' }] };
        }

        var jsonStr = JSON.stringify(packageManifest);

        // 1. Raw Secrets & API Key Detection
        if (/(?:["']?(?:password|passwd|pwd|secret|api[_-]?key|bearer|private[_-]?key)["']?)\s*[:=]\s*["'](?![R\[])[^"',\s]{6,}["']/i.test(jsonStr)) {
            findings.push({ severity: 'CRITICAL', rule: 'RAW_CREDENTIAL_DETECTED', message: 'Raw credentials or API keys found in application package.' });
            maxSev = 'CRITICAL';
            passed = false;
        }

        // 2. Anti-SQL and dangerous code execution
        if (/(\beval\s*\(|\bnew\s+Function\s*\(|SELECT\s+.*\s+FROM|DROP\s+TABLE|ALTER\s+TABLE|GlideDBConnection|jdbc:|child_process|execSync)/i.test(jsonStr)) {
            findings.push({ severity: 'CRITICAL', rule: 'DANGEROUS_CODE_EXECUTION', message: 'Prohibited execution pattern (eval, Function, SQL, JDBC, shell) detected.' });
            maxSev = 'CRITICAL';
            passed = false;
        }

        // 3. Unapproved Cross-Scope Modification
        if (/"table"\s*:\s*"(?:incident|problem|change_request|sys_user|sys_properties)"/i.test(jsonStr)) {
            findings.push({ severity: 'HIGH', rule: 'UNAPPROVED_CROSS_SCOPE_ACCESS', message: 'Unapproved modification of ServiceNow platform core tables.' });
            if (maxSev !== 'CRITICAL') maxSev = 'HIGH';
            passed = false;
        }

        // 4. Missing Signature / Integrity Check
        if (!packageManifest.signature && !packageManifest.checksum) {
            findings.push({ severity: 'MEDIUM', rule: 'UNSIGNED_PACKAGE', message: 'Package lacks cryptographic signature or checksum.' });
            if (maxSev === 'INFO' || maxSev === 'LOW') maxSev = 'MEDIUM';
        }

        return {
            passed: passed,
            max_severity: maxSev,
            findings_count: findings.length,
            findings: findings,
            timestamp: new GlideDateTime().getValue()
        };
    },

    type: 'AppForgeMarketplaceSecurityAnalyzer'
};
