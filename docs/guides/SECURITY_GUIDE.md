# AppForge Security & Compliance Guide

## 1. Security Architecture & Threat Model
AppForge enforces defense-in-depth across 4 critical trust layers:

```text
┌────────────────────────────────────────────────────────┐
│ 1. Least Privilege RBAC & Scoped Separation            │
│ 2. Server-Side Four-Eyes Production Gating             │
│ 3. Cryptographic Packaging & SHA-256 Checksums         │
│ 4. Policy-as-Code & Forbidden Destructive Guards       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Policy-as-Code Baseline (APPFORGE_BASELINE)
AppForge enforces 15 non-negotiable security baselines:
1. `POL-SEC-001`: No raw credential exposure in scripts or payloads.
2. `POL-SEC-002`: Prohibit `eval()` and dynamic code execution.
3. `POL-SEC-003`: Prohibit direct SQL/DDL statements.
4. `POL-SEC-004`: Application scope naming isolation.
5. `POL-SEC-005`: Inbound REST API endpoints require authentication & role authorization.
6. `POL-SEC-006`: Production promotions require Four-Eyes approval separation.
7. `POL-SEC-007`: Mutex locking enforced on active deployment environments.
8. `POL-SEC-008`: Replay and unauthorized version downgrades are blocked.
9. `POL-SEC-009`: Multi-tenant data and schema boundary isolation.
10. `POL-SEC-010`: Zero secrets in telemetry and audit evidence logs.
11. `POL-SEC-011`: Preflight verification mandatory before deployment promotion.
12. `POL-SEC-012`: Reverse-order compensating rollback capability required.
13. `POL-SEC-013`: Schema migrations require pre-migration snapshot markers.
14. `POL-SEC-014`: Time-bounded policy exceptions automatically expire.
15. `POL-SEC-015`: Destructive actions (`DROP_TABLE`, `DELETE_DATA`) permanently blocked (`FORBIDDEN`).

---

## 3. Cryptographic Hardening & Asymmetric Signing Blueprint
* **Current Implementation**: HMAC-SHA256 symmetric package signing within single enterprise.
* **Production Candidate Blueprint**: Asymmetric ECDSA (NIST P-256) / Ed25519 with dedicated Public Key Registry (`x_appforge_public_key`) enabling cross-organization publisher verification without shared secrets.
