// ============================================================================
// Animator Toolkit - command dispatcher
//
// The panel never builds ExtendScript source. It sends one versioned JSON
// request to AT.dispatch(), which looks the command up in a registry,
// validates the environment it needs (project / comp / selection), wraps
// mutating commands in exactly one undo group, and returns a JSON result:
//
//   { ok: true,  requestId, result: {...}, feedback: "Anchor moved" }
//   { ok: false, requestId, error: { code, message } }
//
// Commands register themselves from host/commands/*.jsx via AT.register().
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {


AT.PROTOCOL_VERSION = 1;
AT.commands = AT.commands || {};

// A user-facing failure. `code` lets the panel pick an empty-state or hint;
// `message` is written for a new animator, not a developer.
AT.UserError = function (code, message) {
    this.code = code;
    this.message = message;
};

AT.fail = function (code, message) {
    throw new AT.UserError(code, message);
};

// spec: {
//   label:    "Set Anchor"      - undo history name (mutating commands only)
//   mutating: true|false
//   needs:    "none" | "project" | "comp" | "layers" | "properties"
//   run:      function (payload, ctx) -> { result, feedback }
// }
AT.register = function (name, spec) {
    AT.commands[name] = spec;
};

AT.activeComp = function () {
    if (!app.project) return null;
    var item = app.project.activeItem;
    return item instanceof CompItem ? item : null;
};

AT.requireComp = function () {
    if (!app.project) AT.fail("no-project", "Open a project first.");
    var comp = AT.activeComp();
    if (!comp) AT.fail("no-comp", "Open a composition in the timeline or viewer first.");
    return comp;
};

AT.requireLayers = function (comp) {
    var layers = comp.selectedLayers;
    if (!layers || layers.length === 0) {
        AT.fail("no-selection", "Select one or more layers in the timeline first.");
    }
    var list = [];
    for (var i = 0; i < layers.length; i++) list.push(layers[i]);
    return list;
};

AT.buildContext = function (needs) {
    var ctx = {};
    if (needs === "none") return ctx;
    if (needs === "project") {
        if (!app.project) AT.fail("no-project", "Open a project first.");
        return ctx;
    }
    ctx.comp = AT.requireComp();
    if (needs === "layers") ctx.layers = AT.requireLayers(ctx.comp);
    return ctx;
};

AT.errorResult = function (requestId, code, message) {
    return AT.JSON.stringify({ ok: false, requestId: requestId, error: { code: code, message: message } });
};

AT.dispatch = function (requestText) {
    var request;
    try {
        request = AT.JSON.parse(String(requestText));
    } catch (e) {
        return AT.errorResult(null, "bad-request", "The panel sent a malformed request (" + e.message + ").");
    }

    var requestId = request.requestId || null;
    if (request.version !== AT.PROTOCOL_VERSION) {
        return AT.errorResult(requestId, "version-mismatch",
            "Panel and host script versions differ. Close and reopen the panel.");
    }

    var spec = AT.commands[request.command];
    if (!spec) {
        return AT.errorResult(requestId, "unknown-command", "Unknown command: " + request.command);
    }

    var payload = request.payload || {};
    var undoOpen = false;
    try {
        var ctx = AT.buildContext(spec.needs || "comp");
        if (spec.mutating) {
            app.beginUndoGroup("Animator Toolkit: " + (spec.label || request.command));
            undoOpen = true;
        }
        var out = spec.run(payload, ctx) || {};
        return AT.JSON.stringify({
            ok: true,
            requestId: requestId,
            result: out.result || {},
            feedback: out.feedback || ""
        });
    } catch (err) {
        if (err instanceof AT.UserError) {
            return AT.errorResult(requestId, err.code, err.message);
        }
        var where = err && err.line ? " (line " + err.line + ")" : "";
        return AT.errorResult(requestId, "host-exception",
            "After Effects reported an error: " + (err && err.message ? err.message : String(err)) + where);
    } finally {
        // Always close the group, even on failure, so a half-finished
        // operation is still one Cmd/Ctrl+Z away from gone.
        if (undoOpen) app.endUndoGroup();
    }
};

AT.register("system.ping", {
    needs: "none",
    run: function () {
        return {
            result: {
                protocol: AT.PROTOCOL_VERSION,
                aeVersion: app.version,
                commands: (function () {
                    var names = [];
                    for (var k in AT.commands) if (AT.commands.hasOwnProperty(k)) names.push(k);
                    return names;
                })()
            }
        };
    }
});

}($["com.cnn.animatortoolkit"]));
