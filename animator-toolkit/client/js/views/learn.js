/*
 * Learn: micro-lessons and explained shortcuts, plus the
 * panel's own settings (density), version and "replay the welcome".
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var VERSION = "0.3.0";
    var AUTHOR = "Amir Anderson";
    var LINKEDIN = "https://www.linkedin.com/in/amiranderson";
    var sub = "lessons";
    var scFilter = "all";
    var focusId = null;
    var LEVELS = [["fixes", "Stuck? Quick fixes"], ["essential", "Essentials"], ["basics", "After Effects basics"],
        ["principles", "Animation principles"], ["production", "Production speed & delivery"]];

    function progress() { return AT.store.get("progress"); }

    // ---- lessons ---------------------------------------------------------------------
    function lessonCard(l) {
        var done = !!progress().lessons[l.id];
        return h("button.lesson" + (done ? ".done" : ""), { type: "button", on: { click: function () { openLesson(l); } } }, [
            AT.illustration(l.illo, "lesson-illo"),
            h("span.lesson-title", { text: l.title }),
            h("span.lesson-meta", [done ? h("span.done-mark", "✓ ") : null, (l.seconds < 60 ? l.seconds + " sec" : Math.round(l.seconds / 60 * 10) / 10 + " min")]),
            AT.ui.favButton(l.id)
        ]);
    }

    function lessons() {
        var wrap = h("div");
        LEVELS.forEach(function (lv) {
            var list = AT.content.lessons.filter(function (l) { return l.level === lv[0]; });
            wrap.appendChild(h("div.subhead", [h("span", { text: lv[1] })]));
            wrap.appendChild(h("div.lesson-grid", list.map(lessonCard)));
        });
        return wrap;
    }

    function openLesson(l) {
        var done = !!progress().lessons[l.id];
        var body = [AT.illustration(l.illo, "sheet-illo")];
        l.body.forEach(function (p) { body.push(h("p", { text: p })); });
        if (l.tryIt.length) {
            body.push(h("div.sheet-sub", { text: "Try it" }));
            body.push(h("div.chips", l.tryIt.map(function (id) {
                var it = AT.catalog.get(id);
                var b = h("button.chip", { type: "button", on: { click: function () { AT.run(it, null, b); } } }, [AT.icon(it.icon), h("span", { text: it.title })]);
                return b;
            })));
        }
        if (l.shortcuts.length) {
            body.push(h("div.sheet-sub", { text: "Shortcuts" }));
            l.shortcuts.forEach(function (id) {
                var s = AT.catalog.get(id);
                if (s) body.push(h("div.sc-row.sc-compact", [h("span.sc-title", { text: s.title }), AT.ui.keycaps(s.keys)]));
            });
        }
        var mark = h("button.btn" + (done ? "" : ".btn-primary") + ".btn-block", { type: "button", text: done ? "✓ Learned — mark as not yet" : "Got it", on: { click: function () {
            AT.store.update("progress", function (p) { if (done) delete p.lessons[l.id]; else p.lessons[l.id] = new Date().toISOString(); });
            AT.app.closeSheet();
            if (!done) AT.toast("✓ " + l.title + " learned", "ok");
            AT.app.rerender();
        } } });
        body.push(mark);
        AT.app.sheet(l.title, body);
    }

    // ---- shortcuts ------------------------------------------------------------------------
    function shortcuts() {
        var wrap = h("div");
        var chips = h("div.filter-chips");
        [{ id: "all", title: "All" }].concat(AT.content.shortcutCategories).forEach(function (c) {
            chips.appendChild(h("button.filter-chip" + (scFilter === c.id ? ".on" : ""), { type: "button", on: { click: function () { scFilter = c.id; AT.app.rerender(); } } }, [h("span", { text: c.title })]));
        });
        wrap.appendChild(chips);
        var list = h("div.sc-list");
        AT.content.shortcuts.filter(function (s) { return scFilter === "all" || s.category === scFilter; }).forEach(function (s) {
            var row = h("div.sc-row" + (s.id === focusId ? ".flash" : ""), { id: "sc-" + s.id }, [
                h("div.sc-main", [h("span.sc-title", { text: s.title }), AT.ui.isBeginner() ? h("span.sc-what", { text: s.summary }) : null]),
                AT.ui.keycaps(s.keys),
                AT.ui.favButton(s.id)
            ]);
            list.appendChild(row);
        });
        wrap.appendChild(list);
        if (focusId) {
            var id = focusId;
            focusId = null;
            setTimeout(function () { var el = document.getElementById("sc-" + id); if (el) el.scrollIntoView({ block: "center" }); }, 50);
        }
        return wrap;
    }

    function focusShortcut(s) {
        sub = "shortcuts";
        scFilter = s.category;
        focusId = s.id;
        AT.app.rerender();
    }

    // ---- about this panel ------------------------------------------------------------------------
    function about() {
        var s = AT.store.get("settings");
        return h("div.about", [
            h("div.about-row", [h("span.about-k", { text: "Panel" }), h("div.about-v", [
                AT.ui.segmented([{ value: "comfortable", label: "Roomy" }, { value: "compact", label: "Compact" }], s.density || "comfortable",
                    function (v) { AT.store.update("settings", function (x) { x.density = v; }); AT.app.applySettings(); }, { cls: "seg-sm", label: "Density" })
            ])]),
            h("div.about-row", [h("span.about-k", { text: "Version" }), h("span.about-v.muted", { text: VERSION + (AT.bridge.isPreview() ? " · preview mode" : "") })]),
            h("div.about-row", [h("span.about-k", { text: "Made by" }), h("div.about-v.credit", [
                h("img", { src: "icons/logo.svg", alt: "" }),
                h("div.credit-text", [h("strong", { text: AUTHOR }), h("span", { text: "Motion designer" })]),
                h("button.btn.btn-sm.linkedin", { type: "button", title: LINKEDIN, on: { click: function () { AT.bridge.openURL(LINKEDIN); } } }, [AT.icon("linkedin"), h("span", { text: "LinkedIn" })])
            ])]),
            h("div.about-row", [h("span.about-k", { text: "Welcome" }), h("button.btn.btn-sm", { type: "button", text: "Replay the welcome", on: { click: function () { AT.app.onboarding(); } } })])
        ]);
    }

    function render(page) {
        page.appendChild(AT.ui.segmented([
            { value: "lessons", label: "Lessons", icon: "learn" },
            { value: "shortcuts", label: "Shortcuts", icon: "key" }
        ], sub, function (v) { sub = v; AT.app.rerender(); }, { cls: "seg-tabs", label: "Learn section" }));
        var body = sub === "shortcuts" ? shortcuts() : lessons();
        page.appendChild(h("div.learn-body", body));
        page.appendChild(AT.ui.section("About this panel", { icon: "info", cls: "sec-about" }, about()));
    }

    AT.learn = { openLesson: openLesson, focusShortcut: focusShortcut, VERSION: VERSION, LINKEDIN: LINKEDIN };
    AT.registerView({ id: "learn", title: "Learn", icon: "learn", render: render });
})(window.AT = window.AT || {});
