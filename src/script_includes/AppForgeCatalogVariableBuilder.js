/**
 * AppForgeCatalogVariableBuilder
 * Generates and validates ServiceNow Service Catalog Variables (item_option_new), Choices, and Variable Sets.
 * Supports all 24 standard ServiceNow variable types and container layout blocks.
 */
var AppForgeCatalogVariableBuilder = Class.create();
AppForgeCatalogVariableBuilder.prototype = {
    initialize: function() {
        'use strict';
        this.SUPPORTED_TYPES = [
            'Single Line Text', 'Multi Line Text', 'HTML', 'Integer', 'Decimal',
            'Date', 'Date/Time', 'Yes/No', 'Checkbox', 'Select Box',
            'Multiple Choice', 'Multiple Select', 'Lookup Select Box', 'Reference',
            'List Collector', 'Attachment', 'Label', 'Container Start', 'Container End',
            'Break', 'Rich Text', 'Password', 'Email', 'URL'
        ];
    },

    /**
     * Normalizes and validates a variable definition.
     */
    buildVariable: function(varDef, orderIndex) {
        'use strict';
        if (!varDef || !varDef.name) {
            throw new Error('Variable definition must have a unique "name" attribute.');
        }

        var type = varDef.type || 'Single Line Text';
        if (this.SUPPORTED_TYPES.indexOf(type) === -1) {
            throw new Error('Unsupported variable type "' + type + '" for variable "' + varDef.name + '".');
        }

        var normalized = {
            name: varDef.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            question_text: varDef.question || varDef.label || varDef.name,
            type: type,
            order: varDef.order || ((orderIndex || 1) * 100),
            mandatory: varDef.mandatory === true || varDef.mandatory === 'true',
            read_only: varDef.read_only === true || varDef.read_only === 'true',
            hidden: varDef.hidden === true || varDef.hidden === 'true',
            default_value: varDef.default_value || '',
            help_text: varDef.help_text || '',
            tooltip: varDef.tooltip || '',
            reference_table: varDef.reference_table || (type === 'Reference' ? 'sys_user' : ''),
            reference_qual: varDef.reference_qual || '',
            lookup_table: varDef.lookup_table || '',
            lookup_value: varDef.lookup_value || '',
            lookup_label: varDef.lookup_label || '',
            max_length: varDef.max_length || 4000,
            variable_set: varDef.variable_set || '',
            choices: []
        };

        // Process Choices for Select Box, Multiple Choice, Multiple Select
        if (varDef.choices && Array.isArray(varDef.choices)) {
            normalized.choices = this.buildChoices(varDef.choices);
        }

        return normalized;
    },

    /**
     * Builds and validates choice records for choice-based variables.
     */
    buildChoices: function(choicesList) {
        'use strict';
        var choices = [];
        for (var i = 0; i < choicesList.length; i++) {
            var c = choicesList[i];
            var label = typeof c === 'string' ? c : (c.label || c.name || '');
            var value = typeof c === 'string' ? c.toLowerCase().replace(/[^a-z0-9_]/g, '_') : (c.value || label.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
            choices.push({
                label: label,
                value: value,
                order: (i + 1) * 100,
                inactive: c.inactive === true || false,
                is_default: c.is_default === true || false
            });
        }
        return choices;
    },

    /**
     * Builds a reusable Variable Set definition containing grouped variables.
     */
    buildVariableSet: function(setDef) {
        'use strict';
        if (!setDef || !setDef.name) {
            throw new Error('Variable Set must have a "name" attribute.');
        }

        var vSet = {
            name: setDef.name,
            title: setDef.title || setDef.name,
            description: setDef.description || '',
            type: setDef.type || 'single_row', // single_row or multi_row
            order: setDef.order || 100,
            variables: []
        };

        if (setDef.variables && Array.isArray(setDef.variables)) {
            for (var j = 0; j < setDef.variables.length; j++) {
                vSet.variables.push(this.buildVariable(setDef.variables[j], j + 1));
            }
        }

        return vSet;
    },

    type: 'AppForgeCatalogVariableBuilder'
};
