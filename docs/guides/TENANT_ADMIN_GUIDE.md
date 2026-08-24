# AppForge Tenant Administrator Guide

## 1. Role Scope & Responsibilities
A Tenant Administrator (`TENANT_ADMIN`) manages applications, users, roles, environments, policies, and keys within a single tenant boundary.

> [!IMPORTANT]
> `TENANT_ADMIN` cannot access or mutate resources outside their assigned tenant and cannot escalate privileges to `PLATFORM_ADMIN`.

---

## 2. Managing Applications & Schemas
- Declarative application creation and visual studio editing are automatically scoped to your `tenant_id`.
- Public keys for package signing are registered in `x_appforge_public_key` with tenant scoping.

---

## 3. Promoting Deployments
- Deployment mutex locks are scoped per environment (`tenant_id:environment`).
- Deployments require Four-Eyes approval if configured in your tenant's governance policies.

---

## 4. Managing User Memberships
- Invite and manage users in `x_appforge_tenant_member`.
- Roles assignable: `TENANT_DEVELOPER`, `TENANT_RELEASE_MANAGER`, `TENANT_SECURITY_APPROVER`, `TENANT_VIEWER`.
