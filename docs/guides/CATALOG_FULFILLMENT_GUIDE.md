# AppForge Catalog Fulfillment Guide

Details multi-stage fulfillment logic orchestration using native ServiceNow tables and Flow Designer.

---

## ⚡ Supported Fulfillment Actions

1. **`RITM`:** Initiates native Service Request Item record (`sc_req_item`).
2. **`APPROVAL`:** Creates `sysapproval_approver` records mapped to managers or security groups.
3. **`TASK`:** Sequential and parallel Catalog Tasks (`sc_task`) with group assignment.
4. **`INCIDENT` / `PROBLEM` / `CHANGE`:** Automatically triggers standard ITSM workflows upon request submission.
5. **`FLOW` / `SUBFLOW`:** Invokes native Flow Designer flows via correlation ID.
