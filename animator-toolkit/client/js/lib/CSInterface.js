/*
 * Minimal CSInterface bridge for Adobe CEP panels.
 *
 * This implements only what Motion Spell Checker's panel needs to talk to
 * ExtendScript (host/spellcheck.jsx): evalScript() and a couple of
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

    // Runs `script` in the extension's ExtendScript engine (host/spellcheck.jsx)
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

    CSInterface.prototype.getSystemPath = function (pathType) {
        try {
            return window.__adobe_cep__.getSystemPath(pathType);
        } catch (e) {
            return "";
        }
    };

    CSInterface.prototype.closeExtension = function () {
        try { window.__adobe_cep__.closeExtension(); } catch (e) {}
    };

    global.CSInterface = CSInterface;
})(window);
