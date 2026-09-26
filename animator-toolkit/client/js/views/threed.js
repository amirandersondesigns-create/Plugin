/*
 * Easy 3D: one place for the 3D basics. Setup (3D switch, depth), 3D motion
 * presets, extruded 3D text, and quick camera moves that need 3D layers.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    function setting(key, label, min, max, step, def, unit) {
        var s = AT.store.get("settings");
        return AT.ui.slider({ label: label, min: min, max: max, step: step, value: typeof s[key] === "number" ? s[key] : def, unit: unit,
            onChange: function (v) { AT.store.update("settings", function (x) { x[key] = v; }); } });
    }

    function render(page) {
        page.appendChild(AT.ui.lead("3D in three steps: make layers 3D, spread them in depth, then move a camera. The flips below turn layers 3D for you."));

        page.appendChild(AT.ui.section("Setup", { icon: "cube" }, h("div", [
            h("div.tool-grid", ["threed.make", "threed.make2d", "threed.depthSpread"].map(function (id) { return AT.ui.toolButton(id); })),
            setting("depthSpacing", "Depth spacing", 50, 2000, 50, 300, "px")
        ])));

        var lib = h("div");
        AT.motionLibrary.render(lib, "threed");
        page.appendChild(AT.ui.section("3D motion", { icon: "motion", hint: "the anchor point is the hinge" }, lib));

        page.appendChild(AT.ui.section("3D text", { icon: "text" }, h("div", [
            h("div.tool-grid", ["threed.renderer.extrude", "text.extrude", "threed.renderer.classic"].map(function (id) { return AT.ui.toolButton(id); })),
            setting("extrudeDepth", "Extrusion depth", 1, 400, 1, 40, "px"),
            AT.ui.isBeginner() ? h("p.hint", { text: "Extrusion needs the Advanced 3D (or Cinema 4D) renderer: set it first, then select text and Extrude. Add a light and a camera orbit to show the sides." }) : null
        ])));

        page.appendChild(AT.ui.section("Camera", {
            icon: "camera",
            right: h("button.link", { type: "button", text: "All camera tools", on: { click: function () { AT.app.show("camera"); } } })
        }, h("div.tool-grid", ["camera.create", "camera.push", "camera.orbit-left", "camera.orbit-right", "camera.focus"].map(function (id) { return AT.ui.toolButton(id); }))));
    }

    AT.registerView({ id: "threed", title: "3D", icon: "cube", render: render });
})(window.AT = window.AT || {});
