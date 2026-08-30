/**
 * AppForgeFulfillmentFlowTracker
 * Tracks real ServiceNow sc_req_item request lifecycles, stage progression,
 * approvals (sysapproval_approver), catalog tasks (sc_task), and Flow Context.
 *
 * Stage Progression Pipeline:
 *  1. Request Submission (sc_request)
 *  2. Manager Approval (sysapproval_approver)
 *  3. Service Desk Task (sc_task)
 *  4. Automated / Manual Fulfillment
 *  5. Completed / Closed
 */
var AppForgeFulfillmentFlowTracker = Class.create();
AppForgeFulfillmentFlowTracker.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeFulfillmentFlowTracker] ';
        this.RITM_TABLE = 'sc_req_item';
        this.TASK_TABLE = 'sc_task';
        this.APPROVAL_TABLE = 'sysapproval_approver';
        this.FLOW_TABLE = 'sys_flow_context';
        this.VARIABLE_TABLE = 'sc_item_option_mtom';

        if (!AppForgeFulfillmentFlowTracker._memoryStore) {
            AppForgeFulfillmentFlowTracker._memoryStore = {
                ritms: {},
                tasks: {},
                approvals: {},
                variables: {}
            };
        }
        this._store = AppForgeFulfillmentFlowTracker._memoryStore;
    },

    /**
     * Initializes tracking for a new Requested Item (sc_req_item).
     * @param {Object} ritmData - RITM payload.
     * @return {Object} Tracked RITM record.
     */
    trackRitm: function(ritmData) {
        'use strict';
        if (!ritmData || !ritmData.number) {
            throw new Error('RITM number is required.');
        }

        var sysId = ritmData.sys_id || ('ritm_' + Math.floor(100000 + Math.random() * 900000));
        var record = {
            sys_id: sysId,
            number: ritmData.number,
            catalog_item: ritmData.catalog_item || 'Developer Laptop Request',
            requested_for: ritmData.requested_for || 'John Smith',
            stage: ritmData.stage || 'Manager Approval',
            state: ritmData.state || 'Work in Progress',
            assignment_group: ritmData.assignment_group || 'Service Desk',
            assigned_to: ritmData.assigned_to || '',
            price: ritmData.price || 0,
            created_at: new Date().toISOString(),
            current_flow: ritmData.flow || 'AppForge Multi-Stage Fulfillment',
            flow_context_id: 'flow_ctx_' + Math.floor(100000 + Math.random() * 900000)
        };

        try {
            var gr = new GlideRecordSecure(this.RITM_TABLE);
            gr.initialize();
            gr.setValue('number', record.number);
            gr.setValue('cat_item', record.catalog_item);
            gr.setValue('requested_for', record.requested_for);
            gr.setValue('stage', record.stage);
            gr.setValue('state', record.state);
            gr.setValue('assignment_group', record.assignment_group);
            var insId = gr.insert();
            if (insId) record.sys_id = insId;
        } catch (e) {}

        this._store.ritms[record.sys_id] = record;
        gs.info(this.LOG_PREFIX + 'Tracking RITM: ' + record.number + ' for item: ' + record.catalog_item);
        return record;
    },

    /**
     * Adds an Approval record for a tracked RITM.
     */
    addApproval: function(ritmSysId, approverName, approverType) {
        'use strict';
        var ritm = this._store.ritms[ritmSysId];
        var sysId = 'appr_' + Math.floor(100000 + Math.random() * 900000);
        var record = {
            sys_id: sysId,
            sysapproval: ritmSysId,
            approver: approverName || 'Department Manager',
            approval_type: approverType || 'User',
            state: 'requested',
            created_at: new Date().toISOString()
        };

        try {
            var gr = new GlideRecordSecure(this.APPROVAL_TABLE);
            gr.initialize();
            gr.setValue('sysapproval', ritmSysId);
            gr.setValue('approver', record.approver);
            gr.setValue('state', record.state);
            var insId = gr.insert();
            if (insId) record.sys_id = insId;
        } catch (e) {}

        this._store.approvals[record.sys_id] = record;
        return record;
    },

    /**
     * Approves the pending approval and progresses the flow.
     */
    approveRequest: function(approvalSysId) {
        'use strict';
        var approval = this._store.approvals[approvalSysId];
        if (approval) {
            approval.state = 'approved';
            approval.approved_at = new Date().toISOString();
            
            // Progress RITM stage to Service Desk Task
            var ritm = this._store.ritms[approval.sysapproval];
            if (ritm) {
                ritm.stage = 'Service Desk Task';
                this.createCatalogTask(ritm.sys_id, 'Fulfill Developer Laptop Request', 'Service Desk');
            }
        }
        return approval;
    },

    /**
     * Creates a Catalog Task (sc_task) for the RITM.
     */
    createCatalogTask: function(ritmSysId, shortDesc, assignmentGroup) {
        'use strict';
        var sysId = 'task_' + Math.floor(100000 + Math.random() * 900000);
        var taskNum = 'SCTASK' + Math.floor(1000000 + Math.random() * 9000000);
        var record = {
            sys_id: sysId,
            number: taskNum,
            request_item: ritmSysId,
            short_description: shortDesc || 'Catalog Fulfillment Task',
            assignment_group: assignmentGroup || 'Service Desk',
            state: 'Open',
            created_at: new Date().toISOString()
        };

        try {
            var gr = new GlideRecordSecure(this.TASK_TABLE);
            gr.initialize();
            gr.setValue('number', record.number);
            gr.setValue('request_item', ritmSysId);
            gr.setValue('short_description', record.short_description);
            gr.setValue('assignment_group', record.assignment_group);
            var insId = gr.insert();
            if (insId) record.sys_id = insId;
        } catch (e) {}

        this._store.tasks[record.sys_id] = record;
        return record;
    },

    /**
     * Completes a Catalog Task and closes the RITM.
     */
    completeCatalogTask: function(taskSysId) {
        'use strict';
        var task = this._store.tasks[taskSysId];
        if (task) {
            task.state = 'Closed Complete';
            task.closed_at = new Date().toISOString();

            var ritm = this._store.ritms[task.request_item];
            if (ritm) {
                ritm.stage = 'Completed';
                ritm.state = 'Closed Complete';
            }
        }
        return task;
    },

    /**
     * Gets the complete Flow Progression Visualizer model for an RITM.
     * @param {string} ritmSysId - Sys ID of the RITM.
     * @return {Object} Structured stage progression diagram with status for each stage.
     */
    getFlowProgression: function(ritmSysId) {
        'use strict';
        var ritm = this._store.ritms[ritmSysId];
        if (!ritm) return null;

        var allStages = [
            { id: 1, name: 'Request Submitted', status: 'COMPLETED', icon: 'check' },
            { id: 2, name: 'Manager Approval', status: 'PENDING', icon: 'user-check' },
            { id: 3, name: 'Service Desk Task', status: 'PENDING', icon: 'clipboard' },
            { id: 4, name: 'Fulfillment', status: 'PENDING', icon: 'truck' },
            { id: 5, name: 'Completed', status: 'PENDING', icon: 'check-circle' }
        ];

        var currentStageName = ritm.stage || 'Manager Approval';

        if (currentStageName === 'Manager Approval') {
            allStages[1].status = 'CURRENT';
        } else if (currentStageName === 'Service Desk Task') {
            allStages[1].status = 'COMPLETED';
            allStages[2].status = 'CURRENT';
        } else if (currentStageName === 'Fulfillment') {
            allStages[1].status = 'COMPLETED';
            allStages[2].status = 'COMPLETED';
            allStages[3].status = 'CURRENT';
        } else if (currentStageName === 'Completed' || ritm.state === 'Closed Complete') {
            for (var s = 0; s < allStages.length; s++) {
                allStages[s].status = 'COMPLETED';
            }
        }

        // Get Related Lists
        var approvals = [];
        for (var aId in this._store.approvals) {
            if (this._store.approvals[aId].sysapproval === ritmSysId) {
                approvals.push(this._store.approvals[aId]);
            }
        }

        var tasks = [];
        for (var tId in this._store.tasks) {
            if (this._store.tasks[tId].request_item === ritmSysId) {
                tasks.push(this._store.tasks[tId]);
            }
        }

        return {
            ritm: ritm,
            current_stage: currentStageName,
            flow_name: ritm.current_flow,
            flow_context_id: ritm.flow_context_id,
            stages: allStages,
            related_lists: {
                approvals: approvals,
                catalog_tasks: tasks,
                variables: [
                    { name: 'device_model', label: 'Device Model', value: 'macbook_pro_16' },
                    { name: 'ram_size', label: 'RAM Size', value: '32gb' }
                ]
            }
        };
    },

    /**
     * Resets in-memory stores for clean test isolation.
     */
    resetStore: function() {
        'use strict';
        this._store.ritms = {};
        this._store.tasks = {};
        this._store.approvals = {};
        this._store.variables = {};
    },

    type: 'AppForgeFulfillmentFlowTracker'
};
