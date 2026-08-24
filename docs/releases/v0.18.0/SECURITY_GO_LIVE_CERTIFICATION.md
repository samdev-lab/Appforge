# AppForge Security Go-Live Certification

**Audit Scope:** Production Release Candidate v0.18.0  
**Certified Commit:** `180f7ae`  
**Security Gate Result:** **16 / 16 Controls PASSED (100% Green)**  

---

## 1. 16-Point DevSecOps Security Gate

1. **Authentication:** Validated via ServiceNow platform sessions and OAuth/Basic tokens.
2. **Authorization:** Scoped role checks on all Scripted REST operations.
3. **RBAC Hierarchy:** Strict enforcement across admin, developer, deployer, governance manager, viewer, and super-admin.
4. **Four-Eyes Separation:** Enforced for production deployment, tenant deletion, and policy exceptions.
5. **Tenant Isolation:** Row-level filtering and context enforcement on all 32 tables.
6. **IDOR Protection:** Header tampering blocked; server-side authenticated session is source of truth.
7. **Package Cryptography:** Asymmetric ECDSA (NIST P-256) / SHA-256 with public key registry lookup.
8. **Tamper Detection:** Invalidation of tampered manifests prior to deployment planning.
9. **Secret Redaction:** Automatic sanitization to `[REDACTED_SECRET]` in logs and telemetry.
10. **Script Security Scanner:** Static AST-level inspection of business rules and workflows.
11. **`eval()` Blocking:** Strict policy violation on dynamic code evaluation.
12. **Raw SQL Blocking:** Enforced use of parameterized `GlideRecordSecure` queries.
13. **Anti-Destructive DDL:** Destructive operations (`DROP TABLE`, `DELETE DATA`) rejected with `FORBIDDEN`.
14. **Downgrade Protection:** Rejection of version regression attempts (`DOWNGRADE_BLOCKED`).
15. **Replay Protection:** Unique nonce and timestamp validation on all package deployments.
16. **API Idempotency:** Delivery ID caching and duplicate request deduplication.
