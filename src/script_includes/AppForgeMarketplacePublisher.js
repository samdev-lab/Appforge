/**
 * AppForgeMarketplacePublisher
 * Coordinates multi-stage application publishing workflows into the Marketplace Catalog
 * enforcing Four-Eyes approval separation (requested_by != approved_by) and security scans.
 */
var AppForgeMarketplacePublisher = Class.create();
AppForgeMarketplacePublisher.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMarketplacePublisher] ';
        this.securityAnalyzer = new AppForgeMarketplaceSecurityAnalyzer();
        this.compatibilityChecker = new AppForgePackageCompatibilityChecker();
        this._publishedApps = {};
    },

    /**
     * Submits an application for marketplace publishing.
     * @param {Object} appDef - Marketplace app descriptor.
     * @param {Object} packageManifest - Package manifest.
     * @param {string} requestedBy - Publisher user ID.
     * @return {Object} Submission result.
     */
    submitForPublish: function(appDef, packageManifest, requestedBy) {
        'use strict';
        if (!appDef || !appDef.name || !appDef.publisher) {
            return { success: false, status: 'INVALID', error: 'Missing application name or publisher' };
        }

        // 1. Security Scan
        var secScan = this.securityAnalyzer.analyzePackage(packageManifest);
        if (!secScan.passed) {
            return {
                success: false,
                status: 'REJECTED_SECURITY',
                error: 'Security scan failed (' + secScan.max_severity + ')',
                findings: secScan.findings
            };
        }

        // 2. Compatibility Check
        var compCheck = this.compatibilityChecker.checkCompatibility(packageManifest, 'TEST');
        if (!compCheck.compatible) {
            return {
                success: false,
                status: 'INCOMPATIBLE',
                error: 'Platform compatibility check failed',
                details: compCheck.errors
            };
        }

        var appId = appDef.marketplace_app_id || ('mkt_' + appDef.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

        this._publishedApps[appId] = {
            marketplace_app_id: appId,
            name: appDef.name,
            publisher: appDef.publisher,
            version: appDef.version || '1.0.0',
            latest_version: appDef.version || '1.0.0',
            status: 'SUBMITTED',
            requested_by: requestedBy || 'publisher_user',
            visibility: appDef.visibility || 'PUBLIC',
            license_type: appDef.license_type || 'FREE',
            package_manifest: packageManifest
        };

        gs.info(this.LOG_PREFIX + 'Application ' + appId + ' submitted for marketplace review.');
        return { success: true, status: 'SUBMITTED', marketplace_app_id: appId };
    },

    /**
     * Approves and publishes an application with Four-Eyes principle enforcement.
     * @param {string} marketplaceAppId - Marketplace application ID.
     * @param {string} approvedBy - Approver user ID.
     * @return {Object} Approval result.
     */
    approvePublish: function(marketplaceAppId, approvedBy) {
        'use strict';
        var app = this._publishedApps[marketplaceAppId];
        if (!app) {
            return { success: false, status: 'NOT_FOUND', error: 'Marketplace application not found: ' + marketplaceAppId };
        }

        // Four-Eyes Principle: Requester cannot approve their own application
        if (app.requested_by === approvedBy) {
            gs.warn(this.LOG_PREFIX + 'Self-approval blocked for ' + marketplaceAppId);
            return {
                success: false,
                status: 'BLOCKED',
                error: 'SEPARATION_OF_DUTIES_VIOLATION: Requester (' + app.requested_by + ') cannot approve their own application.'
            };
        }

        app.status = 'PUBLISHED';
        app.approved_by = approvedBy;
        app.published_on = new GlideDateTime().getValue();

        gs.info(this.LOG_PREFIX + 'Application ' + marketplaceAppId + ' published successfully by ' + approvedBy);
        return { success: true, status: 'PUBLISHED', marketplace_app: app };
    },

    type: 'AppForgeMarketplacePublisher'
};
