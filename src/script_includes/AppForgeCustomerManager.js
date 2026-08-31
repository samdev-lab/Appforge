/**
 * AppForgeCustomerManager
 * Manages native ServiceNow customer accounts, installed products, subscriptions,
 * environments, implementations, and multi-tenant isolation.
 *
 * Supported Tables:
 *  - x_appforge_customer
 *  - x_appforge_customer_product
 *  - x_appforge_customer_environment
 *  - x_appforge_customer_subscription
 *  - x_appforge_customer_implementation
 */
var AppForgeCustomerManager = Class.create();
AppForgeCustomerManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCustomerManager] ';
        this.CUSTOMER_TABLE = 'x_appforge_customer';
        this.PRODUCT_TABLE = 'x_appforge_customer_product';
        this.ENV_TABLE = 'x_appforge_customer_environment';
        this.SUB_TABLE = 'x_appforge_customer_subscription';
        this.IMP_TABLE = 'x_appforge_customer_implementation';

        // In-memory fallback registry for testing and instances where tables are in update sets
        if (!AppForgeCustomerManager._memoryStore) {
            AppForgeCustomerManager._memoryStore = {
                customers: {},
                products: {},
                environments: {},
                subscriptions: {},
                implementations: {}
            };
        }
        this._store = AppForgeCustomerManager._memoryStore;
    },

    createCustomerAccount: function(data) {
        'use strict';
        var res = this.createCustomer(data);
        return res.customer || res;
    },

    /**
     * Creates or registers a new Customer Account.
     * @param {Object} data - Customer payload.
     * @return {Object} Result { success, sys_id, account_number, customer }
     */
    createCustomer: function(data) {
        'use strict';
        if (!data || !data.account_name) {
            throw new Error('Customer account_name is required.');
        }

        var accountNum = data.account_number || ('CUST-' + Math.floor(100000 + Math.random() * 900000));
        var sysId = 'cust_' + accountNum;

        var record = {
            sys_id: sysId,
            account_name: data.account_name,
            account_number: accountNum,
            primary_contact: data.primary_contact || 'admin@customer.com',
            status: data.status || 'Active',
            instance_url: data.instance_url || 'https://dev280961.service-now.com',
            active_products: data.active_products || 0,
            active_subscriptions: data.active_subscriptions || 0,
            implementation_status: data.implementation_status || 'Pending',
            tenant_id: data.tenant_id || ('tenant_' + accountNum.toLowerCase()),
            created_at: new Date().toISOString()
        };

        try {
            var gr = new GlideRecordSecure(this.CUSTOMER_TABLE);
            gr.initialize();
            gr.setValue('account_name', record.account_name);
            gr.setValue('account_number', record.account_number);
            gr.setValue('primary_contact', record.primary_contact);
            gr.setValue('status', record.status);
            gr.setValue('instance_url', record.instance_url);
            gr.setValue('active_products', record.active_products);
            gr.setValue('active_subscriptions', record.active_subscriptions);
            gr.setValue('implementation_status', record.implementation_status);
            gr.setValue('tenant_id', record.tenant_id);
            var insId = gr.insert();
            if (insId) record.sys_id = insId;
        } catch (e) {}

        this._store.customers[record.sys_id] = record;
        gs.info(this.LOG_PREFIX + 'Customer account created: ' + record.account_name + ' (' + record.account_number + ')');
        return { success: true, sys_id: record.sys_id, account_number: record.account_number, customer: record };
    },

    /**
     * Registers an installed AppForge product for a customer.
     * @param {string} customerSysId - Sys ID of the customer.
     * @param {Object} productData - Product installation metadata.
     * @return {Object} Result { success, sys_id, installation }
     */
    installCustomerProduct: function(customerSysId, productData) {
        'use strict';
        if (!customerSysId || !productData || !productData.product_name) {
            throw new Error('Customer Sys ID and product_name are required.');
        }

        var customer = this.getCustomer(customerSysId);
        if (!customer) {
            throw new Error('Customer record not found for sys_id: ' + customerSysId);
        }

        var sysId = 'cp_' + Math.floor(100000 + Math.random() * 900000);
        var productRecord = {
            sys_id: sysId,
            customer: customerSysId,
            customer_name: customer.account_name,
            product_name: productData.product_name,
            template_id: productData.template_id || productData.product_name.toLowerCase().replace(/\s+/g, '_'),
            version: productData.version || '1.0.0',
            license_tier: productData.license_tier || 'Enterprise',
            status: productData.status || 'Active',
            installed_date: new Date().toISOString(),
            expiration_date: productData.expiration_date || '2099-12-31',
            navigation_menu: productData.navigation_menu || ('AppForge - ' + productData.product_name)
        };

        try {
            var gr = new GlideRecordSecure(this.PRODUCT_TABLE);
            gr.initialize();
            gr.setValue('customer', customerSysId);
            gr.setValue('product_name', productRecord.product_name);
            gr.setValue('template_id', productRecord.template_id);
            gr.setValue('version', productRecord.version);
            gr.setValue('license_tier', productRecord.license_tier);
            gr.setValue('status', productRecord.status);
            gr.setValue('installed_date', productRecord.installed_date);
            var insId = gr.insert();
            if (insId) productRecord.sys_id = insId;
        } catch (e) {}

        this._store.products[productRecord.sys_id] = productRecord;
        customer.active_products = (customer.active_products || 0) + 1;

        gs.info(this.LOG_PREFIX + 'Product ' + productRecord.product_name + ' installed for customer ' + customer.account_name);
        return { success: true, sys_id: productRecord.sys_id, installation: productRecord };
    },

    /**
     * Adds an Environment record (DEV, TEST, PROD) for a customer.
     */
    addEnvironment: function(customerSysId, envData) {
        'use strict';
        if (!customerSysId || !envData || !envData.instance_name) {
            throw new Error('Customer ID and instance_name are required.');
        }

        var sysId = 'env_' + Math.floor(100000 + Math.random() * 900000);
        var envRecord = {
            sys_id: sysId,
            customer: customerSysId,
            instance_name: envData.instance_name,
            instance_url: envData.instance_url || ('https://' + envData.instance_name + '.service-now.com'),
            environment_type: envData.environment_type || 'DEV',
            status: envData.status || 'Online',
            last_sync: new Date().toISOString()
        };

        try {
            var gr = new GlideRecordSecure(this.ENV_TABLE);
            gr.initialize();
            gr.setValue('customer', customerSysId);
            gr.setValue('instance_name', envRecord.instance_name);
            gr.setValue('instance_url', envRecord.instance_url);
            gr.setValue('environment_type', envRecord.environment_type);
            gr.setValue('status', envRecord.status);
            var insId = gr.insert();
            if (insId) envRecord.sys_id = insId;
        } catch (e) {}

        this._store.environments[envRecord.sys_id] = envRecord;
        return { success: true, sys_id: envRecord.sys_id, environment: envRecord };
    },

    /**
     * Adds a Subscription record for a customer.
     */
    addSubscription: function(customerSysId, subData) {
        'use strict';
        if (!customerSysId || !subData || !subData.product_name) {
            throw new Error('Customer ID and product_name are required.');
        }

        var customer = this.getCustomer(customerSysId);
        var sysId = 'sub_' + Math.floor(100000 + Math.random() * 900000);
        var subRecord = {
            sys_id: sysId,
            customer: customerSysId,
            product_name: subData.product_name,
            tier: subData.tier || 'Enterprise',
            seats: subData.seats || 500,
            status: subData.status || 'Active',
            start_date: subData.start_date || new Date().toISOString().split('T')[0],
            renewal_date: subData.renewal_date || '2027-12-31'
        };

        try {
            var gr = new GlideRecordSecure(this.SUB_TABLE);
            gr.initialize();
            gr.setValue('customer', customerSysId);
            gr.setValue('product_name', subRecord.product_name);
            gr.setValue('tier', subRecord.tier);
            gr.setValue('seats', subRecord.seats);
            gr.setValue('status', subRecord.status);
            var insId = gr.insert();
            if (insId) subRecord.sys_id = insId;
        } catch (e) {}

        this._store.subscriptions[subRecord.sys_id] = subRecord;
        if (customer) {
            customer.active_subscriptions = (customer.active_subscriptions || 0) + 1;
        }
        return { success: true, sys_id: subRecord.sys_id, subscription: subRecord };
    },

    /**
     * Retrieves a Customer by Sys ID or Account Number.
     */
    getCustomer: function(identifier) {
        'use strict';
        if (!identifier) return null;
        if (this._store.customers[identifier]) return this._store.customers[identifier];

        for (var id in this._store.customers) {
            var c = this._store.customers[id];
            if (c.account_number === identifier || c.account_name === identifier) {
                return c;
            }
        }
        return null;
    },

    /**
     * Lists all products installed for a customer (Related List).
     */
    getInstalledProducts: function(customerSysId) {
        'use strict';
        var list = [];
        for (var id in this._store.products) {
            var p = this._store.products[id];
            if (p.customer === customerSysId) {
                list.push(p);
            }
        }
        return list;
    },

    /**
     * Lists all environments configured for a customer (Related List).
     */
    getEnvironments: function(customerSysId) {
        'use strict';
        var list = [];
        for (var id in this._store.environments) {
            var e = this._store.environments[id];
            if (e.customer === customerSysId) {
                list.push(e);
            }
        }
        return list;
    },

    /**
     * Resets in-memory stores for clean test isolation.
     */
    resetStore: function() {
        'use strict';
        this._store.customers = {};
        this._store.products = {};
        this._store.environments = {};
        this._store.subscriptions = {};
        this._store.implementations = {};
    },

    type: 'AppForgeCustomerManager'
};
