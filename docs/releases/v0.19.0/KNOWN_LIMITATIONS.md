# AppForge Known Limitations & Operational Considerations — v0.19.0

1. **Large Binary Attachments:** Picture and icon references should reference hosted attachment sys_ids or approved relative paths rather than embedding mega-byte raw base64 data inside JSON strings.
2. **External Non-Reversible Side Effects:** Once an external email notification or third-party outbound REST API call is triggered as part of an active flow, rollback of the catalog definition cannot reverse external delivery.
3. **Synchronous Batching:** Imports exceeding 500+ items should use the default 50-item batch partition to avoid hitting ServiceNow single-transaction timeout limits.
