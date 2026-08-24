# AppForge Operations & Incident Runbook

## 1. Incident Handling Procedures

### Scenario A: Failed Deployment
* **Symptom**: Deployment pipeline halts with status `FAILED` or `PREFLIGHT_BLOCKED`.
* **Action**:
  1. Inspect the correlation ID (`AF-DEP-YYYY-NNNNNN`) in **AppForge Studio > Audit Log**.
  2. If failure occurred mid-execution, `AppForgeDeploymentRollback` automatically triggers compensating reverse-order cleanup.
  3. Verify `x_appforge_deployment_lock` has been released.
  4. Correct schema or approval conflicts before re-initiating promotion.

---

### Scenario B: Stuck Deployment Lock
* **Symptom**: New deployment attempt returns `DEPLOYMENT_LOCKED`.
* **Action**:
  1. Check `x_appforge_deployment_lock` for active lock record.
  2. Verify whether a long-running batch migration is actively processing in background scheduler.
  3. If previous run was terminated abnormally, an administrator can execute:
     `new AppForgeDeploymentLockManager().releaseLock(envId, runId);`

---

### Scenario C: High-Volume Data Migration Checkpoints
* **Symptom**: Large migration (500k+ records) interrupted by instance node restart.
* **Action**:
  1. Review state marker in `x_appforge_migration_marker`.
  2. Call `processBatches()` with the same `migrationId`.
  3. The engine automatically resumes execution from the latest persisted batch checkpoint.

---

### Scenario D: Disaster Recovery & Runtime Metadata Rebuild
* **Symptom**: Total loss of runtime application metadata or accidental table corruption.
* **Action**:
  1. Locate the latest declarative application JSON definition from Git or `x_appforge_application_definition`.
  2. Invoke `AppForgeFactoryExecutor.execute(definition, 'admin')`.
  3. Reconstructs all 5 layers deterministically in under 2 minutes (RTO < 2 min, RPO = 0).
