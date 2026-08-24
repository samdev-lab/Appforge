# AppForge Tenant Operations Runbook

## 1. Routine Operational Tasks
1. **Health Verification**: Periodic health and drift checks on tenant schemas.
2. **Quota Monitoring**: Review monthly deployment and storage limits via `AppForgeTenantQuotaEngine`.
3. **Key Lifecycle**: Rotate ECDSA P-256 public keys every 90 days in `x_appforge_public_key`.

---

## 2. Emergency Incident Procedures
1. **Cross-Tenant Access Incident**:
   - Suspend suspicious tenant: `AppForgeTenantRegistryService.updateTenantStatus(tenantId, 'SUSPENDED')`.
   - Invalidate tenant cache: `AppForgeTenantCacheQueueManager`.
   - Inspect immutable audit records in `x_appforge_telemetry`.
2. **Disaster Recovery**:
   - Trigger tenant-specific restore from backup without restarting platform workers or impacting sibling tenants.
