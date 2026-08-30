# AppForge Governed Decommissioning Guide

Explains the mandatory 5-step governed decommissioning process that eliminates data loss and prevents accidental deletion.

---

## 🛡️ The 5-Step Decommissioning Pipeline

```text
Request Decommission (App Admin)
       ↓
Dependency & Sub-task Validation
       ↓
Four-Eyes Security Approval (sarah.security)
       ↓
Pre-Decommission Backup Snapshot Creation
       ↓
Approved Execution & Audit Certificate (CERT-DECOM-YYYY-NNNN)
```

1. **Self-Approval Blocked:** Requesters are blocked by policy `POL-SEC-006` from approving their own decommission requests.
2. **Pre-Decommission Snapshot:** Captures an immutable snapshot checksum before tables or records are archived.
3. **Data Retention:** Retains archived records for the standard 90-day compliance window.
