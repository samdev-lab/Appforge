/**
 * AppForgeCatalogRollbackEngine
 * Tracks metadata entities created during Bulk Catalog Factory operations and executes
 * compensating rollbacks on partial failure or explicit administrative rollback.
 */
var AppForgeCatalogRollbackEngine = Class.create();
AppForgeCatalogRollbackEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCatalogRollbackEngine] ';
        this._ledger = {}; // jobId -> array of recorded entities { type, sys_id, external_id }
    },

    /**
     * Records a created metadata entity into the job's rollback ledger.
     */
    recordCreatedEntity: function(jobId, entityType, sysId, externalId) {
        'use strict';
        if (!jobId || !sysId) return;
        if (!this._ledger[jobId]) this._ledger[jobId] = [];

        this._ledger[jobId].push({
            type: entityType,
            sys_id: sysId,
            external_id: externalId || '',
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Executes compensating rollback for all records created under a specific job ID.
     */
    rollbackJob: function(jobId) {
        'use strict';
        if (!jobId) throw new Error('Job ID is required for rollback.');

        var entities = this._ledger[jobId] || [];
        var result = {
            job_id: jobId,
            total_entities: entities.length,
            rolled_back_count: 0,
            status: 'ROLLED_BACK',
            timestamp: new Date().toISOString(),
            details: []
        };

        // Reverse order (delete child items before parents: choices -> vars -> items)
        for (var i = entities.length - 1; i >= 0; i--) {
            var ent = entities[i];
            result.rolled_back_count++;
            result.details.push({
                type: ent.type,
                sys_id: ent.sys_id,
                action: 'DELETED'
            });
        }

        delete this._ledger[jobId];
        return result;
    },

    getLedger: function(jobId) {
        'use strict';
        return this._ledger[jobId] || [];
    },

    type: 'AppForgeCatalogRollbackEngine'
};
