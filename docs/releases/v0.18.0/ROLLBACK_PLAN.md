# AppForge v0.18.0 Rollback Plan

## 1. Rollback Trigger Conditions
Rollback is immediately triggered if:
* Post-deployment smoke tests fail on target instance.
* Any cross-tenant data leakage is detected.
* Deployment lock deadlocks or fails to release within timeout window (30 minutes).

---

## 2. Reverse-Order Compensating Rollback Steps
1. **Acquire Emergency Lock:** Block new incoming deployment promotions.
2. **Reverse Script Includes:** Revert Script Includes to certified baseline commit `da9833b` (`v0.17.0`).
3. **Revert Active Locks:** Call `AppForgeDeploymentLockManager.releaseLock(env, runId)`.
4. **Restore Snapshots:** Restore metadata state from pre-deployment snapshot.
5. **Verify State Consistency:** Run `AppForgeResilienceFailureEngine` validation asserting 0 orphan metadata records.
