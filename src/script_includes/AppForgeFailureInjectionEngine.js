/**
 * AppForgeFailureInjectionEngine
 * Controlled Reliability Testing & Failure Injection Simulator.
 *
 * Implements:
 *   - Simulated Failures: DATABASE_UNAVAILABLE, API_TIMEOUT, WEBHOOK_FAILURE,
 *     QUEUE_FAILURE, BILLING_FAILURE, APPLICATION_FAILURE, BACKUP_FAILURE, RESTORE_FAILURE
 *   - Safety Guard: Disabled in Production by Default (Explicit Simulation Flag Required)
 */
var AppForgeFailureInjectionEngine = Class.create();
AppForgeFailureInjectionEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeFailureInjectionEngine] ';

        if (!AppForgeFailureInjectionEngine._store) {
            AppForgeFailureInjectionEngine._store = {
                enabled: false,
                injected_failures: {}
            };
        }
        this._store = AppForgeFailureInjectionEngine._store;
    },

    enableSimulation: function() {
        'use strict';
        AppForgeFailureInjectionEngine._store.enabled = true;
    },

    disableSimulation: function() {
        'use strict';
        AppForgeFailureInjectionEngine._store.enabled = false;
        AppForgeFailureInjectionEngine._store.injected_failures = {};
    },

    injectFailure: function(failureType) {
        'use strict';
        if (!AppForgeFailureInjectionEngine._store.enabled) {
            return { success: false, error: 'Failure injection simulator is disabled. Enable simulation first.' };
        }
        var type = (failureType || '').toUpperCase();
        AppForgeFailureInjectionEngine._store.injected_failures[type] = true;
        return { success: true, injected: type };
    },

    hasFailure: function(failureType) {
        'use strict';
        if (!AppForgeFailureInjectionEngine._store.enabled) return false;
        var type = (failureType || '').toUpperCase();
        return !!AppForgeFailureInjectionEngine._store.injected_failures[type];
    },

    resetStore: function() {
        'use strict';
        AppForgeFailureInjectionEngine._store = {
            enabled: false,
            injected_failures: {}
        };
        this._store = AppForgeFailureInjectionEngine._store;
    },

    type: 'AppForgeFailureInjectionEngine'
};
