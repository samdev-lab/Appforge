/**
 * AppForgeMarketplaceCatalog
 * Catalog search and filter engine for published marketplace applications.
 */
var AppForgeMarketplaceCatalog = Class.create();
AppForgeMarketplaceCatalog.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMarketplaceCatalog] ';
        this._catalog = [];
    },

    /**
     * Adds an application to the catalog.
     */
    addApp: function(app) {
        'use strict';
        this._catalog.push(app);
    },

    /**
     * Searches catalog with filters.
     * @param {Object} [filter] - { category, publisher, query, license_type }
     * @return {Array<Object>} Filtered applications.
     */
    search: function(filter) {
        'use strict';
        var f = filter || {};
        return this._catalog.filter(function(app) {
            if (app.status !== 'PUBLISHED') return false;
            if (f.category && app.category !== f.category) return false;
            if (f.publisher && app.publisher !== f.publisher) return false;
            if (f.license_type && app.license_type !== f.license_type) return false;
            if (f.query) {
                var q = f.query.toLowerCase();
                var nameMatch = (app.name || '').toLowerCase().indexOf(q) !== -1;
                var descMatch = (app.description || '').toLowerCase().indexOf(q) !== -1;
                if (!nameMatch && !descMatch) return false;
            }
            return true;
        });
    },

    type: 'AppForgeMarketplaceCatalog'
};
