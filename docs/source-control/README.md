# AppForge Source Control Integration & Git Workflow

## 1. Overview

AppForge uses **GitHub** as its remote version control, code collaboration, and backup platform. ServiceNow Studio is the single source of truth for generated application metadata XML artifacts.

---

## 2. GitHub Repository Specifications

- **Repository Name**: `samdev-lab/Appforge.git` (`https://github.com/samdev-lab/Appforge.git`)
- **Default Baseline Branch**: `main`
- **Access Protocol**: HTTPS / SSH (using Personal Access Token with `repo` scope)

---

## 3. Branching Strategy

AppForge follows a modified GitFlow branching model:

```text
 main ─────────────●──────────────────────● (v0.1.0 Tag)
                   │                      ▲
                   └───► feature/001-init ┘
```

- **`main`**: Protected production baseline branch. Only merged via tested releases or approved pull requests.
- **`feature/<feature-name>`**: Short-lived branches for developing individual features or engine components.
- **`release/vX.Y.Z`**: Stabilization branches prior to tagging production releases.
- **`hotfix/<fix-name>`**: Urgent patches off `main`.

---

## 4. Git Commit Conventions

All commit messages must follow Conventional Commits format with ticket reference:

`APPFORGE-<PROMPT_ID>: <Short summary description>`

### Examples:
- `APPFORGE-001: Initialize AppForge ServiceNow platform`
- `APPFORGE-002: Create Application Registry table metadata`
- `APPFORGE-003: Fix security policy evaluation logic in Script Include`

---

## 5. Versioning & Tagging Strategy

- **Semantic Versioning**: `MAJOR.MINOR.PATCH` format (e.g. `v0.1.0`).
- **Git Tags**: Every stable phase completion must create an annotated Git tag on `main`:
  ```bash
  git tag -a v0.1.0 -m "Release v0.1.0 - Engineering Foundation & ServiceNow Source Control Baseline"
  git push origin v0.1.0
  ```

---

## 6. Development Workflow

1. **Step 1**: In ServiceNow Studio, switch to scope `AppForge`.
2. **Step 2**: Pull latest changes from `main` branch before starting work (**Source Control > Apply Changes**).
3. **Step 3**: Make scoped application modifications in Studio.
4. **Step 4**: Commit changes from Studio (**Source Control > Commit Changes**) with compliant commit message.
5. **Step 5**: Tag version upon phase approval.

---

## 7. Rollback & Stash Strategy

- **Local Changes Stashing**: If ServiceNow Studio requires pulling remote changes with local uncommitted work, use **Source Control > Stash Local Changes**.
- **Version Rollback**: If a commit breaks instance functionality, use ServiceNow Studio **Source Control > Switch Branch** to move to previous tagged commit `v0.1.0` or previous release branch.
