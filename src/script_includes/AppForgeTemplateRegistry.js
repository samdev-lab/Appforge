/**
 * AppForgeTemplateRegistry
 * Manages the catalog of certified, declarative AppForge application templates.
 * Enforces versioning, category taxonomy, certification state, and 5-layer specifications.
 */
var AppForgeTemplateRegistry = Class.create();
AppForgeTemplateRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.templates = {};
        this._loadDefaultTemplates();
    },

    /**
     * Registers or updates a template definition in the registry.
     */
    registerTemplate: function(templateDef) {
        'use strict';
        if (!templateDef || !templateDef.template_id) {
            throw new Error('Template definition must include a unique template_id.');
        }

        templateDef.status = templateDef.status || 'PUBLISHED';
        templateDef.certification_status = templateDef.certification_status || 'CERTIFIED';
        templateDef.version = templateDef.version || '1.0.0';
        templateDef.publisher = templateDef.publisher || 'AppForge Certified';
        templateDef.installation_count = templateDef.installation_count || 0;
        templateDef.created_on = templateDef.created_on || new Date().toISOString();

        var key = templateDef.template_id + '@' + templateDef.version;
        this.templates[key] = templateDef;

        // Also store as latest pointer
        this.templates[templateDef.template_id] = templateDef;
        return templateDef;
    },

    /**
     * Retrieves a template by ID and optional version.
     */
    getTemplate: function(templateId, version) {
        'use strict';
        if (!templateId) return null;
        if (version) {
            return this.templates[templateId + '@' + version] || null;
        }
        return this.templates[templateId] || null;
    },

    /**
     * Lists templates with optional filters (category, search, status).
     */
    listTemplates: function(filters) {
        'use strict';
        filters = filters || {};
        var list = [];
        var seen = {};

        for (var key in this.templates) {
            if (this.templates.hasOwnProperty(key)) {
                var t = this.templates[key];
                if (seen[t.template_id]) continue;
                seen[t.template_id] = true;

                // Only show PUBLISHED / CERTIFIED templates to end customers by default
                if (filters.only_certified !== false && t.status !== 'PUBLISHED' && t.status !== 'CERTIFIED') {
                    continue;
                }

                // Category filter
                if (filters.category && filters.category !== 'All' && t.category !== filters.category) {
                    continue;
                }

                // Search query filter
                if (filters.search) {
                    var q = filters.search.toLowerCase();
                    var matchName = (t.name || '').toLowerCase().indexOf(q) !== -1;
                    var matchDesc = (t.description || '').toLowerCase().indexOf(q) !== -1;
                    var matchCat = (t.category || '').toLowerCase().indexOf(q) !== -1;
                    if (!matchName && !matchDesc && !matchCat) continue;
                }

                list.push(t);
            }
        }

        return list;
    },

    /**
     * Seeds standard enterprise application templates.
     */
    _loadDefaultTemplates: function() {
        'use strict';
        // 1. Employee Onboarding (HR)
        this.registerTemplate({
            template_id: 'employee_onboarding',
            name: 'Employee Onboarding',
            display_name: 'Employee Onboarding Suite',
            category: 'HR',
            version: '1.0.0',
            description: 'Automate new hire provisioning, hardware logistics, credential requests, and departmental tasks.',
            icon: '👤',
            pricing_model: 'SUBSCRIPTION',
            price: 499,
            billing_period: 'MONTHLY',
            modules: [
                { name: 'Onboarding Requests', table: 'onboarding_request', icon: 'clipboard' },
                { name: 'Employees', table: 'employee', icon: 'users' },
                { name: 'Onboarding Tasks', table: 'onboarding_task', icon: 'check-square' },
                { name: 'Onboarding Reports', table: 'onboarding_request', icon: 'bar-chart' }
            ],
            layers: {
                data: {
                    tables: [
                        { name: 'onboarding_request', label: 'Onboarding Request', fields: ['employee_name', 'department', 'start_date', 'status'] },
                        { name: 'onboarding_task', label: 'Onboarding Task', fields: ['task_name', 'assigned_to', 'due_date', 'state'] }
                    ]
                },
                experience: {
                    forms: ['Onboarding Request Form', 'Onboarding Task Form'],
                    lists: ['Active Requests', 'Pending Tasks']
                },
                logic: {
                    business_rules: ['Auto-Assign IT Hardware Task', 'Notify Manager on Completion']
                },
                security: {
                    roles: ['hr_manager', 'onboarding_user'],
                    acls: ['read', 'write', 'create']
                },
                integration: {
                    rest_endpoints: ['/api/onboard/v1/intake']
                }
            }
        });

        // 2. Vendor Management (Vendor Management / Procurement)
        this.registerTemplate({
            template_id: 'vendor_management',
            name: 'Vendor Management',
            display_name: 'Enterprise Vendor & Supplier Management',
            category: 'Vendor Management',
            version: '1.0.0',
            description: 'Manage third-party vendor contracts, security reviews, SLA compliance, and supplier performance.',
            icon: '🏢',
            pricing_model: 'SUBSCRIPTION',
            price: 599,
            billing_period: 'MONTHLY',
            modules: [
                { name: 'Vendor Directory', table: 'vendor', icon: 'building' },
                { name: 'Contracts & SLAs', table: 'vendor_contract', icon: 'file-text' },
                { name: 'Risk Assessments', table: 'vendor_risk', icon: 'shield' }
            ],
            layers: {
                data: {
                    tables: [
                        { name: 'vendor', label: 'Vendor', fields: ['vendor_name', 'contact_email', 'status', 'tier'] },
                        { name: 'vendor_contract', label: 'Vendor Contract', fields: ['contract_title', 'value', 'expiry_date'] }
                    ]
                },
                experience: { forms: ['Vendor Form'], lists: ['Active Vendors'] },
                logic: { business_rules: ['Contract Expiry Alert'] },
                security: { roles: ['vendor_manager', 'procurement_admin'], acls: ['read', 'write'] },
                integration: { rest_endpoints: ['/api/vendor/v1/sync'] }
            }
        });

        // 3. Customer Request Management (CSM)
        this.registerTemplate({
            template_id: 'customer_request',
            name: 'Customer Request Management',
            display_name: 'Customer Service & Case Hub',
            category: 'CSM',
            version: '1.0.0',
            description: 'Enterprise customer intake, case escalation, SLA response tracking, and customer communications.',
            icon: '💬',
            pricing_model: 'SUBSCRIPTION',
            price: 699,
            billing_period: 'MONTHLY',
            modules: [
                { name: 'Customer Cases', table: 'csm_case', icon: 'inbox' },
                { name: 'Customer Accounts', table: 'csm_account', icon: 'briefcase' },
                { name: 'SLA Escalations', table: 'csm_escalation', icon: 'alert-triangle' }
            ],
            layers: {
                data: { tables: [{ name: 'csm_case', label: 'Customer Case', fields: ['case_number', 'subject', 'priority', 'state'] }] },
                experience: { forms: ['Case Form'], lists: ['Open Cases'] },
                logic: { business_rules: ['Escalate High Priority Cases'] },
                security: { roles: ['csm_agent', 'csm_manager'], acls: ['read', 'write', 'create'] },
                integration: { rest_endpoints: ['/api/csm/v1/cases'] }
            }
        });

        // 4. Asset Request (Operations / ITSM)
        this.registerTemplate({
            template_id: 'asset_request',
            name: 'Asset Request',
            display_name: 'IT Hardware & Asset Provisioning',
            category: 'Operations',
            version: '1.0.0',
            description: 'Track hardware inventory requests, laptop allocations, mobile devices, and return logistics.',
            icon: '💻',
            pricing_model: 'SUBSCRIPTION',
            price: 399,
            billing_period: 'MONTHLY',
            modules: [
                { name: 'Asset Requests', table: 'asset_request', icon: 'shopping-cart' },
                { name: 'Hardware Inventory', table: 'asset_inventory', icon: 'hard-drive' }
            ],
            layers: {
                data: { tables: [{ name: 'asset_request', label: 'Asset Request', fields: ['requested_item', 'requester', 'delivery_status'] }] },
                experience: { forms: ['Asset Request Form'], lists: ['Pending Orders'] },
                logic: { business_rules: ['Deduct Stock on Fulfillment'] },
                security: { roles: ['asset_admin', 'asset_user'], acls: ['read', 'write', 'create'] },
                integration: { rest_endpoints: ['/api/assets/v1/orders'] }
            }
        });

        // 5. Incident Management Lite (ITSM)
        this.registerTemplate({
            template_id: 'incident_lite',
            name: 'Incident Management Lite',
            display_name: 'Lightweight Incident & Service Desk',
            category: 'ITSM',
            version: '1.0.0',
            description: 'Streamlined incident intake, severity routing, assignment queues, and resolution tracking.',
            icon: '🚨',
            pricing_model: 'SUBSCRIPTION',
            price: 450,
            billing_period: 'MONTHLY',
            modules: [
                { name: 'Active Incidents', table: 'incident_lite', icon: 'alert-circle' },
                { name: 'Resolved Incidents', table: 'incident_lite', icon: 'check-circle' }
            ],
            layers: {
                data: { tables: [{ name: 'incident_lite', label: 'Incident Lite', fields: ['number', 'short_description', 'severity', 'assigned_to'] }] },
                experience: { forms: ['Incident Lite Form'], lists: ['Open Incidents'] },
                logic: { business_rules: ['Auto-Route P1 Incidents'] },
                security: { roles: ['itil_lite', 'incident_admin'], acls: ['read', 'write', 'create'] },
                integration: { rest_endpoints: ['/api/incident/v1/intake'] }
            }
        });

        // 6. Employee Offboarding (HR)
        this.registerTemplate({
            template_id: 'employee_offboarding',
            name: 'Employee Offboarding',
            display_name: 'Secure Employee Offboarding & Asset Recovery',
            category: 'HR',
            version: '1.0.0',
            description: 'Automate account revocation, asset collection, exit interviews, and compliance sign-offs.',
            icon: '🚪',
            pricing_model: 'SUBSCRIPTION',
            price: 399,
            billing_period: 'MONTHLY',
            modules: [
                { name: 'Offboarding Requests', table: 'offboarding_request', icon: 'user-x' },
                { name: 'Asset Returns', table: 'offboarding_asset', icon: 'package' }
            ],
            layers: {
                data: { tables: [{ name: 'offboarding_request', label: 'Offboarding Request', fields: ['employee', 'departure_date', 'status'] }] },
                experience: { forms: ['Offboarding Form'], lists: ['Pending Departures'] },
                logic: { business_rules: ['Revoke Access on Final Date'] },
                security: { roles: ['hr_admin', 'security_officer'], acls: ['read', 'write'] },
                integration: { rest_endpoints: ['/api/offboard/v1/trigger'] }
            }
        });
    },

    type: 'AppForgeTemplateRegistry'
};
