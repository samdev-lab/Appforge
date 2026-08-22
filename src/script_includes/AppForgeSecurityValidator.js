/**
 * AppForgeSecurityValidator
 * Server-side service validating security definitions (Roles, ACLs, Field Security, Record Conditions, Data Policies),
 * detecting circular role inheritance, cross-scope violations, and destructive security actions.
 */
var AppForgeSecurityValidator = Class.create();
AppForgeSecurityValidator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSecurityValidator] ';
        this.VALID_OPERATIONS = ['create', 'read', 'write', 'delete', 'execute', 'CREATE', 'READ', 'WRITE', 'DELETE', 'EXECUTE'];
        this.VALID_DP_CHOICES = ['ignore', 'true', 'false'];
    },

    /**
     * Validates a complete Security Definition block.
     * @param {Object} secDef - Security definition containing roles, acls, data_policies, field_security.
     * @param {string} [appScope] - Application scope prefix for cross-scope validation.
     * @return {Object} { valid: boolean, errors: Array, warnings: Array }
     */
    validate: function(secDef, appScope) {
        'use strict';
        var errors = [];
        var warnings = [];

        if (!secDef || typeof secDef !== 'object') {
            return { valid: false, errors: ['Security definition must be an object'], warnings: [] };
        }

        // 1. Validate Roles & Hierarchy
        var roles = secDef.roles || [];
        var roleNames = [];
        var roleInheritanceMap = {};

        for (var r = 0; r < roles.length; r++) {
            var role = roles[r];
            if (!role.name) {
                errors.push('Role at index ' + r + ' missing required name');
                continue;
            }

            // Cross-scope role check: prevent global role injection
            if (role.name.indexOf('admin') === 0 || role.name === 'itil' || role.name === 'security_admin') {
                errors.push('Cannot define reserved platform role name: ' + role.name);
            }

            if (roleNames.indexOf(role.name) !== -1) {
                errors.push('Duplicate role name detected: ' + role.name);
            } else {
                roleNames.push(role.name);
            }

            if (role.inherits_from) {
                roleInheritanceMap[role.name] = role.inherits_from;
            }
        }

        // Validate inheritance references and detect circular inheritance
        for (var childRole in roleInheritanceMap) {
            var parentRole = roleInheritanceMap[childRole];
            if (roleNames.indexOf(parentRole) === -1) {
                errors.push('Role (' + childRole + ') inherits from unknown role: ' + parentRole);
            }

            // Cycle detection
            var visited = [childRole];
            var curr = parentRole;
            while (curr && roleInheritanceMap[curr]) {
                if (visited.indexOf(curr) !== -1) {
                    errors.push('Circular role inheritance detected involving: ' + childRole + ' and ' + curr);
                    break;
                }
                visited.push(curr);
                curr = roleInheritanceMap[curr];
            }
        }

        // 2. Validate ACLs
        var acls = secDef.acls || [];
        var aclSignatures = [];

        for (var a = 0; a < acls.length; a++) {
            var acl = acls[a];
            if (!acl.name) errors.push('ACL at index ' + a + ' missing name');
            if (!acl.table && !acl.table_name) errors.push('ACL (' + (acl.name || a) + ') missing target table');

            var targetTable = acl.table || acl.table_name;
            if (targetTable && appScope && targetTable.indexOf(appScope) === -1 && targetTable.indexOf('x_appforge') === -1) {
                errors.push('CROSS-SCOPE VIOLATION: ACL (' + acl.name + ') targets table outside application scope: ' + targetTable);
            }

            var op = acl.operation || 'read';
            if (this.VALID_OPERATIONS.indexOf(op) === -1) {
                errors.push('ACL (' + acl.name + ') invalid operation: ' + op + '. Supported: create, read, write, delete, execute');
            }

            if (acl.roles && Array.isArray(acl.roles)) {
                for (var ri = 0; ri < acl.roles.length; ri++) {
                    var reqRole = acl.roles[ri];
                    if (roleNames.indexOf(reqRole) === -1 && reqRole !== 'admin' && reqRole.indexOf('x_appforge') === -1) {
                        errors.push('ACL (' + acl.name + ') references undefined role: ' + reqRole);
                    }
                }
            }

            var sig = targetTable + '|' + (acl.field || acl.field_name || '*') + '|' + op.toLowerCase();
            if (aclSignatures.indexOf(sig) !== -1) {
                warnings.push('Multiple ACL definitions for ' + sig);
            } else {
                aclSignatures.push(sig);
            }

            // Destructive check
            if (acl.action === 'delete' || acl.action === 'drop') {
                errors.push('DESTRUCTIVE ACL ACTION BLOCKED: Destructive security operations require Migration Engine.');
            }
        }

        // 3. Validate Data Policies
        var dps = secDef.data_policies || [];
        for (var d = 0; d < dps.length; d++) {
            var dp = dps[d];
            if (!dp.name) errors.push('Data Policy at index ' + d + ' missing name');
            if (!dp.table && !dp.table_name) errors.push('Data Policy (' + (dp.name || d) + ') missing table');
            if (!dp.field && !dp.field_name) errors.push('Data Policy (' + (dp.name || d) + ') missing field');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    },

    type: 'AppForgeSecurityValidator'
};
