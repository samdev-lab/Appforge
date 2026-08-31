/**
 * AppForgeIncidentProblemChangeService
 * Enterprise ITSM Operations: Incidents (SEV1-SEV4), Problem Management & Governed Change Control.
 *
 * Implements:
 *   - Incidents (x_appforge_ops_incident) with Severities SEV1 to SEV4 & lifecycle progression
 *   - Problem Management (x_appforge_ops_problem) with Root Cause, Workarounds, and Known Errors
 *   - Change Management (x_appforge_ops_change) with Four-Eyes Separation of Duties (Requester != Approver)
 */
var AppForgeIncidentProblemChangeService = Class.create();
AppForgeIncidentProblemChangeService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeIncidentProblemChangeService] ';
        this.auditService = new AppForgeAuditService();
        this.logger = new AppForgeOperationalLoggingService();

        if (!AppForgeIncidentProblemChangeService._store) {
            AppForgeIncidentProblemChangeService._store = {
                incidents: [],
                problems: [],
                changes: []
            };
        }
        this._store = AppForgeIncidentProblemChangeService._store;
    },

    // ─── Incidents ──────────────────────────────────────────────────────

    createIncident: function(opts) {
        'use strict';
        var o = opts || {};
        var incNumber = 'INC-' + Math.floor(100000 + Math.random() * 900000);
        var incident = {
            incident_id: 'inc_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000),
            number: incNumber,
            tenant: o.tenant || 'system',
            application: o.application || 'platform',
            severity: (o.severity || 'SEV3').toUpperCase(),
            priority: (o.priority || 'P3').toUpperCase(),
            state: 'NEW',
            short_description: o.short_description || 'Operational incident',
            description: o.description || '',
            assigned_to: o.assigned_to || 'ops_tier1',
            opened_at: new Date().toISOString(),
            acknowledged_at: null,
            resolved_at: null,
            closed_at: null,
            root_cause: null,
            resolution: null,
            correlation_id: o.correlation_id || ('corr_' + Date.now().toString(36))
        };

        AppForgeIncidentProblemChangeService._store.incidents.push(incident);
        this.auditService.logEvent('INCIDENT_CREATED', 'OPERATIONAL', o.assigned_to || 'system', incident.correlation_id, 'SUCCESS', 'Incident created: ' + incNumber + ' [' + incident.severity + ']');
        return incident;
    },

    updateIncidentState: function(incidentNumberOrId, newState, resolution, rootCause) {
        'use strict';
        var validStates = ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED', 'CLOSED'];
        var st = (newState || '').toUpperCase();
        if (validStates.indexOf(st) === -1) throw new Error('Invalid incident state: ' + newState);

        for (var i = 0; i < AppForgeIncidentProblemChangeService._store.incidents.length; i++) {
            var inc = AppForgeIncidentProblemChangeService._store.incidents[i];
            if (inc.number === incidentNumberOrId || inc.incident_id === incidentNumberOrId) {
                inc.state = st;
                if (st === 'ACKNOWLEDGED' && !inc.acknowledged_at) inc.acknowledged_at = new Date().toISOString();
                if (st === 'RESOLVED') {
                    inc.resolved_at = new Date().toISOString();
                    inc.resolution = resolution || 'Issue resolved.';
                    inc.root_cause = rootCause || inc.root_cause;
                }
                if (st === 'CLOSED') inc.closed_at = new Date().toISOString();
                return { success: true, incident: inc };
            }
        }
        return { success: false, error: 'Incident not found.' };
    },

    listIncidents: function(filter) {
        'use strict';
        var f = filter || {};
        var list = AppForgeIncidentProblemChangeService._store.incidents.slice();
        if (f.tenant) list = list.filter(function(i) { return i.tenant === f.tenant; });
        if (f.severity) list = list.filter(function(i) { return i.severity === f.severity.toUpperCase(); });
        if (f.state) list = list.filter(function(i) { return i.state === f.state.toUpperCase(); });
        return list;
    },

    // ─── Problem Management ─────────────────────────────────────────────

    createProblem: function(opts) {
        'use strict';
        var o = opts || {};
        var prbNumber = 'PRB-' + Math.floor(100000 + Math.random() * 900000);
        var problem = {
            problem_id: 'prb_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000),
            number: prbNumber,
            tenant: o.tenant || 'system',
            application: o.application || 'platform',
            state: 'OPEN',
            short_description: o.short_description || 'Root cause investigation',
            root_cause: o.root_cause || null,
            workaround: o.workaround || null,
            permanent_fix: o.permanent_fix || null,
            related_incidents: o.related_incidents || [],
            opened_at: new Date().toISOString()
        };

        AppForgeIncidentProblemChangeService._store.problems.push(problem);
        return problem;
    },

    updateProblem: function(problemNumberOrId, updates) {
        'use strict';
        var u = updates || {};
        for (var i = 0; i < AppForgeIncidentProblemChangeService._store.problems.length; i++) {
            var p = AppForgeIncidentProblemChangeService._store.problems[i];
            if (p.number === problemNumberOrId || p.problem_id === problemNumberOrId) {
                if (u.state) p.state = u.state.toUpperCase();
                if (u.root_cause) p.root_cause = u.root_cause;
                if (u.workaround) p.workaround = u.workaround;
                if (u.permanent_fix) p.permanent_fix = u.permanent_fix;
                return { success: true, problem: p };
            }
        }
        return { success: false, error: 'Problem not found.' };
    },

    // ─── Change Management & Four-Eyes Governance ───────────────────────

    requestChange: function(opts) {
        'use strict';
        var o = opts || {};
        var chgNumber = 'CHG-' + Math.floor(100000 + Math.random() * 900000);
        var change = {
            change_id: 'chg_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000),
            number: chgNumber,
            tenant: o.tenant || 'system',
            application: o.application || 'platform',
            environment: o.environment || 'PRODUCTION',
            change_type: (o.change_type || 'NORMAL').toUpperCase(), // STANDARD, NORMAL, EMERGENCY
            risk: (o.risk || 'LOW').toUpperCase(),
            impact: (o.impact || 'LOW').toUpperCase(),
            implementation_plan: o.implementation_plan || 'Standard deployment steps',
            rollback_plan: o.rollback_plan || 'Execute automated rollback engine',
            requested_by: o.requested_by || 'ops_engineer',
            approved_by: null,
            status: (o.change_type === 'EMERGENCY' ? 'APPROVED' : 'REQUESTED'), // Emergency pre-authorized with audit
            created_at: new Date().toISOString()
        };

        if (o.change_type === 'EMERGENCY') {
            change.approved_by = 'EMERGENCY_CAB_AUTO_AUDIT';
            this.auditService.logEvent('EMERGENCY_CHANGE_DECLARED', 'GOVERNANCE', change.requested_by, change.change_id, 'SUCCESS', 'Emergency change declared: ' + chgNumber);
        }

        AppForgeIncidentProblemChangeService._store.changes.push(change);
        return change;
    },

    approveChange: function(changeNumberOrId, approverUser) {
        'use strict';
        for (var i = 0; i < AppForgeIncidentProblemChangeService._store.changes.length; i++) {
            var c = AppForgeIncidentProblemChangeService._store.changes[i];
            if (c.number === changeNumberOrId || c.change_id === changeNumberOrId) {
                // Four-Eyes Separation of Duties enforcement
                if (c.requested_by === approverUser) {
                    return {
                        success: false,
                        errorCode: 'FOUR_EYES_APPROVAL_REQUIRED',
                        error: 'Requester (' + approverUser + ') cannot self-approve production changes. Independent Four-Eyes approval required.'
                    };
                }
                c.approved_by = approverUser;
                c.status = 'APPROVED';
                c.approved_at = new Date().toISOString();
                this.auditService.logEvent('CHANGE_APPROVED', 'GOVERNANCE', approverUser, c.change_id, 'SUCCESS', 'Change ' + c.number + ' approved by ' + approverUser);
                return { success: true, change: c };
            }
        }
        return { success: false, error: 'Change not found.' };
    },

    resetStore: function() {
        'use strict';
        AppForgeIncidentProblemChangeService._store = {
            incidents: [],
            problems: [],
            changes: []
        };
        this._store = AppForgeIncidentProblemChangeService._store;
    },

    type: 'AppForgeIncidentProblemChangeService'
};
