/*
 * Presses After Effects' own keyboard shortcuts, the only way to switch the
 * viewer's grid-and-guides overlays (Title/Action Safe, Proportional Grid,
 * Grid, Guides, Rulers, snapping), which have no scripting API. The host
 * first activates the Composition viewer, then the key goes to it exactly
 * as if the artist had pressed it.
 *   macOS:   System Events (needs After Effects allowed under
 *            Privacy & Security > Accessibility, asked once)
 *   Windows: WScript.Shell SendKeys
 */
(function (AT) {
    "use strict";

    var MAC = /Mac/.test(navigator.platform);

    function nodeRequire() {
        if (window.cep_node && window.cep_node.require) return window.cep_node.require;
        if (typeof window.require === "function") return window.require;
        return null;
    }

    // "Mod + Shift + ;" -> { mods: ["Mod", "Shift"], key: ";" }
    function parse(combo) {
        var parts = String(combo).split(" + ");
        return { mods: parts.slice(0, -1), key: parts[parts.length - 1] };
    }

    function macScript(c) {
        var using = c.mods.map(function (m) { return { Mod: "command down", Ctrl: "control down", Alt: "option down", Shift: "shift down" }[m]; });
        var key = c.key.length === 1 ? c.key.toLowerCase() : c.key;
        return 'tell application "System Events" to keystroke "' + key.replace(/"/g, '\\"') + '"' + (using.length ? " using {" + using.join(", ") + "}" : "");
    }

    function winKeys(c) {
        var pre = c.mods.map(function (m) { return { Mod: "^", Ctrl: "^", Alt: "%", Shift: "+" }[m]; }).join("");
        var key = c.key.length === 1 ? c.key.toLowerCase() : c.key;
        if (/[+^%~(){}\[\]]/.test(key)) key = "{" + key + "}";
        return pre + key;
    }

    function press(combo) {
        // Test hook, and the browser preview (no Node): pretend it worked.
        if (typeof window.__atKeyPress === "function") return Promise.resolve(window.__atKeyPress(combo));
        var req = nodeRequire();
        if (!req || AT.bridge.isPreview()) return Promise.resolve({ ok: true, preview: true });
        var cp = req("child_process");
        var c = parse(combo);
        return new Promise(function (resolve) {
            var done = function (err, stdout, stderr) {
                if (!err) return resolve({ ok: true });
                var msg = String((stderr || "") + (err.message || ""));
                if (MAC && /not allowed|1002|1743|assistive|accessibility/i.test(msg)) {
                    return resolve({ ok: false, code: "permission",
                        message: "macOS needs your OK once: System Settings > Privacy & Security > Accessibility, turn on Adobe After Effects, then press this again." });
                }
                resolve({ ok: false, code: "keys", message: "Couldn't press " + combo + " for you. Click the Composition viewer and press it there." });
            };
            if (MAC) cp.execFile("osascript", ["-e", macScript(c)], { timeout: 4000 }, done);
            else cp.execFile("powershell", ["-NoProfile", "-NonInteractive", "-Command",
                "(New-Object -ComObject WScript.Shell).SendKeys('" + winKeys(c).replace(/'/g, "''") + "')"], { timeout: 6000, windowsHide: true }, done);
        });
    }

    AT.keys = { press: press, _macScript: macScript, _winKeys: winKeys, _parse: parse };
})(window.AT = window.AT || {});
