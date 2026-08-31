/**
 * AppForgeCustomerSupportService
 * Customer Support Ticketing & Governed Knowledge Base Service.
 *
 * Implements:
 *   - Customer Support Requests (x_appforge_ops_request) with Multi-Tenant Customer Scoping
 *   - Role-Gated Knowledge Base (x_appforge_ops_knowledge) with Visibility Filtering (PUBLIC, CUSTOMER, INTERNAL)
 *   - Strict Confidentiality (Customer users cannot access INTERNAL articles)
 */
var AppForgeCustomerSupportService = Class.create();
AppForgeCustomerSupportService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCustomerSupportService] ';

        if (!AppForgeCustomerSupportService._store) {
            AppForgeCustomerSupportService._store = {
                requests: [],
                articles: [
                    { number: 'KB-001', title: 'Connecting CRM REST Endpoints', category: 'INTEGRATION_GUIDE', visibility: 'PUBLIC', content: 'Step-by-step CRM integration.' },
                    { number: 'KB-002', title: 'Bulk Catalog Excel Import Template Guide', category: 'HOW_TO', visibility: 'CUSTOMER', content: 'How to populate BC-001 template.' },
                    { number: 'KB-003', title: 'Internal Platform Secrets Vault Encryption Keys', category: 'TROUBLESHOOTING', visibility: 'INTERNAL', content: 'Confidential internal infrastructure key rotation.' }
                ]
            };
        }
        this._store = AppForgeCustomerSupportService._store;
    },

    /**
     * Submits a customer support request.
     */
    createSupportRequest: function(a1, a2, a3, a4, a5, a6) {
        'use strict';
        var o = (typeof a1 === 'object' && a1 !== null) ? a1 : {
            customer: a1,
            application: a2,
            category: a3,
            priority: a4,
            description: a5,
            requester: a6
        };
        var reqNumber = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
        var req = {
            request_id: 'req_' + Date.now().toString(36),
            number: reqNumber,
            request_number: reqNumber,
            customer: o.customer || 'cust_acme',
            requester: o.requester || 'customer_user',
            application: o.application || 'crm',
            category: o.category || 'General Inquiry',
            priority: (o.priority || 'P3').toUpperCase(),
            description: o.description || 'Support request',
            state: 'SUBMITTED', // SUBMITTED, IN_PROGRESS, RESOLVED, CLOSED
            assigned_to: 'support_agent_01',
            opened_at: new Date().toISOString(),
            resolved_at: null
        };

        AppForgeCustomerSupportService._store.requests.push(req);
        req.success = true;
        req.request = req;
        return req;
    },

    listCustomerRequests: function(customerId) {
        'use strict';
        return AppForgeCustomerSupportService._store.requests.filter(function(r) {
            return r.customer === customerId;
        });
    },

    getKnowledgeArticles: function(role) {
        'use strict';
        return this.listKnowledgeArticles(role);
    },

    /**
     * Lists knowledge articles with strict visibility enforcement.
     */
    listKnowledgeArticles: function(userRole) {
        'use strict';
        var role = (userRole || 'CUSTOMER_USER').toUpperCase();
        var isInternal = (role === 'APPFORGE_OPERATIONS_ADMIN' || role === 'APPFORGE_SUPPORT_AGENT' || role === 'ADMIN');

        return AppForgeCustomerSupportService._store.articles.filter(function(a) {
            if (isInternal) return true;
            if (role === 'CUSTOMER_USER' || role === 'CUSTOMER_ADMIN' || role === 'BILLING_ADMIN') {
                return (a.visibility === 'PUBLIC' || a.visibility === 'CUSTOMER');
            }
            return (a.visibility === 'PUBLIC');
        });
    },

    createArticle: function(title, category, visibility, content) {
        'use strict';
        var kbNumber = 'KB-' + Math.floor(100 + Math.random() * 900);
        var article = {
            number: kbNumber,
            title: title,
            category: (category || 'HOW_TO').toUpperCase(),
            visibility: (visibility || 'CUSTOMER').toUpperCase(),
            content: content || ''
        };
        AppForgeCustomerSupportService._store.articles.push(article);
        return article;
    },

    resetStore: function() {
        'use strict';
        AppForgeCustomerSupportService._store = {
            requests: [],
            articles: [
                { number: 'KB-001', title: 'Connecting CRM REST Endpoints', category: 'INTEGRATION_GUIDE', visibility: 'PUBLIC', content: 'Step-by-step CRM integration.' },
                { number: 'KB-002', title: 'Bulk Catalog Excel Import Template Guide', category: 'HOW_TO', visibility: 'CUSTOMER', content: 'How to populate BC-001 template.' },
                { number: 'KB-003', title: 'Internal Platform Secrets Vault Encryption Keys', category: 'TROUBLESHOOTING', visibility: 'INTERNAL', content: 'Confidential internal infrastructure key rotation.' }
            ]
        };
        this._store = AppForgeCustomerSupportService._store;
    },

    type: 'AppForgeCustomerSupportService'
};
