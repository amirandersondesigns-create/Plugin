/*
 * Minimal CSInterface bridge for Adobe CEP panels.
 *
 * Implements only what Animator Toolkit needs: evalScript(), getSystemPath()
 * and getHostEnvironment(). It keeps the official CSInterface names and
 * signatures, so Adobe's full CSInterface.js is a drop-in replacement.
 */
(function (global) {
    "use strict";

    function CSInterface() {}

    CSInterface.prototype.isInHost = function () {
        return typeof global.__adobe_cep__ !== "undefined";
    };

    CSInterface.prototype.evalScript = function (script, callback) {
        callback = callback || function () {};
        if (!this.isInHost()) {
            callback("EvalScript error.");
            return;
        }
        global.__adobe_cep__.evalScript(script, callback);
    };

    CSInterface.prototype.getHostEnvironment = function () {
        try {
            return JSON.parse(global.__adobe_cep__.getHostEnvironment());
        } catch (e) {
            return null;
        }
    };

    // Same decoding as Adobe's CSInterface: the host returns a file:// URL.
    CSInterface.prototype.getSystemPath = function (pathType) {
        try {
            var path = decodeURI(global.__adobe_cep__.getSystemPath(pathType));
            var isWin = navigator.platform.indexOf("Win") === 0;
            return isWin ? path.replace("file:///", "") : path.replace("file://", "");
        } catch (e) {
            return "";
        }
    };

    global.SystemPath = { EXTENSION: "extension", USER_DATA: "userData", MY_DOCUMENTS: "myDocuments" };
    global.CSInterface = CSInterface;
})(window);
