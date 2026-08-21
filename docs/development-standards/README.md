# AppForge Development Standards & Naming Conventions

## 1. Naming Conventions

All AppForge artifacts must strictly adhere to the following prefix and naming rules:

| Artifact Type | Scope / Prefix | Naming Rule | Example |
| :--- | :--- | :--- | :--- |
| **Application Name** | — | `AppForge` | `AppForge` |
| **Application Scope** | `x_appforge` / `x_snc_appforge` | Snake case, lowercase | `x_appforge` |
| **Tables** | `x_appforge_` | Snake case, lowercase | `x_appforge_application_registry` |
| **Fields** | `u_` or scope prefix | Snake case, lowercase | `u_app_name`, `u_is_active` |
| **Script Includes** | Scope prefix | PascalCase with prefix | `AppForgeUtil`, `AppForgeMetadataEngine` |
| **Business Rules** | Scope prefix | Descriptive sentence case | `AppForge - Validate Application Key` |
| **Client Scripts** | Scope prefix | Descriptive sentence case | `AppForge - OnChange App Type` |
| **UI Policies** | Scope prefix | Descriptive sentence case | `AppForge - Readonly Mandatory Rules` |
| **ACLs** | Scope prefix | Scope + Table + Operation | `x_appforge_application_registry.read` |
| **Roles** | `x_appforge.` | Dot notation, lowercase | `x_appforge.admin`, `x_appforge.user` |
| **Flows / Subflows** | Scope prefix | Title case with prefix | `AppForge - Provision New Application` |
| **Events** | `x_appforge.` | Dot notation, lowercase | `x_appforge.app.created` |
| **Scripted REST APIs**| Scope prefix | CamelCase / Title Case | `AppForge Application API` |
| **Properties** | `x_appforge.` | Dot notation, lowercase | `x_appforge.engine.logging.verbosity` |
| **Application Modules**| Scope prefix | Title Case | `AppForge Administration` |

---

## 2. Coding Standards for Script Includes

- **Class Definition**: Always use standard ServiceNow Prototype pattern.
- **Strict Mode**: Place `'use strict';` at top of script bodies.
- **JSDoc**: Every method must include JSDoc parameter and return descriptions.
- **Logging**: Use `gs.debug()`, `gs.info()`, `gs.warn()`, `gs.error()` prefixed with `[AppForge]`.
- **Exception Handling**: Use `try...catch` blocks for all external system interactions or database mutations.

### Example Script Include Template

```javascript
var AppForgeMetadataEngine = Class.create();
AppForgeMetadataEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMetadataEngine] ';
    },

    /**
     * Retrieves application definition metadata by key.
     * @param {string} appKey - The unique application key.
     * @return {Object|null} Application metadata object or null if not found.
     */
    getAppMetadata: function(appKey) {
        'use strict';
        if (!appKey) {
            gs.warn(this.LOG_PREFIX + 'getAppMetadata called with empty appKey');
            return null;
        }

        try {
            var gr = new GlideRecordSecure('x_appforge_application_registry');
            gr.addQuery('u_app_key', appKey);
            gr.query();
            if (gr.next()) {
                return {
                    sys_id: gr.getUniqueValue(),
                    name: gr.getValue('u_name'),
                    active: gr.getValue('u_active') == '1'
                };
            }
        } catch (ex) {
            gs.error(this.LOG_PREFIX + 'Error retrieving app metadata: ' + ex.message);
        }
        return null;
    },

    type: 'AppForgeMetadataEngine'
};
```

---

## 3. Global Application Isolation Rules

1. **Zero Global Modifications**: Do not modify global scripts, global business rules, or global dictionary entries.
2. **Cross-Scope Access**: If global resources must be accessed, configure explicit **Cross-Scope Access (sys_scope_privilege)** records with restricted access.
3. **No Direct Table Schema Alterations**: Do not alter core platform tables (`sys_user`, `task`, `cmdb`) directly in core scripts without scope encapsulation.
