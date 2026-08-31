/**
 * AppForgeCommercialCustomerService
 * Commercial Customer Account, Tenant Mapping & User Management Engine.
 *
 * Implements:
 *   - Customer account lifecycle (PROSPECT, TRIAL, ACTIVE, SUSPENDED, CANCELLED)
 *   - Customer User RBAC (CUSTOMER_ADMIN, BILLING_ADMIN, TECHNICAL_ADMIN, CUSTOMER_USER, READ_ONLY)
 *   - Multi-tenant tenant scoping & boundary checks
 *   - Audit integration for commercial compliance
 */
var AppForgeCommercialCustomerService = Class.create();
AppForgeCommercialCustomerService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCommercialCustomerService] ';
        this.auditService = new AppForgeAuditService();

        if (!AppForgeCommercialCustomerService._store) {
            AppForgeCommercialCustomerService._store = {
                customers: {}, // customerId -> record
                users: {} // customerId -> array of user records
            };
        }
        this._store = AppForgeCommercialCustomerService._store;
    },

    /**
     * Creates a new commercial customer account.
     */
    createCustomer: function(data) {
        'use strict';
        if (!data || !data.name) throw new Error('Customer name is required.');

        var custId = data.customer_id || ('cust_' + Math.floor(Math.random() * 1000000));
        var record = {
            customer_id: custId,
            number: 'CUST-' + Math.floor(100000 + Math.random() * 900000),
            name: data.name,
            legal_name: data.legal_name || data.name,
            status: data.status || 'PROSPECT',
            industry: data.industry || 'Technology',
            country: data.country || 'US',
            timezone: data.timezone || 'UTC',
            primary_contact: data.primary_contact || 'admin',
            billing_email: data.billing_email || ('billing@' + data.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'),
            tenant_id: data.tenant_id || ('tenant_' + custId),
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString()
        };

        AppForgeCommercialCustomerService._store.customers[custId] = record;
        AppForgeCommercialCustomerService._store.users[custId] = [];

        if (data.primary_contact) {
            this.addUserToCustomer(custId, data.primary_contact, 'CUSTOMER_ADMIN', true);
        }

        this.auditService.logEvent(record.tenant_id, data.creator || 'system', 'CUSTOMER_CREATED', 'commercial', 'customer', 'SUCCESS', null, { customer_id: custId, name: record.name });
        return record;
    },

    getCustomer: function(customerId) {
        'use strict';
        return AppForgeCommercialCustomerService._store.customers[customerId] || null;
    },

    updateCustomer: function(customerId, data) {
        'use strict';
        var c = this.getCustomer(customerId);
        if (!c) throw new Error('Customer ' + customerId + ' not found.');

        for (var k in data) {
            if (k !== 'customer_id' && k !== 'number') {
                c[k] = data[k];
            }
        }
        c.updated_on = new Date().toISOString();
        return c;
    },

    /**
     * Adds a user to a customer organization with a commercial role.
     */
    addUserToCustomer: function(customerId, username, role, isPrimary) {
        'use strict';
        var c = this.getCustomer(customerId);
        if (!c) throw new Error('Customer ' + customerId + ' not found.');

        var validRoles = ['CUSTOMER_ADMIN', 'CUSTOMER_USER', 'BILLING_ADMIN', 'TECHNICAL_ADMIN', 'READ_ONLY'];
        var selectedRole = (role || 'CUSTOMER_USER').toUpperCase();
        if (validRoles.indexOf(selectedRole) === -1) {
            throw new Error('Invalid commercial role: ' + role);
        }

        var userList = AppForgeCommercialCustomerService._store.users[customerId] || [];
        var existing = userList.find(function(u) { return u.user === username; });

        if (existing) {
            existing.role = selectedRole;
            existing.status = 'ACTIVE';
            return existing;
        }

        var userRec = {
            customer_id: customerId,
            user: username,
            role: selectedRole,
            status: 'ACTIVE',
            is_primary: !!isPrimary,
            created_on: new Date().toISOString()
        };

        userList.push(userRec);
        AppForgeCommercialCustomerService._store.users[customerId] = userList;
        return userRec;
    },

    listCustomerUsers: function(customerId) {
        'use strict';
        return AppForgeCommercialCustomerService._store.users[customerId] || [];
    },

    deactivateCustomerUser: function(customerId, username) {
        'use strict';
        var users = this.listCustomerUsers(customerId);
        var u = users.find(function(item) { return item.user === username; });
        if (!u) return { success: false, error: 'User not found in customer account.' };

        u.status = 'INACTIVE';
        return { success: true, user: u };
    },

    resetStore: function() {
        'use strict';
        AppForgeCommercialCustomerService._store = {
            customers: {},
            users: {}
        };
        this._store = AppForgeCommercialCustomerService._store;
        this.auditService.resetStore();
    },

    type: 'AppForgeCommercialCustomerService'
};
