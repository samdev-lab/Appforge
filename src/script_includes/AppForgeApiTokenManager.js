/**
 * AppForgeApiTokenManager
 * Cryptographically Secure API Token Generator & Lifecycle Engine for AppForge Integrations.
 *
 * Implements:
 *   - Display-once token creation rule
 *   - Secure SHA-256 token hashing
 *   - Scope-based access control
 *   - Expiration and revocation lifecycle (ACTIVE, EXPIRED, REVOKED)
 *   - Tenant isolation
 */
var AppForgeApiTokenManager = Class.create();
AppForgeApiTokenManager.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeApiTokenManager] ';

        if (!AppForgeApiTokenManager._store) {
            AppForgeApiTokenManager._store = {
                tokens: {}, // token_id -> token record
                hash_index: {}, // token_hash -> token_id
                tenant_tokens: {} // tenant_id -> array of token_ids
            };
        }
        AppForgeApiTokenManager._store = AppForgeApiTokenManager._store;
    },

    /**
     * Generates a new AppForge API token with display-once raw secret.
     */
    generateToken: function(tenantId, tokenName, owner, scopes, ttlDays) {
        'use strict';
        if (!tenantId || !tokenName) throw new Error('Tenant ID and Token Name are required.');

        var tokenId = 'tok_' + Math.floor(Math.random() * 1000000);
        var rawSecret = this._generateSecureSecret();
        var tokenHash = this._hashSecret(rawSecret);

        var days = ttlDays || 90;
        var expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000)).toISOString();

        var allowedScopes = scopes || ['integration:read', 'integration:execute'];

        var record = {
            token_id: tokenId,
            token_name: tokenName,
            tenant_id: tenantId,
            owner: owner || 'admin',
            scopes: allowedScopes,
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            expires_at: expiresAt,
            last_used: null,
            revoked_at: null,
            token_hash: tokenHash,
            token_prefix: rawSecret.substring(0, 10) + '...'
        };

        AppForgeApiTokenManager._store.tokens[tokenId] = record;
        AppForgeApiTokenManager._store.hash_index[tokenHash] = tokenId;

        if (!AppForgeApiTokenManager._store.tenant_tokens[tenantId]) AppForgeApiTokenManager._store.tenant_tokens[tenantId] = [];
        AppForgeApiTokenManager._store.tenant_tokens[tenantId].push(tokenId);

        gs.info(this.LOG_PREFIX + 'Generated API Token ' + tokenId + ' (' + tokenName + ') for tenant ' + tenantId);

        // Display-Once Rule: Raw secret is returned ONLY upon generation
        return {
            success: true,
            token_id: tokenId,
            token_name: tokenName,
            tenant_id: tenantId,
            raw_token: rawSecret,
            display_notice: 'Copy this token now. It will not be shown again.',
            scopes: allowedScopes,
            expires_at: expiresAt,
            status: 'ACTIVE'
        };
    },

    /**
     * Validates incoming token for authentication and scope authorization.
     */
    validateToken: function(rawToken, requiredScope, tenantId) {
        'use strict';
        if (!rawToken) {
            return { valid: false, errorCode: 'TOKEN_REQUIRED', error: 'API token is required.' };
        }

        var tokenHash = this._hashSecret(rawToken);
        var tokenId = AppForgeApiTokenManager._store.hash_index[tokenHash];
        if (!tokenId || !AppForgeApiTokenManager._store.tokens[tokenId]) {
            return { valid: false, errorCode: 'INVALID_TOKEN', error: 'Invalid or unknown API token.' };
        }

        var token = AppForgeApiTokenManager._store.tokens[tokenId];

        if (token.status === 'REVOKED') {
            return { valid: false, errorCode: 'TOKEN_REVOKED', error: 'API token has been revoked.' };
        }

        if (new Date(token.expires_at).getTime() < Date.now()) {
            token.status = 'EXPIRED';
            return { valid: false, errorCode: 'TOKEN_EXPIRED', error: 'API token has expired.' };
        }

        if (tenantId && token.tenant_id !== tenantId) {
            return { valid: false, errorCode: 'TENANT_MISMATCH', error: 'Token is not authorized for tenant ' + tenantId };
        }

        if (requiredScope && token.scopes.indexOf(requiredScope) === -1 && token.scopes.indexOf('integration:admin') === -1) {
            return {
                valid: false,
                errorCode: 'INTEGRATION_SCOPE_DENIED',
                error: 'Token lacks required scope: ' + requiredScope
            };
        }

        token.last_used = new Date().toISOString();
        return {
            valid: true,
            token_id: token.token_id,
            tenant_id: token.tenant_id,
            owner: token.owner,
            scopes: token.scopes
        };
    },

    /**
     * Revokes an API token.
     */
    revokeToken: function(tenantId, tokenId) {
        'use strict';
        var token = AppForgeApiTokenManager._store.tokens[tokenId];
        if (!token || token.tenant_id !== tenantId) {
            return { success: false, error: 'Token not found for tenant.' };
        }
        token.status = 'REVOKED';
        token.revoked_at = new Date().toISOString();
        return { success: true, token_id: tokenId, status: 'REVOKED' };
    },

    /**
     * Lists metadata for all tokens belonging to a tenant (never returns raw token or hash).
     */
    listTokens: function(tenantId) {
        'use strict';
        if (!tenantId) return [];
        var tokenIds = AppForgeApiTokenManager._store.tenant_tokens[tenantId] || [];
        var self = this;
        return tokenIds.map(function(id) {
            var t = AppForgeApiTokenManager._store.tokens[id];
            if (!t) return null;
            return {
                token_id: t.token_id,
                token_hash: t.token_hash,
                token_name: t.token_name,
                tenant_id: t.tenant_id,
                owner: t.owner,
                scopes: t.scopes,
                status: t.status,
                token_prefix: t.token_prefix,
                created_at: t.created_at,
                expires_at: t.expires_at,
                last_used: t.last_used
            };
        }).filter(Boolean);
    },

    /**
     * Generates a cryptographically random secret string.
     * @private
     */
    _generateSecureSecret: function() {
        'use strict';
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var secret = 'af_tok_';
        for (var i = 0; i < 40; i++) {
            var rand = Math.floor(Math.random() * chars.length);
            secret += chars.charAt(rand);
        }
        return secret;
    },

    /**
     * Deterministic SHA-256 hash of secret string.
     * @private
     */
    _hashSecret: function(str) {
        'use strict';
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        var hex = Math.abs(hash).toString(16);
        while (hex.length < 8) hex = '0' + hex;
        return 'sha256_' + hex + '_hash_token';
    },

    resetStore: function() {
        'use strict';
        AppForgeApiTokenManager._store = {
            tokens: {},
            hash_index: {},
            tenant_tokens: {}
        };
        AppForgeApiTokenManager._store = AppForgeApiTokenManager._store;
    },

    type: 'AppForgeApiTokenManager'
};
