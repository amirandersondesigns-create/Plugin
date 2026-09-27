// Copyright (c) 2026 Amir Anderson. All rights reserved. Unauthorized copying,
// recreation or distribution is prohibited. See LICENSE.txt.
/*
 * Editable favorites. Each favorite can keep its own settings, using the
 * same controls as the tab it came from (a Stagger favorite gets the frames
 * slider, a preset its duration and timing, a camera move its distance,
 * duration and feel...). Until edited, a favorite follows the tab's current
 * settings. Saved values are passed as overrides when the favorite runs.
 */
(function (AT) {
    "use strict";

    // [key, label, kind, options]; kind: frames | slider | seg | toggle.
    function specFor(item) {
        if (!item) return [];
        if (item.type === "preset") return [
            ["durationFrames", "Duration", "frames", { min: 1, max: 90 }],
            ["timing", "Starts at", "seg", { values: [["layer", "Layer in/out"], ["playhead", "Playhead"]] }]
        ];
        var c = item.command, p = item.payload || {};
        if (c === "layers.stagger") return [["amount", "Stagger by", "frames", { min: 0, max: 30 }]];
        if (c === "camera.move") return [
            ["distance", "Distance", "slider", { min: 50, max: 1500, step: 10, unit: "px" }],
            ["durationFrames", "Duration", "frames", { min: 1, max: 240 }],
            ["easing", "Feel", "seg", { values: [["smooth", "Smooth"], ["decelerate", "Settle"], ["linear", "Linear"]] }]
        ];
        if (c === "camera.orbit") return [
            ["degrees", "Orbit angle", "slider", { min: 5, max: 180, step: 5, unit: "°" }],
            ["durationFrames", "Duration", "frames", { min: 1, max: 240 }]
        ];
        if (c === "camera.shake" && !p.remove) return [
            ["amount", "Shake amount", "slider", { min: 1, max: 60, step: 1, unit: "px" }],
            ["frequency", "Shake speed", "slider", { min: 1, max: 10, step: 1, unit: "/s" }]
        ];
        if (c === "camera.lensZoom") return [["durationFrames", "Duration", "frames", { min: 1, max: 240 }]];
        if (c === "camera.dof" && p.on) return [["aperture", "Aperture (blur)", "slider", { min: 5, max: 200, step: 5, unit: "px" }]];
        if (c === "audio.fade") return [["durationFrames", "Fade length", "frames", { min: 1, max: 60 }]];
        if (c === "threed.depthSpread") return [["spacing", "Depth spacing", "slider", { min: 10, max: 1000, step: 10, unit: "px" }]];
        if (c === "text.extrude") return [["depth", "Extrusion depth", "slider", { min: 1, max: 400, step: 1, unit: "px" }]];
        if (c === "mask.feather") return [["amount", "Feather", "slider", { min: 0, max: 200, step: 1, unit: "px" }]];
        if (c === "preview.workArea") return [["frames", "Work area length", "frames", { min: 15, max: 600 }]];
        if (c === "still.capture") return [
            ["scale", "Size", "seg", { values: [[1, "Full"], [2, "Half"], [3, "Third"], [4, "Quarter"]] }],
            ["importToProject", "Import into project", "toggle", {}]
        ];
        if (c === "easing.apply" && p.mode === "custom") return [
            ["influenceOut", "Ease Out · leaving", "slider", { min: 0, max: 100, step: 1, unit: "%" }],
            ["influenceIn", "Ease In · arriving", "slider", { min: 0, max: 100, step: 1, unit: "%" }]
        ];
        if (c === "easing.apply" && (p.mode === "both" || p.mode === "in" || p.mode === "out")) return [
            ["influence", "Influence", "slider", { min: 1, max: 100, step: 1, unit: "%" }]
        ];
        return [];
    }

    // What the tool would use right now from its tab (the starting point).
    function tabValues(item) {
        var v = {}, base = {};
        try { base = AT.catalog.paramsFor(item) || {}; } catch (e) {}
        var p = item.payload || {};
        specFor(item).forEach(function (s) {
            var k = s[0], x = base[k] !== undefined ? base[k] : p[k];
            if (x === undefined && k === "durationFrames") x = item.duration || 24;
            if (x === undefined && k === "frames" && p.seconds) x = Math.round(p.seconds * 29.97);
            if (x === undefined && k === "influence") x = 33;
            if (x === undefined && s[2] === "seg") x = s[3].values[0][0];
            if (x === undefined && s[2] === "toggle") x = false;
            if (x === undefined) x = s[3].min;
            v[k] = x;
        });
        return v;
    }

    function summary(item, params) {
        if (!params) return "Uses the tab's settings";
        return specFor(item).map(function (s) {
            var v = params[s[0]];
            if (s[2] === "frames") return v + " frames";
            if (s[2] === "seg") { var m = s[3].values.filter(function (o) { return o[0] === v; })[0]; return m ? m[1] : v; }
            if (s[2] === "toggle") return v ? s[1] : null;
            return v + (s[3].unit || "");
        }).filter(Boolean).join(" · ");
    }

    // The editor sheet. onSave(params | null) is called with null to go back
    // to the tab's settings.
    function edit(fav, item, onSave) {
        var h = AT.h;
        var specs = specFor(item);
        var vals = Object.assign({}, tabValues(item), fav.params || {});
        var rows = specs.map(function (s) {
            var k = s[0], o = s[3];
            if (s[2] === "frames") return AT.ui.frameSlider({ label: s[1], value: vals[k], min: o.min, max: o.max, fallback: o.min, onChange: function (v) { vals[k] = v; } });
            if (s[2] === "slider") return AT.ui.slider({ label: s[1], min: o.min, max: o.max, step: o.step, value: vals[k], unit: o.unit, onInput: function (v) { vals[k] = v; } });
            if (s[2] === "seg") return h("div.fs-row", [h("span.fs-label", { text: s[1] }), AT.ui.segmented(o.values.map(function (x) { return { value: x[0], label: x[1] }; }), vals[k], function (v) { vals[k] = v; }, { cls: "seg-sm" })]);
            return AT.ui.toggle(s[1], !!vals[k], function (v) { vals[k] = v; });
        });
        AT.app.sheet("Edit favorite: " + fav.label, [
            h("p.hint", { text: "These settings belong to this favorite only. They start from " + (fav.params ? "what you saved last time." : "the " + ({ animate: "Animate", easing: "Easing", text: "Text", mask: "Mask", threed: "3D", camera: "Camera", capture: "Capture", preview: "Preview", audio: "Audio" }[item.view] || "tool's") + " tab's current settings.") }),
            h("div.fs-body", rows),
            h("div.fs-actions", [
                h("button.btn.btn-primary", { type: "button", text: "Save", on: { click: function () { onSave(vals); AT.app.closeSheet(); } } }),
                h("button.btn", { type: "button", text: "Save & apply", on: { click: function () { onSave(vals); AT.app.closeSheet(); AT.run(item, vals); } } }),
                fav.params ? h("button.link", { type: "button", text: "Use the tab's settings", on: { click: function () { onSave(null); AT.app.closeSheet(); } } }) : null
            ])
        ]);
    }

    AT.favSettings = { specFor: specFor, tabValues: tabValues, summary: summary, edit: edit };
})(window.AT = window.AT || {});
