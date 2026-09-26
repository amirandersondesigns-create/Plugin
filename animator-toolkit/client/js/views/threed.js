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
        page.appendChild(AT.ui.lead("Make layers 3D, spread them in depth, then add a camera in the Camera tab."));

        page.appendChild(AT.ui.section("Setup", { icon: "cube" }, h("div", [
            h("div.tool-grid", ["threed.make", "threed.make2d", "threed.depthSpread"].map(function (id) { return AT.ui.toolButton(id); })),
            setting("depthSpacing", "Depth spacing", 50, 2000, 50, 300, "px")
        ])));

        var lib = h("div");
        AT.motionLibrary.render(lib, "threed");
        page.appendChild(AT.ui.section("3D motion", { icon: "motion", hint: "the anchor point is the hinge" }, lib));

        page.appendChild(AT.ui.section("3D text", { icon: "text" }, h("div", [
            h("div.tool-grid", [AT.ui.toolButton("threed.renderer.extrude", { label: "Advanced 3D" }), AT.ui.toolButton("text.extrude"), AT.ui.toolButton("threed.renderer.classic", { label: "Classic 3D" })]),
            setting("extrudeDepth", "Extrusion depth", 1, 400, 1, 40, "px"),
            AT.ui.isBeginner() ? h("p.hint", { text: "Switch the comp to Advanced 3D first, then select text or shapes and Extrude." }) : null
        ])));

        // Camera tools live only in the Camera tab (no duplicate buttons here).
        page.appendChild(h("button.next-card", { type: "button", on: { click: function () { AT.app.show("camera"); } } }, [
            h("span.next-ico", AT.icon("camera")),
            h("span.next-text", [h("strong", { text: "Next: add a camera" }), h("span", { text: "Create, push, orbit and focus in the Camera tab." })]),
            AT.icon("chevron", "next-arrow")
        ]));
    }

    AT.registerView({ id: "threed", title: "3D", icon: "cube", render: render });
})(window.AT = window.AT || {});
