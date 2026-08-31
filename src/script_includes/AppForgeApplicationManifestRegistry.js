/**
 * AppForgeApplicationManifestRegistry
 * Central declarative registry of application manifests for all 7 independent
 * AppForge capabilities: CRM, CSM, SPM, FSM, Resource Management, Bulk Catalog, and ITSM.
 *
 * Manifest defines:
 *  - application metadata (name, scope, version, price, dependencies, plugins)
 *  - tables (OOB reuse for ITSM, custom tables for others)
 *  - fields, references, choices
 *  - forms, form sections, list layouts
 *  - roles, ACLs
 *  - UI Policies, Client Scripts, Business Rules, Flows
 *  - Application Menus and Navigation Modules
 *  - Configuration schema
 */
var AppForgeApplicationManifestRegistry = Class.create();
AppForgeApplicationManifestRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeApplicationManifestRegistry] ';
        this._manifests = this._buildManifestCatalog();
    },

    /**
     * Retrieves manifest for a given capability.
     * @param {string} capabilityId
     * @return {Object|null}
     */
    getManifest: function(capabilityId) {
        'use strict';
        if (!capabilityId) return null;
        var key = String(capabilityId).toLowerCase().replace(/[\s-]+/g, '_');
        return this._manifests[key] || null;
    },

    /**
     * Lists all registered capability manifests.
     * @return {Array<Object>}
     */
    listManifests: function() {
        'use strict';
        var list = [];
        for (var k in this._manifests) {
            if (this._manifests.hasOwnProperty(k)) {
                list.push(this._manifests[k]);
            }
        }
        return list;
    },

    /**
     * Builds declarative manifests for all 7 independent capabilities.
     * @private
     */
    _buildManifestCatalog: function() {
        'use strict';
        return {
            'crm': {
                id: 'crm',
                name: 'Customer Relationship Management (CRM)',
                short_description: 'Manage sales pipeline, accounts, contacts, leads, and opportunities.',
                scope: 'x_appforge_crm',
                version: '1.0.0',
                price: 699,
                billing_model: 'Monthly Subscription',
                edition: 'Enterprise',
                category: 'Sales & Customer Management',
                dependencies: [],
                required_plugins: [],
                is_oob_table_reuse: false,
                tables: [
                    'x_appforge_crm_account',
                    'x_appforge_crm_contact',
                    'x_appforge_crm_lead',
                    'x_appforge_crm_opportunity',
                    'x_appforge_crm_activity',
                    'x_appforge_crm_pipeline',
                    'x_appforge_crm_task',
                    'x_appforge_crm_product',
                    'x_appforge_crm_quote',
                    'x_appforge_crm_config'
                ],
                roles: ['x_appforge_crm_user', 'x_appforge_crm_admin'],
                application_menu: {
                    title: 'AppForge - CRM',
                    name: 'appforge_crm',
                    order: 450,
                    roles: 'x_appforge_crm_user,x_appforge_crm_admin,admin'
                },
                modules: [
                    { title: 'Accounts', table_name: 'x_appforge_crm_account', link_type: 'LIST', order: 100 },
                    { title: 'Contacts', table_name: 'x_appforge_crm_contact', link_type: 'LIST', order: 200 },
                    { title: 'Leads', table_name: 'x_appforge_crm_lead', link_type: 'LIST', order: 300 },
                    { title: 'Opportunities', table_name: 'x_appforge_crm_opportunity', link_type: 'LIST', order: 400 },
                    { title: 'Activities', table_name: 'x_appforge_crm_activity', link_type: 'LIST', order: 500 },
                    { title: 'Pipeline', table_name: 'x_appforge_crm_pipeline', link_type: 'LIST', order: 600 },
                    { title: 'Sales Tasks', table_name: 'x_appforge_crm_task', link_type: 'LIST', order: 700 },
                    { title: 'Products', table_name: 'x_appforge_crm_product', link_type: 'LIST', order: 800 },
                    { title: 'Quotes', table_name: 'x_appforge_crm_quote', link_type: 'LIST', order: 900 },
                    { title: 'Configuration', table_name: 'x_appforge_crm_config', link_type: 'FORM', order: 1000 }
                ],
                configuration_table: 'x_appforge_crm_config',
                features: ['Lead Scoring', 'Opportunity Pipeline', 'Activity Tracking', 'Quote Generation', 'Territory Management']
            },

            'csm': {
                id: 'csm',
                name: 'Customer Service Management (CSM)',
                short_description: 'Case management, customer accounts, contacts, assets, and service contracts.',
                scope: 'x_appforge_csm',
                version: '1.0.0',
                price: 799,
                billing_model: 'Monthly Subscription',
                edition: 'Enterprise',
                category: 'Customer Operations',
                dependencies: [],
                required_plugins: [],
                is_oob_table_reuse: false,
                tables: [
                    'x_appforge_csm_account',
                    'x_appforge_csm_contact',
                    'x_appforge_csm_case',
                    'x_appforge_csm_case_task',
                    'x_appforge_csm_asset',
                    'x_appforge_csm_entitlement',
                    'x_appforge_csm_sla',
                    'x_appforge_csm_config'
                ],
                roles: ['x_appforge_csm_user', 'x_appforge_csm_admin'],
                application_menu: {
                    title: 'AppForge - CSM',
                    name: 'appforge_csm',
                    order: 400,
                    roles: 'x_appforge_csm_user,x_appforge_csm_admin,admin'
                },
                modules: [
                    { title: 'Accounts', table_name: 'x_appforge_csm_account', link_type: 'LIST', order: 100 },
                    { title: 'Contacts', table_name: 'x_appforge_csm_contact', link_type: 'LIST', order: 200 },
                    { title: 'Cases', table_name: 'x_appforge_csm_case', link_type: 'LIST', order: 300 },
                    { title: 'Case Tasks', table_name: 'x_appforge_csm_case_task', link_type: 'LIST', order: 400 },
                    { title: 'Interactions', table_name: 'interaction', link_type: 'LIST', order: 500 },
                    { title: 'Customer Health', table_name: 'x_appforge_csm_health', link_type: 'LIST', order: 600 },
                    { title: 'Entitlements', table_name: 'x_appforge_csm_entitlement', link_type: 'LIST', order: 700 },
                    { title: 'Configuration', table_name: 'x_appforge_csm_config', link_type: 'FORM', order: 800 }
                ],
                configuration_table: 'x_appforge_csm_config',
                features: ['Omnichannel Case Intake', 'Entitlement Verification', 'SLA Tracking', 'Customer Asset Linkage']
            },

            'spm': {
                id: 'spm',
                name: 'Strategic Portfolio Management (SPM)',
                short_description: 'Portfolio governance, program roadmaps, project execution, demands, and financials.',
                scope: 'x_appforge_spm',
                version: '1.0.0',
                price: 999,
                billing_model: 'Monthly Subscription',
                edition: 'Enterprise',
                category: 'Strategic Execution',
                dependencies: [],
                required_plugins: [],
                is_oob_table_reuse: false,
                tables: [
                    'x_appforge_spm_portfolio',
                    'x_appforge_spm_program',
                    'x_appforge_spm_project',
                    'x_appforge_spm_demand',
                    'x_appforge_spm_project_task',
                    'x_appforge_spm_resource_plan',
                    'x_appforge_spm_strategic_goal',
                    'x_appforge_spm_config'
                ],
                roles: ['x_appforge_spm_user', 'x_appforge_spm_admin'],
                application_menu: {
                    title: 'AppForge - SPM',
                    name: 'appforge_spm',
                    order: 200,
                    roles: 'x_appforge_spm_user,x_appforge_spm_admin,admin'
                },
                modules: [
                    { title: 'Portfolios', table_name: 'x_appforge_spm_portfolio', link_type: 'LIST', order: 100 },
                    { title: 'Programs', table_name: 'x_appforge_spm_program', link_type: 'LIST', order: 200 },
                    { title: 'Projects', table_name: 'x_appforge_spm_project', link_type: 'LIST', order: 300 },
                    { title: 'Project Tasks', table_name: 'x_appforge_spm_project_task', link_type: 'LIST', order: 400 },
                    { title: 'Demands', table_name: 'x_appforge_spm_demand', link_type: 'LIST', order: 500 },
                    { title: 'Strategic Goals', table_name: 'x_appforge_spm_strategic_goal', link_type: 'LIST', order: 600 },
                    { title: 'Resource Plans', table_name: 'x_appforge_spm_resource_plan', link_type: 'LIST', order: 700 },
                    { title: 'Project Resources', table_name: 'x_appforge_spm_resource', link_type: 'LIST', order: 800 },
                    { title: 'Financials', table_name: 'x_appforge_spm_financial', link_type: 'LIST', order: 900 },
                    { title: 'Configuration', table_name: 'x_appforge_spm_config', link_type: 'FORM', order: 1000 }
                ],
                configuration_table: 'x_appforge_spm_config',
                features: ['Portfolio Investment Planning', 'Demand Scoring Matrix', 'Project Gantt Hierarchy', 'Financial Tracking']
            },

            'fsm': {
                id: 'fsm',
                name: 'Field Service Management (FSM)',
                short_description: 'Dispatch console, work orders, field technicians, territories, and skill-based scheduling.',
                scope: 'x_appforge_fsm',
                version: '1.0.0',
                price: 899,
                billing_model: 'Monthly Subscription',
                edition: 'Enterprise',
                category: 'Field Operations',
                dependencies: [],
                required_plugins: [],
                is_oob_table_reuse: false,
                tables: [
                    'x_appforge_fsm_work_order',
                    'x_appforge_fsm_work_order_task',
                    'x_appforge_fsm_dispatch',
                    'x_appforge_fsm_technician',
                    'x_appforge_fsm_location',
                    'x_appforge_fsm_assignment',
                    'x_appforge_fsm_config'
                ],
                roles: ['x_appforge_fsm_user', 'x_appforge_fsm_admin'],
                application_menu: {
                    title: 'AppForge - FSM',
                    name: 'appforge_fsm',
                    order: 470,
                    roles: 'x_appforge_fsm_user,x_appforge_fsm_admin,admin'
                },
                modules: [
                    { title: 'Work Orders', table_name: 'x_appforge_fsm_work_order', link_type: 'LIST', order: 100 },
                    { title: 'Work Order Tasks', table_name: 'x_appforge_fsm_work_order_task', link_type: 'LIST', order: 200 },
                    { title: 'Dispatch', table_name: 'x_appforge_fsm_dispatch', link_type: 'LIST', order: 300 },
                    { title: 'Technicians', table_name: 'x_appforge_fsm_technician', link_type: 'LIST', order: 400 },
                    { title: 'Locations', table_name: 'x_appforge_fsm_location', link_type: 'LIST', order: 500 },
                    { title: 'Assignments', table_name: 'x_appforge_fsm_assignment', link_type: 'LIST', order: 600 },
                    { title: 'Territories', table_name: 'cmn_location_territory', link_type: 'LIST', order: 700 },
                    { title: 'Scheduling', table_name: 'x_appforge_fsm_schedule', link_type: 'LIST', order: 800 },
                    { title: 'Configuration', table_name: 'x_appforge_fsm_config', link_type: 'FORM', order: 900 }
                ],
                configuration_table: 'x_appforge_fsm_config',
                features: ['Intelligent Dispatch Routing', 'Technician Skill Matching', 'Geofenced Territories', 'Work Order SLA']
            },

            'resource_management': {
                id: 'resource_management',
                name: 'Resource Management',
                short_description: 'Capacity planning, team utilization, allocations, availability, and skills inventory.',
                scope: 'x_appforge_rm',
                version: '1.0.0',
                price: 499,
                billing_model: 'Monthly Subscription',
                edition: 'Enterprise',
                category: 'Operations',
                dependencies: [],
                required_plugins: [],
                is_oob_table_reuse: false,
                tables: [
                    'x_appforge_rm_resource',
                    'x_appforge_rm_resource_plan',
                    'x_appforge_rm_allocation',
                    'x_appforge_rm_capacity',
                    'x_appforge_rm_skill',
                    'x_appforge_rm_config'
                ],
                roles: ['x_appforge_rm_user', 'x_appforge_rm_admin'],
                application_menu: {
                    title: 'AppForge - Resource Management',
                    name: 'appforge_resource_management',
                    order: 480,
                    roles: 'x_appforge_rm_user,x_appforge_rm_admin,admin'
                },
                modules: [
                    { title: 'Resources', table_name: 'x_appforge_rm_resource', link_type: 'LIST', order: 100 },
                    { title: 'Resource Plans', table_name: 'x_appforge_rm_resource_plan', link_type: 'LIST', order: 200 },
                    { title: 'Allocations', table_name: 'x_appforge_rm_allocation', link_type: 'LIST', order: 300 },
                    { title: 'Capacity', table_name: 'x_appforge_rm_capacity', link_type: 'LIST', order: 400 },
                    { title: 'Skills', table_name: 'x_appforge_rm_skill', link_type: 'LIST', order: 500 },
                    { title: 'Resource Groups', table_name: 'sys_user_group', link_type: 'LIST', order: 600 },
                    { title: 'Availability', table_name: 'x_appforge_rm_availability', link_type: 'LIST', order: 700 },
                    { title: 'Configuration', table_name: 'x_appforge_rm_config', link_type: 'FORM', order: 800 }
                ],
                configuration_table: 'x_appforge_rm_config',
                features: ['Capacity vs Demand Analysis', 'Hard & Soft Allocations', 'Skill Gap Heatmaps', 'Utilization Rates']
            },

            'bulk_catalog': {
                id: 'bulk_catalog',
                name: 'Bulk Catalog Manager',
                short_description: 'Template-driven (BC-001) bulk catalog item importer with dynamic variable and workflow creation.',
                scope: 'x_appforge_catalog',
                version: '1.0.0',
                price: 299,
                billing_model: 'Monthly Subscription',
                edition: 'Enterprise',
                category: 'Catalog & Automation',
                dependencies: [],
                required_plugins: [],
                is_oob_table_reuse: false,
                tables: [
                    'x_appforge_catalog_import',
                    'x_appforge_catalog_template',
                    'x_appforge_catalog_history',
                    'x_appforge_catalog_import_error',
                    'x_appforge_catalog_config'
                ],
                roles: ['x_appforge_catalog_user', 'x_appforge_catalog_admin'],
                application_menu: {
                    title: 'AppForge - Bulk Catalog',
                    name: 'appforge_bulk_catalog',
                    order: 100,
                    roles: 'x_appforge_catalog_user,x_appforge_catalog_admin,admin'
                },
                modules: [
                    { title: 'Catalog Imports', table_name: 'x_appforge_catalog_import', link_type: 'LIST', order: 100 },
                    { title: 'Catalog Items', table_name: 'sc_cat_item', link_type: 'LIST', order: 200 },
                    { title: 'Import Templates', table_name: 'x_appforge_catalog_template', link_type: 'LIST', order: 300 },
                    { title: 'Import History', table_name: 'x_appforge_catalog_history', link_type: 'LIST', order: 400 },
                    { title: 'Import Errors', table_name: 'x_appforge_catalog_import_error', link_type: 'LIST', order: 500 },
                    { title: 'Configuration', table_name: 'x_appforge_catalog_config', link_type: 'FORM', order: 600 }
                ],
                configuration_table: 'x_appforge_catalog_config',
                features: ['7-Sheet Excel Generator', 'BC-001 Validator', '10 After-Submit Action Handlers', 'Rollback Engine']
            },

            'itsm': {
                id: 'itsm',
                name: 'IT Service Management (ITSM)',
                short_description: 'ITIL foundation leveraging native ServiceNow OOB Incident, Problem, Change, and Request tables.',
                scope: 'x_appforge_itsm',
                version: '1.0.0',
                price: 599,
                billing_model: 'Monthly Subscription',
                edition: 'Enterprise',
                category: 'IT Operations',
                dependencies: [],
                required_plugins: ['com.snc.itsm'],
                is_oob_table_reuse: true,
                tables: [
                    'incident',
                    'problem',
                    'change_request',
                    'sc_request',
                    'sc_req_item',
                    'sc_task'
                ],
                roles: ['itil', 'x_appforge_itsm_admin'],
                application_menu: {
                    title: 'AppForge - ITSM',
                    name: 'appforge_itsm',
                    order: 300,
                    roles: 'itil,x_appforge_itsm_admin,admin'
                },
                modules: [
                    { title: 'Requests', table_name: 'sc_req_item', link_type: 'LIST', order: 100 },
                    { title: 'Incidents', table_name: 'incident', link_type: 'LIST', order: 200 },
                    { title: 'Problems', table_name: 'problem', link_type: 'LIST', order: 300 },
                    { title: 'Changes', table_name: 'change_request', link_type: 'LIST', order: 400 },
                    { title: 'Tasks', table_name: 'task', link_type: 'LIST', order: 500 },
                    { title: 'Reports', table_name: 'sys_report', link_type: 'LIST', order: 600 },
                    { title: 'Configuration', table_name: 'x_appforge_itsm_config', link_type: 'FORM', order: 700 }
                ],
                configuration_table: 'x_appforge_itsm_config',
                features: ['OOB Table Re-use', 'Priority Matrix', 'Change Risk Engine', 'Major Incident Triggering']
            }
        };
    },

    type: 'AppForgeApplicationManifestRegistry'
};
