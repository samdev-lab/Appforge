# AppForge Deployment & Release Lifecycle

## 1. Overview

AppForge deployment utilizes native ServiceNow Application Repository and Git-based source control promotion across instance environments (Development PDI -> Test -> Staging -> Production).

---

## 2. Release Lifecycle Flow

```text
 ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │   Development   │ ────► │     Testing     │ ────► │   Production    │
 │ (PDI / Git Repo)│       │ (Instance App)  │       │ (App Repo / Git)│
 └─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Development**: All scoped development occurs in the developer's ServiceNow PDI connected to Git branch `main` or `feature/*`.
2. **Commit & Tag**: Upon verification, code is committed to Git and tagged (`v0.1.0`).
3. **App Repository Publish**: In Studio, publish application to instance Application Repository (`Publish to Application Repository`).
4. **Target Instance Installation**: Target instances install updated application via `System Applications > My Company Applications`.

---

## 3. Pre-Deployment Checklist

- [ ] All ATF tests pass clean.
- [ ] No uncommitted changes in ServiceNow Studio.
- [ ] Version updated in application manifest (`sys_app` table) to `0.1.0`.
- [ ] Role hierarchy verified (`x_appforge.admin`, `x_appforge.developer`, `x_appforge.user`).
- [ ] No global application overrides present.
