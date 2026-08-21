# AppForge Testing Strategy & ATF Framework

## 1. Overview

AppForge enforces a multi-level testing strategy combining Automated Test Framework (ATF), manual protocol verification, and Source Control sync verification.

---

## 2. Automated Test Framework (ATF) Baseline

Every AppForge engine and metadata component will have dedicated ATF Test Suites.

### Test Suite Structure
- `AppForge Core Test Suite`
  - `ATF - Security & Role Validation`
  - `ATF - Metadata Engine Initialization`
  - `ATF - Application Scope Isolation`
  - `ATF - REST Endpoint Authentication`

### ATF Guidelines
1. **Isolated Test Execution**: ATF tests must clean up created records post-test execution.
2. **No Production Side-Effects**: Tests must be executed using test impersonations (`x_appforge.user`, `x_appforge.developer`, `x_appforge.admin`).

---

## 3. Bi-Directional Source Control Sync Test Protocol

To satisfy Prompt 001 verification, source control synchronization between ServiceNow PDI and GitHub must be verified in both directions:

### Test Case 1: ServiceNow → GitHub (Push Test)
1. In ServiceNow Studio, create/update an AppForge documentation property or Script Include header.
2. Navigate to **Source Control > Commit Changes**.
3. Provide commit message: `APPFORGE-001: Test commit from ServiceNow to GitHub`.
4. Push to `main` (or active feature branch).
5. **Expected Result**: GitHub repository reflects new commit and updated files within 30 seconds.

### Test Case 2: GitHub → ServiceNow (Pull Test)
1. In GitHub web interface (or local clone), make a non-breaking modification to `docs/architecture/README.md`.
2. Commit directly to `main` branch.
3. In ServiceNow Studio, navigate to **Source Control > Apply Changes**.
4. Confirm stash / apply operation.
5. **Expected Result**: ServiceNow Studio pulls updated files without conflicts and reports "Application successfully updated".

---

## 4. Prompt 001 Validation Matrix

| Test ID | Test Category | Target | Method | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| `TC-APP-01` | Scoped App | Scope Metadata | Studio Inspection | Scope `x_appforge` created and active |
| `TC-GIT-01` | Source Control | Repository | Git Command / GitHub API | Repo `appforge-servicenow` clean on `main` |
| `TC-GIT-02` | Source Control | Sync ServiceNow -> Git | Studio Commit | Push successful |
| `TC-GIT-03` | Source Control | Sync Git -> ServiceNow | Studio Apply Changes | Pull successful |
| `TC-SEC-01` | Security | Role Strategy | sys_user_role | `x_appforge.admin`, `developer`, `user` exist |
| `TC-SEC-02` | Security | Global Isolation | Sys Audit / Scope log | Zero global application changes |
