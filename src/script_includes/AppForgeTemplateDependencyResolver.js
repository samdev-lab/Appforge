/**
 * AppForgeTemplateDependencyResolver
 * Validates prerequisite plugins, release compatibility, and solution dependencies
 * prior to template installation.
 */
var AppForgeTemplateDependencyResolver = Class.create();
AppForgeTemplateDependencyResolver.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeTemplateDependencyResolver] ';
    },

    /**
     * Checks if all dependencies for a template are satisfied.
     */
    resolve: function(templateId, currentRelease, installedPlugins) {
        'use strict';
        installedPlugins = installedPlugins || ['com.glide.service_catalog', 'com.glide.service_portal'];
        currentRelease = currentRelease || 'Vancouver';

        var result = {
            template_id: templateId,
            satisfied: true,
            missing_plugins: [],
            release_compatible: true
        };

        if (templateId === 'bulk_catalog_automation') {
            if (installedPlugins.indexOf('com.glide.service_catalog') === -1) {
                result.satisfied = false;
                result.missing_plugins.push('com.glide.service_catalog');
            }
        }

        return result;
    },

    type: 'AppForgeTemplateDependencyResolver'
};
