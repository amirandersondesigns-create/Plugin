/*
 * Catalog: one lookup for every tool, preset, lesson, shortcut and
 * workflow, plus AT.run(), the single way anything in the panel executes.
 * Views, search results, favorites and workflow steps all call AT.run with
 * a catalog id, so behaviour and feedback are identical everywhere.
 */
(function (AT) {
    "use strict";

    var byId = {};

    function build() {
        byId = {};
        var c = AT.content;
        [c.actions, c.presets, c.lessons, c.shortcuts, c.workflows].forEach(function (list) {
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
        if (item.type === "preset") {
            var p = { timing: s.presetTiming || "layer" };
            p.durationFrames = s.durationFrames > 0 ? s.durationFrames : item.duration;
            return p;
        }
        if (item.command === "camera.move") {
            return { distance: s.cameraDistance || 300, durationFrames: s.cameraFrames || 48, easing: s.cameraEasing || "smooth" };
        }
        if (item.command === "still.capture") {
            return { folder: s.stillFolder || "", importToProject: !!s.stillImport, addToComp: !!s.stillAddToComp };
        }
        if (item.command === "layers.stagger") {
            return { frames: s.staggerFrames || 3 };
        }
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
                remember(item.id);
                if (source) AT.ui.pulse(source);
                AT.app.refreshContext();
            } else {
                AT.toast(res.error.message, "error", item);
            }
            return res;
        });
    }

    AT.catalog = { build: build, get: get, all: all, paramsFor: paramsFor };
    AT.run = run;
})(window.AT = window.AT || {});
