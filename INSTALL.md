# AppForge Installation Guide

AppForge provides a completely automated installation experience for ServiceNow.

---

## 🛠️ Prerequisites
1. A ServiceNow instance (Vancouver, Washington DC, Xanadu, or later).
2. Admin credentials or OAuth token for the target instance.
3. Node.js v18+ on your local deployment machine.

---

## 🚀 One-Click Automated Installation

Run the installer CLI directly from the root of the repository:

```bash
./scripts/install
```

### Optional Command-Line Arguments:
```bash
./scripts/install --instance https://yourinstance.service-now.com --user admin --password "your_password"
```

The installer will automatically execute the 6-stage setup pipeline:
1. **Connectivity Check:** Validates REST endpoint access.
2. **Scope Verification:** Confirms `x_1805046_app_fo_0` scoped privileges.
3. **Database Provisioning:** Physical tables and dictionary columns.
4. **UI Page Deployment:** Installs the Light Mode Studio Workspace.
5. **Navigation Binding:** Registers the left-navigation menu under `App-forge`.
6. **Health Verification:** Runs smoke tests and generates `APPFORGE_INSTALLATION_CERTIFICATE.json`.

---

## 📋 Manual Installation via Update Set (Alternative)

If you prefer installing via the native ServiceNow interface:
1. Log into your ServiceNow instance as `admin`.
2. Navigate to: **System Update Sets > Retrieved Update Sets**.
3. Click **Import Update Set from XML**.
4. Choose [`AppForge_v0.18.0_Complete_Update_Set.xml`](file:///Users/shamshadali/Documents/Shamshad/ServiceNow%20Tools/AppForge/AppForge_v0.18.0_Complete_Update_Set.xml).
5. Preview and **Commit Update Set**.

---

## 🩺 Post-Install Health Check

Run the preflight health check anytime to verify your installation:

```bash
./scripts/validate
```
