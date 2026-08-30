# Single-Page Bulk Catalog Management Guide

**Component:** `Bulk Catalog Manager Workspace`  
**Purpose:** Manage complete ServiceNow Service Catalog implementation from a single unified page.

---

## ⚡ 1-Page Implementation Lifecycle

```text
Customer Scope Selection
        ↓
Excel Template Download & Upload
        ↓
Import Configuration (Items, Variables, Choices, Policies)
        ↓
"After Submit" Fulfillment Designer (☑ Approval, ☑ Task, ☐ Incident, ☐ Change)
        ↓
Validation & Dry-Run Preview
        ↓
Four-Eyes Approval & 1-Click Publish to ServiceNow
```

---

## 📋 "After Submit" Fulfillment Designer

Enables implementation teams to multi-select what records AppForge should orchestrate in native ServiceNow upon catalog item submission:
* **`☑ RITM`:** Standard Service Request Item (`sc_req_item`).
* **`☑ Approval`:** Route approvals to Manager, Requested For Manager, or specific Group.
* **`☑ Catalog Task`:** Create sequential/parallel tasks (`sc_task`) with group assignment.
* **`☐ Incident` / `☐ Problem` / `☐ Change Request`:** Automatically generate standard ITSM workflow items.
* **`☐ Flow Designer`:** Trigger Flow/Subflow execution.
