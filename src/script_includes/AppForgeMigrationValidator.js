/**
 * AppForgeMigrationValidator
 * Validates schema and data migration definitions, transformations, and security boundaries.
 * Strictly blocks unsafe operations (DROP_FIELD, DROP_TABLE, SQL injection, eval, cross-scope modifications).
 */
var AppForgeMigrationValidator = Class.create();
AppForgeMigrationValidator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMigrationValidator] ';
        this.SUPPORTED_TRANSFORMATIONS = [
            'TRIM', 'UPPERCASE', 'LOWERCASE', 'NULL_TO_DEFAULT',
            'STRING_CONCAT', 'STRING_SPLIT', 'DATE_NORMALIZE',
            'DATETIME_NORMALIZE', 'INTEGER_CONVERT', 'DECIMAL_CONVERT',
            'BOOLEAN_CONVERT', 'REFERENCE_MAP'
        ];
        this.SAFE_SCHEMA_OPERATIONS = [
            'ADD_FIELD', 'ALTER_FIELD_SAFE', 'ADD_REFERENCE',
            'ADD_INDEX', 'RENAME_FIELD_LOGICAL', 'DEPRECATE_FIELD',
            'TRANSFORM_DATA', 'MAP_REFERENCE', 'BACKFILL_FIELD'
        ];
    },

    /**
     * Validates a migration definition.
     * @param {Object} migrationDef - Migration definition.
     * @param {string} [appScope] - Application scope.
     * @return {Object} { valid: boolean, status: 'VALID'|'WARNING'|'BLOCKED', errors: Array, warnings: Array }
     */
    validate: function(migrationDef, appScope) {
        'use strict';
        var errors = [];
        var warnings = [];

        if (!migrationDef || typeof migrationDef !== 'object') {
            return { valid: false, status: 'BLOCKED', errors: ['Migration definition is missing or invalid'], warnings: [] };
        }

        var jsonStr = JSON.stringify(migrationDef);

        // 1. Anti-SQL and dangerous code execution security check
        if (/(\beval\s*\(|\bnew\s+Function\s*\(|SELECT\s+.*\s+FROM|DROP\s+TABLE|ALTER\s+TABLE|GlideDBConnection|jdbc:|child_process|execSync)/i.test(jsonStr)) {
            errors.push('BLOCKED: Unsafe execution pattern (SQL, JDBC, eval, Function, or system execution) detected in migration definition.');
            return { valid: false, status: 'BLOCKED', errors: errors, warnings: warnings };
        }

        // 2. Destructive schema operations
        if (migrationDef.operations && Array.isArray(migrationDef.operations)) {
            for (var i = 0; i < migrationDef.operations.length; i++) {
                var op = migrationDef.operations[i];
                var opType = (op.operation_type || op.type || '').toUpperCase();

                if (opType === 'DROP_FIELD' || opType === 'DROP_TABLE' || opType === 'MASS_DELETE' || opType === 'UNSAFE_TYPE_CHANGE') {
                    errors.push('MIGRATION_REQUIRES_PRIVILEGED_REVIEW: Destructive operation (' + opType + ') is blocked by default.');
                } else if (this.SAFE_SCHEMA_OPERATIONS.indexOf(opType) === -1) {
                    warnings.push('Unknown schema operation: ' + opType);
                }

                // 3. Transformation verification
                if (op.transformation) {
                    var trans = (op.transformation || '').toUpperCase();
                    if (this.SUPPORTED_TRANSFORMATIONS.indexOf(trans) === -1) {
                        errors.push('Unsupported transformation type: ' + trans);
                    }
                }

                // 4. Cross-scope check
                if (appScope && op.target_table && op.target_table.indexOf(appScope) === -1 && op.target_table.indexOf('x_appforge') === -1) {
                    errors.push('BLOCKED: Cross-scope migration target table (' + op.target_table + ') outside scope ' + appScope);
                }
            }
        }

        // 5. Unsafe field type transition check
        if (migrationDef.type_transition) {
            var fromType = (migrationDef.type_transition.from || '').toUpperCase();
            var toType = (migrationDef.type_transition.to || '').toUpperCase();

            if (fromType === 'STRING' && toType === 'INTEGER') {
                errors.push('BLOCKED: Unsafe type transition from STRING to INTEGER without transformation strategy.');
            } else if (fromType === 'REFERENCE' && toType === 'STRING') {
                errors.push('BLOCKED: Unsafe reference conversion to STRING.');
            }
        }

        var isValid = errors.length === 0;
        return {
            valid: isValid,
            status: isValid ? (warnings.length > 0 ? 'WARNING' : 'VALID') : 'BLOCKED',
            errors: errors,
            warnings: warnings
        };
    },

    type: 'AppForgeMigrationValidator'
};
