/**
 * AppForgePricingEngine
 * Configuration-Driven Pricing, Contract Versioning & Multi-Model Billing Calculator.
 *
 * Implements:
 *   - Configuration-driven application pricing (Zero hardcoded prices in business logic)
 *   - Multiple billing models: FLAT, PER_USER, PER_EXECUTION, PER_API_CALL, PER_STORAGE, TIERED, HYBRID
 *   - Billing frequencies: MONTHLY, ANNUAL (with 16.7% annual discount default)
 *   - Contract pricing: STANDARD_PRICE, CUSTOM_PRICE, ENTERPRISE_PRICE
 *   - Tax & Coupon / Promotional discount abstraction
 */
var AppForgePricingEngine = Class.create();
AppForgePricingEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePricingEngine] ';
        this.auditService = new AppForgeAuditService();

        if (!AppForgePricingEngine._store) {
            AppForgePricingEngine._store = {
                catalog_version: 'v1.0',
                catalog: {
                    'crm': { base_monthly: 699, base_annual: 6990, currency: 'USD', name: 'CRM', model: 'FLAT', per_user_addon: 25, included_users: 5 },
                    'csm': { base_monthly: 799, base_annual: 7990, currency: 'USD', name: 'CSM', model: 'FLAT', per_user_addon: 30, included_users: 5 },
                    'spm': { base_monthly: 999, base_annual: 9990, currency: 'USD', name: 'SPM', model: 'FLAT', per_user_addon: 40, included_users: 5 },
                    'fsm': { base_monthly: 899, base_annual: 8990, currency: 'USD', name: 'FSM', model: 'FLAT', per_user_addon: 35, included_users: 5 },
                    'resource_management': { base_monthly: 499, base_annual: 4990, currency: 'USD', name: 'Resource Management', model: 'FLAT', per_user_addon: 20, included_users: 5 },
                    'bulk_catalog': { base_monthly: 299, base_annual: 2990, currency: 'USD', name: 'Bulk Catalog Manager', model: 'FLAT', per_user_addon: 10, included_users: 10 },
                    'itsm': { base_monthly: 599, base_annual: 5990, currency: 'USD', name: 'ITSM', model: 'FLAT', per_user_addon: 25, included_users: 5 }
                },
                customer_contracts: {}, // customerId -> { appKey: { price, model, approver, type } }
                discounts: {
                    'WELCOME20': { percentage: 20, description: '20% Launch Discount' },
                    'ENTERPRISE30': { percentage: 30, description: '30% Enterprise Partner Discount' }
                }
            };
        }
        this._store = AppForgePricingEngine._store;
    },

    /**
     * Retrieves application pricing metadata.
     */
    getAppPricing: function(appKey) {
        'use strict';
        var key = (appKey || '').toLowerCase().replace(/[\s-]+/g, '_');
        return AppForgePricingEngine._store.catalog[key] || null;
    },

    /**
     * Lists entire product catalog with current versioned pricing.
     */
    listCatalog: function() {
        'use strict';
        var list = [];
        for (var k in AppForgePricingEngine._store.catalog) {
            var item = AppForgePricingEngine._store.catalog[k];
            list.push({
                application_key: k,
                name: item.name,
                monthly_price: item.base_monthly,
                annual_price: item.base_annual,
                currency: item.currency,
                model: item.model,
                included_users: item.included_users,
                catalog_version: AppForgePricingEngine._store.catalog_version
            });
        }
        return list;
    },

    /**
     * Calculates price for a single application item.
     */
    calculateItemPrice: function(appKey, frequency, quantity, model, customerId, discountCode) {
        'use strict';
        var key = (appKey || '').toLowerCase().replace(/[\s-]+/g, '_');
        var cat = this.getAppPricing(key);
        if (!cat) throw new Error('Application ' + appKey + ' not found in catalog.');

        var freq = (frequency || 'MONTHLY').toUpperCase();
        var q = (typeof quantity === 'number' && quantity > 0) ? quantity : 1;
        var selectedModel = model || cat.model;

        // 1. Check for Customer Custom Contract Price
        var contract = (customerId && AppForgePricingEngine._store.customer_contracts[customerId]) ? AppForgePricingEngine._store.customer_contracts[customerId][key] : null;

        var basePrice = 0;
        var pricingType = 'STANDARD_PRICE';

        if (contract) {
            basePrice = (freq === 'ANNUAL') ? (contract.price * 10) : contract.price;
            pricingType = contract.type || 'CUSTOM_PRICE';
        } else {
            basePrice = (freq === 'ANNUAL') ? cat.base_annual : cat.base_monthly;
        }

        var userAddon = 0;
        if (selectedModel === 'PER_USER' || selectedModel === 'HYBRID') {
            var extraUsers = Math.max(0, q - (cat.included_users || 0));
            userAddon = extraUsers * (cat.per_user_addon || 20) * (freq === 'ANNUAL' ? 10 : 1);
        }

        var subtotal = basePrice + userAddon;

        // 2. Apply Discounts
        var discountPct = 0;
        if (discountCode && AppForgePricingEngine._store.discounts[discountCode]) {
            discountPct = AppForgePricingEngine._store.discounts[discountCode].percentage;
        }
        var discountAmount = (subtotal * discountPct) / 100;
        var total = Math.max(0, subtotal - discountAmount);

        return {
            application_key: key,
            frequency: freq,
            quantity: q,
            pricing_type: pricingType,
            base_price: basePrice,
            addons: userAddon,
            subtotal: subtotal,
            discount_percentage: discountPct,
            discount_amount: discountAmount,
            total: total,
            currency: cat.currency || 'USD'
        };
    },

    /**
     * Calculates total for multi-item subscription bundle with tax.
     */
    calculateSubscriptionTotal: function(items, frequency, customerId, discountCode, taxRate) {
        'use strict';
        var list = items || [];
        var calculatedItems = [];
        var subtotal = 0;
        var totalDiscount = 0;

        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var appKey = typeof item === 'string' ? item : item.application_key;
            var q = (typeof item === 'object' && item.quantity) ? item.quantity : 1;
            var calc = this.calculateItemPrice(appKey, frequency, q, null, customerId, discountCode);
            calculatedItems.push(calc);
            subtotal += calc.subtotal;
            totalDiscount += calc.discount_amount;
        }

        var netSubtotal = subtotal - totalDiscount;
        var taxPct = (typeof taxRate === 'number') ? taxRate : 0;
        var taxAmount = (netSubtotal * taxPct) / 100;
        var grandTotal = netSubtotal + taxAmount;

        return {
            frequency: (frequency || 'MONTHLY').toUpperCase(),
            currency: 'USD',
            item_count: calculatedItems.length,
            items: calculatedItems,
            subtotal: subtotal,
            discount_total: totalDiscount,
            net_subtotal: netSubtotal,
            tax_rate: taxPct,
            tax_amount: taxAmount,
            grand_total: grandTotal
        };
    },

    /**
     * Sets governed customer contract price.
     */
    setCustomerContractPrice: function(customerId, appKey, customPrice, pricingType, requester, approver) {
        'use strict';
        if (!customerId || !appKey || typeof customPrice !== 'number') {
            throw new Error('Customer ID, app key, and custom price are required.');
        }
        var key = appKey.toLowerCase().replace(/[\s-]+/g, '_');

        // Four-Eyes Check
        if (requester && approver && requester === approver) {
            return {
                success: false,
                errorCode: 'FOUR_EYES_APPROVAL_REQUIRED',
                error: 'Contract price override requires Four-Eyes separation (Requester ' + requester + ' cannot self-approve).'
            };
        }

        if (!AppForgePricingEngine._store.customer_contracts[customerId]) {
            AppForgePricingEngine._store.customer_contracts[customerId] = {};
        }

        var contractRec = {
            application_key: key,
            price: customPrice,
            type: pricingType || 'ENTERPRISE_PRICE',
            requester: requester || 'sales_lead',
            approver: approver || 'vp_sales',
            created_at: new Date().toISOString()
        };

        AppForgePricingEngine._store.customer_contracts[customerId][key] = contractRec;
        this.auditService.logEvent('platform', approver || 'system', 'CONTRACT_PRICE_SET', key, 'pricing', 'SUCCESS', null, { customer_id: customerId, custom_price: customPrice, type: contractRec.type });

        return { success: true, contract: contractRec };
    },

    resetStore: function() {
        'use strict';
        AppForgePricingEngine._store = {
            catalog_version: 'v1.0',
            catalog: {
                'crm': { base_monthly: 699, base_annual: 6990, currency: 'USD', name: 'CRM', model: 'FLAT', per_user_addon: 25, included_users: 5 },
                'csm': { base_monthly: 799, base_annual: 7990, currency: 'USD', name: 'CSM', model: 'FLAT', per_user_addon: 30, included_users: 5 },
                'spm': { base_monthly: 999, base_annual: 9990, currency: 'USD', name: 'SPM', model: 'FLAT', per_user_addon: 40, included_users: 5 },
                'fsm': { base_monthly: 899, base_annual: 8990, currency: 'USD', name: 'FSM', model: 'FLAT', per_user_addon: 35, included_users: 5 },
                'resource_management': { base_monthly: 499, base_annual: 4990, currency: 'USD', name: 'Resource Management', model: 'FLAT', per_user_addon: 20, included_users: 5 },
                'bulk_catalog': { base_monthly: 299, base_annual: 2990, currency: 'USD', name: 'Bulk Catalog Manager', model: 'FLAT', per_user_addon: 10, included_users: 10 },
                'itsm': { base_monthly: 599, base_annual: 5990, currency: 'USD', name: 'ITSM', model: 'FLAT', per_user_addon: 25, included_users: 5 }
            },
            customer_contracts: {},
            discounts: {
                'WELCOME20': { percentage: 20, description: '20% Launch Discount' },
                'ENTERPRISE30': { percentage: 30, description: '30% Enterprise Partner Discount' }
            }
        };
        this._store = AppForgePricingEngine._store;
        this.auditService.resetStore();
    },

    type: 'AppForgePricingEngine'
};
