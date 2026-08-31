/**
 * AppForgeCustomerOnboardingService
 * Guided Customer SaaS Onboarding, Checklist Governance & Progress Engine.
 *
 * Implements:
 *   - Onboarding Model (x_appforge_onboarding) & Task Model (x_appforge_onboarding_task)
 *   - Mandatory & Optional Task Progression (Mandatory tasks cannot be skipped)
 *   - Deterministic Server-Side Progress Calculation (0% -> 100%)
 *   - Full Multi-Tenant Provisioning (Org, Admin, Subscriptions, Checklist)
 */
var AppForgeCustomerOnboardingService = Class.create();
AppForgeCustomerOnboardingService.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeCustomerOnboardingService] ';
        this.customerService = new AppForgeCommercialCustomerService();
        this.trialManager = new AppForgeTrialManager();
        this.renewalEngine = new AppForgeSubscriptionRenewalEngine();
        this.installer = new AppForgeCapabilityInstaller();
        this.auditService = new AppForgeAuditService();

        if (!AppForgeCustomerOnboardingService._store) {
            AppForgeCustomerOnboardingService._store = {
                onboardings: {}, // number -> onboarding record
                tasks: {} // onboardingNumber -> array of task objects
            };
        }
        this._store = AppForgeCustomerOnboardingService._store;
    },

    /**
     * Initializes guided customer onboarding.
     */
    startOnboarding: function(opts) {
        'use strict';
        var o = opts || {};
        var orgName = o.organization_name || 'New Organization';
        var adminEmail = o.admin_email || 'admin@customer.com';
        var tenantId = o.tenant_id || ('tenant_' + Date.now().toString(36));
        var apps = o.applications || ['crm'];
        var isTrial = (o.trial !== false);

        var onbNumber = 'ONB-' + Math.floor(100000 + Math.random() * 900000);

        // Provision Customer Account
        var cust = this.customerService.createCustomer({
            customer_id: tenantId,
            name: orgName,
            tenant_id: tenantId,
            billing_email: adminEmail
        });
        this.customerService.addUserToCustomer(tenantId, adminEmail, 'CUSTOMER_ADMIN', true);

        // Provision Trial or Subscription
        var trialStatus = 'NONE';
        var subStatus = 'NONE';
        if (isTrial) {
            for (var i = 0; i < apps.length; i++) {
                this.trialManager.startTrial(tenantId, apps[i]);
            }
            trialStatus = 'TRIAL_ACTIVE';
        } else {
            this.renewalEngine.createSubscription(tenantId, 'ENTERPRISE_PLAN', apps);
            subStatus = 'ACTIVE';
        }

        var defaultTasks = [
            { name: 'Create Organization', category: 'SETUP', mandatory: true, status: 'COMPLETED' },
            { name: 'Verify Administrator', category: 'IDENTITY', mandatory: true, status: 'COMPLETED' },
            { name: 'Select Applications', category: 'COMMERCIAL', mandatory: true, status: 'COMPLETED' },
            { name: 'Start Evaluation / Subscribe', category: 'COMMERCIAL', mandatory: true, status: 'COMPLETED' },
            { name: 'Install Application', category: 'INSTALLATION', mandatory: true, status: 'PENDING' },
            { name: 'Configure Application', category: 'CONFIGURATION', mandatory: true, status: 'PENDING' },
            { name: 'Invite Users', category: 'IDENTITY', mandatory: false, status: 'PENDING' },
            { name: 'Create First Business Record', category: 'WORKFLOW', mandatory: true, status: 'PENDING' },
            { name: 'Execute First Business Workflow', category: 'WORKFLOW', mandatory: true, status: 'PENDING' },
            { name: 'Configure Third-Party Integration', category: 'INTEGRATION', mandatory: false, status: 'PENDING' },
            { name: 'Review Operational Dashboard', category: 'OBSERVABILITY', mandatory: true, status: 'PENDING' }
        ];

        var onbRec = {
            number: onbNumber,
            tenant: tenantId,
            organization: orgName,
            primary_admin: adminEmail,
            status: 'IN_PROGRESS', // NOT_STARTED, IN_PROGRESS, BLOCKED, COMPLETED, ABANDONED
            started_at: new Date().toISOString(),
            completed_at: null,
            current_step: 'Install Application',
            progress_percentage: 36, // 4 out of 11 completed
            trial_status: trialStatus,
            subscription_status: subStatus,
            last_activity: new Date().toISOString(),
            selected_apps: apps
        };

        AppForgeCustomerOnboardingService._store.onboardings[onbNumber] = onbRec;
        AppForgeCustomerOnboardingService._store.tasks[onbNumber] = defaultTasks;

        this.auditService.logEvent('CUSTOMER_ONBOARDING_STARTED', 'ONBOARDING', adminEmail, onbNumber, 'SUCCESS', 'Onboarding started for ' + orgName);
        return { success: true, onboarding: onbRec, tasks: defaultTasks };
    },

    /**
     * Completes a task in the onboarding checklist and recalculates server-side progress.
     */
    completeTask: function(onboardingNumber, taskName) {
        'use strict';
        var tasks = AppForgeCustomerOnboardingService._store.tasks[onboardingNumber];
        if (!tasks) return { success: false, error: 'Onboarding tasks not found.' };

        var taskFound = false;
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].name.toLowerCase() === taskName.toLowerCase()) {
                tasks[i].status = 'COMPLETED';
                taskFound = true;
                break;
            }
        }

        if (!taskFound) return { success: false, error: 'Task not found: ' + taskName };

        return this._recalculateProgress(onboardingNumber);
    },

    /**
     * Skips an optional task (mandatory tasks cannot be skipped).
     */
    skipTask: function(onboardingNumber, taskName) {
        'use strict';
        var tasks = AppForgeCustomerOnboardingService._store.tasks[onboardingNumber];
        if (!tasks) return { success: false, error: 'Onboarding tasks not found.' };

        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].name.toLowerCase() === taskName.toLowerCase()) {
                if (tasks[i].mandatory) {
                    return {
                        success: false,
                        errorCode: 'MANDATORY_TASK_CANNOT_BE_SKIPPED',
                        error: 'Task ' + taskName + ' is mandatory for pilot compliance and cannot be skipped.'
                    };
                }
                tasks[i].status = 'SKIPPED';
                return this._recalculateProgress(onboardingNumber);
            }
        }

        return { success: false, error: 'Task not found.' };
    },

    _recalculateProgress: function(onboardingNumber) {
        'use strict';
        var onb = AppForgeCustomerOnboardingService._store.onboardings[onboardingNumber];
        var tasks = AppForgeCustomerOnboardingService._store.tasks[onboardingNumber];

        var completedOrSkipped = 0;
        var nextPending = null;

        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].status === 'COMPLETED' || tasks[i].status === 'SKIPPED') {
                completedOrSkipped++;
            } else if (!nextPending) {
                nextPending = tasks[i].name;
            }
        }

        var pct = Math.round((completedOrSkipped / tasks.length) * 100);
        onb.progress_percentage = pct;
        onb.last_activity = new Date().toISOString();

        if (pct >= 100) {
            onb.status = 'COMPLETED';
            onb.completed_at = new Date().toISOString();
            onb.current_step = 'Onboarding Complete';
            this.auditService.logEvent('CUSTOMER_ONBOARDING_COMPLETED', 'ONBOARDING', onb.primary_admin, onboardingNumber, 'SUCCESS', 'Onboarding completed (100%) for ' + onb.organization);
        } else {
            onb.current_step = nextPending || 'Finish';
        }

        return { success: true, onboarding: onb, progress_percentage: pct };
    },

    getOnboarding: function(onboardingNumber) {
        'use strict';
        var onb = AppForgeCustomerOnboardingService._store.onboardings[onboardingNumber];
        var tasks = AppForgeCustomerOnboardingService._store.tasks[onboardingNumber] || [];
        return onb ? { onboarding: onb, tasks: tasks } : null;
    },

    getOnboardingByTenant: function(tenantId) {
        'use strict';
        for (var k in AppForgeCustomerOnboardingService._store.onboardings) {
            var o = AppForgeCustomerOnboardingService._store.onboardings[k];
            if (o.tenant === tenantId) {
                return { onboarding: o, tasks: AppForgeCustomerOnboardingService._store.tasks[o.number] || [] };
            }
        }
        return null;
    },

    resetStore: function() {
        'use strict';
        AppForgeCustomerOnboardingService._store = {
            onboardings: {},
            tasks: {}
        };
        this._store = AppForgeCustomerOnboardingService._store;
    },

    type: 'AppForgeCustomerOnboardingService'
};
