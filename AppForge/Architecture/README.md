# AppForge Documentation — Architecture

See primary documentation in [docs/architecture/README.md](../../docs/architecture/README.md).

## Core Target Architecture
AppForge is designed as a native Application Factory inside ServiceNow.

```text
                         APPFORGE
                            │
                            ▼
                 ┌─────────────────────┐
                 │ AppForge Experience │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   AppForge Core     │
                 │                     │
                 │ Application Factory │
                 │ Metadata Engine     │
                 │ Security Engine     │
                 │ UI Engine           │
                 │ Automation Engine   │
                 │ Integration Engine  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ ServiceNow Platform │
                 │                     │
                 │ Tables              │
                 │ Glide               │
                 │ ACL                 │
                 │ Flow Designer       │
                 │ APIs                │
                 │ Events              │
                 │ ATF                 │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ AppForge Foundation │
                 └─────────────────────┘

                            │
                            ▼

                    ┌───────────────┐
                    │    GitHub     │
                    │ Source Control│
                    └───────────────┘
```
