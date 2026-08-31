/**
 * AppForgeCommercialStateMachine
 * Strict State Machine for Commercial SaaS, Subscription & Customer Lifecycles.
 *
 * Supported States:
 *   - PROSPECT: Newly registered, not yet trial or subscribed
 *   - TRIAL: In active 14-day evaluation
 *   - ACTIVE: Fully paid and active commercial subscription
 *   - PAST_DUE: Payment failed, renewal pending
 *   - GRACE_PERIOD: Retry window before access restriction
 *   - SUSPENDED: Non-payment or administrative hold
 *   - CANCEL_PENDING: Cancellation requested at period end
 *   - CANCELLED: Terminated by customer or admin
 *   - EXPIRED: Trial or contract concluded without renewal
 */
var AppForgeCommercialStateMachine = Class.create();
AppForgeCommercialStateMachine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCommercialStateMachine] ';

        this.TRANSITIONS = {
            'PROSPECT': ['TRIAL', 'ACTIVE', 'CANCELLED'],
            'TRIAL': ['ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL'], // trial can be extended
            'ACTIVE': ['PAST_DUE', 'CANCEL_PENDING', 'CANCELLED', 'SUSPENDED', 'ACTIVE'], // upgrade/downgrade
            'PAST_DUE': ['ACTIVE', 'GRACE_PERIOD', 'SUSPENDED', 'CANCELLED'],
            'GRACE_PERIOD': ['ACTIVE', 'SUSPENDED', 'CANCELLED'],
            'SUSPENDED': ['ACTIVE', 'CANCELLED', 'EXPIRED'],
            'CANCEL_PENDING': ['CANCELLED', 'ACTIVE'], // customer can retract cancellation
            'CANCELLED': ['ACTIVE', 'PROSPECT'], // reactivation
            'EXPIRED': ['ACTIVE', 'PROSPECT', 'TRIAL']
        };
    },

    /**
     * Checks if a transition between two states is valid.
     */
    canTransition: function(fromState, toState) {
        'use strict';
        if (!fromState || !toState) return false;
        var f = fromState.toUpperCase();
        var t = toState.toUpperCase();
        if (f === t) return true; // idempotency
        var allowed = this.TRANSITIONS[f] || [];
        return allowed.indexOf(t) !== -1;
    },

    /**
     * Validates transition and throws or returns structured error if invalid.
     */
    validateTransition: function(fromState, toState) {
        'use strict';
        var f = (fromState || 'UNKNOWN').toUpperCase();
        var t = (toState || 'UNKNOWN').toUpperCase();
        if (!this.canTransition(f, t)) {
            return {
                valid: false,
                errorCode: 'COMMERCIAL_INVALID_STATE_TRANSITION',
                error: 'Cannot transition subscription/customer from ' + f + ' to ' + t
            };
        }
        return { valid: true, from: f, to: t };
    },

    getAllowedTransitions: function(fromState) {
        'use strict';
        var f = (fromState || '').toUpperCase();
        return (this.TRANSITIONS[f] || []).slice();
    },

    type: 'AppForgeCommercialStateMachine'
};
