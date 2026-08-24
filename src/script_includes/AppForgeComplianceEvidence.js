/**
 * AppForgeComplianceEvidence
 * Collects, sanitizes, and hashes compliance evidence across platform registries and runtime events.
 */
var AppForgeComplianceEvidence = Class.create();
AppForgeComplianceEvidence.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeComplianceEvidence] ';
        this.checksumEngine = new AppForgeChecksumEngine();
    },

    /**
     * Collects and sanitizes compliance evidence.
     * @param {Object} rawEvidence - Raw evidence object.
     * @return {Object} Sanitized and hashed evidence record.
     */
    collectEvidence: function(rawEvidence) {
        'use strict';
        if (!rawEvidence) return null;

        var sanitized = this._sanitize(rawEvidence);
        var evidenceHash = this.checksumEngine.generateChecksum(sanitized);

        return {
            tenant: sanitized.tenant || 'SYSTEM',
            application: sanitized.application || 'app',
            policy: sanitized.policy || 'GENERAL',
            source: sanitized.source || 'PLATFORM_REGISTRY',
            result: sanitized.result || 'PASS',
            evidence: sanitized.evidence || {},
            evidence_hash: evidenceHash,
            timestamp: new GlideDateTime().getValue()
        };
    },

    /**
     * Recursively masks sensitive credentials in evidence records.
     */
    _sanitize: function(obj) {
        'use strict';
        if (!obj || typeof obj !== 'object') return obj;
        var copy = Array.isArray(obj) ? [] : {};
        for (var k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                if (/(?:password|passwd|pwd|secret|api[_-]?key|token|bearer|private[_-]?key)/i.test(k)) {
                    copy[k] = '[REDACTED_SECRET]';
                } else if (typeof obj[k] === 'object' && obj[k] !== null) {
                    copy[k] = this._sanitize(obj[k]);
                } else {
                    copy[k] = obj[k];
                }
            }
        }
        return copy;
    },

    type: 'AppForgeComplianceEvidence'
};
