/**
 * AppForgeBranchPatternParser
 * Script Include responsible for parsing Git branch names and extracting branch classification types and instance identifiers.
 */
var AppForgeBranchPatternParser = Class.create();
AppForgeBranchPatternParser.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeBranchPatternParser] ';
    },

    /**
     * Parses a branch name string into its type and instance metadata.
     * @param {string} branchName - Git branch name (e.g. sn_instances/dev280961, main).
     * @return {Object} Parsed result { branch_name, branch_type, instance_identifier }.
     */
    parse: function(branchName) {
        'use strict';
        if (!branchName) {
            return {
                branch_name: '',
                branch_type: 'OTHER',
                instance_identifier: null
            };
        }

        var cleanName = branchName.trim();

        // 1. Instance Branch Pattern (e.g. sn_instances/dev280961)
        var instanceMatch = cleanName.match(/^sn_instances\/(.+)$/i);
        if (instanceMatch && instanceMatch[1]) {
            return {
                branch_name: cleanName,
                branch_type: 'INSTANCE',
                instance_identifier: instanceMatch[1]
            };
        }

        // 2. Main / Production Baseline Branch Pattern
        if (/^(main|master)$/i.test(cleanName)) {
            return {
                branch_name: cleanName,
                branch_type: 'MAIN',
                instance_identifier: null
            };
        }

        // 3. Development Branch Pattern
        if (/^(dev|development)$/i.test(cleanName)) {
            return {
                branch_name: cleanName,
                branch_type: 'DEVELOPMENT',
                instance_identifier: null
            };
        }

        // 4. Feature Branch Pattern (e.g. feature/module-ui)
        if (/^feature\//i.test(cleanName)) {
            return {
                branch_name: cleanName,
                branch_type: 'FEATURE',
                instance_identifier: null
            };
        }

        // 5. Release Branch Pattern (e.g. release/v1.0.0)
        if (/^release\//i.test(cleanName)) {
            return {
                branch_name: cleanName,
                branch_type: 'RELEASE',
                instance_identifier: null
            };
        }

        // 6. Hotfix Branch Pattern (e.g. hotfix/patch-security)
        if (/^hotfix\//i.test(cleanName)) {
            return {
                branch_name: cleanName,
                branch_type: 'HOTFIX',
                instance_identifier: null
            };
        }

        return {
            branch_name: cleanName,
            branch_type: 'OTHER',
            instance_identifier: null
        };
    },

    type: 'AppForgeBranchPatternParser'
};
