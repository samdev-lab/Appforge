# AppForge v0.18.0 Migration Plan

## 1. Migration Overview
This plan governs upgrading from AppForge `v0.17.0` (or `v0.16.0`) to `v0.18.0` on instance `dev280961.service-now.com`.

---

## 2. Pre-Migration Checklist
1. **Source of Truth:** Confirm Git branch `sn_instances/dev280961-multitenant` at commit `7872137`.
2. **Environment Locks:** Verify no active deployment mutex locks in `x_appforge_deployment_lock`.
3. **Database Backup:** Create a full declarative tenant snapshot using `AppForgeTenantExportImportEngine`.

---

## 3. Execution Phases
1. **Schema Layer:** Apply `x_appforge_tenant` and `x_appforge_tenant_member` registry schemas.
2. **Script Includes:** Deploy updated Multi-Tenant and Trust Fabric Script Includes.
3. **Public Key Registry:** Verify `x_appforge_public_key` table indexing on `key_id` and `tenant_id`.
4. **Post-Migration Verification:** Execute smoke test suite `scratch/test_real_instance_certification.js`.
