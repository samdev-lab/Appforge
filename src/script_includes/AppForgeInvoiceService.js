/**
 * AppForgeInvoiceService
 * Commercial Invoicing & Line Item Generation Service.
 *
 * Implements:
 *   - Invoice status progression: DRAFT -> OPEN -> PAID -> VOID / UNCOLLECTIBLE
 *   - Multi-item calculation with taxes, discounts, and usage overage
 *   - Customer invoice history querying & multi-tenant isolation
 */
var AppForgeInvoiceService = Class.create();
AppForgeInvoiceService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeInvoiceService] ';
        this.pricingEngine = new AppForgePricingEngine();
        this.auditService = new AppForgeAuditService();

        if (!AppForgeInvoiceService._store) {
            AppForgeInvoiceService._store = {
                invoices: {}, // invId -> invoice record
                customer_invoices: {} // customerId -> array of invIds
            };
        }
        this._store = AppForgeInvoiceService._store;
    },

    /**
     * Generates a detailed commercial invoice with line items.
     */
    generateInvoice: function(customerId, subId, items, discountCode, taxRate) {
        'use strict';
        if (!customerId) throw new Error('Customer ID is required.');

        var invId = 'inv_' + Math.floor(Math.random() * 10000000);
        var invNum = 'INV-' + Math.floor(100000 + Math.random() * 900000);
        var calc = this.pricingEngine.calculateSubscriptionTotal(items || [], 'MONTHLY', customerId, discountCode, taxRate);

        var now = new Date();
        var due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        var invoiceRec = {
            invoice_id: invId,
            invoice_number: invNum,
            customer_id: customerId,
            subscription_id: subId || 'sub_manual',
            status: 'OPEN',
            currency: calc.currency || 'USD',
            subtotal: calc.subtotal,
            discount: calc.discount_total,
            tax: calc.tax_amount,
            total: calc.grand_total,
            amount_paid: 0,
            amount_due: calc.grand_total,
            invoice_date: now.toISOString(),
            due_date: due.toISOString(),
            paid_date: null,
            line_items: calc.items.map(function(item) {
                return {
                    application_key: item.application_key,
                    description: 'AppForge ' + item.application_key.toUpperCase() + ' Subscription',
                    quantity: item.quantity,
                    unit_price: item.base_price,
                    amount: item.total
                };
            })
        };

        AppForgeInvoiceService._store.invoices[invId] = invoiceRec;
        if (!AppForgeInvoiceService._store.customer_invoices[customerId]) {
            AppForgeInvoiceService._store.customer_invoices[customerId] = [];
        }
        AppForgeInvoiceService._store.customer_invoices[customerId].push(invId);

        this.auditService.logEvent('tenant_' + customerId, 'billing', 'INVOICE_GENERATED', 'commercial', 'invoice', 'SUCCESS', invId, { invoice_number: invNum, total: invoiceRec.total });
        return invoiceRec;
    },

    getInvoice: function(invoiceId) {
        'use strict';
        return AppForgeInvoiceService._store.invoices[invoiceId] || null;
    },

    listCustomerInvoices: function(customerId) {
        'use strict';
        var ids = AppForgeInvoiceService._store.customer_invoices[customerId] || [];
        return ids.map(function(id) {
            return AppForgeInvoiceService._store.invoices[id];
        }).filter(Boolean);
    },

    markInvoicePaid: function(invoiceId, paymentId) {
        'use strict';
        var inv = this.getInvoice(invoiceId);
        if (!inv) return { success: false, errorCode: 'INVOICE_NOT_FOUND', error: 'Invoice not found.' };

        inv.status = 'PAID';
        inv.amount_paid = inv.total;
        inv.amount_due = 0;
        inv.paid_date = new Date().toISOString();
        inv.payment_id = paymentId;

        return { success: true, status: 'PAID', invoice: inv };
    },

    voidInvoice: function(invoiceId, reason) {
        'use strict';
        var inv = this.getInvoice(invoiceId);
        if (!inv) return { success: false, errorCode: 'INVOICE_NOT_FOUND', error: 'Invoice not found.' };

        inv.status = 'VOID';
        inv.void_reason = reason || 'Administrative void';
        return { success: true, status: 'VOID', invoice: inv };
    },

    resetStore: function() {
        'use strict';
        AppForgeInvoiceService._store = {
            invoices: {},
            customer_invoices: {}
        };
        this._store = AppForgeInvoiceService._store;
        this.auditService.resetStore();
    },

    type: 'AppForgeInvoiceService'
};
