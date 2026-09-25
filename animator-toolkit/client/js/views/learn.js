/*
 * Learn: micro-lessons, explained shortcuts and guided workflows, plus the
 * panel's own settings (mode, density), version and "replay the welcome".
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var VERSION = "0.1.1";
    var sub = "lessons";
    var scFilter = "all";
    var focusId = null;
    var LEVELS = [["essential", "Essentials"], ["basics", "After Effects basics"], ["principles", "Animation principles"]];

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

    // ---- workflows -------------------------------------------------------------------------
    function workflows() {
        return h("div.wf-list", AT.content.workflows.map(function (w) {
            var p = progress().workflows[w.id] || {};
            var n = Object.keys(p).filter(function (k) { return p[k]; }).length;
            return h("button.wf", { type: "button", on: { click: function () { openWorkflow(w); } } }, [
                AT.illustration(w.illo, "wf-illo"),
                h("span.wf-main", [
                    h("span.wf-title", { text: w.title }),
                    h("span.wf-sub", { text: w.summary }),
                    h("span.wf-bar", h("i", { style: { width: Math.round(n / w.steps.length * 100) + "%" } }))
                ]),
                h("span.wf-meta", { text: w.minutes + " min" })
            ]);
        }));
    }

    function openWorkflow(w) {
        var p = progress().workflows[w.id] || {};
        var ol = h("ol.stepper");
        w.steps.forEach(function (st, i) {
            var check = h("input", { type: "checkbox", "aria-label": "Step " + (i + 1) + " done" });
            check.checked = !!p[i];
            check.addEventListener("change", function () {
                AT.store.update("progress", function (pr) {
                    pr.workflows[w.id] = pr.workflows[w.id] || {};
                    pr.workflows[w.id][i] = check.checked;
                });
                li.classList.toggle("done", check.checked);
            });
            var content = [];
            if (st["do"]) {
                var it = AT.catalog.get(st["do"]);
                var b = h("button.chip", { type: "button", on: { click: function () {
                    AT.run(it, null, b).then(function (res) {
                        if (res.ok && !check.checked) { check.checked = true; check.dispatchEvent(new Event("change")); }
                    });
                } } }, [it.type === "preset" ? AT.ui.preview(it.preview, it.phase) : AT.icon(it.icon), h("span", { text: it.title })]);
                content.push(b);
            } else if (st.learn) {
                var l = AT.catalog.get(st.learn);
                content.push(h("button.chip", { type: "button", on: { click: function () { openLesson(l); } } }, [AT.icon("learn"), h("span", { text: "Read: " + l.title })]));
            }
            if (st.text) content.push(h("p.step-text", { text: st.text }));
            if (st.note) content.push(h("p.step-note", { text: st.note }));
            var li = h("li.step" + (check.checked ? ".done" : ""), [h("label.step-check", [check, h("span.step-n", { text: String(i + 1) })]), h("div.step-body", content)]);
            ol.appendChild(li);
        });
        AT.app.sheet(w.title, [AT.illustration(w.illo, "sheet-illo"), h("p", { text: w.summary }), ol,
            h("button.btn.btn-block", { type: "button", text: "Reset checklist", on: { click: function () {
                AT.store.update("progress", function (pr) { delete pr.workflows[w.id]; });
                openWorkflow(w);
            } } })]);
    }

    // ---- about this panel ------------------------------------------------------------------------
    function about() {
        var s = AT.store.get("settings");
        return h("div.about", [
            h("div.about-row", [h("span.about-k", { text: "Panel" }), h("div.about-v", [
                AT.ui.segmented([{ value: "beginner", label: "Beginner" }, { value: "pro", label: "Pro" }], s.mode === "pro" ? "pro" : "beginner",
                    function (v) { AT.app.setMode(v); }, { cls: "seg-sm", label: "Mode" }),
                AT.ui.segmented([{ value: "comfortable", label: "Roomy" }, { value: "compact", label: "Compact" }], s.density || "comfortable",
                    function (v) { AT.store.update("settings", function (x) { x.density = v; }); AT.app.applySettings(); }, { cls: "seg-sm", label: "Density" })
            ])]),
            h("div.about-row", [h("span.about-k", { text: "Version" }), h("span.about-v.muted", { text: VERSION + (AT.bridge.isPreview() ? " · preview mode" : "") })]),
            h("div.about-row", [h("span.about-k", { text: "Welcome" }), h("button.btn.btn-sm", { type: "button", text: "Replay the welcome", on: { click: function () { AT.app.onboarding(); } } })])
        ]);
    }

    function render(page) {
        page.appendChild(AT.ui.segmented([
            { value: "lessons", label: "Lessons", icon: "learn" },
            { value: "shortcuts", label: "Shortcuts", icon: "key" },
            { value: "workflows", label: "Guides", icon: "list" }
        ], sub, function (v) { sub = v; AT.app.rerender(); }, { cls: "seg-tabs", label: "Learn section" }));
        var body = sub === "shortcuts" ? shortcuts() : sub === "workflows" ? workflows() : lessons();
        page.appendChild(h("div.learn-body", body));
        page.appendChild(AT.ui.section("About this panel", { icon: "info", cls: "sec-about" }, about()));
    }

    AT.learn = { openLesson: openLesson, openWorkflow: openWorkflow, focusShortcut: focusShortcut, VERSION: VERSION };
    AT.registerView({ id: "learn", title: "Learn", icon: "learn", render: render });
})(window.AT = window.AT || {});
