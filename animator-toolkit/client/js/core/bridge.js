/*
 * Host bridge — the ONLY place the panel talks to ExtendScript.
 *
 * AT.bridge.run(command, payload) → Promise<{ ok, result, feedback, error }>
 *
 * Requests are versioned JSON, serialized twice so they arrive in
 * ExtendScript as one inert string literal; the host parses it with a real
 * JSON parser (no eval). Outside After Effects (a browser preview, tests)
 * the bridge runs in "preview" mode against a simulated host so the whole
 * UI can still be exercised.
 */
(function (AT) {
    "use strict";

    var PROTOCOL_VERSION = 1;
    var cs = new CSInterface();
    var counter = 0;
    var booted = null;

    function evalScript(script) {
        return new Promise(function (resolve) {
            cs.evalScript(script, resolve);
        });
    }

    function literal(str) {
        return JSON.stringify(str).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }

    function boot() {
        if (booted) return booted;
        if (!cs.isInHost()) {
            booted = Promise.resolve({ mode: "preview" });
            return booted;
        }
        var root = cs.getSystemPath(SystemPath.EXTENSION);
        booted = evalScript("typeof AT_boot === 'function' ? AT_boot(" + literal(root) + ") : 'no-loader'")
            .then(function (res) {
                if (res !== "ok") throw new Error("Host scripts failed to load: " + res);
                return { mode: "host" };
            });
        return booted;
    }

    function parseResponse(raw, requestId) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            return {
                ok: false,
                requestId: requestId,
                error: { code: "bad-response", message: "After Effects returned an unexpected reply: " + String(raw).slice(0, 120) }
            };
        }
    }

    function run(command, payload) {
        var request = {
            version: PROTOCOL_VERSION,
            requestId: "req-" + ++counter,
            command: command,
            payload: payload || {}
        };
        return boot().then(function (env) {
            if (env.mode === "preview") return AT.previewHost.handle(request);
            return evalScript("AT.dispatch(" + literal(JSON.stringify(request)) + ")").then(function (raw) {
                return parseResponse(raw, request.requestId);
            });
        }).catch(function (err) {
            return { ok: false, requestId: request.requestId, error: { code: "bridge", message: err.message } };
        });
    }

    AT.bridge = {
        run: run,
        boot: boot,
        isPreview: function () { return !cs.isInHost(); },
        _literal: literal
    };
})(window.AT = window.AT || {});
