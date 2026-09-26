/*
 * Favorites: a personal kit of cards. Each card shows what the item does
 * (a live motion preview, the ease curve, or the tool's icon), runs on
 * click, and can be renamed, reordered or removed.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var filter = "all";
    var STARTERS = ["ease.both", "motion.slide-fade.in", "anchor.center", "motion.bounce.in", "layers.nullParent", "still.capture"];

    function groupMeta(id) {
        return AT.favorites.GROUPS.filter(function (g) { return g.id === id; })[0] || AT.favorites.GROUPS[3];
    }

    function visual(item) {
        if (item.type === "preset") return AT.ui.preview(item.preview, item.phase, { autoplay: false, large: true });
        if (item.curve !== undefined && item.view === "easing") return AT.ui.curve(item.curve, { width: 96, height: 56, pad: 6, cls: "curve-card" });
        if (item.type === "lesson" || item.type === "workflow") return AT.illustration(item.illo, "card-illo");
        return h("div.card-glyph", AT.icon(item.icon));
    }

    function card(fav, index, total, redraw) {
        var item = AT.catalog.get(fav.targetId);
        if (!item) return null;
        var g = groupMeta(fav.group);
        var vis = visual(item);
        var title = h("div.fav-title", { text: fav.label, title: "Double-click to rename" });

        function rename() {
            var input = h("input.fav-rename", { type: "text", value: fav.label, maxlength: 40, "aria-label": "Favorite name" });
            title.replaceWith(input);
            input.focus();
            input.select();
            function done(commit) {
                if (commit) AT.favorites.rename(fav.targetId, input.value);
                redraw();
            }
            input.addEventListener("keydown", function (e) {
                if (e.key === "Enter") done(true);
                if (e.key === "Escape") done(false);
            });
            input.addEventListener("blur", function () { done(true); });
        }
        title.addEventListener("dblclick", rename);

        var el = h("div.fav-card", { style: { "--g": g.color, "--gt": AT.favorites.tint(g.color, 0.16), "--gb": AT.favorites.tint(g.color, 0.3), "--gl": AT.favorites.tint(g.color, 0.6) }, tabindex: "0", on: {
            mouseenter: function () { if (vis.play) vis.play(); },
            keydown: function (e) { if (e.key === "Enter" && e.target === el) run(); }
        } });
        function run() { AT.run(item, null, el); }

        el.appendChild(h("button.fav-visual", { type: "button", title: "Apply — " + item.summary, on: { click: run } }, [
            vis, h("span.fav-play", AT.icon(item.type === "lesson" || item.type === "workflow" ? "learn" : "play"))
        ]));
        el.appendChild(h("div.fav-foot", [
            title,
            h("div.fav-meta", [h("span.fav-tag", { text: g.title }), h("span.fav-type", { text: item.type === "preset" ? (item.phase === "in" ? "entrance" : "exit") : item.type === "action" ? "tool" : item.type })])
        ]));
        el.appendChild(h("div.fav-actions", [
            h("button.icon-btn", { type: "button", title: "Rename", "aria-label": "Rename", on: { click: rename } }, AT.icon("edit")),
            index > 0 ? h("button.icon-btn", { type: "button", title: "Move earlier", "aria-label": "Move earlier", on: { click: function () { AT.favorites.move(fav.targetId, -1); redraw(); } } }, AT.icon("up")) : null,
            index < total - 1 ? h("button.icon-btn", { type: "button", title: "Move later", "aria-label": "Move later", on: { click: function () { AT.favorites.move(fav.targetId, 1); redraw(); } } }, AT.icon("down")) : null,
            h("button.icon-btn.danger", { type: "button", title: "Remove", "aria-label": "Remove", on: { click: function () {
                el.classList.add("leaving");
                setTimeout(function () { AT.favorites.remove(fav.targetId); redraw(); }, 160);
            } } }, AT.icon("close"))
        ]));
        return el;
    }

    function render(page) {
        var body = h("div");
        page.appendChild(body);

        function redraw() {
            body.innerHTML = "";
            var all = AT.favorites.items();
            if (!all.length) {
                body.appendChild(AT.ui.empty("favorites", "Build your kit",
                    "Tap the ☆ on any tool, preset or lesson and it lands here — ready in one click, remembered between sessions.",
                    [h("div.starter", [
                        h("div.starter-title", { text: "Popular to start with" }),
                        h("div.starter-grid", STARTERS.map(function (id) {
                            var it = AT.catalog.get(id);
                            return h("div.starter-item", [
                                it.type === "preset" ? AT.ui.preview(it.preview, it.phase) : h("span.starter-ico", AT.icon(it.icon)),
                                h("span", { text: it.title }),
                                h("button.fav-btn", { type: "button", title: "Add to Favorites", "aria-label": "Add " + it.title + " to Favorites", on: { click: function () { AT.favorites.add(id); redraw(); } } }, AT.icon("star"))
                            ]);
                        }))
                    ])]));
                return;
            }

            var counts = {};
            all.forEach(function (f) { counts[f.group] = (counts[f.group] || 0) + 1; });
            if (filter !== "all" && !counts[filter]) filter = "all";

            body.appendChild(h("div.fav-hero", [
                h("div", [h("div.fav-count", { text: String(all.length) }), h("div.fav-count-label", { text: all.length === 1 ? "favorite" : "favorites" })]),
                h("div.fav-hero-text", { text: "Click a card to apply. Double-click a name to rename it." })
            ]));

            var chips = h("div.filter-chips", { role: "tablist" });
            [{ id: "all", title: "All", color: "#8a8a8a" }].concat(AT.favorites.GROUPS.filter(function (g) { return counts[g.id]; })).forEach(function (g) {
                chips.appendChild(h("button.filter-chip" + (filter === g.id ? ".on" : ""), {
                    type: "button", role: "tab", style: { "--g": g.color, "--gt": AT.favorites.tint(g.color, 0.14) },
                    on: { click: function () { filter = g.id; redraw(); } }
                }, [h("i.dot"), h("span", { text: g.title }), h("span.count", { text: String(g.id === "all" ? all.length : counts[g.id]) })]));
            });
            body.appendChild(chips);

            var shown = all.filter(function (f) { return filter === "all" || f.group === filter; });
            var grid = h("div.fav-grid");
            shown.forEach(function (f) {
                var c = card(f, all.indexOf(f), all.length, redraw);
                if (c) grid.appendChild(c);
            });
            body.appendChild(grid);
        }
        redraw();
    }

    AT.registerView({ id: "favorites", title: "Favorites", icon: "star", render: render });
})(window.AT = window.AT || {});
