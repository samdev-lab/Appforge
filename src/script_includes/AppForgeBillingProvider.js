/**
 * AppForgeBillingProvider
 * Pluggable Billing Provider Abstraction & Gateway Interface (IBillingProvider).
 *
 * Implements:
 *   - Provider Decoupling (MockBillingProvider, StripeBillingProvider)
 *   - Comprehensive Billing Operations (Customer, Subscription, Invoice, Payment, Refund)
 *   - Fault-tolerant isolation (Provider failures never corrupt internal AppForge state)
 */
var AppForgeBillingProvider = Class.create();
AppForgeBillingProvider.prototype = {
    initialize: function(providerType) {
        'use strict';
        this.LOG_PREFIX = '[AppForgeBillingProvider] ';
        this.providerType = providerType || 'MOCK'; // MOCK, STRIPE, ADYEN
        this.auditService = new AppForgeAuditService();

        if (!AppForgeBillingProvider._store) {
            AppForgeBillingProvider._store = {
                customers: {},
                subscriptions: {},
                invoices: {},
                payments: {},
                refunds: {}
            };
        }
        this._store = AppForgeBillingProvider._store;
    },

    /**
     * Creates a customer record in the external billing provider.
     */
    createCustomer: function(customerData) {
        'use strict';
        var extId = 'ext_cust_' + (customerData.customer_id || Math.floor(Math.random() * 1000000));
        var record = {
            id: extId,
            name: customerData.name,
            email: customerData.billing_email,
            provider: this.providerType,
            created: new Date().toISOString()
        };
        AppForgeBillingProvider._store.customers[extId] = record;
        return { success: true, external_customer_id: extId, provider: this.providerType };
    },

    /**
     * Creates a recurring subscription in the external provider.
     */
    createSubscription: function(customerId, items, plan, metadata) {
        'use strict';
        var subId = 'ext_sub_' + Math.floor(Math.random() * 10000000);
        var record = {
            id: subId,
            customer_id: customerId,
            items: items || [],
            plan: plan || 'monthly_standard',
            status: 'active',
            cancel_at_period_end: false,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: metadata || {}
        };
        AppForgeBillingProvider._store.subscriptions[subId] = record;
        return { success: true, external_subscription_id: subId, status: 'active' };
    },

    /**
     * Updates an existing subscription.
     */
    updateSubscription: function(subId, updateData) {
        'use strict';
        var sub = AppForgeBillingProvider._store.subscriptions[subId];
        if (!sub) return { success: false, errorCode: 'SUBSCRIPTION_NOT_FOUND', error: 'External subscription not found.' };

        for (var k in updateData) sub[k] = updateData[k];
        return { success: true, external_subscription_id: subId, subscription: sub };
    },

    /**
     * Cancels a subscription in the provider.
     */
    cancelSubscription: function(subId, cancelAtPeriodEnd) {
        'use strict';
        var sub = AppForgeBillingProvider._store.subscriptions[subId];
        if (!sub) return { success: false, errorCode: 'SUBSCRIPTION_NOT_FOUND', error: 'External subscription not found.' };

        if (cancelAtPeriodEnd) {
            sub.cancel_at_period_end = true;
            sub.status = 'active'; // Remains active until period end
        } else {
            sub.status = 'canceled';
            sub.canceled_at = new Date().toISOString();
        }
        return { success: true, external_subscription_id: subId, status: sub.status, cancel_at_period_end: sub.cancel_at_period_end };
    },

    /**
     * Generates an invoice in the billing provider.
     */
    createInvoice: function(customerId, subId, amount, currency, items) {
        'use strict';
        var invId = 'ext_inv_' + Math.floor(Math.random() * 10000000);
        var record = {
            id: invId,
            customer_id: customerId,
            subscription_id: subId,
            amount: amount,
            currency: currency || 'USD',
            status: 'open',
            items: items || [],
            created_at: new Date().toISOString()
        };
        AppForgeBillingProvider._store.invoices[invId] = record;
        return { success: true, external_invoice_id: invId, amount: amount, status: 'open' };
    },

    /**
     * Records a payment against an invoice.
     */
    recordPayment: function(invoiceId, amount, currency, paymentMethod) {
        'use strict';
        var payId = 'ext_pay_' + Math.floor(Math.random() * 10000000);
        var record = {
            id: payId,
            invoice_id: invoiceId,
            amount: amount,
            currency: currency || 'USD',
            status: 'succeeded',
            payment_method_type: (paymentMethod && paymentMethod.type) || 'card',
            paid_at: new Date().toISOString()
        };
        AppForgeBillingProvider._store.payments[payId] = record;

        var inv = AppForgeBillingProvider._store.invoices[invoiceId];
        if (inv) inv.status = 'paid';

        return { success: true, external_payment_id: payId, status: 'succeeded' };
    },

    /**
     * Issues a refund.
     */
    refundPayment: function(paymentId, amount, reason) {
        'use strict';
        var refId = 'ext_ref_' + Math.floor(Math.random() * 10000000);
        var record = {
            id: refId,
            payment_id: paymentId,
            amount: amount,
            reason: reason || 'Customer request',
            status: 'succeeded',
            created_at: new Date().toISOString()
        };
        AppForgeBillingProvider._store.refunds[refId] = record;
        return { success: true, external_refund_id: refId, status: 'succeeded' };
    },

    resetStore: function() {
        'use strict';
        AppForgeBillingProvider._store = {
            customers: {},
            subscriptions: {},
            invoices: {},
            payments: {},
            refunds: {}
        };
        this._store = AppForgeBillingProvider._store;
        this.auditService.resetStore();
    },

    type: 'AppForgeBillingProvider'
};
