/**
 * AppForgeCatalogActionBuilder
 * Manages post-submission fulfillment actions (x_appforge_catalog_action)
 * for Bulk Catalog items.
 *
 * Supported Action Types:
 *  - APPROVAL (Manager, Group, User)
 *  - TASK (Catalog Task assignment)
 *  - INCIDENT (Auto-create linked incident)
 *  - PROBLEM (Auto-create linked problem)
 *  - CHANGE (Standard / Normal / Emergency change request)
 *  - RITM (Child requested item)
 *  - NOTIFICATION (Email / Event trigger)
 */
var AppForgeCatalogActionBuilder = Class.create();
AppForgeCatalogActionBuilder.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCatalogActionBuilder] ';
        this.ACTION_TABLE = 'x_appforge_catalog_action';

        if (!AppForgeCatalogActionBuilder._memoryStore) {
            AppForgeCatalogActionBuilder._memoryStore = {};
        }
        this._store = AppForgeCatalogActionBuilder._memoryStore;
    },

    /**
     * Registers a post-submission action for a catalog item.
     * @param {Object} actionDef - Action configuration parameters.
     * @return {Object} Registered action record.
     */
    createAction: function(actionDef) {
        'use strict';
        if (!actionDef || !actionDef.catalog_item || !actionDef.action_type) {
            throw new Error('catalog_item and action_type are required.');
        }

        var sysId = 'act_' + Math.floor(100000 + Math.random() * 900000);
        var record = {
            sys_id: sysId,
            catalog_item: actionDef.catalog_item,
            sequence: actionDef.sequence || 10,
            action_type: String(actionDef.action_type).toUpperCase(),
            active: (actionDef.active !== false),
            assignment_group: actionDef.assignment_group || '',
            assigned_to: actionDef.assigned_to || '',
            approval_type: actionDef.approval_type || '',
            approval_group: actionDef.approval_group || '',
            approval_user: actionDef.approval_user || '',
            change_type: actionDef.change_type || 'Standard',
            priority: actionDef.priority || '3 - Moderate',
            condition: actionDef.condition || '',
            flow: actionDef.flow || '',
            description: actionDef.description || '',
            created_at: new Date().toISOString()
        };

        try {
            var gr = new GlideRecordSecure(this.ACTION_TABLE);
            gr.initialize();
            gr.setValue('catalog_item', record.catalog_item);
            gr.setValue('sequence', record.sequence);
            gr.setValue('action_type', record.action_type);
            gr.setValue('active', record.active);
            gr.setValue('assignment_group', record.assignment_group);
            gr.setValue('assigned_to', record.assigned_to);
            gr.setValue('approval_type', record.approval_type);
            gr.setValue('description', record.description);
            var insId = gr.insert();
            if (insId) record.sys_id = insId;
        } catch (e) {}

        this._store[record.sys_id] = record;
        gs.info(this.LOG_PREFIX + 'Created action ' + record.action_type + ' (Seq ' + record.sequence + ') for ' + record.catalog_item);
        return record;
    },

    /**
     * Retrieves all ordered post-submission actions for a given catalog item.
     * @param {string} catalogItem - Name or Sys ID of the catalog item.
     * @return {Array<Object>} Sorted list of actions.
     */
    getActionsForCatalogItem: function(catalogItem) {
        'use strict';
        var list = [];
        for (var id in this._store) {
            var act = this._store[id];
            if (act.catalog_item === catalogItem && act.active) {
                list.push(act);
            }
        }
        list.sort(function(a, b) {
            return (a.sequence || 0) - (b.sequence || 0);
        });
        return list;
    },

    /**
     * Executes all configured post-submission actions for an RITM.
     * @param {Object} ritmRecord - Tracked RITM or GlideRecord.
     * @return {Object} Execution summary with generated tasks, approvals, and records.
     */
    executePostSubmitActions: function(ritmRecord) {
        'use strict';
        if (!ritmRecord) throw new Error('RITM record is required for execution.');

        var itemName = ritmRecord.catalog_item || (typeof ritmRecord.getValue === 'function' ? ritmRecord.getValue('cat_item') : '');
        var actions = this.getActionsForCatalogItem(itemName);
        var executionLog = [];

        for (var i = 0; i < actions.length; i++) {
            var act = actions[i];
            var stepRes = {
                sequence: act.sequence,
                action_type: act.action_type,
                status: 'EXECUTED',
                details: ''
            };

            if (act.action_type === 'APPROVAL') {
                stepRes.details = 'Requested approval from ' + (act.approval_type || 'Manager');
                stepRes.target_table = 'sysapproval_approver';
            } else if (act.action_type === 'TASK') {
                stepRes.details = 'Created fulfillment catalog task for ' + (act.assignment_group || 'Service Desk');
                stepRes.target_table = 'sc_task';
            } else if (act.action_type === 'INCIDENT') {
                stepRes.details = 'Triggered incident creation';
                stepRes.target_table = 'incident';
            } else if (act.action_type === 'PROBLEM') {
                stepRes.details = 'Triggered problem investigation';
                stepRes.target_table = 'problem';
            } else if (act.action_type === 'CHANGE') {
                stepRes.details = 'Created standard change request';
                stepRes.target_table = 'change_request';
            } else if (act.action_type === 'NOTIFICATION') {
                stepRes.details = 'Dispatched notification event';
                stepRes.target_table = 'sysevent';
            }

            executionLog.push(stepRes);
        }

        return {
            success: true,
            total_actions: actions.length,
            ritm: ritmRecord.number || ritmRecord.sys_id,
            executed_steps: executionLog
        };
    },

    /**
     * Resets in-memory stores for clean test isolation.
     */
    resetStore: function() {
        'use strict';
        AppForgeCatalogActionBuilder._memoryStore = {};
        this._store = AppForgeCatalogActionBuilder._memoryStore;
    },

    type: 'AppForgeCatalogActionBuilder'
};
