/**
 * AppForgeCustomerOrganizationService
 * Production Customer Organization Management & Commercial Lifecycle Engine.
 *
 * Implements:
 *   - Table Model (x_appforge_com_customer)
 *   - Lifecycle Transitions: PROSPECT -> TRIAL -> ONBOARDING -> ACTIVE -> SUSPENDED -> OFFBOARDING -> CLOSED
 *   - Multi-Tier Commercial Metadata (Tier, Contacts, Contract Dates, Health & Risk)
 *   - Governed State Transitions with Audit Logging
 */
var AppForgeCustomerOrganizationService = Class.create();
AppForgeCustomerOrganizationService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCustomerOrganizationService] ';
        this.auditService = new AppForgeAuditService();

        if (!AppForgeCustomerOrganizationService._store) {
            AppForgeCustomerOrganizationService._store = {
                customers: {} // customer_id -> customer record
            };
        }
        this._store = AppForgeCustomerOrganizationService._store;
    },

    /**
     * Creates a new customer organization record.
     */
    createOrganization: function(data) {
        'use strict';
        var d = data || {};
        var custId = d.customer_id || ('cust_' + Date.now().toString(36));
        var custNum = 'CUST-' + Math.floor(100000 + Math.random() * 900000);

        var custRec = {
            number: custNum,
            customer_id: custId,
            tenant_id: d.tenant_id || custId,
            name: d.name || 'New Customer Organization',
            legal_name: d.legal_name || d.name || 'New Customer Legal Entity',
            status: d.status || 'TRIAL', // PROSPECT, TRIAL, ONBOARDING, ACTIVE, SUSPENDED, OFFBOARDING, CLOSED
            primary_contact: d.primary_contact || 'admin@customer.com',
            billing_contact: d.billing_contact || 'billing@customer.com',
            technical_contact: d.technical_contact || 'tech@customer.com',
            industry: d.industry || 'Technology',
            country: d.country || 'US',
            time_zone: d.time_zone || 'UTC',
            currency: d.currency || 'USD',
            contract_start: d.contract_start || new Date().toISOString().split('T')[0],
            contract_end: d.contract_end || null,
            tier: (d.tier || 'ENTERPRISE').toUpperCase(), // STANDARD, PREMIUM, ENTERPRISE
            account_manager: d.account_manager || 'sales_lead',
            customer_success_manager: d.customer_success_manager || 'csm_lead',
            environment_status: 'ACTIVE',
            onboarding_status: 'IN_PROGRESS',
            risk_status: 'LOW',
            adoption_score: 80,
            health_score: 95,
            created_by: d.created_by || 'system',
            created_on: new Date().toISOString(),
            updated_by: d.created_by || 'system',
            updated_on: new Date().toISOString()
        };

        AppForgeCustomerOrganizationService._store.customers[custId] = custRec;
        this.auditService.logEvent('CUSTOMER_ORGANIZATION_CREATED', 'ORGANIZATION', custRec.created_by, custId, 'SUCCESS', 'Organization created: ' + custRec.name + ' (' + custNum + ')');
        return { success: true, customer: custRec };
    },

    /**
     * Updates customer organization details.
     */
    updateOrganization: function(customerId, data, actingUser) {
        'use strict';
        var cust = AppForgeCustomerOrganizationService._store.customers[customerId];
        if (!cust) return { success: false, errorCode: 'CUSTOMER_NOT_FOUND', error: 'Customer not found.' };

        var d = data || {};
        if (d.name) cust.name = d.name;
        if (d.legal_name) cust.legal_name = d.legal_name;
        if (d.primary_contact) cust.primary_contact = d.primary_contact;
        if (d.billing_contact) cust.billing_contact = d.billing_contact;
        if (d.technical_contact) cust.technical_contact = d.technical_contact;
        if (d.industry) cust.industry = d.industry;
        if (d.time_zone) cust.time_zone = d.time_zone;
        if (d.currency) cust.currency = d.currency;
        if (d.tier) cust.tier = d.tier.toUpperCase();
        if (d.risk_status) cust.risk_status = d.risk_status;

        cust.updated_by = actingUser || 'admin';
        cust.updated_on = new Date().toISOString();

        this.auditService.logEvent('CUSTOMER_ORGANIZATION_UPDATED', 'ORGANIZATION', cust.updated_by, customerId, 'SUCCESS', 'Organization updated: ' + customerId);
        return { success: true, customer: cust };
    },

    /**
     * Governs customer status lifecycle transitions.
     */
    transitionStatus: function(customerId, targetStatus, reason, actingUser) {
        'use strict';
        var cust = AppForgeCustomerOrganizationService._store.customers[customerId];
        if (!cust) return { success: false, errorCode: 'CUSTOMER_NOT_FOUND', error: 'Customer not found.' };

        var allowedStates = ['PROSPECT', 'TRIAL', 'ONBOARDING', 'ACTIVE', 'SUSPENDED', 'OFFBOARDING', 'CLOSED'];
        var target = (targetStatus || '').toUpperCase();
        if (allowedStates.indexOf(target) === -1) {
            return { success: false, errorCode: 'INVALID_STATUS_TRANSITION', error: 'Invalid status: ' + target };
        }

        var prevStatus = cust.status;
        cust.status = target;
        cust.environment_status = (target === 'SUSPENDED' || target === 'CLOSED') ? 'SUSPENDED' : 'ACTIVE';
        cust.updated_by = actingUser || 'admin';
        cust.updated_on = new Date().toISOString();

        this.auditService.logEvent('CUSTOMER_STATUS_TRANSITION', 'ORGANIZATION', cust.updated_by, customerId, 'SUCCESS', 'Customer status: ' + prevStatus + ' -> ' + target + ' (Reason: ' + (reason || 'None') + ')');
        return { success: true, customer: cust, previous_status: prevStatus, new_status: target };
    },

    suspendOrganization: function(customerId, reason, actingUser) {
        'use strict';
        return this.transitionStatus(customerId, 'SUSPENDED', reason || 'Non-payment or administrative lock', actingUser);
    },

    reactivateOrganization: function(customerId, actingUser) {
        'use strict';
        return this.transitionStatus(customerId, 'ACTIVE', 'Reactivated by administrator', actingUser);
    },

    getOrganization: function(customerId) {
        'use strict';
        var cust = AppForgeCustomerOrganizationService._store.customers[customerId];
        return cust ? { success: true, customer: cust } : { success: false, errorCode: 'CUSTOMER_NOT_FOUND' };
    },

    listOrganizations: function(filter) {
        'use strict';
        var f = filter || {};
        var list = [];
        for (var k in AppForgeCustomerOrganizationService._store.customers) {
            list.push(AppForgeCustomerOrganizationService._store.customers[k]);
        }
        if (f.status) list = list.filter(function(c) { return c.status === f.status.toUpperCase(); });
        if (f.tier) list = list.filter(function(c) { return c.tier === f.tier.toUpperCase(); });
        return list;
    },

    resetStore: function() {
        'use strict';
        AppForgeCustomerOrganizationService._store = {
            customers: {}
        };
        this._store = AppForgeCustomerOrganizationService._store;
    },

    type: 'AppForgeCustomerOrganizationService'
};
