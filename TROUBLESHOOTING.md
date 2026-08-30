# AppForge Troubleshooting & FAQ

Clear, actionable solutions for common operational and deployment scenarios.

---

## ❓ Common Issues & Solutions

### 1. "Someone else changed this application."
* **Cause:** A simultaneous modification was made by another developer.
* **Solution:** Click **Refresh** to load the latest verified revision and re-apply your change.

### 2. "This package was modified after signing. Deployment blocked."
* **Cause:** Schema drift or manual XML tampering was detected.
* **Solution:** Open the application in AppForge and click **Re-validate & Sign** to generate a new cryptographic signature with authorized Four-Eyes approval.

### 3. "Another deployment is currently running in this environment."
* **Cause:** An active deployment lock is in progress to prevent race conditions.
* **Solution:** Wait 30 seconds for the current release to complete, then click **Deploy**.

### 4. "Application Menu 'App-forge' is not visible in Navigator."
* **Cause:** Browser cache or missing navigator refresh.
* **Solution:** Press **Cmd+R** (or **F5**) to refresh your browser. In the filter navigator, type `App-forge`.

---

## 🩺 Need Diagnostic Help?
Run the full automated diagnostic test suite anytime:

```bash
./scripts/validate
```
