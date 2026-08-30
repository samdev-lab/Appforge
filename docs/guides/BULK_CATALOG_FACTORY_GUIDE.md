# AppForge Bulk Catalog Factory Guide

**Release:** v0.19.0  
**Target Audience:** AppForge Implementation Team & ServiceNow Platform Leads  

---

## 🚀 Overview

The **Bulk Catalog Factory** enables implementation teams to create, validate, and deploy hundreds of ServiceNow Catalog Items from a standardized 7-sheet Excel workbook in minutes.

```text
Upload Excel ──> Validate ──> Preview ──> Four-Eyes Gate ──> Batch Processing ──> Service Catalog
```

---

## 📊 Standardized 7-Sheet Excel Format

1. **`Sheet 1 - Catalog Items`:** `external_id`, `catalog_item_name`, `short_description`, `description`, `catalog`, `category`, `price`, `active`, `picture`, `icon`.
2. **`Sheet 2 - Variables`:** `catalog_external_id`, `variable_external_id`, `name`, `question`, `type`, `order`, `mandatory`, `default_value`.
3. **`Sheet 3 - Choices`:** `catalog_external_id`, `variable_external_id`, `choice_external_id`, `label`, `value`, `order`.
4. **`Sheet 4 - Variable Sets`:** `catalog_external_id`, `variable_set_external_id`, `name`, `title`, `description`.
5. **`Sheet 5 - UI Policies`:** `catalog_external_id`, `policy_external_id`, `name`, `condition`, `reverse_if_false`.
6. **`Sheet 6 - UI Policy Actions`:** `policy_external_id`, `variable_external_id`, `visible`, `mandatory`, `disabled`.
7. **`Sheet 7 - Fulfillment`:** `catalog_external_id`, `action_type` (RITM, TASK, INCIDENT, PROBLEM, CHANGE, APPROVAL), `assignment_group`, `approval_required`.
