# AppForge Production Deployment Runbook

**Document Version:** 1.0.0  
**Target Platform:** AppForge v0.18.0  
**Target ServiceNow Instance:** `dev280961.service-now.com` (WashingtonDC)  
**Applicable Scope:** `x_appforge`  

---

## 1. Overview & Principles
This runbook defines the mandatory operational procedures for promoting AppForge releases from `DEV` $\rightarrow$ `TEST` $\rightarrow$ `PROD`.

### Key Governance Rules
1. **Zero Package Rebuild:** The exact same signed package and checksum must be promoted across all environments:
   $$\text{checksum}(\text{DEV}) == \text{checksum}(\text{TEST}) == \text{checksum}(\text{PROD})$$
2. **Four-Eyes Separation of Duties:** Requester cannot approve their own release ($\text{requester} \neq \text{approver}$).
3. **Pre-Deployment Mutex Locking:** Exclusive environment locks prevent concurrent writes.
4. **Automated Verification:** Post-deployment smoke tests must execute immediately after promotion.

---

## 2. Pre-Deployment Checklist

- [ ] **Release State Verification:** Ensure release status is `TEST_VALIDATED` or `PRODUCTION_APPROVED` in `AppForgeReleaseStateMachine`.
- [ ] **Cryptographic Verification:** Verify package signature using `AppForgeAsymmetricSigner.verifyPackage()`.
- [ ] **Environment Lock Check:** Confirm target environment (`PROD`) has no active deployment locks.
- [ ] **Database Migration Plan:** Review affected tables and record counts if schema changes are present.
- [ ] **Rollback Plan Readiness:** Confirm `AppForgeDeploymentRollback` operations are generated and tested in `TEST`.
- [ ] **Four-Eyes Sign-Off:** Confirm explicit production approval by authorized platform lead.

---

## 3. Production Promotion Procedure

```bash
# 1. Acquire Production Mutex Lock and Deploy
# Executed via AppForgeServiceNowDeploymentAdapter
adapter.deploy('PROD', signedPackage, 'prod_run_001', 'prod_deployer');

# 2. Monitor Deployment Execution & Smoke Tests
# Validates Schema, Forms, Business Rules, ACLs, REST Endpoints

# 3. Transition Release State
stateMachine.transitionState('v0.18.0', 'PRODUCTION_DEPLOYED', 'prod_deployer');
stateMachine.transitionState('v0.18.0', 'PRODUCTION_VERIFIED', 'sre_lead');
```

---

## 4. Emergency Deployment Procedure (Hotfix)

In critical production outages, the Emergency Deployment Protocol may be invoked:
1. **Emergency Authorization:** Authorized by Platform Admin with designated emergency flag (`isEmergency: true`).
2. **Audit Logging:** System automatically flags `requires_retrospective_audit: true`.
3. **Non-Negotiable Controls:** Package signature, tenant isolation, and anti-destructive DDL guards (`DROP_TABLE` blocking) remain **STRICTLY ENFORCED**.
4. **Mandatory Retrospective:** Post-incident review and retroactive Four-Eyes sign-off required within 24 hours.

---

## 5. Post-Deployment Verification & Handover
- Check `PRODUCTION_HEALTHY` telemetry signal.
- Verify zero orphan records or active dangling locks.
- Publish release certificate to platform operations dashboard.
