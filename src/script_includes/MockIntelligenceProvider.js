/**
 * MockIntelligenceProvider
 * Provider-neutral AI interface implementation providing deterministic diagnostic analysis and summarization.
 * Does not hard-code any specific commercial LLM provider.
 */
var MockIntelligenceProvider = Class.create();
MockIntelligenceProvider.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[MockIntelligenceProvider] ';
        this.provider_name = 'MockDeterministicAI';
    },

    analyze: function(context) {
        'use strict';
        return {
            provider: this.provider_name,
            summary: 'Application analyzed deterministically from telemetry state.',
            confidence: 0.95
        };
    },

    diagnose: function(context) {
        'use strict';
        var pl = (context && context.payload) || {};
        return {
            provider: this.provider_name,
            diagnosis: pl.probable_root_cause ? ('Root cause determined as ' + pl.probable_root_cause) : 'Application operational within parameters',
            confidence: pl.confidence || 0.90
        };
    },

    summarize: function(context) {
        'use strict';
        var pl = (context && context.payload) || {};
        return {
            provider: this.provider_name,
            summary: 'Application: ' + (pl.application && pl.application.name) + ' (Health: ' + (pl.health && pl.health.status) + ', Score: ' + (pl.health && pl.health.score) + '/100)'
        };
    },

    recommend: function(context) {
        'use strict';
        var pl = (context && context.payload) || {};
        return {
            provider: this.provider_name,
            recommended_actions: pl.recommendations || []
        };
    },

    type: 'MockIntelligenceProvider'
};
