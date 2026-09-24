// ============================================================================
// Animator Toolkit - ExtendScript entry point
//
// CEP evaluates this file when the panel opens. It loads the core and every
// command module. The panel also calls AT_boot(<extension root>) on start,
// so the modules load even on hosts where $.fileName isn't set for
// ScriptPath files, and so a panel reload picks up edited host scripts.
// Keep host files pure ASCII: ExtendScript's file decoding varies by host.
// ============================================================================

var AT_MODULES = [
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
    "commands/still.jsx",
    "commands/context.jsx"
];

function AT_boot(extensionRoot) {
    try {
        var hostDir = new Folder(extensionRoot + "/host");
        for (var i = 0; i < AT_MODULES.length; i++) {
            var f = new File(hostDir.fsName + "/" + AT_MODULES[i]);
            if (!f.exists) return "missing:" + AT_MODULES[i];
            $.evalFile(f);
        }
        AT.ready = true;
        return "ok";
    } catch (e) {
        return "error:" + e.message + " (" + (e.fileName || "") + ":" + (e.line || "") + ")";
    }
}

(function () {
    try {
        var here = new File($.fileName);
        if (here.exists) AT_boot(here.parent.parent.fsName);
    } catch (e) {}
})();
