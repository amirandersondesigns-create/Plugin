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
                AT.ui.iconButton("distribute.h", { caption: "Space" }),
                AT.ui.iconButton("distribute.v", { caption: "Space" })
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
                AT.ui.toolButton("keys.delete", { cls: "tool-sm", fav: false, label: "Delete" }),
                AT.ui.toolButton("keys.reverse", { cls: "tool-sm", fav: false, label: "Reverse" }),
                AT.ui.toolButton("layers.stagger", { cls: "tool-sm", fav: false, label: "Stagger" })
            ])
        ]);
    }

    function layerTools() {
        var s = AT.store.get("settings");
        return h("div", [
            h("div.tool-grid", ["layers.nullParent", "layers.precompose", "layers.motionBlur", "layers.marker", "layers.null"].map(function (id) {
                return AT.ui.toolButton(id);
            })),
            AT.ui.isBeginner() ? null : AT.ui.slider({
                label: "Stagger", min: 1, max: 12, value: s.staggerFrames || 3, unit: "f",
                onChange: function (v) { AT.store.update("settings", function (x) { x.staggerFrames = v; }); }
            })
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
