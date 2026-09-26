// ============================================================================
// Animator Toolkit - ExtendScript entry point
//
// After Effects runs every extension and script in ONE shared ExtendScript
// global scope. To avoid colliding with other tools, the toolkit defines no
// globals of its own: everything lives on $["com.aanders.animatortoolkit"]
// (the pattern Adobe partners recommend for shared-engine hosts).
//
// CEP evaluates this file when the panel opens. It loads the core and every
// command module. The panel also calls boot(<extension root>) on start, so
// the modules load even on hosts where $.fileName isn't set for ScriptPath
// files, and so a panel reload picks up edited host scripts.
// Keep host files pure ASCII: ExtendScript's file decoding varies by host.
// ============================================================================

$["com.aanders.animatortoolkit"] = $["com.aanders.animatortoolkit"] || {};

(function (AT) {
    AT.MODULES = [
        "core/json.jsx",
        "core/dispatcher.jsx",
        "core/props.jsx",
        "commands/easing.jsx",
        "commands/anchor.jsx",
        "commands/presets.jsx",
        "commands/text.jsx",
        "commands/keyframes.jsx",
        "commands/layers.jsx",
        "commands/camera.jsx",
        "commands/mask.jsx",
        "commands/threed.jsx",
        "commands/preview.jsx",
        "commands/still.jsx",
        "commands/context.jsx"
    ];

    // Returns "ok", or a short reason the panel shows to the user.
    AT.boot = function (extensionRoot) {
        try {
            var hostDir = new Folder(extensionRoot + "/host");
            if (!hostDir.exists) return "error:host folder not found at " + hostDir.fsName;
            AT.ready = false;
            for (var i = 0; i < AT.MODULES.length; i++) {
                var f = new File(hostDir.fsName + "/" + AT.MODULES[i]);
                if (!f.exists) return "missing:" + AT.MODULES[i];
                $.evalFile(f);
            }
            if (typeof AT.dispatch !== "function") return "error:dispatcher did not initialize";
            AT.root = extensionRoot;
            AT.ready = true;
            return "ok";
        } catch (e) {
            return "error:" + (e && e.message ? e.message : String(e)) + " (" + (e && e.fileName ? e.fileName : "") + ":" + (e && e.line ? e.line : "") + ")";
        }
    };

    try {
        var here = new File($.fileName);
        if (here.exists) AT.boot(here.parent.parent.fsName);
    } catch (e) {}
}($["com.aanders.animatortoolkit"]));
