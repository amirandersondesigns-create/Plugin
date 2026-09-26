/*
 * Home: what's selected and what you can do with it, quick actions,
 * favorites quick bar, recent tools, and essential-skills progress.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var suggestBox = null;

    // Everyday one-click tools, whatever tab they live in.
    var QUICK = ["anchor.center", "anchor.bottom-center", "ease.both", "ease.in",
        "ease.out", "keys.all", "layers.stagger", "layers.nullParent",
        "layers.precompose", "layers.rasterize", "layers.motionBlur", "layers.marker",
        "threed.make", "camera.create", "preview.mode.fast", "still.capture"];

    var QUICK_CAPTIONS = {
        "anchor.center": "Center", "anchor.bottom-center": "Bottom", "ease.both": "Easy Ease", "ease.in": "Ease In",
        "ease.out": "Ease Out", "keys.all": "Key All", "layers.stagger": "Stagger", "layers.nullParent": "Null+Parent",
        "layers.precompose": "Precomp", "layers.rasterize": "Rasterize", "layers.motionBlur": "Motion Blur", "layers.marker": "Marker",
        "threed.make": "Make 3D", "camera.create": "Camera", "preview.mode.fast": "Fast Preview", "still.capture": "Grab Still"
    };

    var VIEW_NAMES = { home: "Home", animate: "Animate", easing: "Easing", text: "Text", mask: "Mask", threed: "3D", camera: "Camera",
        capture: "Capture", preview: "Preview", audio: "Audio" };
    var editing = false;

    // The artist's own quick actions (defaults until they edit them).
    function quickIds() {
        var saved = AT.store.get("settings").quick;
        return (Array.isArray(saved) ? saved : QUICK).filter(function (id) { return AT.catalog.get(id); });
    }
    function saveQuick(ids) { AT.store.update("settings", function (x) { x.quick = ids; }); }

    function caption(item) { return QUICK_CAPTIONS[item.id] || item.title; }

    function quickTile(id, onRemove) {
        var item = AT.catalog.get(id);
        var art = item.type === "preset" ? AT.ui.preview(item.preview, item.phase, { autoplay: false }) : AT.icon(item.icon);
        var b = h("button.icon-tool.quick-tile" + (editing ? ".editing" : ""), {
            type: "button", title: editing ? "Remove " + item.title : item.title + " — " + item.summary, "aria-label": (editing ? "Remove " : "") + item.title,
            on: {
                click: function () { if (editing) onRemove(id); else AT.run(item, null, b); },
                contextmenu: function (e) { e.preventDefault(); AT.ui.explain(item, b); },
                mouseenter: function () { var pv = b.querySelector(".pv"); if (pv && pv.play) pv.play(); }
            }
        }, [art, h("span.icon-cap", { text: caption(item) }), editing ? h("span.quick-x", { "aria-hidden": "true" }, AT.icon("close")) : null]);
        return b;
    }

    function quickSection() {
        var grid = h("div.quick-grid");
        var right = h("span.quick-links");
        function paint() {
            var ids = quickIds();
            grid.innerHTML = "";
            ids.forEach(function (id) {
                grid.appendChild(quickTile(id, function (rid) { saveQuick(quickIds().filter(function (x) { return x !== rid; })); paint(); }));
            });
            if (editing || !ids.length) {
                grid.appendChild(h("button.icon-tool.quick-add", { type: "button", "aria-label": "Add quick actions", on: { click: function () { openPicker(paint); } } },
                    [AT.icon("plus"), h("span.icon-cap", { text: "Add" })]));
            }
            right.innerHTML = "";
            if (editing) right.appendChild(h("button.link.quick-reset", { type: "button", text: "Reset", on: { click: function () { saveQuick(QUICK.slice()); paint(); } } }));
            right.appendChild(h("button.link.quick-edit", { type: "button", text: editing ? "Done" : "Edit", on: { click: function () { editing = !editing; paint(); } } }));
        }
        paint();
        return AT.ui.section("Quick actions", { icon: "bolt", hint: "right-click to learn", right: right }, grid);
    }

    // Everything that can be a quick action, grouped by tab, with search.
    function openPicker(onChange) {
        var items = AT.catalog.all().filter(function (it) { return (it.type === "action" || it.type === "preset") && VIEW_NAMES[it.view]; });
        var list = h("div.picker-list");
        var q = h("input.picker-search", { type: "search", placeholder: "Filter tools and presets", "aria-label": "Filter" });
        function paint() {
            var term = q.value.trim().toLowerCase();
            var ids = quickIds();
            list.innerHTML = "";
            Object.keys(VIEW_NAMES).forEach(function (v) {
                var rows = items.filter(function (it) { return it.view === v && (!term || (it.title + " " + (it.keywords || "")).toLowerCase().indexOf(term) >= 0); });
                if (!rows.length) return;
                list.appendChild(h("div.picker-group", { text: VIEW_NAMES[v] }));
                rows.forEach(function (it) {
                    var on = ids.indexOf(it.id) >= 0;
                    list.appendChild(h("button.picker-row" + (on ? ".on" : ""), { type: "button", "aria-pressed": on ? "true" : "false", on: { click: function () {
                        var cur = quickIds();
                        saveQuick(on ? cur.filter(function (x) { return x !== it.id; }) : cur.concat([it.id]));
                        paint();
                        onChange();
                    } } }, [
                        h("span.picker-art", it.type === "preset" ? AT.ui.preview(it.preview, it.phase, { autoplay: false }) : AT.icon(it.icon)),
                        h("span.picker-title", { text: it.title }),
                        h("span.picker-state", on ? [AT.icon("check"), h("span", { text: "Added" })] : [h("span", { text: "+ Add" })])
                    ]));
                });
            });
            if (!list.firstChild) list.appendChild(h("p.hint", { text: "Nothing matches." }));
        }
        q.addEventListener("input", paint);
        paint();
        AT.app.sheet("Quick actions", [h("p.hint", { text: "Add anything you use every day. Remove it any time; it's always here to add back." }), q, list]);
    }

    function essentialsSection() {
        var s = AT.store.get("settings");
        if (s.essentialsHidden) return null;
        var progress = AT.store.get("progress").lessons;
        var done = AT.content.essentials.filter(function (id) { return progress[id]; }).length;
        var open = !s.essentialsCollapsed;
        var body = h("div", [
            h("div.essential-row", AT.content.essentials.map(function (id, i) {
                var l = AT.catalog.get(id);
                return h("button.essential" + (progress[id] ? ".done" : ""), { type: "button", on: { click: function () { AT.app.open(l); } } }, [
                    AT.illustration(l.illo, "essential-illo"),
                    h("span.essential-n", { text: progress[id] ? "\u2713" : String(i + 1) }),
                    h("span.essential-t", { text: l.title })
                ]);
            })),
            h("button.link.essentials-hide", { type: "button", text: "Hide from Home", on: { click: function () {
                AT.store.update("settings", function (x) { x.essentialsHidden = true; });
                AT.toast("Essential skills hidden. Bring them back any time in Learn \u203a About.", "info");
                AT.app.rerender();
            } } })
        ]);
        body.hidden = !open;
        var toggle = h("button.collapse-btn" + (open ? ".open" : ""), { type: "button", "aria-expanded": open ? "true" : "false", "aria-label": open ? "Collapse" : "Expand", on: { click: function () {
            open = !open;
            body.hidden = !open;
            toggle.classList.toggle("open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            AT.store.update("settings", function (x) { x.essentialsCollapsed = !open; });
        } } }, AT.icon("chevron"));
        return AT.ui.section("5 essential skills", { icon: "learn", cls: "sec-essentials", right: h("span.quick-links", [h("span.pill", { text: done + " / 5" }), toggle]) }, body);
    }

    function suggestions(c) {
        if (!c || !c.project) return { title: "Open a project to begin", text: "Then open a composition and select a layer — suggestions for it will appear here.", ids: [] };
        if (!c.comp) return { title: "Open a composition", text: "Double-click a comp in the Project panel. Tools work on the comp that's open in the timeline.", ids: [] };
        if (c.selectedKeys > 0) return { title: c.selectedKeys + " keyframes selected", text: "Shape how the motion speeds up and slows down.", ids: ["ease.both", "ease.in", "ease.out", "ease.linear", "keys.reverse"] };
        var k = c.kinds || {};
        if (k.camera) return { title: "Camera selected", text: "Add a move from the playhead.", ids: ["camera.push", "camera.pull", "camera.truck-left", "camera.truck-right", "still.capture"] };
        if (k.text) return { title: "Text selected", text: "Popular text entrances. More in the Text tab.", ids: ["motion.slide-fade.in", "motion.word-reveal.in", "motion.tracking.in", "anchor.center", "motion.fade.out"] };
        if (c.layerCount > 1) return { title: c.layerCount + " layers selected", text: "Group, align or cascade them.", ids: ["layers.nullParent", "layers.stagger", "align.center", "layers.precompose", "motion.slide-fade.in"] };
        if (c.layerCount === 1) return { title: "Layer selected", text: "Set the pivot, then add motion.", ids: ["anchor.center", "motion.pop.in", "motion.slide-up.in", "motion.bounce.in", "keys.all"] };
        return { title: "Nothing selected", text: "Click a layer in the timeline. Most tools act on the selected layers; easing tools act on selected keyframes.", ids: [] };
    }

    function chip(id) {
        var item = AT.catalog.get(id);
        if (!item) return null;
        var b = h("button.chip", { type: "button", title: item.summary, on: { click: function () { AT.run(item, null, b); } } }, [
            item.type === "preset" ? AT.ui.preview(item.preview, item.phase, { autoplay: false }) : AT.icon(item.icon),
            h("span", { text: item.title })
        ]);
        b.addEventListener("mouseenter", function () { var pv = b.querySelector(".pv"); if (pv) pv.play(); });
        return b;
    }

    function renderSuggest(c) {
        if (!suggestBox) return;
        var s = suggestions(c);
        suggestBox.innerHTML = "";
        suggestBox.appendChild(h("div.suggest-head", [
            h("span.suggest-title", { text: s.title }),
            s.text && AT.ui.isBeginner() ? h("span.suggest-text", { text: s.text }) : null
        ]));
        if (s.ids.length) suggestBox.appendChild(h("div.chips", s.ids.map(chip)));
    }

    function render(page, c) {
        editing = false;
        suggestBox = h("div.suggest");
        page.appendChild(AT.ui.section("For your selection", { icon: "sparkle", cls: "sec-suggest" }, suggestBox));
        renderSuggest(c);

        page.appendChild(quickSection());

        var favs = AT.favorites.items();
        if (favs.length) {
            page.appendChild(AT.ui.section("Favorites", {
                icon: "star", right: h("button.link", { type: "button", text: "All", on: { click: function () { AT.app.show("favorites"); } } })
            }, h("div.chips", favs.slice(0, 8).map(function (f) {
                var c2 = chip(f.targetId);
                if (c2) c2.querySelector("span:last-child").textContent = f.label;
                return c2;
            }))));
        }

        var recent = (AT.store.get("settings").recent || []).filter(function (id) { return AT.catalog.get(id); });
        if (recent.length) {
            page.appendChild(AT.ui.section("Recent", { icon: "clock" }, h("div.chips", recent.map(chip))));
        }

        var ess = essentialsSection();
        if (ess) page.appendChild(ess);
    }

    AT.registerView({ id: "home", title: "Home", icon: "home", render: render, onContext: renderSuggest });
})(window.AT = window.AT || {});
