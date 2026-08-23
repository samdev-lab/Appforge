/**
 * MockEmployeeHRProvider
 * Controlled mock external endpoint simulator for Integration Factory automated testing.
 * Supports simulating: 200 OK, 401 Auth Failure, 408 Timeout, 500 Error, 429 Rate Limit, and duplicate deliveries.
 */
var MockEmployeeHRProvider = Class.create();
MockEmployeeHRProvider.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[MockEmployeeHRProvider] ';
        this.processedRequests = {};
    },

    /**
     * Simulates sending an HTTP request to the external HR system.
     * @param {string} endpoint - Target URL.
     * @param {string} method - HTTP method.
     * @param {Object} payload - Request payload.
     * @param {Object} headers - Request headers.
     * @return {Object} { status_code: number, headers: Object, body: Object, duration_ms: number }
     */
    executeRequest: function(endpoint, method, payload, headers) {
        'use strict';
        var hdrs = headers || {};

        // 1. Simulate 401 Auth Failure
        if (hdrs['Authorization'] === 'invalid_token' || hdrs['X-API-Key'] === 'invalid_key') {
            return {
                status_code: 401,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Unauthorized', message: 'Invalid API credentials provided' },
                duration_ms: 15
            };
        }

        // 2. Simulate 429 Rate Limit
        if (endpoint && endpoint.indexOf('simulate_429') !== -1) {
            return {
                status_code: 429,
                headers: { 'Content-Type': 'application/json', 'Retry-After': '30' },
                body: { error: 'Too Many Requests', message: 'Rate limit exceeded on external HR system' },
                duration_ms: 20
            };
        }

        // 3. Simulate 408 Timeout
        if (endpoint && endpoint.indexOf('simulate_timeout') !== -1) {
            return {
                status_code: 408,
                headers: {},
                body: { error: 'Request Timeout', message: 'Connection to HR server timed out' },
                duration_ms: 30000
            };
        }

        // 4. Simulate 500 Error
        if (endpoint && endpoint.indexOf('simulate_500') !== -1) {
            return {
                status_code: 500,
                headers: { 'Content-Type': 'application/json' },
                body: { error: 'Internal Server Error', message: 'HR downstream service failure' },
                duration_ms: 120
            };
        }

        // 5. Simulate Idempotent / Duplicate Request
        var correlationId = hdrs['X-Correlation-ID'] || (payload ? payload.employee_id : null);
        if (correlationId && this.processedRequests[correlationId]) {
            return {
                status_code: 200,
                headers: { 'Content-Type': 'application/json', 'X-Idempotent-Replay': 'true' },
                body: this.processedRequests[correlationId],
                duration_ms: 5
            };
        }

        // 6. Default 200 OK Success
        var empId = 'HR-' + Math.floor(1000 + Math.random() * 9000);
        var successResponse = {
            employeeId: empId,
            status: 'created',
            external_reference: 'EXT-' + empId,
            department: payload ? payload.department : 'Engineering',
            processed_at: new Date().toISOString()
        };

        if (correlationId) {
            this.processedRequests[correlationId] = successResponse;
        }

        return {
            status_code: 200,
            headers: { 'Content-Type': 'application/json' },
            body: successResponse,
            duration_ms: 45
        };
    },

    type: 'MockEmployeeHRProvider'
};
