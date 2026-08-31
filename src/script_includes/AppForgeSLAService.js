/**
 * AppForgeSLAService
 * Service Level Agreement (SLA) Engine, Breach Detection & Automated Escalation Service.
 *
 * Implements:
 *   - SLA Target Policies for Incidents, Service Requests, Integrations & Applications
 *   - SLA States: NOT_STARTED, IN_PROGRESS, PAUSED, BREACHED, COMPLETED, CANCELLED
 *   - Warning ➔ Escalation ➔ Breach Threshold Pipeline
 */
var AppForgeSLAService = Class.create();
AppForgeSLAService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeSLAService] ';
        this.auditService = new AppForgeAuditService();

        if (!AppForgeSLAService._store) {
            AppForgeSLAService._store = {
                sla_instances: {}, // task_id -> SLA record
                policies: {
                    'SEV1_INCIDENT': { response_target_min: 15, resolution_target_min: 120, name: 'SEV1 Critical Outage SLA' },
                    'SEV2_INCIDENT': { response_target_min: 30, resolution_target_min: 240, name: 'SEV2 Major Degradation SLA' },
                    'SEV3_INCIDENT': { response_target_min: 120, resolution_target_min: 1440, name: 'SEV3 Minor Impact SLA' },
                    'SERVICE_REQUEST': { response_target_min: 240, resolution_target_min: 2880, name: 'Standard Request SLA' }
                }
            };
        }
        this._store = AppForgeSLAService._store;
    },

    /**
     * Attaches and starts an SLA clock for a task.
     */
    startSLA: function(taskId, policyKey, tenant) {
        'use strict';
        var key = (policyKey || 'SEV2_INCIDENT').toUpperCase();
        var policy = AppForgeSLAService._store.policies[key] || AppForgeSLAService._store.policies['SEV2_INCIDENT'];

        var slaRec = {
            sla_id: 'sla_' + Date.now().toString(36),
            task_id: taskId,
            tenant: tenant || 'system',
            policy_name: policy.name,
            response_target_min: policy.response_target_min,
            resolution_target_min: policy.resolution_target_min,
            started_at: new Date().toISOString(),
            state: 'IN_PROGRESS', // NOT_STARTED, IN_PROGRESS, PAUSED, BREACHED, COMPLETED, CANCELLED
            elapsed_minutes: 0,
            remaining_minutes: policy.resolution_target_min,
            warning_triggered: false,
            escalation_triggered: false,
            breached: false
        };

        AppForgeSLAService._store.sla_instances[taskId] = slaRec;
        return slaRec;
    },

    /**
     * Evaluates SLA progression, warnings, escalations and breach triggers.
     */
    evaluateSLA: function(taskId, elapsedMinutes) {
        'use strict';
        var sla = AppForgeSLAService._store.sla_instances[taskId];
        if (!sla) return { error: 'SLA instance not found for task ' + taskId };

        var elapsed = (typeof elapsedMinutes === 'number') ? elapsedMinutes : (sla.elapsed_minutes + 10);
        sla.elapsed_minutes = elapsed;
        sla.remaining_minutes = Math.max(0, sla.resolution_target_min - elapsed);

        var pct = (elapsed / sla.resolution_target_min) * 100;

        if (pct >= 100) {
            sla.state = 'BREACHED';
            sla.breached = true;
            this.auditService.logEvent('SLA_BREACHED', 'OPERATIONAL', 'sla_daemon', taskId, 'CRITICAL', 'SLA breached for task ' + taskId);
        } else if (pct >= 85 && !sla.escalation_triggered) {
            sla.escalation_triggered = true;
            this.auditService.logEvent('SLA_ESCALATED', 'OPERATIONAL', 'sla_daemon', taskId, 'WARNING', 'SLA escalated (85% consumed) for task ' + taskId);
        } else if (pct >= 70 && !sla.warning_triggered) {
            sla.warning_triggered = true;
        }

        return sla;
    },

    completeSLA: function(taskId) {
        'use strict';
        var sla = AppForgeSLAService._store.sla_instances[taskId];
        if (sla) {
            sla.state = (sla.state === 'BREACHED' ? 'BREACHED' : 'COMPLETED');
            sla.completed_at = new Date().toISOString();
            return { success: true, sla: sla };
        }
        return { success: false, error: 'SLA not found.' };
    },

    getSLA: function(taskId) {
        'use strict';
        return AppForgeSLAService._store.sla_instances[taskId] || null;
    },

    resetStore: function() {
        'use strict';
        AppForgeSLAService._store = {
            sla_instances: {},
            policies: {
                'SEV1_INCIDENT': { response_target_min: 15, resolution_target_min: 120, name: 'SEV1 Critical Outage SLA' },
                'SEV2_INCIDENT': { response_target_min: 30, resolution_target_min: 240, name: 'SEV2 Major Degradation SLA' },
                'SEV3_INCIDENT': { response_target_min: 120, resolution_target_min: 1440, name: 'SEV3 Minor Impact SLA' },
                'SERVICE_REQUEST': { response_target_min: 240, resolution_target_min: 2880, name: 'Standard Request SLA' }
            }
        };
        this._store = AppForgeSLAService._store;
    },

    type: 'AppForgeSLAService'
};
