/**
 * AppForgeDistributionEngine
 * Manages package distribution, version resolution, canonical SHA-256 checksum verification,
 * and HMAC-SHA256 signature validation across multi-tenant boundaries.
 */
var AppForgeDistributionEngine = Class.create();
AppForgeDistributionEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeDistributionEngine] ';
        this.checksumEngine = new AppForgeChecksumEngine();
        this.packageSigner = new AppForgePackageSigner();
    },

    /**
     * Verifies package integrity before distribution or installation.
     * @param {Object} packageManifest - Application package manifest.
     * @return {Object} { valid: boolean, status: 'VERIFIED'|'PACKAGE_INTEGRITY_MISMATCH', reason: string }
     */
    verifyPackageIntegrity: function(packageManifest) {
        'use strict';
        if (!packageManifest) {
            return { valid: false, status: 'PACKAGE_INTEGRITY_MISMATCH', reason: 'Missing package manifest' };
        }

        // 1. Checksum Verification
        var expectedChecksum = packageManifest.checksum;
        if (expectedChecksum) {
            var calculatedChecksum = this.checksumEngine.generateChecksum(packageManifest.inventory || packageManifest.payload || packageManifest);
            if (expectedChecksum !== calculatedChecksum) {
                gs.error(this.LOG_PREFIX + 'Package checksum tampering detected! Expected: ' + expectedChecksum + ', got: ' + calculatedChecksum);
                return {
                    valid: false,
                    status: 'PACKAGE_INTEGRITY_MISMATCH',
                    reason: 'PACKAGE_INTEGRITY_MISMATCH: Calculated checksum (' + calculatedChecksum + ') does not match manifest checksum (' + expectedChecksum + ')'
                };
            }
        }

        // 2. Digital Signature Verification
        if (packageManifest.signature) {
            var sigValid = this.packageSigner.verifySignature(packageManifest.inventory || packageManifest.payload || packageManifest, packageManifest.signature);
            if (!sigValid) {
                return {
                    valid: false,
                    status: 'SIGNATURE_INVALID',
                    reason: 'Cryptographic signature verification failed'
                };
            }
        }

        return {
            valid: true,
            status: 'VERIFIED',
            checksum: expectedChecksum,
            verified_at: new GlideDateTime().getValue()
        };
    },

    type: 'AppForgeDistributionEngine'
};
