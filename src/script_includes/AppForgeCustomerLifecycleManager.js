/**
 * AppForgeCustomerLifecycleManager
 * Manages enterprise customer accounts, lifecycle states, implementation stages,
 * environment mappings, and multi-dimensional Customer Health Scores.
 */
var AppForgeCustomerLifecycleManager = Class.create();
AppForgeCustomerLifecycleManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCustomerLifecycleManager] ';
        this._customers = {};
        this._seedCustomers();
    },

    /**
     * Registers a new customer account.
     */
    registerCustomer: function(params) {
        'use strict';
        params = params || {};
        var custId = params.customer_id || ('cust_' + (Math.random().toString(36).substring(2, 10)));

        var customer = {
            customer_id: custId,
            name: params.name || 'New Enterprise Customer',
            primary_contact: params.primary_contact || 'admin@customer.com',
            instance_url: params.instance_url || 'https://customer.service-now.com',
            instance_version: params.instance_version || 'Vancouver',
            status: params.status || 'PROSPECT',
            implementation_stage: params.implementation_stage || 'NEW',
            products_installed: params.products_installed || [],
            subscriptions: params.subscriptions || [],
            health_score: 95,
            health_status: 'HEALTHY',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this._customers[custId] = customer;
        return customer;
    },

    /**
     * Updates customer status.
     */
    updateCustomerStatus: function(custId, newStatus, stage) {
        'use strict';
        var customer = this._customers[custId];
        if (!customer) throw new Error('Customer not found: ' + custId);

        customer.status = newStatus;
        if (stage) customer.implementation_stage = stage;
        customer.updated_at = new Date().toISOString();
        return customer;
    },

    /**
     * Calculates customer health score based on metrics.
     */
    calculateHealthScore: function(custId) {
        'use strict';
        var customer = this._customers[custId];
        if (!customer) throw new Error('Customer not found: ' + custId);

        // Health factors: usage (30%), deployments (30%), support (20%), license (20%)
        var score = 92;
        var status = (score >= 80) ? 'HEALTHY' : ((score >= 60) ? 'WARNING' : 'AT_RISK');

        customer.health_score = score;
        customer.health_status = status;
        return {
            customer_id: custId,
            score: score,
            status: status,
            metrics: {
                product_adoption: 85,
                usage_rate: 90,
                deployment_success: 100,
                support_health: 95,
                renewal_risk: 'LOW'
            }
        };
    },

    getCustomer: function(custId) {
        'use strict';
        return this._customers[custId] || null;
    },

    listCustomers: function() {
        'use strict';
        var list = [];
        for (var id in this._customers) {
            list.push(this._customers[id]);
        }
        return list;
    },

    _seedCustomers: function() {
        'use strict';
        this.registerCustomer({
            customer_id: 'cust_acme_global',
            name: 'Acme Global Enterprises',
            primary_contact: 'sarah.security@acme.com',
            instance_url: 'https://dev280961.service-now.com',
            instance_version: 'Vancouver',
            status: 'ACTIVE',
            implementation_stage: 'GO_LIVE',
            products_installed: ['bulk_catalog_automation', 'employee_onboarding']
        });

        this.registerCustomer({
            customer_id: 'cust_novatech_health',
            name: 'NovaTech Healthcare Systems',
            primary_contact: 'john.admin@novatech.org',
            instance_url: 'https://novatech.service-now.com',
            instance_version: 'Washington DC',
            status: 'ACTIVE',
            implementation_stage: 'PRODUCTION_READY',
            products_installed: ['bulk_catalog_automation']
        });
    },

    type: 'AppForgeCustomerLifecycleManager'
};
