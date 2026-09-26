/*
 * Mask: animated mask reveals (real masks you can edit) and quick mask
 * tools, plus the fix for the most common mask confusion: invisible paths.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    function render(page) {
        page.appendChild(AT.ui.lead("Select a layer, then pick a reveal. Each one builds a real mask named 'AT Mask …' (press M on the layer to see it) and leaves a timeline marker."));
        var lib = h("div");
        AT.motionLibrary.render(lib, "mask");
        page.appendChild(AT.ui.section("Mask reveals", { icon: "mask" }, lib));

        var s = AT.store.get("settings");
        page.appendChild(AT.ui.section("Mask tools", { icon: "mask" }, h("div", [
            h("div.tool-grid", ["mask.rect", "mask.ellipse", "mask.invert", "mask.feather"].map(function (id) { return AT.ui.toolButton(id); })),
            AT.ui.slider({ label: "Feather", min: 0, max: 200, step: 1, value: s.maskFeather || 20, unit: "px",
                onChange: function (v) { AT.store.update("settings", function (x) { x.maskFeather = v; }); } })
        ])));

        var fix = AT.catalog.get("lesson.mask-visibility");
        page.appendChild(h("div.notice", [AT.icon("info"), h("span", [
            h("strong", { text: "Can't see your mask path? " }),
            "Click 'Toggle Mask and Shape Path Visibility' under the viewer, or press ",
            AT.ui.keycaps("Mod + Shift + H"),
            " (Show Layer Controls). ",
            h("button.link", { type: "button", text: "More fixes", on: { click: function () { AT.app.open(fix); } } })
        ])]));
    }

    AT.registerView({ id: "mask", title: "Mask", icon: "mask", render: render });
})(window.AT = window.AT || {});
