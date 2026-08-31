/**
 * AppForgePaymentService
 * Commercial Payment Processing & PCI-Compliant Transaction Record Engine.
 *
 * Implements:
 *   - Payment status tracking (PENDING, SUCCEEDED, FAILED, REFUNDED, CANCELLED)
 *   - Zero storage of raw card numbers (Tokenized provider IDs only)
 *   - Automatic invoice status synchronization upon payment success
 *   - Governed Refund Processing
 */
var AppForgePaymentService = Class.create();
AppForgePaymentService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePaymentService] ';
        this.billingProvider = new AppForgeBillingProvider();
        this.invoiceService = new AppForgeInvoiceService();
        this.auditService = new AppForgeAuditService();

        if (!AppForgePaymentService._store) {
            AppForgePaymentService._store = {
                payments: {}, // payId -> payment record
                customer_payments: {} // customerId -> array of payIds
            };
        }
        this._store = AppForgePaymentService._store;
    },

    /**
     * Processes a payment against an invoice.
     */
    processPayment: function(customerId, invoiceId, amount, paymentMethod) {
        'use strict';
        if (!customerId || !invoiceId) throw new Error('Customer ID and Invoice ID are required.');

        var payId = 'pay_' + Math.floor(Math.random() * 10000000);
        var payNum = 'PAY-' + Math.floor(100000 + Math.random() * 900000);

        // Execute via provider
        var provRes = this.billingProvider.recordPayment(invoiceId, amount, 'USD', paymentMethod);

        var paymentRec = {
            payment_id: payId,
            payment_number: payNum,
            customer_id: customerId,
            invoice_id: invoiceId,
            provider: this.billingProvider.providerType,
            external_payment_id: provRes.external_payment_id,
            amount: amount,
            currency: 'USD',
            status: 'SUCCEEDED',
            payment_date: new Date().toISOString(),
            failure_code: null,
            failure_message: null
        };

        AppForgePaymentService._store.payments[payId] = paymentRec;
        if (!AppForgePaymentService._store.customer_payments[customerId]) {
            AppForgePaymentService._store.customer_payments[customerId] = [];
        }
        AppForgePaymentService._store.customer_payments[customerId].push(payId);

        // Update invoice
        this.invoiceService.markInvoicePaid(invoiceId, payId);

        this.auditService.logEvent('tenant_' + customerId, 'payment_gateway', 'PAYMENT_PROCESSED', 'commercial', 'payment', 'SUCCESS', payId, { invoice_id: invoiceId, amount: amount });
        return { success: true, status: 'SUCCEEDED', payment: paymentRec };
    },

    /**
     * Records a payment failure.
     */
    recordFailedPayment: function(customerId, invoiceId, amount, errorCode, errorMessage) {
        'use strict';
        var payId = 'pay_' + Math.floor(Math.random() * 10000000);
        var paymentRec = {
            payment_id: payId,
            payment_number: 'PAY-FAIL-' + Math.floor(100000 + Math.random() * 900000),
            customer_id: customerId,
            invoice_id: invoiceId,
            amount: amount,
            status: 'FAILED',
            failure_code: errorCode || 'CARD_DECLINED',
            failure_message: errorMessage || 'Payment declined by issuer',
            payment_date: new Date().toISOString()
        };

        AppForgePaymentService._store.payments[payId] = paymentRec;
        this.auditService.logEvent('tenant_' + customerId, 'payment_gateway', 'PAYMENT_FAILED', 'commercial', 'payment', 'FAILED', payId, { error_code: paymentRec.failure_code });
        return paymentRec;
    },

    /**
     * Issues a governed refund.
     */
    issueRefund: function(paymentId, amount, reason, requester, approver) {
        'use strict';
        var pay = AppForgePaymentService._store.payments[paymentId];
        if (!pay) return { success: false, errorCode: 'PAYMENT_NOT_FOUND', error: 'Payment record not found.' };

        // Four-Eyes Check for manual refunds
        if (requester && approver && requester === approver) {
            return {
                success: false,
                errorCode: 'FOUR_EYES_APPROVAL_REQUIRED',
                error: 'Refund requires Four-Eyes separation (Requester ' + requester + ' cannot self-approve).'
            };
        }

        pay.status = 'REFUNDED';
        pay.refund_amount = amount || pay.amount;
        pay.refund_reason = reason || 'Customer refund';
        pay.refunded_at = new Date().toISOString();

        this.auditService.logEvent('tenant_' + pay.customer_id, approver || 'system', 'PAYMENT_REFUNDED', 'commercial', 'payment', 'SUCCESS', paymentId, { refund_amount: pay.refund_amount });
        return { success: true, status: 'REFUNDED', payment: pay };
    },

    resetStore: function() {
        'use strict';
        AppForgePaymentService._store = {
            payments: {},
            customer_payments: {}
        };
        this._store = AppForgePaymentService._store;
        this.billingProvider.resetStore();
        this.invoiceService.resetStore();
        this.auditService.resetStore();
    },

    type: 'AppForgePaymentService'
};
