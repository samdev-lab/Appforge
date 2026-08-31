/**
 * AppForgeBidirectionalSyncEngine
 * Bidirectional Synchronization, Identity Mapping & Loop Suppression Engine.
 *
 * Implements:
 *   - External Identity Registry (sys_id <-> external_id)
 *   - Infinite Loop Suppression (Echo detection via correlation IDs)
 *   - Conflict Resolution Strategies (LAST_WRITE_WINS, SERVICENOW_WINS, EXTERNAL_WINS, MANUAL_REVIEW)
 */
var AppForgeBidirectionalSyncEngine = Class.create();
AppForgeBidirectionalSyncEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeBidirectionalSyncEngine] ';

        if (!AppForgeBidirectionalSyncEngine._store) {
            AppForgeBidirectionalSyncEngine._store = {
                identities_by_sys: {}, // tenant_app_sysId -> externalId
                identities_by_ext: {}, // tenant_app_extId -> sysId
                active_sync_origins: {} // correlationId -> timestamp
            };
        }
        AppForgeBidirectionalSyncEngine._store = AppForgeBidirectionalSyncEngine._store;
    },

    /**
     * Links ServiceNow sys_id to External Record ID.
     */
    linkIdentity: function(tenantId, appKey, sysId, externalId) {
        'use strict';
        if (!tenantId || !appKey || !sysId || !externalId) {
            throw new Error('Tenant, App, SysID, and ExternalID are required.');
        }
        var prefix = tenantId + '_' + appKey + '_';
        AppForgeBidirectionalSyncEngine._store.identities_by_sys[prefix + sysId] = externalId;
        AppForgeBidirectionalSyncEngine._store.identities_by_ext[prefix + externalId] = sysId;
        return { success: true, sys_id: sysId, external_id: externalId };
    },

    /**
     * Lookups External ID by ServiceNow sys_id.
     */
    lookupExternalId: function(tenantId, appKey, sysId) {
        'use strict';
        var prefix = tenantId + '_' + appKey + '_';
        return AppForgeBidirectionalSyncEngine._store.identities_by_sys[prefix + sysId] || null;
    },

    /**
     * Lookups ServiceNow sys_id by External ID.
     */
    lookupSysId: function(tenantId, appKey, externalId) {
        'use strict';
        var prefix = tenantId + '_' + appKey + '_';
        return AppForgeBidirectionalSyncEngine._store.identities_by_ext[prefix + externalId] || null;
    },

    /**
     * Checks if current update is an echo/loop of a previous synchronization.
     */
    isSyncLoop: function(correlationId) {
        'use strict';
        if (!correlationId) return false;
        if (AppForgeBidirectionalSyncEngine._store.active_sync_origins[correlationId]) {
            gs.info(this.LOG_PREFIX + 'Sync loop detected for correlation ' + correlationId + ' — suppressing echo');
            return true;
        }
        return false;
    },

    /**
     * Registers active synchronization correlation to prevent loop reflection.
     */
    registerSyncOrigin: function(correlationId) {
        'use strict';
        if (correlationId) {
            AppForgeBidirectionalSyncEngine._store.active_sync_origins[correlationId] = new Date().toISOString();
        }
    },

    /**
     * Resolves data conflict between ServiceNow and External system according to configured strategy.
     */
    resolveConflict: function(strategy, snRecord, extRecord, snTimestamp, extTimestamp) {
        'use strict';
        var s = (strategy || 'MANUAL_REVIEW').toUpperCase();

        switch (s) {
            case 'SERVICENOW_WINS':
                return { winner: 'SERVICENOW', record: snRecord, strategy: s };

            case 'EXTERNAL_WINS':
                return { winner: 'EXTERNAL', record: extRecord, strategy: s };

            case 'LAST_WRITE_WINS':
                var snTime = new Date(snTimestamp || 0).getTime();
                var extTime = new Date(extTimestamp || 0).getTime();
                if (snTime >= extTime) {
                    return { winner: 'SERVICENOW', record: snRecord, strategy: s };
                } else {
                    return { winner: 'EXTERNAL', record: extRecord, strategy: s };
                }

            case 'MANUAL_REVIEW':
            default:
                return {
                    winner: 'FLAGGED_FOR_REVIEW',
                    strategy: 'MANUAL_REVIEW',
                    review_required: true,
                    sn_record: snRecord,
                    ext_record: extRecord
                };
        }
    },

    resetStore: function() {
        'use strict';
        AppForgeBidirectionalSyncEngine._store = {
            identities_by_sys: {},
            identities_by_ext: {},
            active_sync_origins: {}
        };
        AppForgeBidirectionalSyncEngine._store = AppForgeBidirectionalSyncEngine._store;
    },

    type: 'AppForgeBidirectionalSyncEngine'
};
