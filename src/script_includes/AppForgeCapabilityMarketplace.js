/**
 * AppForgeCapabilityMarketplace
 * Catalog, search, pricing, and dependency resolution engine for AppForge Capabilities.
 *
 * Supported Capabilities:
 *  1. bulk_catalog ($299/mo)
 *  2. spm ($999/mo)
 *  3. csm ($799/mo)
 *  4. crm ($699/mo)
 *  5. fsm ($899/mo)
 *  6. resource_management ($499/mo)
 *  7. itsm ($599/mo)
 */
var AppForgeCapabilityMarketplace = Class.create();
AppForgeCapabilityMarketplace.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCapabilityMarketplace] ';
        this.TABLE_NAME = 'x_appforge_capability_catalog';

        if (!AppForgeCapabilityMarketplace._memoryStore) {
            AppForgeCapabilityMarketplace._memoryStore = {
                pricing_overrides: {},
                capabilities: this._getInitialCapabilities()
            };
        }
        this._store = AppForgeCapabilityMarketplace._memoryStore;
    },

    /**
     * Lists all published capabilities.
     * @return {Array<Object>} List of capability definitions.
     */
    listCapabilities: function() {
        'use strict';
        var list = [];
        for (var i = 0; i < this._store.capabilities.length; i++) {
            var cap = this._store.capabilities[i];
            var overridePrice = this._store.pricing_overrides[cap.id];
            var copy = JSON.parse(JSON.stringify(cap));
            if (overridePrice !== undefined) copy.price = overridePrice;
            list.push(copy);
        }
        return list;
    },

    /**
     * Retrieves a single capability by ID.
     * @param {string} capabilityId - Capability ID.
     * @return {Object|null} Capability object.
     */
    getCapability: function(capabilityId) {
        'use strict';
        if (!capabilityId) return null;
        var id = capabilityId.toLowerCase().replace(/[\s-]+/g, '_');
        var list = this.listCapabilities();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id || list[i].id === capabilityId) {
                return list[i];
            }
        }
        return null;
    },

    /**
     * Searches capabilities by filter criteria.
     * @param {Object} filter - { category, query, max_price }
     * @return {Array<Object>} Filtered capabilities.
     */
    search: function(filter) {
        'use strict';
        var f = filter || {};
        var list = this.listCapabilities();
        return list.filter(function(cap) {
            if (f.category && f.category !== 'All' && cap.category !== f.category) return false;
            if (f.max_price && cap.price > f.max_price) return false;
            if (f.query) {
                var q = f.query.toLowerCase();
                var nameMatch = cap.name.toLowerCase().indexOf(q) !== -1;
                var descMatch = cap.description.toLowerCase().indexOf(q) !== -1;
                var idMatch = cap.id.toLowerCase().indexOf(q) !== -1;
                if (!nameMatch && !descMatch && !idMatch) return false;
            }
            return true;
        });
    },

    /**
     * Dynamically updates capability pricing from AppForge Control Plane.
     * @param {string} capabilityId - Capability ID.
     * @param {number} newPrice - New monthly subscription price.
     */
    updatePricing: function(capabilityId, newPrice) {
        'use strict';
        if (!capabilityId || typeof newPrice !== 'number' || newPrice < 0) {
            throw new Error('Valid capabilityId and positive numeric price required.');
        }
        var id = capabilityId.toLowerCase().replace(/[\s-]+/g, '_');
        this._store.pricing_overrides[id] = newPrice;
        gs.info(this.LOG_PREFIX + 'Updated price for ' + id + ' to $' + newPrice + '/mo');
        return { success: true, capability_id: id, price: newPrice };
    },

    /**
     * Resolves mandatory and optional dependencies for a capability.
     * @param {string} capabilityId - Capability ID.
     * @return {Object} { mandatory: Array, optional: Array }
     */
    getDependencyChain: function(capabilityId) {
        'use strict';
        var cap = this.getCapability(capabilityId);
        if (!cap) return { mandatory: [], optional: [] };
        return {
            mandatory: cap.dependencies || [],
            optional: cap.optional_dependencies || []
        };
    },

    /**
     * Default catalog of 7 first-class AppForge capabilities.
     * @private
     */
    _getInitialCapabilities: function() {
        'use strict';
        return [
            {
                id: 'bulk_catalog',
                name: 'Bulk Catalog Manager',
                description: 'Bulk create and manage ServiceNow catalog items using standardized 7-sheet Excel templates with variable and fulfillment rule automation.',
                version: '1.0.0',
                schema_version: 'BC-001',
                category: 'Catalog Automation',
                compatibility: 'WashingtonDC, Xanadu, Tokyo, Utah, Vancouver',
                license_type: 'Commercial Subscription',
                price: 299,
                billing_frequency: 'MONTHLY',
                user_limit: 100,
                record_limit: 50000,
                status: 'AVAILABLE',
                features: [
                    '7-Sheet Excel Import & Export',
                    'Dynamic Variable & Choice Generation',
                    'Catalog UI Policy Builder',
                    '10 After-Submit Action Configurations',
                    'Transactional Pre-Import Validation',
                    'Instant Service Portal Orderability'
                ],
                dependencies: []
            },
            {
                id: 'spm',
                name: 'Strategic Portfolio Management (SPM)',
                description: 'End-to-end strategic portfolio governance, demand intake scoring, project portfolio management, resource planning, and financial tracking.',
                version: '1.0.0',
                schema_version: 'SPM-001',
                category: 'Enterprise Management',
                compatibility: 'WashingtonDC, Xanadu, Vancouver',
                license_type: 'Commercial Subscription',
                price: 999,
                billing_frequency: 'MONTHLY',
                user_limit: 250,
                record_limit: 100000,
                status: 'AVAILABLE',
                features: [
                    'Portfolio & Program Hierarchy',
                    'Project & Project Task Tracking',
                    'Demand Management & Scoring Matrix',
                    'Strategic Goal Alignment',
                    'Resource Planning & Financials'
                ],
                dependencies: []
            },
            {
                id: 'csm',
                name: 'Customer Service Management (CSM)',
                description: 'Omni-channel customer service management, case resolution workflows, customer account hierarchies, contact management, and customer health scoring.',
                version: '1.0.0',
                schema_version: 'CSM-001',
                category: 'Customer Experience',
                compatibility: 'WashingtonDC, Xanadu, Vancouver',
                license_type: 'Commercial Subscription',
                price: 799,
                billing_frequency: 'MONTHLY',
                user_limit: 150,
                record_limit: 100000,
                status: 'AVAILABLE',
                features: [
                    'Customer Accounts & Contacts',
                    'Case & Case Task Management',
                    'Customer Interactions & Omnichannel',
                    'Customer Health Scoring',
                    'Entitlement & SLA Management'
                ],
                dependencies: []
            },
            {
                id: 'crm',
                name: 'Customer Relationship Management (CRM)',
                description: 'Complete sales pipeline automation, lead capture, opportunity qualification, activity logging, quoting, and product catalog tracking.',
                version: '1.0.0',
                schema_version: 'CRM-001',
                category: 'Customer Experience',
                compatibility: 'WashingtonDC, Xanadu, Vancouver',
                license_type: 'Commercial Subscription',
                price: 699,
                billing_frequency: 'MONTHLY',
                user_limit: 150,
                record_limit: 75000,
                status: 'AVAILABLE',
                features: [
                    'Lead Intake & Qualification',
                    'Opportunity Pipeline Management',
                    'Sales Activities & Tasks',
                    'Product Catalog & Quote Generation',
                    'Customer Interaction Timeline'
                ],
                dependencies: []
            },
            {
                id: 'fsm',
                name: 'Field Service Management (FSM)',
                description: 'Field workforce scheduling, work order dispatch, territory mapping, field agent skill tracking, and on-site task completion.',
                version: '1.0.0',
                schema_version: 'FSM-001',
                category: 'Operations',
                compatibility: 'WashingtonDC, Xanadu, Vancouver',
                license_type: 'Commercial Subscription',
                price: 899,
                billing_frequency: 'MONTHLY',
                user_limit: 200,
                record_limit: 100000,
                status: 'AVAILABLE',
                features: [
                    'Work Orders & Work Order Tasks',
                    'Field Agent Skill Mapping',
                    'Territory & Location Management',
                    'Dispatch & Scheduling Engine',
                    'Mobile & Field Execution Workflows'
                ],
                dependencies: []
            },
            {
                id: 'resource_management',
                name: 'Resource Management',
                description: 'Capacity planning, resource allocation, skill matching, resource request approvals, and utilization analytics across enterprise projects.',
                version: '1.0.0',
                schema_version: 'RES-001',
                category: 'Enterprise Management',
                compatibility: 'WashingtonDC, Xanadu, Vancouver',
                license_type: 'Commercial Subscription',
                price: 499,
                billing_frequency: 'MONTHLY',
                user_limit: 100,
                record_limit: 50000,
                status: 'AVAILABLE',
                features: [
                    'Resource Pool & Groups',
                    'Resource Plan Allocations',
                    'Capacity vs Availability Matrix',
                    'Resource Request & Approval Flow',
                    'Utilization & Forecasting Reports'
                ],
                dependencies: []
            },
            {
                id: 'itsm',
                name: 'IT Service Management (ITSM)',
                description: 'Standard ServiceNow IT Service Management accelerator delivering incident, problem, change, request, and task automation.',
                version: '1.0.0',
                schema_version: 'ITSM-001',
                category: 'IT Operations',
                compatibility: 'WashingtonDC, Xanadu, Tokyo, Utah, Vancouver',
                license_type: 'Commercial Subscription',
                price: 599,
                billing_frequency: 'MONTHLY',
                user_limit: 200,
                record_limit: 150000,
                status: 'AVAILABLE',
                features: [
                    'Incident Management Lifecycle',
                    'Problem & Root Cause Analysis',
                    'Change Request Risk & Approval',
                    'Service Request Fulfillment',
                    'Executive ITSM Reports & Dashboards'
                ],
                dependencies: []
            }
        ];
    },

    type: 'AppForgeCapabilityMarketplace'
};
