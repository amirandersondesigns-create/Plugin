/*
 * Camera: create, move (with honest names), select, save/restore.
 * Still capture lives in its own Capture tab.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    function createCard() {
        var s = AT.store.get("settings");
        var opts = { lens: s.cameraLens || "50mm", oneNode: s.cameraOneNode !== false, make3D: s.cameraMake3D !== false };
        function save() {
            AT.store.update("settings", function (x) { x.cameraLens = opts.lens; x.cameraOneNode = opts.oneNode; x.cameraMake3D = opts.make3D; });
        }
        var btn = h("button.btn.btn-primary.btn-block", { type: "button", on: { click: function () {
            AT.run("camera.create", { lens: opts.lens, oneNode: opts.oneNode, make3D: opts.make3D }, btn);
        } } }, [AT.icon("camera"), h("span", { text: "Create Camera" })]);
        return h("div.card", [
            h("div.field", [h("span.field-label", { text: "Lens" }),
                AT.ui.segmented(["24mm", "35mm", "50mm", "80mm", "135mm"].map(function (l) { return { value: l, label: l.replace("mm", "") }; }), opts.lens,
                    function (v) { opts.lens = v; save(); }, { cls: "seg-sm", label: "Lens" })]),
            AT.ui.isBeginner() ? h("p.hint", { text: "Wide (24) exaggerates depth; long (135) flattens it. 50 is close to how we see." }) : null,
            h("div.row", [
                AT.ui.toggle("One-node", opts.oneNode, function (v) { opts.oneNode = v; save(); }),
                AT.ui.toggle("Make selected 3D", opts.make3D, function (v) { opts.make3D = v; save(); })
            ]),
            btn
        ]);
    }

    function moves() {
        var s = AT.store.get("settings");
        var ids = ["camera.push", "camera.pull", "camera.truck-left", "camera.truck-right", "camera.pedestal-up", "camera.pedestal-down"];
        var aka = { "camera.truck-left": "a.k.a. pan", "camera.truck-right": "a.k.a. pan", "camera.pedestal-up": "a.k.a. tilt", "camera.pedestal-down": "a.k.a. tilt", "camera.push": "dolly in", "camera.pull": "dolly out" };
        return h("div", [
            h("div.move-grid", ids.map(function (id) {
                var item = AT.catalog.get(id);
                var b = h("button.move", { type: "button", title: item.why, on: { click: function () { AT.run(item, null, b); } } }, [
                    h("span.move-icon.mv-" + id.split(".")[1], AT.icon(item.icon)),
                    h("span.move-name", { text: item.title }),
                    h("span.move-aka", { text: aka[id] }),
                    AT.ui.favButton(id)
                ]);
                return b;
            })),
            AT.ui.slider({ label: "Distance", min: 50, max: 1500, step: 25, value: s.cameraDistance || 300, unit: "px",
                onChange: function (v) { AT.store.update("settings", function (x) { x.cameraDistance = v; }); } }),
            AT.ui.slider({ label: "Duration", min: 6, max: 240, step: 6, value: s.cameraFrames || 48, unit: "f",
                onChange: function (v) { AT.store.update("settings", function (x) { x.cameraFrames = v; }); } }),
            h("div.field", [h("span.field-label", { text: "Feel" }), AT.ui.segmented([
                { value: "smooth", label: "Smooth" }, { value: "decelerate", label: "Settle" }, { value: "linear", label: "Linear" }
            ], s.cameraEasing || "smooth", function (v) { AT.store.update("settings", function (x) { x.cameraEasing = v; }); }, { cls: "seg-sm" })])
        ]);
    }

    function saved() {
        var list = h("div.saved-list");
        function draw() {
            list.innerHTML = "";
            var items = AT.store.get("cameras").saved;
            if (!items.length) {
                list.appendChild(h("p.muted", { text: "Save the camera's position and zoom to come back to it later." }));
            }
            items.forEach(function (cam, i) {
                list.appendChild(h("div.saved", [
                    h("span.saved-name", { text: cam.label }),
                    h("button.btn.btn-sm", { type: "button", text: "Restore", on: { click: function (e) {
                        var b = e.currentTarget;
                        AT.bridge.run("camera.restore", cam).then(function (res) {
                            AT.toast(res.ok ? "✓ " + res.feedback : res.error.message, res.ok ? "ok" : "error");
                            if (res.ok) AT.ui.pulse(b);
                        });
                    } } }),
                    h("button.icon-btn", { type: "button", "aria-label": "Delete", title: "Delete", on: { click: function () {
                        AT.store.update("cameras", function (c) { c.saved.splice(i, 1); });
                        draw();
                    } } }, AT.icon("trash"))
                ]));
            });
        }
        draw();
        var saveBtn = h("button.btn", { type: "button", on: { click: function () {
            AT.bridge.run("camera.read").then(function (res) {
                if (!res.ok) return AT.toast(res.error.message, "error");
                var r = res.result;
                var ctx = AT.app.context();
                AT.store.update("cameras", function (c) {
                    c.saved.unshift({ label: r.camera + " @ " + (ctx && ctx.comp ? "f" + ctx.comp.frame : "now"), position: r.position, pointOfInterest: r.pointOfInterest, zoom: r.zoom });
                    c.saved = c.saved.slice(0, 8);
                });
                AT.toast("✓ Camera position saved", "ok");
                draw();
            });
        } } }, [AT.icon("folder"), h("span", { text: "Save position" })]);
        return h("div", [h("div.row", [saveBtn, AT.ui.toolButton("camera.select", { cls: "tool-sm", fav: false })]), list]);
    }

    function setting(key, label, min, max, step, def, unit) {
        var s = AT.store.get("settings");
        return AT.ui.slider({ label: label, min: min, max: max, step: step, value: typeof s[key] === "number" ? s[key] : def, unit: unit,
            onChange: function (v) { AT.store.update("settings", function (x) { x[key] = v; }); } });
    }

    function lensFocus() {
        return h("div", [
            h("div.tool-grid", ["camera.dof.on", "camera.dof.off", "camera.focus", "camera.lens-in", "camera.lens-out"].map(function (id) { return AT.ui.toolButton(id); })),
            setting("cameraAperture", "Aperture (blur)", 5, 300, 5, 60, "px"),
            AT.ui.isBeginner() ? h("p.hint", { text: "Select the subject layer, then Focus on Layer: it stays sharp while nearer and farther layers blur. Bigger aperture = more blur. DOF renders slowly, so switch it off while animating." }) : null
        ]);
    }

    function rigs() {
        return h("div", [
            h("div.tool-grid", ["camera.orbit-left", "camera.orbit-right", "camera.shake", "camera.shake.remove"].map(function (id) { return AT.ui.toolButton(id); })),
            setting("orbitDegrees", "Orbit angle", 5, 180, 5, 30, "\u00b0"),
            setting("shakeAmount", "Shake amount", 1, 60, 1, 12, "px"),
            setting("shakeFrequency", "Shake speed", 0.5, 10, 0.5, 2, "/s"),
            AT.ui.isBeginner() ? h("p.hint", { text: "Orbit parents the camera to a 3D null ('AT Camera Orbit') at the comp centre and rotates it. Move that null to orbit around something else." }) : null
        ]);
    }

    function render(page) {
        page.appendChild(AT.ui.lead("Cameras only see 3D layers. Moves start at the playhead and use the active camera (or the selected one)."));
        page.appendChild(AT.ui.section("Create", { icon: "camera" }, createCard()));
        page.appendChild(AT.ui.section("Moves", { icon: "motion", hint: "from the playhead" }, moves()));
        page.appendChild(AT.ui.section("Lens & focus", { icon: "sparkle" }, lensFocus()));
        page.appendChild(AT.ui.section("Rigs & shake", { icon: "reverse", hint: "orbit uses the Duration above" }, rigs()));
        page.appendChild(AT.ui.section("Saved positions", { icon: "folder" }, saved()));
    }

    AT.registerView({ id: "camera", title: "Camera", icon: "camera", render: render });
})(window.AT = window.AT || {});
