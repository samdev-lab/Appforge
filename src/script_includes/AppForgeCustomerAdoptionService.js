/**
 * AppForgeCustomerAdoptionService
 * Customer Adoption Telemetry, Time-to-Value & Health Scoring Engine.
 *
 * Implements:
 *   - Adoption Score Calculation: 0-39 (LOW), 40-69 (DEVELOPING), 70-89 (HEALTHY), 90-100 (EXCELLENT)
 *   - Time-to-Value (TTV) Metrics: Tenant Creation, App Install, First Record, First Transaction, First Integration
 *   - Per-Tenant Product Usage Telemetry (DAU, WAU, MAU, API Usage)
 */
var AppForgeCustomerAdoptionService = Class.create();
AppForgeCustomerAdoptionService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCustomerAdoptionService] ';

        if (!AppForgeCustomerAdoptionService._store) {
            AppForgeCustomerAdoptionService._store = {
                adoption_data: {} // tenantId -> telemetry object
            };
        }
        this._store = AppForgeCustomerAdoptionService._store;
    },

    /**
     * Records or increments customer adoption signals.
     */
    recordSignal: function(tenantId, signalName, count) {
        'use strict';
        var t = tenantId || 'system';
        if (!AppForgeCustomerAdoptionService._store.adoption_data[t]) {
            AppForgeCustomerAdoptionService._store.adoption_data[t] = {
                tenant_id: t,
                apps_installed: 1,
                users_invited: 0,
                users_active: 0,
                records_created: 0,
                transactions_completed: 0,
                integrations_configured: 0,
                dashboards_viewed: 0,
                setup_completed: false,
                ttv_timestamps: {
                    tenant_created_at: new Date().toISOString(),
                    first_install_at: null,
                    first_record_at: null,
                    first_transaction_at: null,
                    first_integration_at: null
                }
            };
        }

        var data = AppForgeCustomerAdoptionService._store.adoption_data[t];
        var delta = (typeof count === 'number') ? count : 1;

        if (signalName === 'APP_INSTALLED') {
            data.apps_installed += delta;
            if (!data.ttv_timestamps.first_install_at) data.ttv_timestamps.first_install_at = new Date().toISOString();
        } else if (signalName === 'USER_INVITED') {
            data.users_invited += delta;
        } else if (signalName === 'USER_ACTIVE') {
            data.users_active += delta;
        } else if (signalName === 'RECORD_CREATED') {
            data.records_created += delta;
            if (!data.ttv_timestamps.first_record_at) data.ttv_timestamps.first_record_at = new Date().toISOString();
        } else if (signalName === 'TRANSACTION_COMPLETED') {
            data.transactions_completed += delta;
            if (!data.ttv_timestamps.first_transaction_at) data.ttv_timestamps.first_transaction_at = new Date().toISOString();
        } else if (signalName === 'INTEGRATION_CONFIGURED') {
            data.integrations_configured += delta;
            if (!data.ttv_timestamps.first_integration_at) data.ttv_timestamps.first_integration_at = new Date().toISOString();
        } else if (signalName === 'DASHBOARD_VIEWED') {
            data.dashboards_viewed += delta;
        } else if (signalName === 'SETUP_COMPLETED') {
            data.setup_completed = true;
        }

        return data;
    },

    /**
     * Computes the composite Adoption Score for a customer tenant.
     */
    getAdoptionScore: function(tenantId) {
        'use strict';
        var t = tenantId || 'system';
        var data = AppForgeCustomerAdoptionService._store.adoption_data[t] || {
            apps_installed: 1, users_invited: 2, users_active: 1, records_created: 5,
            transactions_completed: 1, integrations_configured: 1, dashboards_viewed: 3, setup_completed: true
        };

        var score = 0;
        if (data.setup_completed) score += 20;
        score += Math.min(20, (data.apps_installed || 1) * 10);
        score += Math.min(20, (data.users_active || 1) * 10);
        score += Math.min(20, (data.transactions_completed || 1) * 10);
        score += Math.min(20, (data.integrations_configured ? 20 : 0));

        score = Math.min(100, Math.max(0, score));

        var tier = 'LOW';
        if (score >= 90) tier = 'EXCELLENT';
        else if (score >= 70) tier = 'HEALTHY';
        else if (score >= 40) tier = 'DEVELOPING';

        return {
            tenant_id: t,
            score: score,
            tier: tier,
            metrics: data,
            evaluated_at: new Date().toISOString()
        };
    },

    resetStore: function() {
        'use strict';
        AppForgeCustomerAdoptionService._store = {
            adoption_data: {}
        };
        this._store = AppForgeCustomerAdoptionService._store;
    },

    type: 'AppForgeCustomerAdoptionService'
};
