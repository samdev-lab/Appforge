/**
 * AppForgePublicKeyRegistry
 * Manages public key lifecycle, cryptographic fingerprints, and status transitions
 * for enterprise asymmetric package verification.
 * Backed by x_appforge_public_key. Never stores private keys.
 */
var AppForgePublicKeyRegistry = Class.create();
AppForgePublicKeyRegistry.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgePublicKeyRegistry] ';
        this.TABLE_NAME = 'x_appforge_public_key';
        this.SUPPORTED_ALGORITHMS = ['ECDSA-P256-SHA256', 'Ed25519'];
        this.checksumEngine = new AppForgeChecksumEngine();
    },

    /**
     * Registers a new public key in the registry.
     * @param {Object} keyDef - Public key definition.
     * @param {string} actor - User or service registering the key.
     * @return {Object} { success: boolean, key_id: string, fingerprint: string, status: string, error?: string }
     */
    registerKey: function(keyDef, actor) {
        'use strict';
        if (!keyDef || !keyDef.public_key) {
            return { success: false, error: 'Mandatory field missing: public_key' };
        }

        // Strict private key guard
        var pkStr = String(keyDef.public_key);
        if (/PRIVATE\s+KEY/i.test(pkStr) || /sa_password/i.test(pkStr)) {
            gs.error(this.LOG_PREFIX + 'SECURITY_VIOLATION: Attempt to register private key rejected.');
            return {
                success: false,
                status: 'REJECTED_SECURITY_VIOLATION',
                error: 'Private keys are strictly forbidden in x_appforge_public_key registry.'
            };
        }

        var keyId = keyDef.key_id || ('key_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000));
        var algorithm = keyDef.algorithm || 'ECDSA-P256-SHA256';
        var tenantId = keyDef.tenant_id || 'global';
        var keyName = keyDef.key_name || ('Key-' + keyId);
        var fingerprint = this._computeFingerprint(pkStr);
        var validFrom = keyDef.valid_from || new GlideDateTime().getValue();
        var validUntil = keyDef.valid_until || '2099-12-31T23:59:59Z';
        var user = actor || 'system';

        var gr = new GlideRecordSecure(this.TABLE_NAME);
        gr.initialize();
        gr.setValue('key_id', keyId);
        gr.setValue('tenant_id', tenantId);
        gr.setValue('organization_id', keyDef.organization_id || '');
        gr.setValue('key_name', keyName);
        gr.setValue('algorithm', algorithm);
        gr.setValue('public_key', pkStr);
        gr.setValue('fingerprint', fingerprint);
        gr.setValue('status', 'ACTIVE');
        gr.setValue('valid_from', validFrom);
        gr.setValue('valid_until', validUntil);
        gr.setValue('created_by', user);
        gr.setValue('created_at', new GlideDateTime().getValue());
        gr.setValue('updated_at', new GlideDateTime().getValue());
        var sysId = gr.insert();

        gs.info(this.LOG_PREFIX + 'Registered public key: ' + keyId + ' (Fingerprint: ' + fingerprint.substring(0, 16) + '...)');

        return {
            success: true,
            status: 'ACTIVE',
            key_id: keyId,
            sys_id: sysId,
            algorithm: algorithm,
            fingerprint: fingerprint,
            tenant_id: tenantId
        };
    },

    /**
     * Retrieves a public key record by key ID.
     */
    getKey: function(keyId) {
        'use strict';
        if (!keyId) return null;

        var gr = new GlideRecordSecure(this.TABLE_NAME);
        gr.addQuery('key_id', keyId);
        gr.query();
        if (gr.next()) {
            return {
                key_id: gr.getValue('key_id'),
                tenant_id: gr.getValue('tenant_id'),
                organization_id: gr.getValue('organization_id'),
                key_name: gr.getValue('key_name'),
                algorithm: gr.getValue('algorithm'),
                public_key: gr.getValue('public_key'),
                fingerprint: gr.getValue('fingerprint'),
                status: gr.getValue('status'),
                valid_from: gr.getValue('valid_from'),
                valid_until: gr.getValue('valid_until'),
                created_by: gr.getValue('created_by')
            };
        }
        return null;
    },

    /**
     * Validates whether a key is currently valid for signature verification.
     */
    validateKey: function(keyId) {
        'use strict';
        var key = this.getKey(keyId);
        if (!key) {
            return { valid: false, status: 'KEY_NOT_FOUND', error: 'Public key ' + keyId + ' not found in registry.' };
        }

        if (key.status === 'REVOKED') {
            return { valid: false, status: 'KEY_REVOKED', error: 'Public key ' + keyId + ' has been revoked.' };
        }

        if (key.status === 'SUSPENDED') {
            return { valid: false, status: 'KEY_SUSPENDED', error: 'Public key ' + keyId + ' is currently suspended.' };
        }

        var now = new Date().getTime();
        var until = new Date(key.valid_until).getTime();
        if (until && now > until) {
            return { valid: false, status: 'KEY_EXPIRED', error: 'Public key ' + keyId + ' expired on ' + key.valid_until };
        }

        return {
            valid: true,
            status: 'ACTIVE',
            key: key
        };
    },

    /**
     * Revokes a public key.
     */
    revokeKey: function(keyId, actor, reason) {
        'use strict';
        var gr = new GlideRecordSecure(this.TABLE_NAME);
        gr.addQuery('key_id', keyId);
        gr.query();
        if (gr.next()) {
            gr.setValue('status', 'REVOKED');
            gr.setValue('revoked_by', actor || 'admin');
            gr.setValue('revoked_at', new GlideDateTime().getValue());
            gr.setValue('revocation_reason', reason || 'Administrative revocation');
            gr.setValue('updated_at', new GlideDateTime().getValue());
            gr.update();

            gs.warn(this.LOG_PREFIX + 'Revoked public key: ' + keyId + ' by ' + (actor || 'admin'));
            return { success: true, status: 'REVOKED', key_id: keyId };
        }
        return { success: false, error: 'Key not found: ' + keyId };
    },

    /**
     * Suspends a public key temporarily.
     */
    suspendKey: function(keyId, actor) {
        'use strict';
        var gr = new GlideRecordSecure(this.TABLE_NAME);
        gr.addQuery('key_id', keyId);
        gr.query();
        if (gr.next()) {
            gr.setValue('status', 'SUSPENDED');
            gr.setValue('updated_at', new GlideDateTime().getValue());
            gr.update();
            return { success: true, status: 'SUSPENDED', key_id: keyId };
        }
        return { success: false, error: 'Key not found: ' + keyId };
    },

    _computeFingerprint: function(publicKeyStr) {
        'use strict';
        return this.checksumEngine.generateChecksum({ pk: publicKeyStr.trim() });
    },

    type: 'AppForgePublicKeyRegistry'
};
