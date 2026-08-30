/**
 * AppForgeCustomerRegistry
 * Manages customer CRM records, customer lifecycle states, subscription bindings, and tenant associations.
 */
var AppForgeCustomerRegistry = Class.create();
AppForgeCustomerRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.customers = {};
        this._seedDefaultCustomers();
    },

    /**
     * Registers or updates a customer record.
     */
    registerCustomer: function(customer) {
        'use strict';
        if (!customer || !customer.customer_id) {
            throw new Error('Customer ID is required for registration.');
        }

        customer.status = customer.status || 'ACTIVE';
        customer.created_at = customer.created_at || new Date().toISOString();
        customer.tenants = customer.tenants || [];
        customer.subscription_plan = customer.subscription_plan || 'ENTERPRISE';

        this.customers[customer.customer_id] = customer;
        return customer;
    },

    /**
     * Retrieves a customer by ID.
     */
    getCustomer: function(customerId) {
        'use strict';
        return this.customers[customerId] || null;
    },

    /**
     * Updates customer lifecycle status.
     * Allowed: PROSPECT, ONBOARDING, ACTIVE, SUSPENDED, OFFBOARDING, CLOSED.
     */
    updateCustomerStatus: function(customerId, newStatus, reason) {
        'use strict';
        var validStatuses = ['PROSPECT', 'ONBOARDING', 'ACTIVE', 'SUSPENDED', 'OFFBOARDING', 'CLOSED'];
        if (validStatuses.indexOf(newStatus) === -1) {
            throw new Error('Invalid customer status: ' + newStatus);
        }

        var cust = this.getCustomer(customerId);
        if (!cust) {
            throw new Error('Customer not found: ' + customerId);
        }

        cust.status = newStatus;
        cust.status_reason = reason || '';
        cust.updated_at = new Date().toISOString();
        return cust;
    },

    /**
     * Lists all customers with optional status filter.
     */
    listCustomers: function(filterStatus) {
        'use strict';
        var list = [];
        for (var id in this.customers) {
            if (this.customers.hasOwnProperty(id)) {
                if (!filterStatus || this.customers[id].status === filterStatus) {
                    list.push(this.customers[id]);
                }
            }
        }
        return list;
    },

    /**
     * Seeds initial enterprise customers.
     */
    _seedDefaultCustomers: function() {
        'use strict';
        this.registerCustomer({
            customer_id: 'cust_acme_global',
            customer_name: 'Acme Global Enterprises',
            customer_code: 'ACME',
            industry: 'Financial Services',
            primary_contact: 'jane.doe@acmeglobal.com',
            status: 'ACTIVE',
            subscription_plan: 'ENTERPRISE',
            account_manager: 'sarah.security',
            onboarding_status: 'COMPLETED',
            tenants: ['tenant_enterprise_01', 'tenant_acme_prod']
        });

        this.registerCustomer({
            customer_id: 'cust_novatech',
            customer_name: 'NovaTech Health Systems',
            customer_code: 'NOVAT',
            industry: 'Healthcare & Life Sciences',
            primary_contact: 'dr.marcus@novatech.org',
            status: 'ACTIVE',
            subscription_plan: 'PRO',
            account_manager: 'admin',
            onboarding_status: 'COMPLETED',
            tenants: ['tenant_novatech_dev', 'tenant_novatech_prod']
        });
    },

    type: 'AppForgeCustomerRegistry'
};
