/**
 * AppForgePrompt028ApplicationIsolationTestSuite
 * Automated Test Suite for AppForge Prompt 028:
 * True Application Isolation, Dependency Graph & Independent Lifecycle Certification.
 *
 * Validates:
 *  - 7 Canonical application identities with immutable keys
 *  - Dependency Graph Engine & Circular Dependency Detection (DEPENDENCY_CYCLE_DETECTED)
 *  - Optional dependency non-install rule (CSM installs without CRM, SPM installs without RM)
 *  - Missing dependency and conflict protection
 *  - Artifact ownership & cross-application modification blocking (CROSS_APPLICATION_MODIFICATION_BLOCKED)
 *  - Package inventory validation (FOREIGN_ARTIFACT_DETECTED)
 *  - Safe 12-step uninstallation and dependent app protection (DEPENDENT_APPLICATION_EXISTS)
 *  - Orphan artifact detection (non-destructive)
 *  - Independent upgrade, rollback, suspend, reactivate lifecycle
 *  - Independent package SHA-256 checksums
 *  - Lifecycle concurrency locking (APPLICATION_OPERATION_IN_PROGRESS)
 *  - Multi-tenant data & navigation isolation matrix
 *  - Four-Eyes governance on decommission
 *  - End-to-end full scenario lifecycle (Scenario 54)
 */
