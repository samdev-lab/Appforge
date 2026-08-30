/**
 * AppForgeUsageMeterEngine
 * Tracks product utilization metrics, catalog items created, API invocations, and license consumption.
 */
var AppForgeUsageMeterEngine = Class.create();
AppForgeUsageMeterEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeUsageMeterEngine] ';
        this._meters = {};
    },

    /**
     * Records usage metric consumption.
     */
    recordUsage: function(custId, productId, metricType, quantity) {
        'use strict';
        var key = custId + ':' + productId + ':' + metricType;
        if (!this._meters[key]) {
            this._meters[key] = {
                customer_id: custId,
                product_id: productId,
                metric_type: metricType,
                total_consumed: 0,
                last_updated: new Date().toISOString()
            };
        }

        this._meters[key].total_consumed += (quantity || 1);
        this._meters[key].last_updated = new Date().toISOString();
        return this._meters[key];
    },

    getUsage: function(custId, productId, metricType) {
        'use strict';
        var key = custId + ':' + productId + ':' + metricType;
        return this._meters[key] || { customer_id: custId, product_id: productId, metric_type: metricType, total_consumed: 0 };
    },

    type: 'AppForgeUsageMeterEngine'
};
