/*
 * Text: create a text layer and the text motion library (layer-level
 * presets plus per-character Text Animator presets).
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    function render(page, c) {
        var hasText = c && c.kinds && c.kinds.text;
        page.appendChild(AT.ui.lead("Select text layers, then pick a preset. Lettering tiles build a real Text Animator you can twirl open."));
        if (c && c.comp && !hasText) {
            page.appendChild(h("div.notice", [AT.icon("info"), h("span", { text: "No text layer selected. Presets like Type On only work on text; layer presets (Fade, Slide, Bounce…) work on anything." })]));
        }
        page.appendChild(AT.ui.section("Create", { icon: "text" }, h("div.tool-grid", [AT.ui.toolButton("text.create"), AT.ui.toolButton("anchor.center", { label: "Center anchor" })])));
        var lib = h("div");
        AT.motionLibrary.render(lib, "text");
        page.appendChild(AT.ui.section("Text motion", { icon: "motion" }, lib));
        page.appendChild(h("p.tip", [AT.icon("cube"), h("span", ["Want 3D type? Extrusion, flips and depth live in the ",
            h("button.link", { type: "button", text: "3D tab", on: { click: function () { AT.app.show("threed"); } } }), "."])]));
    }

    AT.registerView({
        id: "text", title: "Text", icon: "text", render: render,
        onContext: function () { /* notice refreshes on next visit; avoid re-rendering under the cursor */ }
    });
})(window.AT = window.AT || {});