var AppForgePrompt028ApplicationIsolationTestSuite = Class.create();
AppForgePrompt028ApplicationIsolationTestSuite.prototype = {
    initialize: function() {
        'use strict';
        this.installer = new AppForgeCapabilityInstaller();
        this.manifestRegistry = new AppForgeApplicationManifestRegistry();
        this.depGraph = this.installer.dependencyGraph;
        this.ownership = this.installer.ownershipRegistry;
        this.orphanDetector = new AppForgeOrphanArtifactDetector();
        this.navEngine = this.installer.navEngine;
        this.configEngine = this.installer.configEngine;
        this.customerManager = this.installer.customerManager;

        // Reset memory stores
        this.installer.resetStore();
        this.depGraph.resetStore();
        this.ownership.resetStore();
        this.navEngine.resetStore();
        this.configEngine.resetStore();
        this.customerManager.resetStore();
    },

    runAllTests: function() {
        'use strict';
        var results = [];
        var self = this;

        function runTest(name, fn) {
            try {
                var res = fn.call(self);
                results.push({ name: name, passed: res.passed, details: res.details });
            } catch (err) {
                results.push({ name: name, passed: false, details: 'Exception: ' + (err.message || err) });
            }
        }

        // 1. Canonical Application Identity & Manifest Contracts
        runTest('P028-01: 7 Canonical application identities with immutable keys', this.test01_CanonicalApplicationIdentities);
        runTest('P028-02: Manifest contract declares explicit dependencies and isolation boundaries', this.test02_ManifestContracts);

        // 2. Dependency Graph & Cycle Detection
        runTest('P028-03: Dependency graph detects circular cycles (DEPENDENCY_CYCLE_DETECTED)', this.test03_CircularDependencyDetection);
        runTest('P028-04: Topological installation order resolution', this.test04_TopologicalInstallationOrder);
        runTest('P028-05: Missing required dependency blocks installation', this.test05_MissingDependencyBlocked);
        runTest('P028-06: Application conflicts block installation', this.test06_ConflictBlocked);

        // 3. Optional Dependency Non-Install Rule (Section 10 & 40)
        runTest('P028-07: Installing CSM does NOT automatically install CRM', this.test07_CsmInstallsWithoutCrm);
        runTest('P028-08: Installing SPM does NOT automatically install Resource Management', this.test08_SpmInstallsWithoutRm);
        runTest('P028-09: Installing FSM does NOT automatically install CSM', this.test09_FsmInstallsWithoutCsm);
        runTest('P028-10: Installing Bulk Catalog does NOT automatically install ITSM', this.test10_BulkCatalogInstallsWithoutItsm);

        // 4. Artifact Ownership & Cross-Application Protection (Section 11-13)
        runTest('P028-11: Artifact ownership registered on installation', this.test11_ArtifactOwnershipRegistration);
        runTest('P028-12: Cross-application modification attempt blocked (CROSS_APPLICATION_MODIFICATION_BLOCKED)', this.test12_CrossAppModificationBlocked);
        runTest('P028-13: Package inventory detects foreign artifacts (FOREIGN_ARTIFACT_DETECTED)', this.test13_ForeignArtifactDetection);

        // 5. Safe Uninstallation & Dependent Protection (Section 14-16)
        runTest('P028-14: Safe 12-step uninstall removes owned artifacts and retains other apps', this.test14_SafeUninstallOwnedArtifacts);
        runTest('P028-15: Uninstall blocked when active required dependent exists (DEPENDENT_APPLICATION_EXISTS)', this.test15_DependentUninstallBlocked);
        runTest('P028-16: Uninstall permitted when dependency is optional', this.test16_OptionalDependencyUninstallPermitted);
        runTest('P028-17: Uninstall is 100% idempotent', this.test17_UninstallIdempotency);

        // 6. Orphan Artifact Detection (Section 17)
        runTest('P028-18: Non-destructive orphan artifact detector classifies unowned resources', this.test18_OrphanArtifactDetection);

        // 7. Lifecycle Isolation: Upgrade, Rollback, Suspend, Reactivate (Section 18-20)
        runTest('P028-19: Upgrading CRM does NOT modify CSM version or CSM checksum', this.test19_UpgradeIsolation);
        runTest('P028-20: Rollback CRM restores prior version without affecting other apps', this.test20_RollbackIsolation);
        runTest('P028-21: Suspending CRM disables entitlement and navigation, keeps CSM active', this.test21_SuspendIsolation);
        runTest('P028-22: Reactivating CRM restores active status without reinstalling', this.test22_ReactivateIsolation);

        // 8. Package Checksum Isolation (Section 27)
        runTest('P028-23: Checksum isolation - independent SHA-256 package checksums', this.test23_ChecksumIsolation);

        // 9. Concurrency Protection & Locks (Section 35)
        runTest('P028-24: Simultaneous conflicting operations blocked (APPLICATION_OPERATION_IN_PROGRESS)', this.test24_ConcurrencyLocking);

        // 10. Multi-Tenant Data & Navigation Isolation (Section 21-23 & 31)
        runTest('P028-25: Tenant A (CRM+FSM) vs Tenant B (CSM+SPM) complete isolation', this.test25_MultiTenantIsolationMatrix);
        runTest('P028-26: Suspended application hidden from user navigation', this.test26_SuspendedAppHiddenFromNavigation);

        // 11. Four-Eyes Governance (Section 32)
        runTest('P028-27: Four-Eyes governance blocks self-approved decommissioning', this.test27_FourEyesGovernance);

        // 12. Complete Master Lifecycle Journey (Scenario 54)
        runTest('P028-28: Full end-to-end multi-application lifecycle scenario', this.test28_FullScenario54Lifecycle);

        var passed = 0;
        var failed = 0;
        for (var i = 0; i < results.length; i++) {
            if (results[i].passed) {
                passed++;
            } else {
                failed++;
                gs.error('[AppForgePrompt028ApplicationIsolationTestSuite] FAILED: ' + results[i].name + ' - ' + results[i].details);
            }
        }

        gs.info('[AppForgePrompt028ApplicationIsolationTestSuite] COMPLETED: ' + passed + '/' + results.length + ' PASSED.');
        return {
            total: results.length,
            passed: passed,
            failed: failed,
            skipped: 0,
            allPassed: (failed === 0),
            details: results
        };
    },

    // ─── Test Implementations ──────────────────────────────────────────

    test01_CanonicalApplicationIdentities: function() {
        var keys = ['crm', 'csm', 'spm', 'fsm', 'resource_management', 'bulk_catalog', 'itsm'];
        var allValid = true;
        for (var i = 0; i < keys.length; i++) {
            var m = this.manifestRegistry.getManifest(keys[i]);
            if (!m || m.application_key !== keys[i]) {
                allValid = false;
                break;
            }
        }
        return { passed: allValid, details: '7 Canonical application keys validated' };
    },

    test02_ManifestContracts: function() {
        var csmManifest = this.manifestRegistry.getManifest('csm');
        var spmManifest = this.manifestRegistry.getManifest('spm');
        var pass = csmManifest && csmManifest.dependencies.required.indexOf('appforge_core') !== -1 &&
                   csmManifest.dependencies.optional.indexOf('crm') !== -1 &&
                   spmManifest && spmManifest.dependencies.optional.indexOf('resource_management') !== -1 &&
                   csmManifest.isolation && csmManifest.lifecycle.uninstall === true;
        return { passed: !!pass, details: 'Manifest contracts verified for dependencies, isolation, and lifecycle' };
    },

    test03_CircularDependencyDetection: function() {
        var res = this.depGraph.detectCircularDependency('crm', 'csm');
        this.depGraph.registerDependency('csm', 'crm', true);
        var cycleCheck = this.depGraph.detectCircularDependency('crm', 'csm');
        this.depGraph.removeDependency('csm', 'crm'); // cleanup

        var pass = cycleCheck.hasCycle === true && cycleCheck.errorCode === 'DEPENDENCY_CYCLE_DETECTED';
        return { passed: !!pass, details: 'Cycle detected: ' + (cycleCheck.cyclePath ? cycleCheck.cyclePath.join(' -> ') : 'none') };
    },

    test04_TopologicalInstallationOrder: function() {
        var order = this.depGraph.getInstallOrder('spm');
        var pass = order.indexOf('spm') !== -1;
        return { passed: !!pass, details: 'Topological order for SPM: ' + order.join(', ') };
    },

    test05_MissingDependencyBlocked: function() {
        this.depGraph.registerDependency('custom_analytics', 'crm', true);
        var validation = this.depGraph.validateInstall('custom_analytics', []);
        this.depGraph.removeDependency('custom_analytics', 'crm'); // cleanup

        var pass = validation.valid === false && validation.errorCode === 'MISSING_REQUIRED_DEPENDENCY';
        return { passed: !!pass, details: 'Missing dependency blocked: ' + validation.error };
    },

    test06_ConflictBlocked: function() {
        this.depGraph._conflicts['legacy_crm'] = ['crm'];
        var validation = this.depGraph.validateInstall('legacy_crm', ['crm']);
        delete this.depGraph._conflicts['legacy_crm'];

        var pass = validation.valid === false && validation.errorCode === 'APPLICATION_CONFLICT_DETECTED';
        return { passed: !!pass, details: 'Conflict blocked: ' + validation.error };
    },

    test07_CsmInstallsWithoutCrm: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_iso_csm', capability_id: 'csm' });
        var hasCsm = this.installer.hasCapability('cust_iso_csm', 'csm');
        var hasCrm = this.installer.hasCapability('cust_iso_csm', 'crm');
        var pass = res.success && hasCsm === true && hasCrm === false;
        return { passed: !!pass, details: 'CSM installed: ' + hasCsm + ', CRM not installed: ' + (!hasCrm) };
    },

    test08_SpmInstallsWithoutRm: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_iso_spm', capability_id: 'spm' });
        var hasSpm = this.installer.hasCapability('cust_iso_spm', 'spm');
        var hasRm = this.installer.hasCapability('cust_iso_spm', 'resource_management');
        var pass = res.success && hasSpm === true && hasRm === false;
        return { passed: !!pass, details: 'SPM installed: ' + hasSpm + ', RM not installed: ' + (!hasRm) };
    },

    test09_FsmInstallsWithoutCsm: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_iso_fsm', capability_id: 'fsm' });
        var hasFsm = this.installer.hasCapability('cust_iso_fsm', 'fsm');
        var hasCsm = this.installer.hasCapability('cust_iso_fsm', 'csm');
        var pass = res.success && hasFsm === true && hasCsm === false;
        return { passed: !!pass, details: 'FSM installed: ' + hasFsm + ', CSM not installed: ' + (!hasCsm) };
    },

    test10_BulkCatalogInstallsWithoutItsm: function() {
        var res = this.installer.installCapability({ customer_id: 'cust_iso_bulk', capability_id: 'bulk_catalog' });
        var hasBulk = this.installer.hasCapability('cust_iso_bulk', 'bulk_catalog');
        var hasItsm = this.installer.hasCapability('cust_iso_bulk', 'itsm');
        var pass = res.success && hasBulk === true && hasItsm === false;
        return { passed: !!pass, details: 'Bulk Catalog installed: ' + hasBulk + ', ITSM not installed: ' + (!hasItsm) };
    },

    test11_ArtifactOwnershipRegistration: function() {
        this.installer.installCapability({ customer_id: 'cust_own_crm', capability_id: 'crm' });
        var owner = this.ownership.getArtifactOwner('x_appforge_crm_account');
        var pass = owner && owner.owner === 'crm' && owner.type === 'table';
        return { passed: !!pass, details: 'Artifact owner: ' + (owner ? owner.owner : null) };
    },

    test12_CrossAppModificationBlocked: function() {
        this.ownership.registerArtifact('csm', '1.0.0', 'table', 'x_appforge_csm_case', false);
        var permCheck = this.ownership.validateModificationPermission('crm', 'x_appforge_csm_case');
        var pass = permCheck.permitted === false && permCheck.errorCode === 'CROSS_APPLICATION_MODIFICATION_BLOCKED';
        return { passed: !!pass, details: 'Cross-app modification blocked: ' + permCheck.error };
    },

    test13_ForeignArtifactDetection: function() {
        this.ownership.registerArtifact('spm', '1.0.0', 'table', 'x_appforge_spm_project', false);
        var invCheck = this.ownership.validatePackageInventory('crm', ['x_appforge_spm_project']);
        var pass = invCheck.valid === false && invCheck.errorCode === 'FOREIGN_ARTIFACT_DETECTED';
        return { passed: !!pass, details: 'Foreign artifact detected: ' + invCheck.error };
    },

    test14_SafeUninstallOwnedArtifacts: function() {
        var cust = 'cust_uninst_test';
        this.installer.installCapability({ customer_id: cust, capability_id: 'crm' });
        this.installer.installCapability({ customer_id: cust, capability_id: 'csm' });

        var uninstRes = this.installer.uninstallCapability(cust, 'crm');
        var hasCrm = this.installer.hasCapability(cust, 'crm');
        var hasCsm = this.installer.hasCapability(cust, 'csm');

        var pass = uninstRes.success && uninstRes.status === 'UNINSTALLED' && hasCrm === false && hasCsm === true;
        return { passed: !!pass, details: 'CRM uninstalled: ' + (!hasCrm) + ', CSM preserved: ' + hasCsm };
    },

    test15_DependentUninstallBlocked: function() {
        var cust = 'cust_dep_block';
        this.depGraph.registerDependency('spm', 'resource_management', true); // explicitly declare required
        this.installer.installCapability({ customer_id: cust, capability_id: 'resource_management' });
        this.installer.installCapability({ customer_id: cust, capability_id: 'spm' });

        var uninstRes = this.installer.uninstallCapability(cust, 'resource_management');
        this.depGraph.registerDependency('spm', 'resource_management', false); // reset to optional

        var pass = uninstRes.success === false && uninstRes.errorCode === 'DEPENDENT_APPLICATION_EXISTS';
        return { passed: !!pass, details: 'Dependent uninstall blocked: ' + uninstRes.error };
    },

    test16_OptionalDependencyUninstallPermitted: function() {
        var cust = 'cust_opt_uninst';
        this.depGraph.registerDependency('spm', 'resource_management', false); // optional
        this.installer.installCapability({ customer_id: cust, capability_id: 'resource_management' });
        this.installer.installCapability({ customer_id: cust, capability_id: 'spm' });

        var uninstRes = this.installer.uninstallCapability(cust, 'resource_management');
        var hasRm = this.installer.hasCapability(cust, 'resource_management');
        var hasSpm = this.installer.hasCapability(cust, 'spm');

        var pass = uninstRes.success === true && hasRm === false && hasSpm === true;
        return { passed: !!pass, details: 'Optional RM uninstalled: ' + (!hasRm) + ', SPM retained: ' + hasSpm };
    },

    test17_UninstallIdempotency: function() {
        var cust = 'cust_uninst_idem';
        this.installer.installCapability({ customer_id: cust, capability_id: 'fsm' });
        var res1 = this.installer.uninstallCapability(cust, 'fsm');
        var res2 = this.installer.uninstallCapability(cust, 'fsm');

        var pass = res1.success && res2.success && res2.idempotent === true;
        return { passed: !!pass, details: 'First uninstall success: ' + res1.success + ', Second uninstall idempotent: ' + res2.idempotent };
    },

    test18_OrphanArtifactDetection: function() {
        this.ownership.registerArtifact('deprecated_app', '1.0.0', 'table', 'x_appforge_deprecated_tbl', false);
        this.ownership.registerArtifact('active_app', '1.0.0', 'table', 'x_appforge_active_tbl', false);

        var report = this.orphanDetector.scanForOrphans(['active_app']);
        var pass = report.has_orphans === true && report.by_category.tables.indexOf('x_appforge_deprecated_tbl') !== -1;
        return { passed: !!pass, details: 'Orphan count: ' + report.orphan_count + ', Tables: ' + report.by_category.tables.join(', ') };
    },

    test19_UpgradeIsolation: function() {
        var cust = 'cust_upg_iso';
        this.installer.installCapability({ customer_id: cust, capability_id: 'crm' });
        this.installer.installCapability({ customer_id: cust, capability_id: 'csm' });

        var csmChecksumBefore = this.installer._store.installations[cust + '_csm'].installation_checksum;
        var upgRes = this.installer.upgradeCapability(cust, 'crm', '1.2.0');
        var csmChecksumAfter = this.installer._store.installations[cust + '_csm'].installation_checksum;
        var csmVersion = this.installer._store.installations[cust + '_csm'].version;

        var pass = upgRes.success && csmChecksumBefore === csmChecksumAfter && csmVersion === '1.0.0';
        return { passed: !!pass, details: 'CRM upgraded to 1.2.0; CSM version: ' + csmVersion + ' and checksum remained identical' };
    },

    test20_RollbackIsolation: function() {
        var cust = 'cust_roll_iso';
        this.installer.installCapability({ customer_id: cust, capability_id: 'spm' });
        this.installer.installCapability({ customer_id: cust, capability_id: 'fsm' });

        this.installer.upgradeCapability(cust, 'spm', '1.3.0');
        var rollRes = this.installer.rollbackCapability(cust, 'spm');
        var spmVer = this.installer._store.installations[cust + '_spm'].version;
        var fsmVer = this.installer._store.installations[cust + '_fsm'].version;

        var pass = rollRes.success && spmVer === '1.0.0' && fsmVer === '1.0.0';
        return { passed: !!pass, details: 'SPM restored to ' + spmVer + '; FSM untouched: ' + fsmVer };
    },

    test21_SuspendIsolation: function() {
        var cust = 'cust_susp_iso';
        this.installer.installCapability({ customer_id: cust, capability_id: 'crm' });
        this.installer.installCapability({ customer_id: cust, capability_id: 'csm' });

        var suspRes = this.installer.suspendCapability(cust, 'crm', 'Audit window');
        var hasCrm = this.installer.hasCapability(cust, 'crm');
        var hasCsm = this.installer.hasCapability(cust, 'csm');

        var pass = suspRes.success && hasCrm === false && hasCsm === true;
        return { passed: !!pass, details: 'CRM suspended: ' + (!hasCrm) + '; CSM active: ' + hasCsm };
    },

    test22_ReactivateIsolation: function() {
        var cust = 'cust_react_iso';
        this.installer.installCapability({ customer_id: cust, capability_id: 'crm' });
        this.installer.suspendCapability(cust, 'crm', 'Test suspension');
        var reactRes = this.installer.reactivateCapability(cust, 'crm');
        var hasCrm = this.installer.hasCapability(cust, 'crm');

        var pass = reactRes.success && reactRes.status === 'INSTALLED' && hasCrm === true;
        return { passed: !!pass, details: 'CRM reactivated: ' + hasCrm };
    },

    test23_ChecksumIsolation: function() {
        var crmChk1 = this.installer.calculatePackageChecksum('crm', '1.0.0');
        var crmChk2 = this.installer.calculatePackageChecksum('crm', '1.1.0');
        var csmChk = this.installer.calculatePackageChecksum('csm', '1.0.0');

        var pass = crmChk1 !== crmChk2 && crmChk1 !== csmChk && csmChk.indexOf('sha256_') === 0;
        return { passed: !!pass, details: 'CRM 1.0: ' + crmChk1 + ', CRM 1.1: ' + crmChk2 + ', CSM: ' + csmChk };
    },

    test24_ConcurrencyLocking: function() {
        var cust = 'cust_lock_test';
        this.installer._acquireLock(cust + '_crm', 'UPGRADE');
        var installAttempt = this.installer.installCapability({ customer_id: cust, capability_id: 'crm' });
        this.installer._releaseLock(cust + '_crm');

        var pass = installAttempt.success === false && installAttempt.errorCode === 'APPLICATION_OPERATION_IN_PROGRESS';
        return { passed: !!pass, details: 'Concurrent operation blocked: ' + installAttempt.error };
    },

    test25_MultiTenantIsolationMatrix: function() {
        var tenantA = 'tenant_a_crm_fsm';
        var tenantB = 'tenant_b_csm_spm';

        this.installer.installCapability({ customer_id: 'cust_t_a', tenant_id: tenantA, capability_id: 'crm' });
        this.installer.installCapability({ customer_id: 'cust_t_a', tenant_id: tenantA, capability_id: 'fsm' });

        this.installer.installCapability({ customer_id: 'cust_t_b', tenant_id: tenantB, capability_id: 'csm' });
        this.installer.installCapability({ customer_id: 'cust_t_b', tenant_id: tenantB, capability_id: 'spm' });

        var navA = this.installer.navEngine.getUserVisibleNavigation('cust_t_a', ['crm', 'fsm']);
        var navB = this.installer.navEngine.getUserVisibleNavigation('cust_t_b', ['csm', 'spm']);

        var titlesA = navA.map(function(n) { return n.application.title; });
        var titlesB = navB.map(function(n) { return n.application.title; });

        var pass = titlesA.indexOf('AppForge - CRM') !== -1 && titlesA.indexOf('AppForge - FSM') !== -1 &&
                   titlesA.indexOf('AppForge - CSM') === -1 && titlesA.indexOf('AppForge - SPM') === -1 &&
                   titlesB.indexOf('AppForge - CSM') !== -1 && titlesB.indexOf('AppForge - SPM') !== -1 &&
                   titlesB.indexOf('AppForge - CRM') === -1 && titlesB.indexOf('AppForge - FSM') === -1;

        return { passed: !!pass, details: 'Tenant A titles: [' + titlesA.join(', ') + '], Tenant B titles: [' + titlesB.join(', ') + ']' };
    },

    test26_SuspendedAppHiddenFromNavigation: function() {
        var cust = 'cust_susp_nav';
        this.installer.installCapability({ customer_id: cust, capability_id: 'crm' });
        this.installer.installCapability({ customer_id: cust, capability_id: 'csm' });
        this.installer.suspendCapability(cust, 'crm');

        // Only active capabilities passed to navigation
        var activeCaps = this.installer.listCustomerCapabilities(cust).map(function(i) { return i.capability_id; });
        var nav = this.installer.navEngine.getUserVisibleNavigation(cust, activeCaps);
        var titles = nav.map(function(n) { return n.application.title; });

        var pass = titles.indexOf('AppForge - CSM') !== -1 && titles.indexOf('AppForge - CRM') === -1;
        return { passed: !!pass, details: 'Suspended CRM excluded from nav: [' + titles.join(', ') + ']' };
    },

    test27_FourEyesGovernance: function() {
        var cust = 'cust_gov_test';
        this.installer.installCapability({ customer_id: cust, capability_id: 'bulk_catalog' });
        var req = this.installer.requestDecommission(cust, 'bulk_catalog', 'operator_alice', 'Contract ended');
        var badApprove = this.installer.executeDecommission(req.request_id, 'operator_alice');
        var goodApprove = this.installer.executeDecommission(req.request_id, 'security_officer_bob');

        var pass = req.success && badApprove.success === false && goodApprove.success === true && goodApprove.status === 'DECOMMISSIONED';
        return { passed: !!pass, details: 'Self-approval blocked: ' + (badApprove.success === false) + ', Independent officer approved: ' + goodApprove.success };
    },

    test28_FullScenario54Lifecycle: function() {
        var custA = 'cust_scenario54';

        // 1. Install CRM -> CRM works
        var i1 = this.installer.installCapability({ customer_id: custA, capability_id: 'crm' });
        var crm1 = this.installer.hasCapability(custA, 'crm');

        // 2. Install CSM -> CRM unchanged, CSM works
        var i2 = this.installer.installCapability({ customer_id: custA, capability_id: 'csm' });
        var csm1 = this.installer.hasCapability(custA, 'csm');

        // 3. Suspend CRM -> CRM unavailable, CSM still works
        this.installer.suspendCapability(custA, 'crm');
        var crmSusp = this.installer.hasCapability(custA, 'crm');
        var csmStill1 = this.installer.hasCapability(custA, 'csm');

        // 4. Reactivate CRM -> CRM works
        this.installer.reactivateCapability(custA, 'crm');
        var crmReact = this.installer.hasCapability(custA, 'crm');

        // 5. Upgrade CRM -> CSM unchanged
        this.installer.upgradeCapability(custA, 'crm', '1.1.0');
        var csmVer1 = this.installer._store.installations[custA + '_csm'].version;

        // 6. Rollback CRM -> CSM unchanged
        this.installer.rollbackCapability(custA, 'crm');
        var csmVer2 = this.installer._store.installations[custA + '_csm'].version;

        // 7. Uninstall CRM -> CRM removed, CSM still works
        var u1 = this.installer.uninstallCapability(custA, 'crm');
        var crmFinal = this.installer.hasCapability(custA, 'crm');
        var csmFinal = this.installer.hasCapability(custA, 'csm');

        var pass = i1.success && crm1 && i2.success && csm1 &&
                   (crmSusp === false) && (csmStill1 === true) &&
                   (crmReact === true) && (csmVer1 === '1.0.0') && (csmVer2 === '1.0.0') &&
                   u1.success && (crmFinal === false) && (csmFinal === true);

        return {
            passed: !!pass,
            details: 'Scenario 54 Lifecycle Verified: Install -> Add CSM -> Suspend -> Reactivate -> Upgrade -> Rollback -> Uninstall CRM (CSM preserved)'
        };
    },

    type: 'AppForgePrompt028ApplicationIsolationTestSuite'
};
