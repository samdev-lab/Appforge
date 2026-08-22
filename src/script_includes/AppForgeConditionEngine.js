/**
 * AppForgeConditionEngine
 * Evaluates and generates declarative conditions for Business Rules.
 * Supported operators: =, !=, >, <, >=, <=, IS_EMPTY, IS_NOT_EMPTY,
 *   CHANGES, CHANGES_TO, CHANGES_FROM, IN, NOT_IN
 */
var AppForgeConditionEngine = Class.create();
AppForgeConditionEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeConditionEngine] ';
        this.SUPPORTED_OPERATORS = [
            '=', '!=', '>', '<', '>=', '<=',
            'IS_EMPTY', 'IS_NOT_EMPTY',
            'CHANGES', 'CHANGES_TO', 'CHANGES_FROM',
            'IN', 'NOT_IN'
        ];
    },

    /**
     * Validates a condition definition object.
     * @param {Object} condition - Condition definition.
     * @return {Object} { valid: boolean, error: string }
     */
    validate: function(condition) {
        'use strict';
        if (!condition) return { valid: true }; // Null condition is allowed (unconditional)
        if (typeof condition !== 'object') return { valid: false, error: 'Condition must be an object' };

        // Support both flat { field, operator, value } and compound { AND/OR: [...] }
        if (condition.AND || condition.OR) {
            var clauses = condition.AND || condition.OR;
            if (!Array.isArray(clauses) || clauses.length === 0) {
                return { valid: false, error: 'Compound condition (AND/OR) must be a non-empty array' };
            }
            for (var i = 0; i < clauses.length; i++) {
                var res = this.validate(clauses[i]);
                if (!res.valid) return res;
            }
            return { valid: true };
        }

        if (!condition.field) return { valid: false, error: 'Condition missing required field' };
        if (!condition.operator) return { valid: false, error: 'Condition missing required operator for field: ' + condition.field };
        if (this.SUPPORTED_OPERATORS.indexOf(condition.operator) === -1) {
            return { valid: false, error: 'Unsupported operator: ' + condition.operator + '. Supported: ' + this.SUPPORTED_OPERATORS.join(', ') };
        }

        // Operators that require a value
        var requiresValue = ['=', '!=', '>', '<', '>=', '<=', 'CHANGES_TO', 'CHANGES_FROM', 'IN', 'NOT_IN'];
        if (requiresValue.indexOf(condition.operator) !== -1 && condition.value === undefined && condition.value !== null) {
            return { valid: false, error: 'Operator ' + condition.operator + ' requires a value for field: ' + condition.field };
        }

        return { valid: true };
    },

    /**
     * Converts a declarative condition to a ServiceNow-compatible condition string.
     * @param {Object} condition - Condition definition.
     * @return {string} ServiceNow filter/condition string.
     */
    toSnConditionString: function(condition) {
        'use strict';
        if (!condition) return '';

        if (condition.AND) {
            return condition.AND.map(this.toSnConditionString.bind(this)).join('^');
        }
        if (condition.OR) {
            return condition.OR.map(this.toSnConditionString.bind(this)).join('^OR');
        }

        var field = condition.field;
        var op = condition.operator;
        var val = condition.value !== undefined ? condition.value : '';

        var opMap = {
            '=': '=', '!=': '!=', '>': '>', '<': '<', '>=': '>=', '<=': '<=',
            'IS_EMPTY': 'ISEMPTY', 'IS_NOT_EMPTY': 'ISNOTEMPTY',
            'CHANGES': 'CHANGES', 'CHANGES_TO': 'CHANGESTO', 'CHANGES_FROM': 'CHANGESFROM',
            'IN': 'IN', 'NOT_IN': 'NOT IN'
        };

        var snOp = opMap[op] || op;

        if (op === 'IS_EMPTY' || op === 'IS_NOT_EMPTY' || op === 'CHANGES') {
            return field + snOp;
        }
        if (op === 'IN' || op === 'NOT_IN') {
            var vals = Array.isArray(val) ? val.join(',') : String(val);
            return field + snOp + vals;
        }
        return field + snOp + val;
    },

    /**
     * Converts a declarative condition to a JavaScript Boolean expression for BR scripts.
     * @param {Object} condition - Condition definition.
     * @return {string} JS boolean expression.
     */
    toScriptExpression: function(condition) {
        'use strict';
        if (!condition) return 'true';

        if (condition.AND) {
            return '(' + condition.AND.map(this.toScriptExpression.bind(this)).join(' && ') + ')';
        }
        if (condition.OR) {
            return '(' + condition.OR.map(this.toScriptExpression.bind(this)).join(' || ') + ')';
        }

        var field = condition.field;
        var op = condition.operator;
        var val = condition.value;

        var safeVal = (typeof val === 'string') ? '"' + val.replace(/"/g, '\\"') + '"' : JSON.stringify(val);

        switch (op) {
            case '=':          return 'current.' + field + ' == ' + safeVal;
            case '!=':         return 'current.' + field + ' != ' + safeVal;
            case '>':          return 'current.' + field + ' > ' + safeVal;
            case '<':          return 'current.' + field + ' < ' + safeVal;
            case '>=':         return 'current.' + field + ' >= ' + safeVal;
            case '<=':         return 'current.' + field + ' <= ' + safeVal;
            case 'IS_EMPTY':   return '!current.' + field + '.nil() === false';
            case 'IS_NOT_EMPTY': return '!current.' + field + '.nil()';
            case 'CHANGES':    return 'current.' + field + '.changes()';
            case 'CHANGES_TO': return '(current.' + field + '.changes() && current.' + field + ' == ' + safeVal + ')';
            case 'CHANGES_FROM': return '(current.' + field + '.changes() && previous.' + field + ' == ' + safeVal + ')';
            case 'IN':         var inArr = Array.isArray(val) ? JSON.stringify(val) : '[' + safeVal + ']';
                               return inArr + '.indexOf(current.' + field + '.toString()) !== -1';
            case 'NOT_IN':     var notInArr = Array.isArray(val) ? JSON.stringify(val) : '[' + safeVal + ']';
                               return notInArr + '.indexOf(current.' + field + '.toString()) === -1';
            default:           return 'true /* unsupported operator: ' + op + ' */';
        }
    },

    type: 'AppForgeConditionEngine'
};
