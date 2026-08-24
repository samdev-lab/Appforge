# AppForge v0.18.0 Known Limitations & Operational Guidelines

## 1. High-Volume Migration Window (> 500k records)
* **Limitation:** Executing single-thread migrations exceeding 500,000 records in a single synchronous transaction can exceed ServiceNow HTTP request timeout thresholds (60 seconds).
* **Operational Guideline:** Always execute high-volume migrations using `AppForgeMigrationBatchProcessor` in chunk sizes of 500 records via asynchronous scheduled jobs or worker pools.

---

## 2. HSM Hardware Security Module Enclave
* **Limitation:** In the default standalone developer configuration, `AppForgeKeyProvider` operates in `LOCAL` enclave mode.
* **Operational Guideline:** Enterprise production instances must configure `ENTERPRISE_KMS` or `HSM` endpoint references in system properties before provisioning live production signing keys.

---

## 3. Legacy HMAC Compatibility
* **Limitation:** HMAC-SHA256 symmetric packages require pre-shared keys and are not recommended for external marketplace distribution.
* **Operational Guideline:** All new packages must be signed with ECDSA (NIST P-256) via `AppForgeAsymmetricSigner`.
