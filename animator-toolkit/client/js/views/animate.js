/*
 * Animate: the Motion-4-style workbench. Layout dock (anchor grid + align)
 * up top, keyframe strip, the graphic motion library, then layer tools.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var lastAnchor = "center";

    var GRID = ["top-left", "top-center", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-center", "bottom-right"];

    function anchorGrid() {
        var box = h("div.anchor-box", { role: "group", "aria-label": "Anchor point position" });
        var label = h("div.anchor-caption", { text: "Anchor: " + lastAnchor.replace("-", " ") });
        box.appendChild(h("div.anchor-layer"));
        GRID.forEach(function (pos, i) {
            var item = AT.catalog.get("anchor." + pos);
            var dot = h("button.anchor-dot" + (pos === lastAnchor ? ".on" : ""), {
                type: "button", title: item.title, "aria-label": item.title,
                style: { "--x": String(i % 3), "--y": String(Math.floor(i / 3)) },
                on: {
                    click: function () {
                        AT.run(item, null, dot).then(function (res) {
                            if (!res.ok) return;
                            lastAnchor = pos;
                            box.querySelectorAll(".anchor-dot").forEach(function (d) { d.classList.remove("on"); });
                            dot.classList.add("on");
                            label.textContent = "Anchor: " + pos.replace("-", " ");
                            box.style.setProperty("--ax", String(i % 3));
                            box.style.setProperty("--ay", String(Math.floor(i / 3)));
                        });
                    },
                    mouseenter: function () { label.textContent = item.title.replace("Anchor ", "Set to "); },
                    mouseleave: function () { label.textContent = "Anchor: " + lastAnchor.replace("-", " "); }
                }
            }, h("span.anchor-dot-core"));
            box.appendChild(dot);
        });
        var idx = GRID.indexOf(lastAnchor);
        box.style.setProperty("--ax", String(idx % 3));
        box.style.setProperty("--ay", String(Math.floor(idx / 3)));
        box.appendChild(h("div.anchor-pivot"));
        return h("div.dock-cell.dock-anchor", [
            h("div.dock-label", [h("span", { text: "Anchor point" }), AT.ui.infoButton(AT.catalog.get("anchor.center")), AT.ui.favButton("anchor.center")]),
            box,
            label
        ]);
    }

    function alignCell() {
        var ids = ["align.left", "align.hcenter", "align.right", "align.top", "align.vcenter", "align.bottom"];
        return h("div.dock-cell.dock-align", [
            h("div.dock-label", [h("span", { text: "Align to comp" }), AT.ui.infoButton(AT.catalog.get("align.left"))]),
            h("div.align-grid", ids.map(function (id) { return AT.ui.iconButton(id); })),
            h("div.align-row", [
                AT.ui.iconButton("align.center", { caption: "Center" }),
                AT.ui.iconButton("distribute.h", { caption: "Space H" }),
                AT.ui.iconButton("distribute.v", { caption: "Space V" })
            ])
        ]);
    }

    function keyStrip() {
        var keys = ["keys.position", "keys.scale", "keys.rotation", "keys.opacity", "keys.anchor", "keys.all"];
        return h("div.key-strip", [
            h("div.key-row", keys.map(function (id) {
                var item = AT.catalog.get(id);
                var b = h("button.key-btn", { type: "button", title: item.summary, on: {
                    click: function () { AT.run(item, null, b); },
                    contextmenu: function (e) { e.preventDefault(); AT.ui.explain(item, b); }
                } }, [
                    h("span.key-diamond", AT.icon("key")),
                    h("span.key-letter", { text: id === "keys.all" ? "All" : item.short }),
                    h("span.key-name", { text: item.title.replace("Key ", "").replace("Anchor Point", "Anchor").replace("All Transform", "Transform") })
                ]);
                return b;
            })),
            h("div.key-row.key-row-edit", [
                AT.ui.toolButton("keys.reverse", { cls: "tool-sm", fav: false, label: "Reverse Keys" })
            ]),
            staggerControl()
        ]);
    }

    // Stagger in frames (with the seconds equivalent), remembered between sessions.
    function staggerControl() {
        var s = AT.store.get("settings");
        var amount = typeof s.staggerAmount === "number" ? s.staggerAmount : (s.staggerFrames || 3);
        if (s.staggerUnit === "seconds") amount = Math.round(amount * 29.97);
        function save(v) { AT.store.update("settings", function (x) { x.staggerAmount = v; x.staggerUnit = "frames"; }); }
        var slider = AT.ui.frameSlider({ label: "Stagger layers by", value: amount, min: 0, max: 30, fallback: 0, onChange: save });
        var run = h("button.btn.btn-primary.btn-sm", { type: "button", on: { click: function () {
            AT.run("layers.stagger", null, run);
        } } }, [AT.icon("stagger"), h("span", { text: "Stagger" })]);
        return h("div.stagger", [slider, h("div.stagger-actions", [run, AT.ui.favButton("layers.stagger")])]);
    }

    function layerTools() {
        return h("div", [
            h("div.tool-grid", ["layers.nullParent", "layers.precompose", "layers.motionBlur", "layers.rasterize", "layers.marker", "layers.null"].map(function (id) {
                return AT.ui.toolButton(id);
            }))
        ]);
    }

    function render(page) {
        page.appendChild(AT.ui.lead("Select layers in the timeline, then click. Every action is a single undo (Ctrl/Cmd+Z)."));
        page.appendChild(AT.ui.section("Layout", { icon: "grid", cls: "sec-dock" }, h("div.dock", [anchorGrid(), alignCell()])));
        page.appendChild(AT.ui.section("Keyframes", { icon: "key", hint: "at the playhead" }, keyStrip()));
        var lib = h("div");
        AT.motionLibrary.render(lib, "graphic");
        page.appendChild(AT.ui.section("Motion", { icon: "motion" }, lib));
        page.appendChild(AT.ui.section("Layer tools", { icon: "layers" }, layerTools()));
    }

    AT.registerView({ id: "animate", title: "Animate", icon: "animate", render: render });
})(window.AT = window.AT || {});
