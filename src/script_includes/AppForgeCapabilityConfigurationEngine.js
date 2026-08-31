/**
 * AppForgeCapabilityConfigurationEngine
 * Manages native OOB-like configuration records (x_appforge_<cap>_config) for all
 * installed AppForge capabilities: SPM, CSM, CRM, FSM, Resource Management, ITSM, and Bulk Catalog.
 *
 * Exposes native ServiceNow-style configuration properties, default seeding, validation,
 * and tenant/customer-scoped isolation.
 */
var AppForgeCapabilityConfigurationEngine = Class.create();
AppForgeCapabilityConfigurationEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCapabilityConfigurationEngine] ';

        if (!AppForgeCapabilityConfigurationEngine._memoryStore) {
            AppForgeCapabilityConfigurationEngine._memoryStore = {};
        }
        this._store = AppForgeCapabilityConfigurationEngine._memoryStore;
    },

    /**
     * Seeds default configuration for an installed capability.
     * @param {string} capabilityId - ID of capability (spm, csm, crm, fsm, resource_management, itsm, bulk_catalog).
     * @param {string} customerId - Customer Sys ID or tenant ID.
     * @param {Object} [overrides] - Optional configuration property overrides.
     * @return {Object} Seeded configuration record.
     */
    seedDefaultConfiguration: function(capabilityId, customerId, overrides) {
        'use strict';
        if (!capabilityId || !customerId) {
            throw new Error('capabilityId and customerId are required for configuration seeding.');
        }

        var capKey = String(capabilityId).toLowerCase().replace(/[\s-]+/g, '_');
        var configKey = customerId + '::' + capKey;
        var defaults = this.getDefaultConfigSchema(capKey);
        var configData = Object.assign({}, defaults, overrides || {});

        var configRecord = {
            sys_id: 'cfg_' + capKey + '_' + Math.floor(100000 + Math.random() * 900000),
            capability_id: capKey,
            customer_id: customerId,
            table_name: this.getConfigTableName(capKey),
            settings: configData,
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this._store[configKey] = configRecord;
        gs.info(this.LOG_PREFIX + 'Seeded default configuration for ' + capKey + ' (Customer: ' + customerId + ')');
        return configRecord;
    },

    /**
     * Retrieves configuration for a customer capability.
     */
    getConfiguration: function(capabilityId, customerId) {
        'use strict';
        var capKey = String(capabilityId).toLowerCase().replace(/[\s-]+/g, '_');
        var configKey = customerId + '::' + capKey;
        if (this._store[configKey]) {
            return this._store[configKey];
        }
        // Auto-seed defaults if not yet created
        return this.seedDefaultConfiguration(capKey, customerId);
    },

    /**
     * Updates configuration properties for a customer capability.
     */
    updateConfiguration: function(capabilityId, customerId, newSettings) {
        'use strict';
        var config = this.getConfiguration(capabilityId, customerId);
        if (!newSettings || typeof newSettings !== 'object') {
            throw new Error('New settings must be a valid key-value object.');
        }

        for (var k in newSettings) {
            if (newSettings.hasOwnProperty(k)) {
                config.settings[k] = newSettings[k];
            }
        }
        config.updated_at = new Date().toISOString();
        gs.info(this.LOG_PREFIX + 'Updated configuration for ' + capabilityId + ' (Customer: ' + customerId + ')');
        return config;
    },

    /**
     * Gets the table name for capability configuration.
     */
    getConfigTableName: function(capabilityId) {
        'use strict';
        var capKey = String(capabilityId).toLowerCase().replace(/[\s-]+/g, '_');
        if (capKey.indexOf('bulk_catalog') !== -1) return 'x_appforge_catalog_config';
        if (capKey.indexOf('spm') !== -1) return 'x_appforge_spm_config';
        if (capKey.indexOf('csm') !== -1) return 'x_appforge_csm_config';
        if (capKey.indexOf('crm') !== -1) return 'x_appforge_crm_config';
        if (capKey.indexOf('fsm') !== -1) return 'x_appforge_fsm_config';
        if (capKey.indexOf('resource') !== -1) return 'x_appforge_rm_config';
        if (capKey.indexOf('itsm') !== -1) return 'x_appforge_itsm_config';
        return 'x_appforge_' + capKey + '_config';
    },

    /**
     * Returns default schema key-values for each capability.
     */
    getDefaultConfigSchema: function(capabilityId) {
        'use strict';
        var capKey = String(capabilityId).toLowerCase().replace(/[\s-]+/g, '_');

        if (capKey.indexOf('spm') !== -1) {
            return {
                default_project_assignment_group: 'PMO Group',
                demand_approval_required: true,
                demand_scoring_model: 'Strategic Value vs Risk (Weighted Matrix)',
                project_number_prefix: 'PRJ',
                default_currency: 'USD',
                default_project_state: 'Pending Approval',
                resource_rate_card_enforced: true,
                auto_create_project_portfolio: true
            };
        }

        if (capKey.indexOf('csm') !== -1) {
            return {
                case_auto_assignment_group: 'Customer Support Tier 1',
                sla_default_schedule: '8x5 Regional Business Hours',
                customer_entitlement_enforced: true,
                asset_tracking_enabled: true,
                case_priority_matrix: 'Impact x Urgency standard 3x3',
                portal_case_deflection_enabled: true,
                auto_close_resolved_cases_days: 5
            };
        }

        if (capKey.indexOf('crm') !== -1) {
            return {
                default_pipeline_stage: 'Prospecting',
                opportunity_lead_auto_convert: true,
                default_sales_currency: 'USD',
                lead_scoring_model: 'BANT (Budget, Authority, Need, Timeline)',
                default_commission_rate_percent: 10,
                auto_create_contact_from_lead: true
            };
        }

        if (capKey.indexOf('fsm') !== -1) {
            return {
                dispatch_auto_route: true,
                territory_radius_km: 50,
                technician_skill_matching_enforced: true,
                work_order_auto_close: false,
                sla_target_dispatch_hours: 2,
                gps_geofencing_enabled: true,
                default_parts_inventory_location: 'Central Warehouse'
            };
        }

        if (capKey.indexOf('resource') !== -1) {
            return {
                default_capacity_hours_per_week: 40,
                over_allocation_threshold_percent: 110,
                skill_matrix_required: true,
                approval_hierarchy: 'Resource Manager -> Project Manager',
                time_card_rounding_minutes: 15,
                auto_adjust_soft_allocations: true
            };
        }

        if (capKey.indexOf('itsm') !== -1) {
            return {
                incident_priority_calculation: 'Impact x Urgency (OOB ITIL)',
                change_risk_assessment_model: 'Standard Automated Risk Matrix',
                problem_known_error_publishing: true,
                major_incident_trigger_threshold: 'P1-Critical with Business Disruption',
                auto_resolve_incident_after_days: 7,
                change_cab_approval_required: true
            };
        }

        if (capKey.indexOf('bulk_catalog') !== -1) {
            return {
                template_schema_version: 'BC-001',
                max_batch_size: 500,
                auto_publish_approved_items: true,
                attachment_size_limit_mb: 25,
                mandatory_approver_group: 'Service Catalog Administrators',
                default_workflow_action: 'Create Approval',
                validation_strict_mode: true
            };
        }

        return {
            enabled: true,
            environment: 'DEV',
            auto_audit_enabled: true
        };
    },

    /**
     * Resets in-memory stores for clean test isolation.
     */
    resetStore: function() {
        'use strict';
        AppForgeCapabilityConfigurationEngine._memoryStore = {};
        this._store = AppForgeCapabilityConfigurationEngine._memoryStore;
    },

    type: 'AppForgeCapabilityConfigurationEngine'
};
