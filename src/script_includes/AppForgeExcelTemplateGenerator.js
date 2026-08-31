/**
 * AppForgeExcelTemplateGenerator
 * Generates standardized Sample and Blank Excel workbooks (7 sheets, CSV, XML, JSON)
 * for Bulk Catalog Manager imports.
 *
 * Supported Sheets:
 *  1. catalog_items
 *  2. variables
 *  3. choices
 *  4. variable_sets
 *  5. ui_policies
 *  6. ui_policy_actions
 *  7. fulfillment / post_submit_actions
 */
var AppForgeExcelTemplateGenerator = Class.create();
AppForgeExcelTemplateGenerator.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeExcelTemplateGenerator] ';
    },

    /**
     * Generates a fully populated Sample Workbook containing example catalog items,
     * variables, choices, variable sets, and post-submit actions.
     * @return {Object} Structured workbook object with 7 sheets.
     */
    generateSampleWorkbook: function() {
        'use strict';
        return {
            template_name: 'AppForge_Bulk_Catalog_Sample_Template',
            version: '1.0.0',
            schema_version: 'BC-001',
            release_compatibility: 'WashingtonDC',
            sheets: [
                'catalog_items',
                'variables',
                'choices',
                'ui_policies',
                'assignment',
                'after_submit',
                'attachments'
            ],
            catalog_items: [
                {
                    name: 'Developer Laptop Request',
                    short_description: 'High performance MacBook Pro / ThinkPad for engineering staff',
                    description: 'Standard development machine with 32GB RAM, 1TB SSD, and developer toolchain pre-installed.',
                    category: 'Hardware',
                    catalog: 'Service Catalog',
                    active: true,
                    price: 2499.00,
                    currency: 'USD',
                    delivery_time: '3 Days',
                    fulfillment_type: 'Flow Designer',
                    owner: 'Hardware Asset Management',
                    assignment_group: 'Service Desk',
                    assigned_to: 'John Developer',
                    flow: 'AppForge Multi-Stage Fulfillment'
                },
                {
                    name: 'Cloud Sandbox Environment',
                    short_description: 'Self-service AWS/Azure isolated sandbox for R&D projects',
                    description: 'Provision an ephemeral sandbox cloud tenant with budget capping and automated teardown after 30 days.',
                    category: 'Cloud Services',
                    catalog: 'Technical Catalog',
                    active: true,
                    price: 150.00,
                    currency: 'USD',
                    delivery_time: '1 Hour',
                    fulfillment_type: 'Automated Orchestration',
                    owner: 'Cloud Operations Team',
                    assignment_group: 'Cloud Platform Engineering',
                    assigned_to: 'Cloud Auto-Provisioner',
                    flow: 'AppForge Cloud Provisioning Flow'
                },
                {
                    name: 'Enterprise Software License',
                    short_description: 'Request commercial software license (Figma, JetBrains, Copilot)',
                    description: 'Request enterprise seat for productivity software with manager approval.',
                    category: 'Software',
                    catalog: 'Software Catalog',
                    active: true,
                    price: 49.00,
                    currency: 'USD',
                    delivery_time: '1 Day',
                    fulfillment_type: 'Approval & Provision',
                    owner: 'IT Procurement',
                    assignment_group: 'Software Asset Management',
                    assigned_to: 'License Manager',
                    flow: 'AppForge License Approval Flow'
                }
            ],
            variables: [
                {
                    catalog_item: 'Developer Laptop Request',
                    name: 'device_model',
                    label: 'Device Model',
                    type: 'choice',
                    mandatory: true,
                    default_value: 'macbook_pro_16',
                    help_text: 'Select your preferred developer operating system and form factor.',
                    order: 100
                },
                {
                    catalog_item: 'Developer Laptop Request',
                    name: 'ram_size',
                    label: 'RAM Size',
                    type: 'choice',
                    mandatory: true,
                    default_value: '32gb',
                    help_text: 'Standard is 32GB. 64GB requires director approval.',
                    order: 200
                },
                {
                    catalog_item: 'Developer Laptop Request',
                    name: 'business_justification',
                    label: 'Business Justification',
                    type: 'multi_line_text',
                    mandatory: true,
                    default_value: '',
                    help_text: 'Please describe the engineering project requiring this hardware.',
                    order: 300
                },
                {
                    catalog_item: 'Cloud Sandbox Environment',
                    name: 'cloud_provider',
                    label: 'Cloud Provider',
                    type: 'choice',
                    mandatory: true,
                    default_value: 'aws',
                    help_text: 'Select AWS or Azure.',
                    order: 100
                },
                {
                    catalog_item: 'Cloud Sandbox Environment',
                    name: 'cost_center',
                    label: 'Cost Center',
                    type: 'string',
                    mandatory: true,
                    default_value: 'CC-ENG-9042',
                    help_text: 'Engineering budget code for monthly billing chargeback.',
                    order: 200
                }
            ],
            choices: [
                {
                    variable_name: 'device_model',
                    label: 'Apple MacBook Pro 16" (M3 Max / 64GB)',
                    value: 'macbook_pro_16',
                    order: 10
                },
                {
                    variable_name: 'device_model',
                    label: 'Lenovo ThinkPad P1 Gen 6 (i9 / 64GB / Ubuntu)',
                    value: 'thinkpad_p1_ubuntu',
                    order: 20
                },
                {
                    variable_name: 'ram_size',
                    label: '32 GB Unified Memory',
                    value: '32gb',
                    order: 10
                },
                {
                    variable_name: 'ram_size',
                    label: '64 GB Unified Memory (+ Director Approval)',
                    value: '64gb',
                    order: 20
                },
                {
                    variable_name: 'cloud_provider',
                    label: 'Amazon Web Services (AWS)',
                    value: 'aws',
                    order: 10
                },
                {
                    variable_name: 'cloud_provider',
                    label: 'Microsoft Azure',
                    value: 'azure',
                    order: 20
                }
            ],
            variable_sets: [
                {
                    name: 'Standard Hardware Delivery Address',
                    internal_name: 'std_hw_delivery_addr',
                    catalog_items: ['Developer Laptop Request'],
                    order: 500
                }
            ],
            ui_policies: [
                {
                    catalog_item: 'Developer Laptop Request',
                    name: 'Require Justification for 64GB RAM',
                    short_description: 'Require Justification for 64GB RAM',
                    conditions: 'ram_size=64gb',
                    active: true,
                    order: 100
                }
            ],
            ui_policy_actions: [
                {
                    policy_name: 'Require Justification for 64GB RAM',
                    variable_name: 'business_justification',
                    mandatory: true,
                    visible: true,
                    disabled: false
                }
            ],
            assignment: [
                {
                    catalog_item: 'Developer Laptop Request',
                    assignment_group: 'Service Desk',
                    assigned_to: 'John Developer'
                },
                {
                    catalog_item: 'Cloud Sandbox Environment',
                    assignment_group: 'Cloud Platform Engineering',
                    assigned_to: 'Cloud Auto-Provisioner'
                }
            ],
            after_submit: [
                {
                    catalog_item: 'Developer Laptop Request',
                    sequence: 10,
                    action_type: 'Approval',
                    approval_type: 'Manager',
                    approval_group: 'Engineering Management',
                    approval_user: '',
                    priority: '2 - High',
                    description: 'Direct Manager Approval required for developer hardware request'
                },
                {
                    catalog_item: 'Developer Laptop Request',
                    sequence: 20,
                    action_type: 'Task',
                    assignment_group: 'IT Asset Provisioning',
                    assigned_to: '',
                    priority: '3 - Moderate',
                    description: 'Stage device image, tag asset barcode, and prepare courier delivery package'
                },
                {
                    catalog_item: 'Cloud Sandbox Environment',
                    sequence: 10,
                    action_type: 'Flow',
                    assignment_group: 'Cloud Platform Engineering',
                    assigned_to: '',
                    priority: '2 - High',
                    description: 'Automated terraform execution for cloud sandbox creation'
                }
            ],
            fulfillment: [
                {
                    catalog_item: 'Developer Laptop Request',
                    sequence: 10,
                    action_type: 'APPROVAL',
                    approval_type: 'Manager',
                    approval_group: 'Engineering Management',
                    approval_user: '',
                    priority: '2 - High',
                    description: 'Direct Manager Approval required for developer hardware request'
                },
                {
                    catalog_item: 'Developer Laptop Request',
                    sequence: 20,
                    action_type: 'TASK',
                    assignment_group: 'IT Asset Provisioning',
                    assigned_to: '',
                    priority: '3 - Moderate',
                    description: 'Stage device image, tag asset barcode, and prepare courier delivery package'
                },
                {
                    catalog_item: 'Cloud Sandbox Environment',
                    sequence: 10,
                    action_type: 'APPROVAL',
                    approval_type: 'Group',
                    approval_group: 'Cloud Architecture Reviewers',
                    approval_user: '',
                    priority: '2 - High',
                    description: 'Cloud team architecture review'
                },
                {
                    catalog_item: 'Cloud Sandbox Environment',
                    sequence: 20,
                    action_type: 'TASK',
                    assignment_group: 'Cloud Platform Engineering',
                    assigned_to: '',
                    priority: '2 - High',
                    description: 'Automated terraform execution for cloud sandbox creation'
                },
                {
                    catalog_item: 'Enterprise Software License',
                    sequence: 10,
                    action_type: 'APPROVAL',
                    approval_type: 'Manager',
                    approval_group: 'Procurement',
                    approval_user: '',
                    priority: '3 - Moderate',
                    description: 'Software license manager signoff'
                }
            ],
            attachments: [
                {
                    catalog_item: 'Developer Laptop Request',
                    image_name: 'macbook_hero.png',
                    image_reference: 'sys_attachment_macbook',
                    attachment_reference: 'spec_sheet.pdf'
                }
            ]
        };
    },

    generateSampleTemplate: function() {
        'use strict';
        return this.generateSampleWorkbook();
    },

    generateBlankTemplate: function() {
        'use strict';
        return this.generateBlankWorkbook();
    },

    /**
     * Generates a Blank Workbook structure with clean columns and empty row arrays.
     * @return {Object} Structured blank workbook object.
     */
    generateBlankWorkbook: function() {
        'use strict';
        return {
            template_name: 'AppForge_Bulk_Catalog_Blank_Template',
            version: '1.0.0',
            schema_version: 'BC-001',
            release_compatibility: 'WashingtonDC',
            sheets: [
                'catalog_items',
                'variables',
                'choices',
                'ui_policies',
                'assignment',
                'after_submit',
                'attachments'
            ],
            catalog_items: [],
            variables: [],
            choices: [],
            variable_sets: [],
            ui_policies: [],
            ui_policy_actions: [],
            assignment: [],
            after_submit: [],
            fulfillment: [],
            attachments: []
        };
    },

    /**
     * Exports a sheet or workbook as CSV formatted string.
     * @param {string} [sheetName] - Sheet to export (default 'catalog_items').
     * @param {boolean} [isSample] - True for sample data, false for blank.
     * @return {string} CSV text.
     */
    exportCsv: function(sheetName, isSample) {
        'use strict';
        sheetName = sheetName || 'catalog_items';
        var wb = (isSample !== false) ? this.generateSampleWorkbook() : this.generateBlankWorkbook();
        var rows = wb[sheetName] || [];

        if (sheetName === 'catalog_items') {
            var headers = ['name', 'short_description', 'description', 'category', 'active', 'price', 'delivery_time', 'owner', 'assignment_group', 'assigned_to', 'flow'];
            var csv = headers.join(',') + '\n';
            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                var line = [
                    this._escapeCsv(r.name),
                    this._escapeCsv(r.short_description),
                    this._escapeCsv(r.description),
                    this._escapeCsv(r.category),
                    r.active,
                    r.price,
                    this._escapeCsv(r.delivery_time),
                    this._escapeCsv(r.owner),
                    this._escapeCsv(r.assignment_group),
                    this._escapeCsv(r.assigned_to),
                    this._escapeCsv(r.flow)
                ];
                csv += line.join(',') + '\n';
            }
            return csv;
        }

        if (sheetName === 'variables') {
            var vHeaders = ['catalog_item', 'name', 'label', 'type', 'mandatory', 'default_value', 'help_text', 'order'];
            var vCsv = vHeaders.join(',') + '\n';
            for (var j = 0; j < rows.length; j++) {
                var vr = rows[j];
                var vLine = [
                    this._escapeCsv(vr.catalog_item),
                    this._escapeCsv(vr.name),
                    this._escapeCsv(vr.label),
                    this._escapeCsv(vr.type),
                    vr.mandatory,
                    this._escapeCsv(vr.default_value),
                    this._escapeCsv(vr.help_text),
                    vr.order
                ];
                vCsv += vLine.join(',') + '\n';
            }
            return vCsv;
        }

        if (sheetName === 'fulfillment') {
            var fHeaders = ['catalog_item', 'sequence', 'action_type', 'approval_type', 'approval_group', 'approval_user', 'assignment_group', 'assigned_to', 'priority', 'condition', 'description'];
            var fCsv = fHeaders.join(',') + '\n';
            for (var k = 0; k < rows.length; k++) {
                var fr = rows[k];
                var fLine = [
                    this._escapeCsv(fr.catalog_item),
                    fr.sequence,
                    this._escapeCsv(fr.action_type),
                    this._escapeCsv(fr.approval_type),
                    this._escapeCsv(fr.approval_group),
                    this._escapeCsv(fr.approval_user),
                    this._escapeCsv(fr.assignment_group),
                    this._escapeCsv(fr.assigned_to),
                    this._escapeCsv(fr.priority),
                    this._escapeCsv(fr.condition),
                    this._escapeCsv(fr.description)
                ];
                fCsv += fLine.join(',') + '\n';
            }
            return fCsv;
        }

        return JSON.stringify(rows);
    },

    /**
     * Exports multi-sheet workbook as Excel-compliant SpreadsheetML XML format.
     * Compatible with Microsoft Excel, LibreOffice Calc, and Google Sheets.
     * @param {boolean} [isSample] - True for sample data, false for blank.
     * @return {string} XML workbook string.
     */
    exportXmlSpreadsheet: function(isSample) {
        'use strict';
        var wb = (isSample !== false) ? this.generateSampleWorkbook() : this.generateBlankWorkbook();
        var xml = '<?xml version="1.0"?>\n';
        xml += '<?mso-application progid="Excel.Sheet"?>\n';
        xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
        xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
        xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
        xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

        // 1. Catalog Items Sheet
        xml += this._generateXmlWorksheet('Catalog Items', wb.catalog_items, [
            { key: 'name', label: 'Catalog Item Name' },
            { key: 'short_description', label: 'Short Description' },
            { key: 'description', label: 'Description' },
            { key: 'category', label: 'Category' },
            { key: 'active', label: 'Active' },
            { key: 'price', label: 'Price' },
            { key: 'delivery_time', label: 'Delivery Time' },
            { key: 'owner', label: 'Owner' },
            { key: 'assignment_group', label: 'Assignment Group' },
            { key: 'assigned_to', label: 'Assigned To' },
            { key: 'flow', label: 'Fulfillment Flow' }
        ]);

        // 2. Variables Sheet
        xml += this._generateXmlWorksheet('Variables', wb.variables, [
            { key: 'catalog_item', label: 'Catalog Item' },
            { key: 'name', label: 'Variable Name' },
            { key: 'label', label: 'Label' },
            { key: 'type', label: 'Type' },
            { key: 'mandatory', label: 'Mandatory' },
            { key: 'default_value', label: 'Default Value' },
            { key: 'help_text', label: 'Help Text' },
            { key: 'order', label: 'Order' }
        ]);

        // 3. Choices Sheet
        xml += this._generateXmlWorksheet('Choices', wb.choices, [
            { key: 'variable_name', label: 'Variable Name' },
            { key: 'label', label: 'Label' },
            { key: 'value', label: 'Value' },
            { key: 'order', label: 'Order' }
        ]);

        // 4. Fulfillment Actions Sheet
        xml += this._generateXmlWorksheet('Fulfillment Actions', wb.fulfillment, [
            { key: 'catalog_item', label: 'Catalog Item' },
            { key: 'sequence', label: 'Sequence' },
            { key: 'action_type', label: 'Action Type' },
            { key: 'approval_type', label: 'Approval Type' },
            { key: 'approval_group', label: 'Approval Group' },
            { key: 'approval_user', label: 'Approval User' },
            { key: 'assignment_group', label: 'Task Assignment Group' },
            { key: 'priority', label: 'Priority' },
            { key: 'condition', label: 'Condition' },
            { key: 'description', label: 'Description' }
        ]);

        xml += '</Workbook>';
        return xml;
    },

    /**
     * Generates a single XML worksheet element.
     * @private
     */
    _generateXmlWorksheet: function(sheetTitle, rows, columns) {
        'use strict';
        var xml = ' <Worksheet ss:Name="' + sheetTitle + '">\n  <Table>\n   <Row>\n';
        for (var c = 0; c < columns.length; c++) {
            xml += '    <Cell><Data ss:Type="String">' + columns[c].label + '</Data></Cell>\n';
        }
        xml += '   </Row>\n';

        rows = rows || [];
        for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            xml += '   <Row>\n';
            for (var col = 0; col < columns.length; col++) {
                var val = row[columns[col].key];
                if (val === undefined || val === null) val = '';
                var type = (typeof val === 'number') ? 'Number' : 'String';
                xml += '    <Cell><Data ss:Type="' + type + '">' + this._escapeXml(String(val)) + '</Data></Cell>\n';
            }
            xml += '   </Row>\n';
        }

        xml += '  </Table>\n </Worksheet>\n';
        return xml;
    },

    _escapeCsv: function(val) {
        'use strict';
        if (val === undefined || val === null) return '""';
        var s = String(val).replace(/"/g, '""');
        return '"' + s + '"';
    },

    _escapeXml: function(val) {
        'use strict';
        if (!val) return '';
        return String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    type: 'AppForgeExcelTemplateGenerator'
};
