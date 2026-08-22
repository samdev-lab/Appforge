/**
 * AppForgeRegistryRESTAPI
 * Scripted REST API Controller providing read-only query access to AppForge Platform Registries.
 * Endpoint base: /api/x_appforge/applications, /modules, /schemas
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeRegistryRESTAPI] ';
    
    var path = request.pathParams || {};
    var query = request.queryParams || {};
    var resource = path.resource || 'applications';
    var id = path.id || null;
    var subResource = path.subResource || null;

    try {
        if (resource === 'applications') {
            var appRegistry = new AppForgeApplicationRegistry();
            if (id) {
                var app = appRegistry.get(id);
                if (!app) {
                    response.setStatus(404);
                    response.setBody({ error: 'Not Found', message: 'Application ' + id + ' not found' });
                    return;
                }
                response.setStatus(200);
                response.setBody({ result: app });
                return;
            }
            var appList = appRegistry.list(query);
            response.setStatus(200);
            response.setBody({ count: appList.length, result: appList });
            return;
        }

        if (resource === 'modules') {
            var moduleRegistry = new AppForgeModuleRegistry();
            if (id) {
                var module = moduleRegistry.get(id);
                if (!module) {
                    response.setStatus(404);
                    response.setBody({ error: 'Not Found', message: 'Module ' + id + ' not found' });
                    return;
                }
                response.setStatus(200);
                response.setBody({ result: module });
                return;
            }
            var appSysId = query.application ? (query.application + '') : null;
            var moduleList = moduleRegistry.list(appSysId);
            response.setStatus(200);
            response.setBody({ count: moduleList.length, result: moduleList });
            return;
        }

        if (resource === 'schemas') {
            var schemaRegistry = new AppForgeSchemaRegistry();
            var fieldRegistry = new AppForgeSchemaFieldRegistry();

            if (id && subResource === 'fields') {
                var fields = fieldRegistry.list(id);
                response.setStatus(200);
                response.setBody({ schema_id: id, count: fields.length, result: fields });
                return;
            }

            if (id) {
                var schema = schemaRegistry.get(id);
                if (!schema) {
                    response.setStatus(404);
                    response.setBody({ error: 'Not Found', message: 'Schema ' + id + ' not found' });
                    return;
                }
                response.setStatus(200);
                response.setBody({ result: schema });
                return;
            }

            var schemaAppSysId = query.application ? (query.application + '') : null;
            var schemaList = schemaRegistry.list(schemaAppSysId);
            response.setStatus(200);
            response.setBody({ count: schemaList.length, result: schemaList });
            return;
        }

        response.setStatus(400);
        response.setBody({ error: 'Bad Request', message: 'Unknown registry resource: ' + resource });
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception processing REST request: ' + ex.message);
        response.setStatus(500);
        response.setBody({ error: 'Internal Server Error', message: ex.message });
    }

})(request, response);
