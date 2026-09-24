/*
 * Persistent storage for settings, favorites, lesson progress and saved
 * cameras. Survives After Effects restarts.
 *
 * Inside AE (Node enabled) each namespace is a versioned JSON file in
 *   <user data>/AnimatorToolkit/<namespace>.json
 * written atomically (temp file + rename). A corrupt file is moved aside
 * to <namespace>.corrupt-<time>.json and defaults are used, so a bad write
 * can never stop the panel from opening. In a browser preview it falls
 * back to localStorage, and to memory if even that is blocked.
 */
(function (AT) {
    "use strict";

    var SCHEMA = 1;
    var DEFAULTS = {
        settings: { onboarded: false, mode: "beginner", density: "comfortable", presetTiming: "layer", durationFrames: 0, stillFolder: "", stillImport: false, stillAddToComp: false },
        favorites: { items: [] },
        progress: { lessons: {}, workflows: {} },
        cameras: { saved: [] }
    };

    var cache = {};
    var listeners = [];
    var backend = null;

    function nodeRequire() {
        if (window.cep_node && window.cep_node.require) return window.cep_node.require;
        if (typeof window.require === "function") return window.require;
        return null;
    }

    function fileBackend(dir) {
        var req = nodeRequire();
        var fs = req("fs");
        var path = req("path");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return {
            name: "file",
            dir: dir,
            read: function (ns) {
                var file = path.join(dir, ns + ".json");
                if (!fs.existsSync(file)) return null;
                var text = fs.readFileSync(file, "utf8");
                try {
                    return JSON.parse(text);
                } catch (e) {
                    fs.renameSync(file, path.join(dir, ns + ".corrupt-" + Date.now() + ".json"));
                    return null;
                }
            },
            write: function (ns, doc) {
                var file = path.join(dir, ns + ".json");
                var tmp = file + ".tmp";
                fs.writeFileSync(tmp, JSON.stringify(doc, null, 2), "utf8");
                fs.renameSync(tmp, file);
            }
        };
    }

    function localBackend() {
        var mem = {};
        function ls() {
            try { return window.localStorage; } catch (e) { return null; }
        }
        return {
            name: "local",
            read: function (ns) {
                try {
                    var s = ls() ? ls().getItem("at." + ns) : mem[ns];
                    return s ? JSON.parse(s) : null;
                } catch (e) {
                    return null;
                }
            },
            write: function (ns, doc) {
                var s = JSON.stringify(doc);
                try {
                    if (ls()) ls().setItem("at." + ns, s);
                    else mem[ns] = s;
                } catch (e) {
                    mem[ns] = s;
                }
            }
        };
    }

    function merge(defaults, data) {
        var out = {};
        var k;
        for (k in defaults) out[k] = defaults[k];
        for (k in data) out[k] = data[k];
        return out;
    }

    function init(options) {
        options = options || {};
        backend = null;
        cache = {};
        try {
            if (options.dir) {
                backend = fileBackend(options.dir);
            } else if (nodeRequire() && !AT.bridge.isPreview()) {
                var cs = new CSInterface();
                var base = cs.getSystemPath(SystemPath.USER_DATA);
                if (base) backend = fileBackend(nodeRequire()("path").join(base, "AnimatorToolkit"));
            }
        } catch (e) {
            backend = null;
        }
        if (!backend) backend = localBackend();
        return backend.name;
    }

    function get(ns) {
        if (!cache[ns]) {
            var doc = null;
            try { doc = backend.read(ns); } catch (e) { doc = null; }
            var data = doc && doc.schema === SCHEMA ? doc.data : {};
            cache[ns] = merge(DEFAULTS[ns] || {}, data);
        }
        return cache[ns];
    }

    function set(ns, data) {
        cache[ns] = data;
        try {
            backend.write(ns, { schema: SCHEMA, savedAt: new Date().toISOString(), data: data });
        } catch (e) {
            if (AT.toast) AT.toast("Couldn't save " + ns + ": " + e.message, "error");
        }
        listeners.forEach(function (fn) { fn(ns, data); });
    }

    function update(ns, fn) {
        var copy = JSON.parse(JSON.stringify(get(ns)));
        var out = fn(copy);
        set(ns, out === undefined ? copy : out);
        return get(ns);
    }

    AT.store = {
        init: init,
        get: get,
        set: set,
        update: update,
        onChange: function (fn) { listeners.push(fn); },
        location: function () { return backend && backend.dir ? backend.dir : "browser storage"; }
    };
})(window.AT = window.AT || {});
