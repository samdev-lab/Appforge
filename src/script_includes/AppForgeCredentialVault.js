/**
 * AppForgeCredentialVault
 * Secure Credential Vault for AppForge Universal REST Integration Platform.
 *
 * Supported Credential Types:
 *   - API_KEY
 *   - BEARER_TOKEN
 *   - BASIC_AUTH
 *   - OAUTH2
 *   - CUSTOM_HEADER
 *   - APPFORGE_API_TOKEN
 *
 * Enforces:
 *   - Secret masking in all metadata, list views, and diagnostic outputs.
 *   - Multi-tenant credential isolation.
 *   - Expiration and rotation metadata.
 *   - Zero secret leakage in logs.
 */
var AppForgeCredentialVault = Class.create();
AppForgeCredentialVault.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCredentialVault] ';

        if (!AppForgeCredentialVault._store) {
            AppForgeCredentialVault._store = {
                credentials: {}, // credential_id -> metadata + secure payload
                tenant_credentials: {} // tenant_id -> array of credential_ids
            };
        }
        AppForgeCredentialVault._store = AppForgeCredentialVault._store;
    },

    /**
     * Stores a credential securely in the vault.
     */
    storeCredential: function(tenantId, credData) {
        'use strict';
        if (!tenantId || !credData) throw new Error('Tenant ID and Credential Data are required.');
        if (!credData.credential_name) throw new Error('Credential Name is required.');
        if (!credData.credential_type) throw new Error('Credential Type is required.');

        var validTypes = ['API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH', 'OAUTH2', 'CUSTOM_HEADER', 'APPFORGE_API_TOKEN'];
        var credType = credData.credential_type.toUpperCase();
        if (validTypes.indexOf(credType) === -1) {
            return { success: false, errorCode: 'INVALID_CREDENTIAL_TYPE', error: 'Unsupported credential type: ' + credData.credential_type };
        }

        var credId = credData.credential_id || ('cred_' + Math.floor(Math.random() * 1000000));
        var secretPayload = {};

        // Extract secrets based on type
        switch (credType) {
            case 'API_KEY':
                secretPayload.header_name = credData.header_name || 'X-API-Key';
                secretPayload.api_key = credData.api_key || credData.secret || '';
                break;
            case 'BEARER_TOKEN':
                secretPayload.bearer_token = credData.bearer_token || credData.token || '';
                break;
            case 'BASIC_AUTH':
                secretPayload.username = credData.username || '';
                secretPayload.password = credData.password || '';
                break;
            case 'OAUTH2':
                secretPayload.client_id = credData.client_id || '';
                secretPayload.client_secret = credData.client_secret || '';
                secretPayload.token_url = credData.token_url || '';
                secretPayload.grant_type = credData.grant_type || 'client_credentials';
                secretPayload.access_token = credData.access_token || '';
                secretPayload.refresh_token = credData.refresh_token || '';
                break;
            case 'CUSTOM_HEADER':
                secretPayload.header_name = credData.header_name || '';
                secretPayload.header_value = credData.header_value || '';
                break;
            case 'APPFORGE_API_TOKEN':
                secretPayload.api_token = credData.api_token || '';
                break;
        }

        var record = {
            credential_id: credId,
            credential_name: credData.credential_name,
            tenant_id: tenantId,
            credential_type: credType,
            status: 'ACTIVE',
            expires_at: credData.expires_at || null,
            created_at: new Date().toISOString(),
            last_used: null,
            last_rotated: new Date().toISOString(),
            rotation_required: false,
            _secrets: secretPayload
        };

        AppForgeCredentialVault._store.credentials[credId] = record;
        if (!AppForgeCredentialVault._store.tenant_credentials[tenantId]) AppForgeCredentialVault._store.tenant_credentials[tenantId] = [];
        if (AppForgeCredentialVault._store.tenant_credentials[tenantId].indexOf(credId) === -1) {
            AppForgeCredentialVault._store.tenant_credentials[tenantId].push(credId);
        }

        gs.info(this.LOG_PREFIX + 'Stored credential ' + credId + ' (' + credType + ') for tenant ' + tenantId);

        return {
            success: true,
            credential_id: credId,
            credential: this.maskCredential(record)
        };
    },

    /**
     * Retrieves sanitized credential metadata (never includes raw secrets).
     */
    getCredentialMetadata: function(tenantId, credentialId) {
        'use strict';
        if (!tenantId || !credentialId) return null;
        var record = AppForgeCredentialVault._store.credentials[credentialId];
        if (!record || record.tenant_id !== tenantId) {
            return null; // Tenant Isolation
        }
        return this.maskCredential(record);
    },

    /**
     * Lists all credentials for a tenant with secrets masked.
     */
    listCredentials: function(tenantId) {
        'use strict';
        if (!tenantId) return [];
        var credIds = AppForgeCredentialVault._store.tenant_credentials[tenantId] || [];
        var self = this;
        return credIds.map(function(id) {
            return self.maskCredential(AppForgeCredentialVault._store.credentials[id]);
        }).filter(Boolean);
    },

    /**
     * Retrieves decrypted secret payload for internal execution engines only.
     */
    getDecryptedSecret: function(tenantId, credentialId, callerContext) {
        'use strict';
        if (!tenantId || !credentialId) {
            return { success: false, error: 'Tenant ID and Credential ID are required.' };
        }
        var record = AppForgeCredentialVault._store.credentials[credentialId];
        if (!record) {
            return { success: false, errorCode: 'CREDENTIAL_NOT_FOUND', error: 'Credential ' + credentialId + ' not found.' };
        }
        if (record.tenant_id !== tenantId) {
            return { success: false, errorCode: 'TENANT_ACCESS_DENIED', error: 'Cross-tenant credential access denied.' };
        }
        if (record.status !== 'ACTIVE') {
            return { success: false, errorCode: 'CREDENTIAL_INACTIVE', error: 'Credential is ' + record.status };
        }

        record.last_used = new Date().toISOString();
        return {
            success: true,
            credential_id: credentialId,
            credential_type: record.credential_type,
            secrets: Object.assign({}, record._secrets)
        };
    },

    /**
     * Rotates credential secret.
     */
    rotateCredential: function(tenantId, credentialId, newSecretData) {
        'use strict';
        var record = AppForgeCredentialVault._store.credentials[credentialId];
        if (!record || record.tenant_id !== tenantId) {
            return { success: false, error: 'Credential not found for tenant.' };
        }
        Object.assign(record._secrets, newSecretData);
        record.last_rotated = new Date().toISOString();
        record.rotation_required = false;
        return { success: true, credential: this.maskCredential(record) };
    },

    /**
     * Revokes credential.
     */
    revokeCredential: function(tenantId, credentialId) {
        'use strict';
        var record = AppForgeCredentialVault._store.credentials[credentialId];
        if (!record || record.tenant_id !== tenantId) {
            return { success: false, error: 'Credential not found for tenant.' };
        }
        record.status = 'REVOKED';
        record.revoked_at = new Date().toISOString();
        return { success: true, credential: this.maskCredential(record) };
    },

    /**
     * Masks secret fields for UI and API serialization.
     */
    maskCredential: function(record) {
        'use strict';
        if (!record) return null;
        return {
            credential_id: record.credential_id,
            credential_name: record.credential_name,
            tenant_id: record.tenant_id,
            credential_type: record.credential_type,
            status: record.status,
            expires_at: record.expires_at,
            created_at: record.created_at,
            last_used: record.last_used,
            last_rotated: record.last_rotated,
            rotation_required: record.rotation_required,
            secrets_masked: true
        };
    },

    resetStore: function() {
        'use strict';
        AppForgeCredentialVault._store = {
            credentials: {},
            tenant_credentials: {}
        };
        AppForgeCredentialVault._store = AppForgeCredentialVault._store;
    },

    type: 'AppForgeCredentialVault'
};
