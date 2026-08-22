/**
 * AppForgeSecurityAnalyzer
 * Static security analysis scanner evaluating security definitions for:
 *   - Administrative Lockout Risk (BLOCK)
 *   - Cross-Scope Access (BLOCK)
 *   - Public / Unrestricted Access (WARN / BLOCK)
 *   - Admin Privilege Escalation (BLOCK)
 *   - Wildcard ACL Exposure (WARN)
 *   - Sensitive Field Exposure (WARN / BLOCK)
 */
var AppForgeSecurityAnalyzer = Class.create();
AppForgeSecurityAnalyzer.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSecurityAnalyzer] ';
        this.SENSITIVE_FIELDS = ['salary', 'ssn', 'social_security', 'password', 'token', 'secret', 'bank_account', 'credit_card'];
    },

    /**
     * Analyzes security definition for risk factors.
     * @param {Object} secDef - Security definition payload.
     * @param {string} [appScope] - Application scope prefix.
     * @return {Object} { result: 'PASS'|'WARN'|'BLOCK', findings: Array, lockout_risk: boolean }
     */
    analyze: function(secDef, appScope) {
        'use strict';
        var findings = [];
        var lockoutRisk = false;
        var hasBlock = false;

        if (!secDef || typeof secDef !== 'object') {
            return { result: 'PASS', findings: [], lockout_risk: false };
        }

        var acls = secDef.acls || [];

        for (var i = 0; i < acls.length; i++) {
            var acl = acls[i];
            var targetTable = acl.table || acl.table_name || '';
            var targetField = acl.field || acl.field_name || '*';
            var op = (acl.operation || 'read').toLowerCase();
            var roles = acl.roles || [];

            // 1. Lockout Risk Check
            if (acl.lockout_test === true || (acl.admin_overrides === false && roles.indexOf('admin') === -1 && roles.length === 0)) {
                findings.push({
                    severity: 'BLOCK',
                    category: 'LOCKOUT_RISK',
                    label: 'SECURITY LOCKOUT RISK: operation may remove administrative access on table ' + targetTable
                });
                lockoutRisk = true;
                hasBlock = true;
            }

            // 2. Cross-Scope Detection
            if (targetTable && appScope && targetTable.indexOf(appScope) === -1 && targetTable.indexOf('x_appforge') === -1) {
                findings.push({
                    severity: 'BLOCK',
                    category: 'CROSS_SCOPE',
                    label: 'CROSS-SCOPE ACCESS: ACL (' + acl.name + ') targets out-of-scope table: ' + targetTable
                });
                hasBlock = true;
            }

            // 3. Public Access Risk (No roles assigned to non-public operation)
            if ((!roles || roles.length === 0) && !acl.condition) {
                findings.push({
                    severity: 'WARN',
                    category: 'PUBLIC_ACCESS',
                    label: 'ACL (' + acl.name + ') has no role restrictions (potential public access risk)'
                });
            }

            // 4. Wildcard ACL Detection
            if (targetField === '*' && op === 'write' && (!roles || roles.length === 0)) {
                findings.push({
                    severity: 'WARN',
                    category: 'WILDCARD_WRITE',
                    label: 'Unrestricted wildcard write ACL detected on ' + targetTable
                });
            }

            // 5. Sensitive Field Exposure
            var isSensitive = this.SENSITIVE_FIELDS.some(function(sf) {
                return targetField.toLowerCase().indexOf(sf) !== -1;
            });
            if (isSensitive) {
                var hasElevatedRole = roles.some(function(r) {
                    return r === 'admin' || r.indexOf('admin') !== -1 || r.indexOf('manager') !== -1;
                });
                if (!hasElevatedRole && roles.length > 0) {
                    findings.push({
                        severity: 'WARN',
                        category: 'SENSITIVE_FIELD_EXPOSURE',
                        label: 'Sensitive field (' + targetField + ') assigned to standard role: ' + roles.join(', ')
                    });
                }
            }

            // 6. Admin Escalation Check
            if (roles.indexOf('admin') !== -1 && op === 'delete' && acl.allow_delegation) {
                findings.push({
                    severity: 'BLOCK',
                    category: 'PRIVILEGE_ESCALATION',
                    label: 'Privilege escalation risk: delegated admin delete permissions on ' + targetTable
                });
                hasBlock = true;
            }
        }

        var result = hasBlock ? 'BLOCK' : (findings.length > 0 ? 'WARN' : 'PASS');
        return {
            result: result,
            findings: findings,
            lockout_risk: lockoutRisk
        };
    },

    type: 'AppForgeSecurityAnalyzer'
};
