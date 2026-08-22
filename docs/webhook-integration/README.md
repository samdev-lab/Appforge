# AppForge GitHub → ServiceNow Webhook Integration

## 1. Overview & Event Flow

AppForge provides a production-grade, secure, metadata-driven, and idempotent **GitHub → ServiceNow Webhook Integration**. It allows ServiceNow to receive GitHub repository events, HMAC-verify them, persist them for auditing, process them idempotently, and prepare the foundation for future deployment automation.

```text
 ┌──────────────────┐
 │  GitHub Webhook  │
 └────────┬─────────┘
          │ HTTP POST /api/x_appforge/github/webhook
          ▼
 ┌────────────────────────────────────────────────────────┐
 │            AppForgeGitHubWebhookAPI                    │
 │  (Scripted REST Resource Controller)                   │
 └────────┬───────────────────────────────────────────────┘
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │            AppForgeWebhookSecurity                     │
 │  • Reads X-Hub-Signature-256 header                     │
 │  • Validates HMAC-SHA256 signature using               │
 │    x_appforge.github.webhook_secret                    │
 │  • Performs constant-time comparison                   │
 └────────┬───────────────────────────────────────────────┘
          │ (Valid Signature)
          ▼
 ┌────────────────────────────────────────────────────────┐
 │            AppForgeGitHubWebhookService                │
 │  • Extracts X-GitHub-Delivery header                   │
 │  • Enforces Idempotency (Prevents duplicate processing)│
 │  • Persists event record (Status: RECEIVED)            │
 └────────┬───────────────────────────────────────────────┘
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │            AppForgeGitEventService                     │
 │  • Maps repository (x_appforge_repository)             │
 │  • Updates status to PROCESSING                        │
 │  • Routes to dedicated event processors                │
 └────────┬───────────────────────────────────────────────┘
          │
          ├──► PushProcessor            (Event: push)
          ├──► PullRequestProcessor     (Event: pull_request)
          ├──► ReviewProcessor          (Event: pull_request_review)
          └──► WorkflowProcessor        (Event: workflow_run)
          │
          ▼
 ┌────────────────────────────────────────────────────────┐
 │            x_appforge_git_event Audit Record           │
 │  • Status: PROCESSED / UNMAPPED / IGNORED / FAILED     │
 └────────────────────────────────────────────────────────┘
```

---

## 2. API Endpoint Specification

- **Method**: `POST`
- **Path**: `/api/x_appforge/github/webhook`
- **Scope**: `x_appforge`
- **Required Headers**:
  - `X-Hub-Signature-256`: `sha256=<hmac_hex_hash>`
  - `X-GitHub-Event`: `push` | `pull_request` | `pull_request_review` | `workflow_run`
  - `X-GitHub-Delivery`: `<unique_delivery_guid>`
  - `Content-Type`: `application/json`

### HTTP Status Code Responses

| HTTP Code | Description | Condition |
| :--- | :--- | :--- |
| `200 OK` | Event Ingested & Processed | Signature valid, event persisted and processed (or idempotent duplicate skip). |
| `400 Bad Request` | Malformed Request | Missing delivery header, missing event header, or invalid JSON payload. |
| `401 Unauthorized` | Invalid / Missing Signature | `X-Hub-Signature-256` missing or HMAC-SHA256 signature mismatch. |
| `500 Server Error` | Processing Exception | Internal database or script exception (sanitized in response). |

---

## 3. Security & HMAC Verification

1. **HMAC-SHA256 Algorithm**: The signature is computed over the raw HTTP request body using HMAC-SHA256.
2. **Secret Storage**: Webhook secret is stored in private system property `x_appforge.github.webhook_secret`.
3. **Zero Secret Logging**: Webhook secrets, authorization headers, and access tokens are strictly excluded from ServiceNow log outputs (`gs.info`/`gs.error`).
4. **Timing Attack Protection**: Constant-time string comparison (`AppForgeWebhookSecurity.prototype.timingSafeEqual`) is used to prevent timing side-channel attacks.

---

## 4. Idempotency Enforcement

GitHub may retry webhook deliveries due to network latency. AppForge enforces idempotency by treating `X-GitHub-Delivery` as a unique key:
1. Upon receiving a request, `AppForgeGitHubWebhookService` checks `x_appforge_git_event` for `delivery_id`.
2. If a record already exists for the `delivery_id`, the system immediately returns an idempotent `200 OK` response without re-processing business logic or creating duplicate records.

---

## 5. Data Model Tables

### `x_appforge_git_event` (Audit & Persistence)
- `delivery_id` (Unique, Indexed)
- `event_type` (`push`, `pull_request`, `pull_request_review`, `workflow_run`)
- `repository_name`
- `commit_sha`
- `pull_request_number`
- `status` (`RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`, `IGNORED`, `UNMAPPED`)
- `received_at`, `processed_at`

### `x_appforge_repository` (Repository Mapping)
- `repository_id` (Unique Key)
- `repository_name` (e.g. `samdev-lab/Appforge`)
- `application` (Reference to AppForge Scoped App)
- `active` (Boolean)
