/*
 * Home: what's selected and what you can do with it, quick actions,
 * favorites quick bar, recent tools, and essential-skills progress.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var suggestBox = null;

    var QUICK = ["anchor.center", "anchor.bottom-center", "ease.both", "ease.in", "ease.out", "keys.all",
        "layers.nullParent", "layers.precompose", "layers.marker", "layers.motionBlur", "camera.create", "still.capture"];

    var QUICK_CAPTIONS = {
        "anchor.center": "Center", "anchor.bottom-center": "Bottom", "ease.both": "Easy Ease", "ease.in": "Ease In",
        "ease.out": "Ease Out", "keys.all": "Key All", "layers.nullParent": "Null+Parent", "layers.precompose": "Precomp",
        "camera.create": "Camera", "still.capture": "Grab Still"
    };

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
        suggestBox = h("div.suggest");
        page.appendChild(AT.ui.section("For your selection", { icon: "sparkle", cls: "sec-suggest" }, suggestBox));
        renderSuggest(c);

        page.appendChild(AT.ui.section("Quick actions", { icon: "bolt", hint: "right-click any icon to learn what it does" },
            h("div.quick-grid", QUICK.map(function (id) {
                var item = AT.catalog.get(id);
                return AT.ui.iconButton(id, { caption: QUICK_CAPTIONS[id] || item.title });
            }))));

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

        if (AT.ui.isBeginner()) {
            var progress = AT.store.get("progress").lessons;
            var done = AT.content.essentials.filter(function (id) { return progress[id]; }).length;
            page.appendChild(AT.ui.section("5 essential skills", {
                icon: "learn", right: h("span.pill", { text: done + " / 5" })
            }, h("div.essential-row", AT.content.essentials.map(function (id, i) {
                var l = AT.catalog.get(id);
                return h("button.essential" + (progress[id] ? ".done" : ""), { type: "button", on: { click: function () { AT.app.open(l); } } }, [
                    AT.illustration(l.illo, "essential-illo"),
                    h("span.essential-n", { text: progress[id] ? "✓" : String(i + 1) }),
                    h("span.essential-t", { text: l.title })
                ]);
            }))));
        }
    }

    AT.registerView({ id: "home", title: "Home", icon: "home", render: render, onContext: renderSuggest });
})(window.AT = window.AT || {});
