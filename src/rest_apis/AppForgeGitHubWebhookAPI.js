/**
 * AppForgeGitHubWebhookAPI
 * Scripted REST API Resource Handler for POST /api/x_appforge/github/webhook
 * Thin controller architecture delegating to AppForgeWebhookSecurity,
 * AppForgeGitHubWebhookService, and AppForgeGitEventService.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    'use strict';
    var LOG_PREFIX = '[AppForgeGitHubWebhookAPI] ';
    
    // Extract headers
    var headers = {};
    var signatureHeader = request.getHeader('X-Hub-Signature-256') || request.getHeader('x-hub-signature-256');
    var eventType = request.getHeader('X-GitHub-Event') || request.getHeader('x-github-event');
    var deliveryId = request.getHeader('X-GitHub-Delivery') || request.getHeader('x-github-delivery');
    
    headers['X-Hub-Signature-256'] = signatureHeader;
    headers['X-GitHub-Event'] = eventType;
    headers['X-GitHub-Delivery'] = deliveryId;

    var requestBodyStr = '';
    try {
        requestBodyStr = request.body.dataString || '';
    } catch (ex) {
        gs.error(LOG_PREFIX + 'Failed to read request body string: ' + ex.message);
    }

    // Step 1: Security - HMAC Signature Validation
    var securityService = new AppForgeWebhookSecurity();
    var isValidSignature = securityService.validateSignature(requestBodyStr, signatureHeader);
    
    if (!isValidSignature) {
        gs.warn(LOG_PREFIX + 'Rejecting request: Invalid or missing HMAC signature.');
        response.setStatus(401);
        response.setBody({
            error: 'Unauthorized',
            message: 'Invalid or missing X-Hub-Signature-256 webhook signature'
        });
        return;
    }

    // Step 2: Payload Ingestion & Mandatory Idempotency Check
    var webhookService = new AppForgeGitHubWebhookService();
    var ingestResult = webhookService.ingestEvent(headers, requestBodyStr);

    if (!ingestResult.success) {
        var statusCode = ingestResult.statusCode || 400;
        response.setStatus(statusCode);
        response.setBody({
            error: 'Bad Request',
            message: ingestResult.message
        });
        return;
    }

    // Idempotent duplicate skip
    if (ingestResult.isDuplicate) {
        gs.info(LOG_PREFIX + 'Idempotent skip for duplicate delivery ID: ' + deliveryId);
        response.setStatus(200);
        response.setBody({
            status: ingestResult.status || 'PROCESSED',
            message: ingestResult.message,
            deliveryId: deliveryId,
            duplicate: true
        });
        return;
    }

    // Step 3: Event Processing & Repository Mapping Router
    var eventService = new AppForgeGitEventService();
    var processResult = eventService.processEvent(ingestResult.eventSysId);

    response.setStatus(200);
    response.setBody({
        status: processResult.status,
        message: processResult.message || 'Webhook event processed successfully',
        deliveryId: deliveryId,
        eventSysId: ingestResult.eventSysId,
        duplicate: false
    });

})(request, response);
