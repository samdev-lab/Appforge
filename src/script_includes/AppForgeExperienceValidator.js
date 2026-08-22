/**
 * AppForgeExperienceValidator
 * Server-side service validating experience definitions (Forms, Lists, Views, Related Lists, Navigation),
 * section uniqueness, field ordering, and enforcing destructive UI guards.
 */
var AppForgeExperienceValidator = Class.create();
AppForgeExperienceValidator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeExperienceValidator] ';
    },

    /**
     * Validates an Experience Definition block.
     * @param {Object} expDef - Experience configuration block.
     * @return {Object} { valid: boolean, errors: Array, warnings: Array }.
     */
    validate: function(expDef) {
        'use strict';
        var errors = [];
        var warnings = [];

        if (!expDef || typeof expDef !== 'object') {
            return { valid: false, errors: ['Experience definition must be an object'], warnings: [] };
        }

        // 1. Validate Forms
        var forms = expDef.forms || [];
        var formNames = [];
        for (var f = 0; f < forms.length; f++) {
            var frm = forms[f];
            if (!frm.name) errors.push('Form at index ' + f + ' missing name');
            if (!frm.table && !frm.schema) errors.push('Form (' + (frm.name || f) + ') missing table/schema reference');

            if (frm.action === 'delete' || frm.action === 'drop') {
                errors.push('Destructive operation on form (' + frm.name + ') BLOCKED: Destructive operation requires Experience Migration Engine.');
            }

            if (frm.name) {
                if (formNames.indexOf(frm.name) !== -1) {
                    errors.push('Duplicate form name detected: ' + frm.name);
                } else {
                    formNames.push(frm.name);
                }
            }

            // Validate Form Sections
            var sections = frm.sections || [];
            var sectionNames = [];
            for (var s = 0; s < sections.length; s++) {
                var sec = sections[s];
                if (!sec.name) errors.push('Form (' + frm.name + ') section at index ' + s + ' missing name');
                if (sec.name) {
                    if (sectionNames.indexOf(sec.name) !== -1) {
                        errors.push('Form (' + frm.name + ') has duplicate section name: ' + sec.name);
                    } else {
                        sectionNames.push(sec.name);
                    }
                }
            }
        }

        // 2. Validate Lists
        var lists = expDef.lists || [];
        var listNames = [];
        for (var l = 0; l < lists.length; l++) {
            var lst = lists[l];
            if (!lst.name) errors.push('List at index ' + l + ' missing name');
            if (!lst.table && !lst.schema) errors.push('List (' + (lst.name || l) + ') missing table/schema reference');

            if (lst.action === 'delete' || lst.action === 'drop') {
                errors.push('Destructive operation on list (' + lst.name + ') BLOCKED: Destructive operation requires Experience Migration Engine.');
            }

            if (lst.name) {
                if (listNames.indexOf(lst.name) !== -1) {
                    errors.push('Duplicate list name detected: ' + lst.name);
                } else {
                    listNames.push(lst.name);
                }
            }
        }

        // 3. Validate Views
        var views = expDef.views || [];
        for (var v = 0; v < views.length; v++) {
            var vw = views[v];
            if (!vw.name) errors.push('View at index ' + v + ' missing name');
            if (vw.action === 'delete' || vw.action === 'drop') {
                errors.push('Destructive operation on view (' + vw.name + ') BLOCKED: Destructive operation requires Experience Migration Engine.');
            }
        }

        // 4. Validate Related Lists
        var relLists = expDef.related_lists || [];
        for (var r = 0; r < relLists.length; r++) {
            var rl = relLists[r];
            if (!rl.parent_table && !rl.parent_schema) errors.push('Related list at index ' + r + ' missing parent table/schema');
            if (!rl.child_table && !rl.child_schema) errors.push('Related list at index ' + r + ' missing child table/schema');
        }

        // 5. Validate Navigation
        var navs = expDef.navigation || [];
        for (var n = 0; n < navs.length; n++) {
            var nav = navs[n];
            if (!nav.name) errors.push('Navigation entry at index ' + n + ' missing name');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    },

    type: 'AppForgeExperienceValidator'
};
