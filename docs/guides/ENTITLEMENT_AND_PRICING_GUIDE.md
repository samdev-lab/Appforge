# AppForge Entitlement & Pricing Foundation

Explains commercial licensing models, subscription tracking, and tenant entitlement validation.

---

## 💳 Supported Pricing Models

1. **`FREE`:** Unrestricted access for open platform utilities.
2. **`TRIAL`:** Time-boxed 14-day or 30-day evaluation.
3. **`SUBSCRIPTION`:** Recurring monthly/annual billing (e.g. $499/mo).
4. **`PER_USER`:** License allocated per active application user seat.
5. **`ENTERPRISE`:** Unlimited tenant-wide entitlement with SLA support.

---

## 🔒 Entitlement Enforcement
AppForge checks entitlements server-side prior to application compilation. If a tenant is not licensed, installation is rejected with a clear explanation:
> *"Installation Blocked: Subscription or entitlement required for template [template_id]."*
