/**
 * AppForgeDiscoveryAPI
 * Scripted REST API Controller for triggering application discovery and branch binding.
 * Endpoint: POST /api/x_appforge/applications/{application_id}/discover
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeDiscoveryAPI] ';

    var pathParams = request.pathParams || {};
    var appId = pathParams.application_id || 'x_appforge';

    var body = {};
    try {
        if (request.body && request.body.data) {
            body = request.body.data;
        }
    } catch (ex) {
        gs.debug(LOG_PREFIX + 'No request body provided, using default discovery parameters.');
    }

    var branchOverride = body.branch || 'sn_instances/dev280961';
    var repoOverride = body.repository || 'samdev-lab/Appforge';

    try {
        var discoveryService = new AppForgeApplicationDiscovery();
        var result = discoveryService.discover(appId, branchOverride, repoOverride);

        if (result.status === 'SUCCESS') {
            response.setStatus(200);
            response.setBody(result);
        } else {
            response.setStatus(400);
            response.setBody({
                error: 'Discovery Failed',
                message: result.error || 'Failed to complete discovery'
            });
        }
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Exception during discovery REST API execution: ' + ex.message);
        response.setStatus(500);
        response.setBody({
            error: 'Internal Server Error',
            message: ex.message
        });
    }

})(request, response);
