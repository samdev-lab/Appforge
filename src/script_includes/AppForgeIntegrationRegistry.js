/**
 * AppForgeIntegrationRegistry
 * Central Repository & Lifecycle Engine for Universal REST Integrations & Connections.
 *
 * Implements:
 *   - Integration & Connection CRUD with tenant isolation
 *   - Versioning & Rollback support
 *   - Application ownership tracking
 *   - Integration Health Monitoring & Metrics Dashboard
 */
var AppForgeIntegrationRegistry = Class.create();
AppForgeIntegrationRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeIntegrationRegistry] ';
        this.credentialVault = new AppForgeCredentialVault();
        this.executionEngine = new AppForgeIntegrationExecutionEngine();

        if (!AppForgeIntegrationRegistry._store) {
            AppForgeIntegrationRegistry._store = {
                integrations: {}, // integration_id -> record
                connections: {}, // connection_id -> record
                tenant_integrations: {}, // tenant_id -> array of integration_ids
                tenant_connections: {} // tenant_id -> array of connection_ids
            };
        }
        AppForgeIntegrationRegistry._store = AppForgeIntegrationRegistry._store;
    },

    /**
     * Registers a new integration definition.
     */
    registerIntegration: function(tenantId, data) {
        'use strict';
        if (!tenantId || !data) throw new Error('Tenant ID and Integration Data are required.');
        if (!data.integration_name) throw new Error('Integration Name is required.');

        var intId = data.integration_id || ('int_' + Math.floor(Math.random() * 1000000));
        var appKey = (data.application_key || 'general').toLowerCase().replace(/[\s-]+/g, '_');

        var record = {
            integration_id: intId,
            integration_name: data.integration_name,
            application_key: appKey,
            tenant_id: tenantId,
            description: data.description || '',
            direction: (data.direction || 'OUTBOUND').toUpperCase(),
            status: data.status || 'DRAFT',
            connection_id: data.connection_id || null,
            source_table: data.source_table || '',
            target_system: data.target_system || '',
            trigger_type: data.trigger_type || 'MANUAL',
            http_method: (data.http_method || 'POST').toUpperCase(),
            endpoint_path: data.endpoint_path || '',
            field_mappings: data.field_mappings || [],
            version: '1.0.0',
            previous_version_config: null,
            active: data.active !== false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        AppForgeIntegrationRegistry._store.integrations[intId] = record;
        if (!AppForgeIntegrationRegistry._store.tenant_integrations[tenantId]) AppForgeIntegrationRegistry._store.tenant_integrations[tenantId] = [];
        if (AppForgeIntegrationRegistry._store.tenant_integrations[tenantId].indexOf(intId) === -1) {
            AppForgeIntegrationRegistry._store.tenant_integrations[tenantId].push(intId);
        }

        gs.info(this.LOG_PREFIX + 'Registered integration ' + intId + ' (' + data.integration_name + ') for tenant ' + tenantId);

        return {
            success: true,
            integration_id: intId,
            integration: record
        };
    },

    /**
     * Retrieves integration definition.
     */
    getIntegration: function(tenantId, integrationId) {
        'use strict';
        var rec = AppForgeIntegrationRegistry._store.integrations[integrationId];
        if (!rec || rec.tenant_id !== tenantId) {
            return null; // Tenant Isolation
        }
        return rec;
    },

    /**
     * Lists integrations for a tenant, optionally filtered by application key.
     */
    listIntegrations: function(tenantId, appKey) {
        'use strict';
        if (!tenantId) return [];
        var ids = AppForgeIntegrationRegistry._store.tenant_integrations[tenantId] || [];
        var self = this;
        var list = ids.map(function(id) {
            return AppForgeIntegrationRegistry._store.integrations[id];
        }).filter(Boolean);

        if (appKey) {
            var k = appKey.toLowerCase().replace(/[\s-]+/g, '_');
            list = list.filter(function(item) {
                return item.application_key === k;
            });
        }
        return list;
    },

    /**
     * Registers a new connection definition.
     */
    registerConnection: function(tenantId, data) {
        'use strict';
        if (!tenantId || !data) throw new Error('Tenant ID and Connection Data are required.');
        if (!data.connection_name || !data.base_url) throw new Error('Connection Name and Base URL are required.');

        var connId = data.connection_id || ('conn_' + Math.floor(Math.random() * 1000000));
        var record = {
            connection_id: connId,
            connection_name: data.connection_name,
            tenant_id: tenantId,
            base_url: data.base_url,
            authentication_type: data.authentication_type || 'API_KEY',
            credential_id: data.credential_id || null,
            default_headers: data.default_headers || {},
            timeout_ms: data.timeout_ms || 10000,
            retry_policy: data.retry_policy || { max_attempts: 3, backoff_type: 'EXPONENTIAL', initial_delay_ms: 1000 },
            active: data.active !== false,
            created_at: new Date().toISOString()
        };

        AppForgeIntegrationRegistry._store.connections[connId] = record;
        if (!AppForgeIntegrationRegistry._store.tenant_connections[tenantId]) AppForgeIntegrationRegistry._store.tenant_connections[tenantId] = [];
        if (AppForgeIntegrationRegistry._store.tenant_connections[tenantId].indexOf(connId) === -1) {
            AppForgeIntegrationRegistry._store.tenant_connections[tenantId].push(connId);
        }

        gs.info(this.LOG_PREFIX + 'Registered connection ' + connId + ' (' + data.connection_name + ') for tenant ' + tenantId);

        return {
            success: true,
            connection_id: connId,
            connection: record
        };
    },

    /**
     * Retrieves connection definition.
     */
    getConnection: function(tenantId, connectionId) {
        'use strict';
        var rec = AppForgeIntegrationRegistry._store.connections[connectionId];
        if (!rec || rec.tenant_id !== tenantId) {
            return null;
        }
        return rec;
    },

    /**
     * Lists connections for a tenant.
     */
    listConnections: function(tenantId) {
        'use strict';
        if (!tenantId) return [];
        var ids = AppForgeIntegrationRegistry._store.tenant_connections[tenantId] || [];
        var self = this;
        return ids.map(function(id) {
            return AppForgeIntegrationRegistry._store.connections[id];
        }).filter(Boolean);
    },

    /**
     * Upgrades an integration definition to a new version.
     */
    upgradeIntegration: function(tenantId, integrationId, newConfig, newVersion) {
        'use strict';
        var rec = AppForgeIntegrationRegistry._store.integrations[integrationId];
        if (!rec || rec.tenant_id !== tenantId) {
            return { success: false, error: 'Integration not found for tenant.' };
        }

        // Save previous snapshot for rollback
        rec.previous_version_config = {
            version: rec.version,
            endpoint_path: rec.endpoint_path,
            field_mappings: rec.field_mappings,
            http_method: rec.http_method,
            updated_at: rec.updated_at
        };

        rec.version = newVersion || '1.1.0';
        if (newConfig.endpoint_path) rec.endpoint_path = newConfig.endpoint_path;
        if (newConfig.field_mappings) rec.field_mappings = newConfig.field_mappings;
        if (newConfig.http_method) rec.http_method = newConfig.http_method;
        rec.updated_at = new Date().toISOString();

        return {
            success: true,
            integration_id: integrationId,
            version: rec.version,
            integration: rec
        };
    },

    /**
     * Rolls back an integration definition to its previous configuration.
     */
    rollbackIntegration: function(tenantId, integrationId) {
        'use strict';
        var rec = AppForgeIntegrationRegistry._store.integrations[integrationId];
        if (!rec || rec.tenant_id !== tenantId) {
            return { success: false, error: 'Integration not found for tenant.' };
        }
        if (!rec.previous_version_config) {
            return { success: false, error: 'No previous configuration available for rollback.' };
        }

        var prev = rec.previous_version_config;
        rec.version = prev.version;
        rec.endpoint_path = prev.endpoint_path;
        rec.field_mappings = prev.field_mappings;
        rec.http_method = prev.http_method;
        rec.previous_version_config = null;
        rec.updated_at = new Date().toISOString();

        return {
            success: true,
            integration_id: integrationId,
            restored_version: rec.version,
            integration: rec
        };
    },

    /**
     * Aggregates metrics for the Integration Platform Health Dashboard.
     */
    getIntegrationHealthDashboard: function(tenantId) {
        'use strict';
        var allInts = this.listIntegrations(tenantId);
        var activeCount = 0;
        var failedCount = 0;

        for (var i = 0; i < allInts.length; i++) {
            if (allInts[i].status === 'ACTIVE') activeCount++;
            if (allInts[i].status === 'FAILED') failedCount++;
        }

        var logs = (this.executionEngine._store && this.executionEngine._store.execution_logs) || [];
        var tenantLogs = logs.filter(function(l) { return !tenantId || l.tenant_id === tenantId; });

        var successExecs = 0;
        var failedExecs = 0;
        var totalDuration = 0;

        for (var j = 0; j < tenantLogs.length; j++) {
            if (tenantLogs[j].status === 'SUCCESS') successExecs++;
            else failedExecs++;
            totalDuration += (tenantLogs[j].duration_ms || 50);
        }

        var avgDuration = tenantLogs.length > 0 ? Math.round(totalDuration / tenantLogs.length) : 0;
        var successRate = tenantLogs.length > 0 ? Math.round((successExecs / tenantLogs.length) * 100) : 100;

        return {
            total_integrations: allInts.length,
            active_integrations: activeCount,
            failed_integrations: failedCount,
            executions_today: tenantLogs.length,
            successful_executions: successExecs,
            failed_executions: failedExecs,
            success_rate: successRate + '%',
            avg_response_time_ms: avgDuration,
            health_status: (failedCount === 0 && failedExecs === 0) ? 'HEALTHY' : (failedCount > 2 ? 'FAILED' : 'WARNING'),
            recent_executions: tenantLogs.slice(-10)
        };
    },

    resetStore: function() {
        'use strict';
        AppForgeIntegrationRegistry._store = {
            integrations: {},
            connections: {},
            tenant_integrations: {},
            tenant_connections: {}
        };
        AppForgeIntegrationRegistry._store = AppForgeIntegrationRegistry._store;
        this.credentialVault.resetStore();
        this.executionEngine.resetStore();
    },

    type: 'AppForgeIntegrationRegistry'
};
