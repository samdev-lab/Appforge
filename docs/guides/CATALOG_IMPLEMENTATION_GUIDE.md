# AppForge Catalog Implementation Guide

Covers end-to-end implementation workflows, batching strategies, and idempotency safeguards.

---

## 🔁 Idempotent Import Strategy
* `CREATE`: Item not found in target catalog. Creates `sc_cat_item`, `item_option_new`, and fulfillment flows.
* `UPDATE`: Item exists but checksum differs. Updates fields and variables non-destructively.
* `SKIP`: Item exists and checksum matches. Zero modification made.

---

## 🛡️ Four-Eyes Governance (POL-SEC-006)
Production catalog imports require explicit review by an independent security/platform officer (`sarah.security`). Requesters cannot approve their own catalog deployment.
