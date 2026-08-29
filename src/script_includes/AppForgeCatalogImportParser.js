/**
 * AppForgeCatalogImportParser
 * Parses bulk Excel/CSV/JSON templates to create multiple ServiceNow Catalog Items in a single operation.
 */
var AppForgeCatalogImportParser = Class.create();
AppForgeCatalogImportParser.prototype = {
    initialize: function() {
        'use strict';
        this.validator = new AppForgeCatalogValidationEngine();
    },

    /**
     * Parses a JSON or array batch specification.
     */
    parseBatch: function(batchInput) {
        'use strict';
        var items = [];
        if (typeof batchInput === 'string') {
            try {
                batchInput = JSON.parse(batchInput);
            } catch (e) {
                throw new Error('Invalid JSON format for batch catalog import: ' + e.message);
            }
        }

        if (Array.isArray(batchInput)) {
            items = batchInput;
        } else if (batchInput && batchInput.catalog_items && Array.isArray(batchInput.catalog_items)) {
            items = batchInput.catalog_items;
        } else if (batchInput && typeof batchInput === 'object') {
            items = [batchInput];
        }

        var result = {
            total_items: items.length,
            valid_items: 0,
            invalid_items: 0,
            items: [],
            summary: {
                total_variables: 0,
                total_tasks: 0,
                total_approvals: 0
            }
        };

        for (var i = 0; i < items.length; i++) {
            var itemSpec = items[i];
            var validation = this.validator.validate(itemSpec);
            var parsedItem = {
                index: i + 1,
                name: itemSpec.name || ('Catalog Item ' + (i + 1)),
                category: itemSpec.category || 'General',
                spec: itemSpec,
                valid: validation.valid,
                errors: validation.errors,
                warnings: validation.warnings
            };

            if (validation.valid) {
                result.valid_items++;
                result.summary.total_variables += (itemSpec.variables ? itemSpec.variables.length : 0);
                result.summary.total_tasks += (itemSpec.tasks ? itemSpec.tasks.length : 0);
                result.summary.total_approvals += (itemSpec.approvals ? itemSpec.approvals.length : 0);
            } else {
                result.invalid_items++;
            }

            result.items.push(parsedItem);
        }

        return result;
    },

    type: 'AppForgeCatalogImportParser'
};
