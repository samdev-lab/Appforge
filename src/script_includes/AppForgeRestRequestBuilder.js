/**
 * AppForgeRestRequestBuilder
 * Request Builder for REST Methods (GET, POST, PUT, PATCH, DELETE) in AppForge Integrations.
 *
 * Implements:
 *   - Path parameter template interpolation ({account_id})
 *   - Query parameter serialization
 *   - Header composition and authorization injection
 *   - Content-type formatting (application/json, application/xml, text/plain)
 *   - Configurable timeouts
 */
var AppForgeRestRequestBuilder = Class.create();
AppForgeRestRequestBuilder.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeRestRequestBuilder] ';
    },

    /**
     * Builds complete HTTP request specification.
     */
    buildRequest: function(config, payload, pathParams, queryParams) {
        'use strict';
        if (!config) throw new Error('Configuration is required.');

        var method = (config.http_method || 'POST').toUpperCase();
        var allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        if (allowedMethods.indexOf(method) === -1) {
            return { error: 'HTTP_METHOD_NOT_ALLOWED', message: 'HTTP method ' + method + ' is not supported.' };
        }

        // 1. Build URL with path params
        var url = config.endpoint || config.base_url || '';
        if (pathParams) {
            for (var p in pathParams) {
                url = url.replace(new RegExp('\{' + p + '\}', 'g'), encodeURIComponent(pathParams[p]));
            }
        }

        // 2. Append query parameters
        if (queryParams && Object.keys(queryParams).length > 0) {
            var qParts = [];
            for (var q in queryParams) {
                if (queryParams[q] !== undefined && queryParams[q] !== null) {
                    qParts.push(encodeURIComponent(q) + '=' + encodeURIComponent(queryParams[q]));
                }
            }
            if (qParts.length > 0) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + qParts.join('&');
            }
        }

        // 3. Compose Headers
        var headers = Object.assign({}, config.default_headers || {}, config.headers || {});
        var contentType = config.content_type || 'application/json';
        headers['Content-Type'] = contentType;
        headers['Accept'] = config.accept || 'application/json';

        // 4. Inject Authorization Headers from Secrets
        if (config.secrets) {
            var s = config.secrets;
            if (s.api_key) {
                headers[s.header_name || 'X-API-Key'] = s.api_key;
            } else if (s.bearer_token) {
                headers['Authorization'] = 'Bearer ' + s.bearer_token;
            } else if (s.username && s.password) {
                var basicAuth = 'Basic ' + Buffer.from(s.username + ':' + s.password).toString('base64');
                headers['Authorization'] = basicAuth;
            } else if (s.access_token) {
                headers['Authorization'] = 'Bearer ' + s.access_token;
            } else if (s.header_name && s.header_value) {
                headers[s.header_name] = s.header_value;
            }
        }

        // 5. Serialize Body
        var body = null;
        if (method !== 'GET' && payload !== undefined) {
            if (typeof payload === 'string') {
                body = payload;
            } else if (contentType.indexOf('json') !== -1) {
                body = JSON.stringify(payload);
            } else if (contentType.indexOf('xml') !== -1) {
                body = this._toXml(payload);
            } else {
                body = String(payload);
            }
        }

        return {
            method: method,
            url: url,
            headers: headers,
            body: body,
            timeout_ms: config.timeout_ms || 10000
        };
    },

    _toXml: function(obj) {
        'use strict';
        var xml = '<root>';
        for (var k in obj) {
            xml += '<' + k + '>' + obj[k] + '</' + k + '>';
        }
        xml += '</root>';
        return xml;
    },

    type: 'AppForgeRestRequestBuilder'
};
