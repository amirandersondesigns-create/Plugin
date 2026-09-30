/*
 * Minimal CSInterface bridge for Adobe CEP panels.
 *
 * This implements only what Motion Project Organizer's panel needs to talk to
 * ExtendScript (host/organizer.jsx): evalScript() and a couple of
 * environment getters. It intentionally does not reproduce Adobe's full
 * CSInterface.js (~700 lines of menu/theme/event plumbing this panel
 * doesn't use). Drop in the official CSInterface.js from Adobe's CEP
 * samples instead if a future feature needs it — this file exposes the
 * same `CSInterface` global name and `evalScript` signature, so it's a
 * drop-in swap.
 */
(function (global) {
    "use strict";

    function CSInterface() {}

    // Runs `script` in the extension's ExtendScript engine (host/organizer.jsx)
    // and passes the string result to `callback`.
    CSInterface.prototype.evalScript = function (script, callback) {
        callback = callback || function () {};
        if (typeof window.__adobe_cep__ === "undefined") {
            // Not running inside a CEP host (e.g. previewed in a browser).
            callback("");
            return;
        }
        window.__adobe_cep__.evalScript(script, callback);
    };

    CSInterface.prototype.getHostEnvironment = function () {
        try {
            return JSON.parse(window.__adobe_cep__.getHostEnvironment());
        } catch (e) {
            return null;
        }
    };

    // Returns a plain file-system path (Adobe returns a file:// URI; this
    // strips it the same way the official CSInterface.js does).
    CSInterface.prototype.getSystemPath = function (pathType) {
        try {
            var p = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
            if (/^file:\/\/\/[A-Za-z]:/.test(p)) return p.substring(8);   // Windows: file:///C:/...
            return p.replace(/^file:\/\//, "");                            // macOS:   file:///Users/...
        } catch (e) {
            return "";
        }
    };

    CSInterface.prototype.closeExtension = function () {
        try { window.__adobe_cep__.closeExtension(); } catch (e) {}
    };

    global.CSInterface = CSInterface;
})(window);
