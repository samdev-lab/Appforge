/**
 * AppForgeCatalogReferenceResolver
 * Resolves ServiceNow reference entities (users, groups, categories, catalogs, tables)
 * during Bulk Catalog Factory operations with in-memory caching.
 */
var AppForgeCatalogReferenceResolver = Class.create();
AppForgeCatalogReferenceResolver.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCatalogReferenceResolver] ';
        this._cache = {
            users: {},
            groups: {},
            categories: {},
            catalogs: {},
            tables: {}
        };
    },

    /**
     * Resolves a user by username, email, or name.
     */
    resolveUser: function(identifier) {
        'use strict';
        if (!identifier) return null;
        if (this._cache.users[identifier]) return this._cache.users[identifier];

        var sysId = 'sys_user_' + identifier.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (typeof GlideRecord !== 'undefined') {
            var gr = new GlideRecord('sys_user');
            gr.addQuery('user_name', identifier).addOrCondition('email', identifier).addOrCondition('name', identifier);
            gr.setLimit(1);
            gr.query();
            if (gr.next()) {
                sysId = gr.getUniqueValue();
            }
        }

        this._cache.users[identifier] = sysId;
        return sysId;
    },

    /**
     * Resolves an assignment or approval group by name.
     */
    resolveGroup: function(groupName) {
        'use strict';
        if (!groupName) return null;
        if (this._cache.groups[groupName]) return this._cache.groups[groupName];

        var sysId = 'sys_group_' + groupName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (typeof GlideRecord !== 'undefined') {
            var gr = new GlideRecord('sys_user_group');
            gr.addQuery('name', groupName);
            gr.setLimit(1);
            gr.query();
            if (gr.next()) {
                sysId = gr.getUniqueValue();
            }
        }

        this._cache.groups[groupName] = sysId;
        return sysId;
    },

    /**
     * Resolves a catalog category by title/name.
     */
    resolveCategory: function(categoryTitle) {
        'use strict';
        if (!categoryTitle) return null;
        if (this._cache.categories[categoryTitle]) return this._cache.categories[categoryTitle];

        var sysId = 'sc_cat_' + categoryTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (typeof GlideRecord !== 'undefined') {
            var gr = new GlideRecord('sc_category');
            gr.addQuery('title', categoryTitle);
            gr.setLimit(1);
            gr.query();
            if (gr.next()) {
                sysId = gr.getUniqueValue();
            }
        }

        this._cache.categories[categoryTitle] = sysId;
        return sysId;
    },

    type: 'AppForgeCatalogReferenceResolver'
};
