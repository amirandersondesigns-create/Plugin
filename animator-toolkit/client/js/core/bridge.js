/*
 * Host bridge — the ONLY place the panel talks to ExtendScript.
 *
 * AT.bridge.run(command, payload) → Promise<{ ok, result, feedback, error }>
 *
 * Requests are versioned JSON, serialized twice so they arrive in
 * ExtendScript as one inert string literal; the host parses it with a real
 * JSON parser (no eval). The host lives in the $["com.cnn.animatortoolkit"]
 * namespace because After Effects shares one ExtendScript global scope
 * between every extension.
 *
 * Failure handling (all of these used to fail silently or permanently):
 * - a failed boot is NOT cached: the next click retries it
 * - startup retries a few times, since the host engine may still be busy
 * - every call times out with a visible error instead of hanging
 * - every request/reply is logged to the DevTools console (localhost:8099)
 *
 * Outside After Effects (a browser preview, tests) the bridge runs in
 * "preview" mode against a simulated host.
 */
(function (AT) {
    "use strict";

    var PROTOCOL_VERSION = 1;
    var NS = '$["com.cnn.animatortoolkit"]';
    var TIMEOUT_MS = 20000;
    var cs = new CSInterface();
    var counter = 0;
    var booting = null;
    var status = { mode: cs.isInHost() ? "host" : "preview", booted: false, bootResult: null, root: null, lastError: null, lastOk: null };

    function log() {
        try { console.log.apply(console, ["[Animator Toolkit]"].concat([].slice.call(arguments))); } catch (e) { /* no console */ }
    }

    function evalScript(script, timeoutMs) {
        return new Promise(function (resolve) {
            var done = false;
            var timer = setTimeout(function () {
                if (done) return;
                done = true;
                resolve({ timeout: true });
            }, timeoutMs || TIMEOUT_MS);
            cs.evalScript(script, function (raw) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve({ raw: raw });
            });
        });
    }

    function literal(str) {
        return JSON.stringify(str).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }

    function wait(ms) {
        return new Promise(function (r) { setTimeout(r, ms); });
    }

    // Loads the host modules. Resolves { mode } or rejects with a readable
    // reason. Only a successful boot is remembered.
    function bootOnce() {
        var root = cs.getSystemPath(SystemPath.EXTENSION);
        status.root = root;
        // If the namespace is missing (ScriptPath didn't run, or another tool
        // reset the shared engine), load host/index.jsx ourselves first.
        var r = literal(root);
        var script = "(function(){var a=" + NS + ";" +
            "if(!a||!a.boot){var f=new File(" + r + "+'/host/index.jsx');if(!f.exists)return 'missing:host/index.jsx';$.evalFile(f);a=" + NS + ";}" +
            // Already loaded from this folder (by CEP's ScriptPath at panel
            // open)? Don't evaluate all 12 modules a second time.
            "if(a&&a.ready&&a.root===" + r + "&&typeof a.dispatch==='function')return 'ok';" +
            "return (a&&a.boot)?a.boot(" + r + "):'no-loader';})()";
        return evalScript(script, 15000).then(function (r) {
            var res = r.timeout ? "timeout" : String(r.raw);
            status.bootResult = res;
            log("boot", root, "->", res);
            if (res !== "ok") throw new Error(explainBoot(res, root));
            status.booted = true;
            return { mode: "host" };
        });
    }

    function explainBoot(res, root) {
        if (res === "timeout") return "After Effects didn't answer. Close any open dialog in After Effects and try again.";
        if (res === "no-loader" || res.indexOf("missing:") === 0) return "The host scripts are missing or didn't run (" + res + "). Reinstall the extension. Folder: " + root;
        if (res === "EvalScript error.") return "After Effects couldn't run the host script (EvalScript error). Reopen the panel; if it persists, run install/diagnose.";
        return "Host scripts failed to load: " + res;
    }

    function boot(retries) {
        if (status.mode === "preview") return Promise.resolve({ mode: "preview" });
        if (status.booted) return Promise.resolve({ mode: "host" });
        if (booting) return booting;
        var attempts = retries || 1;
        function attempt(n) {
            return bootOnce().catch(function (err) {
                if (n >= attempts) throw err;
                return wait(700 * n).then(function () { return attempt(n + 1); });
            });
        }
        booting = attempt(1).then(function (env) {
            booting = null;
            return env;
        }, function (err) {
            booting = null; // not cached: the next call retries
            status.lastError = err.message;
            throw err;
        });
        return booting;
    }

    function parseResponse(r, requestId) {
        if (r.timeout) {
            return { ok: false, requestId: requestId, error: { code: "timeout", message: "After Effects didn't respond. If a dialog is open in After Effects, close it and try again." } };
        }
        var text = r.raw === undefined || r.raw === null ? "" : String(r.raw);
        if (!text) {
            return { ok: false, requestId: requestId, error: { code: "empty-response", message: "After Effects returned an empty reply." } };
        }
        if (text === "EvalScript error.") {
            // Usually means the host namespace was wiped (e.g. another script
            // reset the engine). Force a reboot on the next call.
            status.booted = false;
            return { ok: false, requestId: requestId, error: { code: "eval-error", message: "After Effects couldn't run the command (EvalScript error). Try again; the panel will reload its host scripts." } };
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            return { ok: false, requestId: requestId, error: { code: "bad-response", message: "After Effects returned an unexpected reply: " + text.slice(0, 160) } };
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
            var script = "(function(){var a=" + NS + ";return (a&&a.dispatch)?a.dispatch(" + literal(JSON.stringify(request)) + "):'EvalScript error.';})()";
            return evalScript(script).then(function (r) {
                var res = parseResponse(r, request.requestId);
                if (command !== "context.inspect") log(command, payload, "->", res);
                return res;
            });
        }).catch(function (err) {
            return { ok: false, requestId: request.requestId, error: { code: "bridge", message: err.message } };
        }).then(function (res) {
            if (res.ok) status.lastOk = command;
            else if (command !== "context.inspect") status.lastError = command + ": " + (res.error && res.error.message);
            return res;
        });
    }

    AT.bridge = {
        run: run,
        boot: boot,
        status: function () { return status; },
        isPreview: function () { return !cs.isInHost(); },
        _literal: literal
    };
})(window.AT = window.AT || {});
