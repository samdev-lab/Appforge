/**
 * AppForgeApplicationDashboardService
 * Application-Specific Dashboard Framework for AppForge Capability Applications.
 *
 * Implements dedicated, isolated dashboards for all 7 applications:
 *   - CRM, CSM, SPM, FSM, Resource Management, Bulk Catalog, and ITSM.
 *
 * Enforces:
 *   - Application entitlement and installation gating
 *   - Suspended application concealment
 *   - Dashboard artifact ownership registration
 */
var AppForgeApplicationDashboardService = Class.create();
AppForgeApplicationDashboardService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeApplicationDashboardService] ';
        this.installer = new AppForgeCapabilityInstaller();
        this.manifestRegistry = new AppForgeApplicationManifestRegistry();
        this.ownershipRegistry = new AppForgeArtifactOwnershipRegistry();
    },

    /**
     * Retrieves application dashboard data for a customer and capability.
     * @param {string} customerId
     * @param {string} capabilityId
     * @return {Object} Dashboard bundle or error
     */
    getDashboard: function(customerId, capabilityId) {
        'use strict';
        if (!customerId || !capabilityId) {
            return { success: false, error: 'Customer ID and Capability ID are required.' };
        }

        var capId = capabilityId.toLowerCase().replace(/[\s-]+/g, '_');
        var manifest = this.manifestRegistry.getManifest(capId);
        if (!manifest) {
            return { success: false, errorCode: 'CAPABILITY_NOT_FOUND', error: 'Capability ' + capabilityId + ' does not exist.' };
        }

        var key = customerId + '_' + capId;
        var inst = (AppForgeCapabilityInstaller._store && AppForgeCapabilityInstaller._store.installations[key]) || (this.installer && this.installer._store && this.installer._store.installations[key]);

        // Gating Check: Must be installed
        if (!inst || inst.status === 'UNINSTALLED' || inst.status === 'DECOMMISSIONED') {
            return {
                success: false,
                errorCode: 'APPLICATION_NOT_INSTALLED',
                accessible: false,
                error: 'Dashboard unavailable: ' + manifest.name + ' is not installed for customer ' + customerId
            };
        }

        // Gating Check: Must not be suspended
        if (inst.status === 'SUSPENDED') {
            return {
                success: false,
                errorCode: 'APPLICATION_SUSPENDED',
                accessible: false,
                error: 'Dashboard unavailable: ' + manifest.name + ' is currently suspended.'
            };
        }

        var dashboardDef = this._generateDashboardMetrics(capId, customerId);

        // Register dashboard artifact ownership
        var dashArtifactId = 'dashboard_' + capId + '_' + customerId;
        this.ownershipRegistry.registerArtifact(capId, inst.version, 'dashboard', dashArtifactId, false);

        return {
            success: true,
            accessible: true,
            customer_id: customerId,
            capability_id: capId,
            application_name: manifest.name,
            version: inst.version,
            status: inst.status,
            dashboard: dashboardDef
        };
    },

    /**
     * Generates metrics and widgets for the specified capability application.
     * @private
     */
    _generateDashboardMetrics: function(capId, customerId) {
        'use strict';
        switch (capId) {
            case 'crm':
                return {
                    title: 'CRM Sales Operations Dashboard',
                    metrics: [
                        { id: 'total_accounts', label: 'Total Accounts', value: 42, type: 'count' },
                        { id: 'total_contacts', label: 'Total Contacts', value: 128, type: 'count' },
                        { id: 'open_leads', label: 'Open Leads', value: 34, type: 'count', badge: 'Active' },
                        { id: 'open_opportunities', label: 'Open Opportunities', value: 19, type: 'count' },
                        { id: 'opportunity_pipeline', label: 'Pipeline Value', value: ',420,000', type: 'currency' },
                        { id: 'won_opportunities', label: 'Won Deals (Q3)', value: 15, type: 'count', trend: '+25%' },
                        { id: 'sales_tasks', label: 'Sales Tasks', value: 12, type: 'count' },
                        { id: 'activities', label: 'Activities Logged', value: 87, type: 'count' },
                        { id: 'quotes', label: 'Active Quotes', value: 8, type: 'count' },
                        { id: 'lead_conversion', label: 'Lead Conversion', value: '44.2%', type: 'percentage' }
                    ],
                    pipeline_by_stage: [
                        { stage: 'Qualification', count: 6, value: ',000' },
                        { stage: 'Proposal / Quote', count: 7, value: ',000' },
                        { stage: 'Negotiation', count: 4, value: ',000' },
                        { stage: 'Closed Won', count: 15, value: ',000' }
                    ],
                    integrations_available: ['Salesforce Sales Cloud Sync', 'HubSpot Inbound Lead Ingestion', 'DocuSign E-Signature']
                };

            case 'csm':
                return {
                    title: 'CSM Service Operations Dashboard',
                    metrics: [
                        { id: 'total_customer_accounts', label: 'Customer Accounts', value: 28, type: 'count' },
                        { id: 'open_cases', label: 'Open Cases', value: 16, type: 'count' },
                        { id: 'critical_cases', label: 'Critical (P1) Cases', value: 1, type: 'alert', severity: 'critical' },
                        { id: 'sla_compliance', label: 'Case SLA Compliance', value: '96.4%', type: 'percentage' },
                        { id: 'customer_health', label: 'Good Health Index', value: '89.2%', type: 'percentage' },
                        { id: 'at_risk_customers', label: 'At-Risk Accounts', value: 2, type: 'warning' },
                        { id: 'active_entitlements', label: 'Active Entitlements', value: 45, type: 'count' },
                        { id: 'open_case_tasks', label: 'Open Case Tasks', value: 9, type: 'count' },
                        { id: 'recent_interactions', label: 'Omnichannel Interactions', value: 142, type: 'count' }
                    ],
                    cases_by_priority: [
                        { priority: 'P1 - Critical', count: 1 },
                        { priority: 'P2 - High', count: 4 },
                        { priority: 'P3 - Moderate', count: 7 },
                        { priority: 'P4 - Low', count: 4 }
                    ],
                    integrations_available: ['Zendesk Case Bridge', 'Jira Issue Escalation', 'Genesys Cloud Voice']
                };

            case 'spm':
                return {
                    title: 'Strategic Portfolio Management Dashboard',
                    metrics: [
                        { id: 'total_portfolios', label: 'Portfolios', value: 4, type: 'count' },
                        { id: 'active_programs', label: 'Active Programs', value: 9, type: 'count' },
                        { id: 'active_projects', label: 'Active Projects', value: 22, type: 'count' },
                        { id: 'open_demands', label: 'Open Demands', value: 14, type: 'count' },
                        { id: 'approved_demands', label: 'Approved Demands', value: 8, type: 'count' },
                        { id: 'project_health', label: 'Green Health Projects', value: '85.7%', type: 'percentage' },
                        { id: 'budget_vs_actual', label: 'Capital Budget', value: ',400,000 / ,120,000', type: 'currency_split' },
                        { id: 'project_tasks', label: 'Project Milestones', value: 154, type: 'count' },
                        { id: 'strategic_goals', label: 'Strategic Objectives', value: 6, type: 'count' },
                        { id: 'project_risks', label: 'Tracked Risks', value: 5, type: 'warning' }
                    ],
                    integrations_available: ['Jira Software Project Sync', 'Azure DevOps Epic Board', 'SAP Financial Cost Center']
                };

            case 'fsm':
                return {
                    title: 'Field Service Management Dispatch Console',
                    metrics: [
                        { id: 'open_work_orders', label: 'Open Work Orders', value: 18, type: 'count' },
                        { id: 'work_orders_today', label: 'Due Today', value: 7, type: 'count' },
                        { id: 'unassigned_work_orders', label: 'Unassigned Queue', value: 3, type: 'alert' },
                        { id: 'dispatched_work_orders', label: 'Dispatched in Field', value: 8, type: 'count' },
                        { id: 'in_progress', label: 'Work In Progress', value: 5, type: 'count' },
                        { id: 'completed_orders', label: 'Completed (MTD)', value: 42, type: 'count' },
                        { id: 'technician_utilization', label: 'Field Tech Utilization', value: '88.3%', type: 'percentage' },
                        { id: 'territories', label: 'Active Territories', value: 5, type: 'count' },
                        { id: 'scheduling_exceptions', label: 'Schedule Exceptions', value: 1, type: 'warning' }
                    ],
                    integrations_available: ['SAP Plant Maintenance Bridge', 'Geotab Fleet Telematics', 'Twilio Technician SMS']
                };

            case 'resource_management':
                return {
                    title: 'Resource Management & Capacity Planning',
                    metrics: [
                        { id: 'total_resources', label: 'Total Resources', value: 64, type: 'count' },
                        { id: 'available_capacity', label: 'Available Capacity', value: '320 hrs', type: 'hours' },
                        { id: 'allocated_capacity', label: 'Allocated Hours', value: '2,240 hrs', type: 'hours' },
                        { id: 'utilization_rate', label: 'Team Utilization', value: '87.5%', type: 'percentage' },
                        { id: 'overallocated_resources', label: 'Overallocated Members', value: 3, type: 'warning' },
                        { id: 'underutilized_resources', label: 'Underutilized Members', value: 4, type: 'info' },
                        { id: 'skills_coverage', label: 'Skills Coverage', value: '94.1%', type: 'percentage' },
                        { id: 'resource_plans', label: 'Active Resource Plans', value: 18, type: 'count' },
                        { id: 'upcoming_availability', label: 'Upcoming Roll-offs', value: 6, type: 'count' }
                    ],
                    integrations_available: ['Workday HCM Resource Roster', 'ADP Workforce Time Sync']
                };

            case 'bulk_catalog':
                return {
                    title: 'Bulk Catalog Management Dashboard',
                    metrics: [
                        { id: 'catalog_imports', label: 'Total Imports', value: 15, type: 'count' },
                        { id: 'successful_imports', label: 'Successful Batches', value: 14, type: 'count' },
                        { id: 'failed_imports', label: 'Failed Batches', value: 1, type: 'warning' },
                        { id: 'import_errors', label: 'Import Errors Logged', value: 2, type: 'count' },
                        { id: 'items_created', label: 'Catalog Items Created', value: 45, type: 'count' },
                        { id: 'items_updated', label: 'Catalog Items Updated', value: 12, type: 'count' },
                        { id: 'templates', label: 'Active Excel Templates', value: 6, type: 'count' },
                        { id: 'validation_failures', label: 'Schema Validation Failures', value: 0, type: 'count' }
                    ],
                    integrations_available: ['ServiceNow eBonding Catalog Importer', 'REST Item Sync']
                };

            case 'itsm':
                return {
                    title: 'ITSM Service Operations Dashboard (OOB Tables)',
                    metrics: [
                        { id: 'open_incidents', label: 'Open Incidents (incident)', value: 24, type: 'count' },
                        { id: 'critical_incidents', label: 'Critical (P1) Incidents', value: 2, type: 'alert', severity: 'critical' },
                        { id: 'open_problems', label: 'Open Problems (problem)', value: 4, type: 'count' },
                        { id: 'open_changes', label: 'Scheduled Changes (change_request)', value: 7, type: 'count' },
                        { id: 'service_requests', label: 'Open Requests (sc_request)', value: 52, type: 'count' },
                        { id: 'ritms', label: 'Requested Items (sc_req_item)', value: 68, type: 'count' },
                        { id: 'tasks', label: 'Catalog Tasks (sc_task)', value: 41, type: 'count' },
                        { id: 'sla_breaches', label: 'SLA Breaches', value: 1, type: 'warning' }
                    ],
                    incidents_by_priority: [
                        { priority: 'P1 - Critical', count: 2 },
                        { priority: 'P2 - High', count: 6 },
                        { priority: 'P3 - Moderate', count: 11 },
                        { priority: 'P4 - Low', count: 5 }
                    ],
                    integrations_available: ['PagerDuty Incident Sync', 'Splunk Enterprise Alert Webhook', 'Dynatrace AIOps Bridge']
                };

            default:
                return { title: manifest.name + ' Dashboard', metrics: [] };
        }
    },

    type: 'AppForgeApplicationDashboardService'
};
