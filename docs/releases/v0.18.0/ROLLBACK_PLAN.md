# AppForge v0.18.0 Production Rollback Plan

## 1. Rollback Trigger Conditions
Rollback is immediately and automatically triggered if:
* Post-deployment smoke tests fail on target environment.
* Any metadata compilation failure or schema corruption occurs mid-flight.
* Package cryptographic signature mismatch is detected.
* Deployment lock deadlocks or fails to release within timeout threshold.

---

## 2. Reverse-Order Compensating Operations
1. **Acquire Emergency Maintenance Lock:** Block new deployment attempts.
2. **Reverse Metadata Operations:** Execute reverse compensations in strict LIFO order:
   - Remove newly registered Scripted REST operations (`sys_ws_operation`).
   - Remove newly created ACLs (`sys_security_acl`).
   - Remove newly created fields (`sys_dictionary` custom fields).
   - Revert schema alterations to baseline definition snapshot.
3. **Data Considerations:** External runtime data records are preserved; only non-destructive schema additions are rolled back. Destructive `DROP TABLE` operations are strictly forbidden.
4. **Release Deployment Locks:** Call `AppForgeDeploymentLockManager.releaseLock(targetEnv, runId)`.
5. **State Machine Update:** Transition release state to `ROLLBACK_REQUIRED` $\rightarrow$ `ROLLED_BACK`.
6. **Audit Trail Logging:** Emit correlation ID (e.g. `AF-ROLLBACK-2026-000001`) with full incident context.
