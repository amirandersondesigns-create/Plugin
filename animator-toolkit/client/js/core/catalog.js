/*
 * Catalog: one lookup for every tool, preset, lesson, shortcut and
 * plus AT.run(), the single way anything in the panel executes.
 * Views, search results and favorites all call AT.run with
 * a catalog id, so behaviour and feedback are identical everywhere.
 */
(function (AT) {
    "use strict";

    var byId = {};

    function build() {
        byId = {};
        var c = AT.content;
        [c.actions, c.presets, c.lessons, c.shortcuts].forEach(function (list) {
            list.forEach(function (item) { byId[item.id] = item; });
        });
    }

    function get(id) {
        return byId[id] || null;
    }

    function all() {
        return Object.keys(byId).map(function (k) { return byId[k]; });
    }

    // Settings-driven parameters, so a favorite or search result runs with
    // the same options the artist set in the tab it lives in.
    function paramsFor(item) {
        var s = AT.store.get("settings");
        var dur = AT.ui.durationParams;
        if (item.type === "preset") {
            var p = { timing: s.presetTiming || "layer" };
            p.durationFrames = dur("presetDur", item.duration).durationFrames; // Auto = the preset's own length
            return p;
        }
        if (item.command === "camera.move") {
            return assign({ distance: s.cameraDistance || 300, easing: s.cameraEasing || "smooth" }, dur("cameraDur", 48));
        }
        if (item.command === "still.capture") {
            return { folder: s.stillFolder || "", importToProject: !!s.stillImport, addToComp: !!s.stillAddToComp };
        }
        if (item.command === "layers.stagger") {
            var st = typeof s.staggerAmount === "number" ? s.staggerAmount : (s.staggerFrames || 3);
            if (s.staggerUnit === "seconds") st = Math.round(st * 29.97);
            return { amount: st, unit: "frames" };
        }
        if (item.command === "camera.orbit") return assign({ degrees: s.orbitDegrees || 30 }, dur("cameraDur", 72));
        if (item.command === "camera.shake" && !(item.payload && item.payload.remove)) return { amount: s.shakeAmount || 12, frequency: s.shakeFrequency || 2 };
        if (item.command === "camera.lensZoom") return dur("cameraDur", 48);
        if (item.command === "camera.dof") return { aperture: s.cameraAperture || 60 };
        if (item.command === "threed.depthSpread") return { spacing: s.depthSpacing || 300 };
        if (item.command === "text.extrude") return { depth: s.extrudeDepth || 40 };
        if (item.command === "mask.feather") return { amount: s.maskFeather || 20 };
        if (item.command === "audio.fade") return dur("audioFadeDur", 15);
        return {};
    }

    function assign(target) {
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i];
            if (!src) continue;
            for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
        }
        return target;
    }

    function remember(id) {
        AT.store.update("settings", function (s) {
            var recent = (s.recent || []).filter(function (r) { return r !== id; });
            recent.unshift(id);
            s.recent = recent.slice(0, 6);
        });
    }

    var NEEDS_CODES = {
        "no-selection": 1, "no-keyframes": 1, "too-few-keyframes": 1, "too-few-layers": 1, "no-camera": 1,
        "no-comp": 1, "no-project": 1, "unsupported-layer": 1, "no-audio": 1, "no-masks": 1, "renderer": 1
    };

    // Runs a catalog item. Returns the bridge response. `overrides` lets a
    // view pass live control values (e.g. slider positions).
    function run(idOrItem, overrides, source) {
        var item = typeof idOrItem === "string" ? get(idOrItem) : idOrItem;
        if (!item) return Promise.resolve({ ok: false, error: { message: "Unknown tool" } });

        if (item.type === "lesson" || item.type === "workflow" || item.type === "shortcut") {
            AT.app.open(item);
            return Promise.resolve({ ok: true });
        }

        var command, payload;
        if (item.type === "preset") {
            command = "preset.apply";
            payload = assign(JSON.parse(JSON.stringify(item.def)), paramsFor(item), overrides);
        } else {
            command = item.command;
            payload = assign({}, item.payload, paramsFor(item), overrides);
        }

        if (source) source.classList.add("is-busy");
        return AT.bridge.run(command, payload).then(function (res) {
            if (source) source.classList.remove("is-busy");
            if (res.ok) {
                AT.toast("✓ " + (res.feedback || item.title), "ok");
                // Stills open a pop-up showing the frame and where it was saved,
                // whichever button captured them.
                if (command === "still.capture" && res.result && res.result.path && AT.stills) AT.stills.captured(res.result);
                remember(item.id);
                if (source) AT.ui.pulse(source);
                AT.app.refreshContext();
            } else if (res.unconfirmed) {
                // No reply at all (not an error from After Effects): the action
                // almost always ran. Say so quietly instead of alarming.
                AT.toast(item.title + " sent to After Effects", "info");
                remember(item.id);
                AT.app.refreshContext();
            } else {
                // The "What does this tool need?" link only makes sense when the
                // problem is the selection or a missing precondition.
                var hint = NEEDS_CODES[res.error.code] ? item : null;
                AT.toast(res.error.message, "error", hint);
            }
            return res;
        });
    }

    AT.catalog = { build: build, get: get, all: all, paramsFor: paramsFor };
    AT.run = run;
})(window.AT = window.AT || {});
