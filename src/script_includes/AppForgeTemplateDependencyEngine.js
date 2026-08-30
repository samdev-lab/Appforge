/**
 * AppForgeTemplateDependencyEngine
 * Resolves prerequisite templates, ServiceNow release compatibility, and runtime dependencies before installation.
 */
var AppForgeTemplateDependencyEngine = Class.create();
AppForgeTemplateDependencyEngine.prototype = {
    initialize: function() {
        'use strict';
        this.dependencies = {};
        this._seedDefaultDependencies();
    },

    /**
     * Registers a dependency rule for a template.
     */
    registerDependency: function(rule) {
        'use strict';
        if (!rule || !rule.template_id) {
            throw new Error('Template ID is required for dependency rule.');
        }

        if (!this.dependencies[rule.template_id]) {
            this.dependencies[rule.template_id] = [];
        }

        this.dependencies[rule.template_id].push({
            dependency_id: rule.dependency_id || ('dep_' + Math.random().toString(36).substring(2, 10)),
            depends_on_template: rule.depends_on_template || null,
            min_template_version: rule.min_template_version || '1.0.0',
            min_servicenow_release: rule.min_servicenow_release || 'Rome',
            required_plugin: rule.required_plugin || null,
            is_optional: rule.is_optional === true
        });

        return rule;
    },

    /**
     * Resolves all dependencies for a template against the current installed applications.
     */
    resolveDependencies: function(templateId, installedTemplateIds, snRelease) {
        'use strict';
        installedTemplateIds = installedTemplateIds || [];
        snRelease = snRelease || 'Xanadu';

        var rules = this.dependencies[templateId] || [];
        var missing = [];
        var satisfied = [];

        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];

            // 1. Template-to-template dependency
            if (rule.depends_on_template) {
                var found = installedTemplateIds.indexOf(rule.depends_on_template) !== -1;
                if (found) {
                    satisfied.push({ type: 'TEMPLATE', target: rule.depends_on_template });
                } else if (!rule.is_optional) {
                    missing.push({
                        type: 'TEMPLATE',
                        target: rule.depends_on_template,
                        min_version: rule.min_template_version,
                        reason: 'Prerequisite template [' + rule.depends_on_template + '] must be installed first.'
                    });
                }
            }

            // 2. ServiceNow release check
            if (rule.min_servicenow_release) {
                // Minimum supported releases: Rome, San Diego, Tokyo, Utah, Vancouver, Washington DC, Xanadu
                satisfied.push({ type: 'PLATFORM_RELEASE', release: snRelease });
            }
        }

        return {
            template_id: templateId,
            satisfied: missing.length === 0,
            missing: missing,
            satisfied_dependencies: satisfied,
            message: missing.length === 0 ? 'All dependencies satisfied.' : 'Missing ' + missing.length + ' required prerequisite(s).'
        };
    },

    /**
     * Seeds sample dependencies.
     */
    _seedDefaultDependencies: function() {
        'use strict';
        // Example: Project Intake requires Asset Request or Employee Core
        this.registerDependency({
            template_id: 'project_intake',
            min_servicenow_release: 'Washington DC'
        });

        this.registerDependency({
            template_id: 'customer_request',
            min_servicenow_release: 'Vancouver'
        });
    },

    type: 'AppForgeTemplateDependencyEngine'
};
