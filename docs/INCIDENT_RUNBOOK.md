# AppForge Incident & Problem Management Runbook

## 1. Incident Classification
- SEV1: Platform-wide critical outage (Response target: 15 min, Resolution target: 2 hours)
- SEV2: Major application degradation (Response target: 30 min, Resolution target: 4 hours)
- SEV3: Limited customer impact (Response target: 2 hours, Resolution target: 24 hours)
- SEV4: Minor inquiry or cosmetic issue

## 2. Four-Eyes Change Governance
All production changes strictly enforce REQUESTER != APPROVER separation of duties. Emergency changes are pre-authorized with immediate immutable audit logging.
