/**
 * AppForgeMigrationCutover
 * Zero/minimal-downtime cutover engine coordinating phase progression:
 * PREPARED -> READY -> APPROVED -> CUTOVER -> VERIFIED.
 */
var AppForgeMigrationCutover = Class.create();
AppForgeMigrationCutover.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMigrationCutover] ';
        this.CUTOVER_STATES = ['PREPARED', 'READY', 'APPROVED', 'CUTOVER', 'VERIFIED', 'FAILED'];
    },

    /**
     * Advances cutover phase.
     * @param {string} currentPhase - Current cutover phase.
     * @param {string} targetPhase - Target phase.
     * @param {boolean} [isApproved] - Approval flag.
     * @return {Object} { success: boolean, next_phase: string, error: string }
     */
    advanceCutover: function(currentPhase, targetPhase, isApproved) {
        'use strict';
        var curr = (currentPhase || 'PREPARED').toUpperCase();
        var tgt = (targetPhase || 'READY').toUpperCase();

        if (tgt === 'CUTOVER' && !isApproved) {
            return { success: false, next_phase: curr, error: 'APPROVAL REQUIRED: Production cutover requires formal approval.' };
        }

        return {
            success: true,
            previous_phase: curr,
            next_phase: tgt
        };
    },

    type: 'AppForgeMigrationCutover'
};
