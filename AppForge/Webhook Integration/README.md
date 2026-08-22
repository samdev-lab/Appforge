# AppForge Documentation — GitHub Webhook Integration

See primary documentation in [docs/webhook-integration/README.md](../../docs/webhook-integration/README.md).

## Webhook Endpoint
- `POST /api/x_appforge/github/webhook`
- HMAC-SHA256 verification (`X-Hub-Signature-256`)
- Mandatory Idempotency (`X-GitHub-Delivery`)
