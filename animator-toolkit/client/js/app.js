/*
 * Application shell: header (brand + search), tab bar, view
 * switching, global search, selection polling, onboarding and the
 * lesson / workflow detail sheet.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var views = [];
    var current = null;
    var context = null;
    var pollTimer = null;
    var searchEl = null;
    var state = { phase: "in" };

    AT.state = state;

    AT.registerView = function (v) {
        views.push(v);
    };

    function view(id) {
        for (var i = 0; i < views.length; i++) if (views[i].id === id) return views[i];
        return views[0];
    }

    // ---- context ----------------------------------------------------------------
    function describeContext(c) {
        if (!c) return { text: "Connecting…", state: "idle" };
        if (!c.project) return { text: "No project open", state: "warn" };
        if (!c.comp) return { text: "No comp open", state: "warn" };
        var n = c.layerCount || 0;
        if (!n) return { text: c.comp.name + " · nothing selected", state: "idle" };
        var kinds = Object.keys(c.kinds || {});
        var what = kinds.length === 1 ? kinds[0] + " layer" : "layer";
        var t = n === 1 ? c.layers[0].name + " (" + kinds[0] + ")" : n + " " + what + "s";
        if (c.selectedKeys) t += " · " + c.selectedKeys + " keys";
        return { text: t, state: "ok" };
    }

    function renderContext() {
        var chip = document.getElementById("context");
        if (!chip) return;
        var d = describeContext(context);
        chip.className = "context ctx-" + d.state;
        chip.querySelector(".context-text").textContent = d.text;
        chip.title = AT.bridge.isPreview() ? "Preview mode — not connected to After Effects" : d.text;
    }

    // One inspect at a time: if After Effects is busy (rendering, a long
    // operation) requests must not pile up in its script queue.
    var inspecting = null;
    function refreshContext() {
        if (inspecting) return inspecting;
        inspecting = AT.bridge.run("context.inspect").then(function (res) {
            inspecting = null;
            if (!res.ok) return;
            var before = JSON.stringify(context);
            context = res.result;
            renderContext(); // cheap: one chip's text
            // Views only re-render when the selection actually changed.
            if (before !== JSON.stringify(context) && current && current.onContext) current.onContext(context);
        }, function () { inspecting = null; });
        return inspecting;
    }

    // Poll only while the panel is visible: CEP has no selection events.
    // While disconnected, retry the host at most every 10 s (a boot loads
    // 12 script files, so it must not run on every tick).
    var lastBootTry = 0;
    function startPolling() {
        clearInterval(pollTimer);
        pollTimer = setInterval(function () {
            if (document.visibilityState !== "visible" || document.querySelector(".is-busy")) return;
            if (!AT.bridge.isPreview() && !AT.bridge.status().booted) {
                if (Date.now() - lastBootTry < 10000) return;
                lastBootTry = Date.now();
                AT.bridge.boot(1).then(function () { hostBanner(null); refreshContext(); }, function () {});
                return;
            }
            refreshContext();
        }, 2000);
    }

    // ---- views ---------------------------------------------------------------------
    function show(id) {
        closeSearch();
        current = view(id);
        document.querySelectorAll(".tab").forEach(function (t) {
            var on = t.dataset.view === current.id;
            t.classList.toggle("on", on);
            t.setAttribute("aria-selected", on ? "true" : "false");
        });
        var main = document.getElementById("view");
        main.innerHTML = "";
        var page = h("div.page.page-" + current.id);
        main.appendChild(page);
        current.render(page, context);
        main.scrollTop = 0;
        requestAnimationFrame(function () { page.classList.add("in"); });
        if (AT.store.get("settings").lastView !== current.id) {
            AT.store.update("settings", function (s) { s.lastView = current.id; });
        }
    }

    function rerender() {
        if (current) {
            var main = document.getElementById("view");
            var top = main.scrollTop;
            show(current.id);
            main.scrollTop = top;
        }
    }

    // ---- search ----------------------------------------------------------------------
    var TYPE_LABEL = { action: "Tool", preset: "Preset", lesson: "Lesson", shortcut: "Shortcut" };

    function runSearch(q) {
        var panel = document.getElementById("search-results");
        if (!q.trim()) {
            closeSearch();
            return;
        }
        AT.search.build(AT.catalog.all(), AT.favorites.items());
        var results = AT.search.query(q, 24);
        panel.innerHTML = "";
        panel.hidden = false;
        document.body.classList.add("searching");
        if (!results.length) {
            panel.appendChild(AT.ui.empty("welcome", "Nothing for “" + q + "”", "Try a simpler word — anchor, ease, fade, camera, text."));
            return;
        }
        results.forEach(function (r, i) {
            var it = r.item;
            var row = h("button.result" + (i === 0 ? ".active" : ""), {
                type: "button",
                on: { click: function () { activate(it, row); } }
            }, [
                h("span.result-icon.t-" + it.type, it.type === "shortcut" ? AT.icon("key") : AT.icon(it.type === "lesson" ? "learn" : it.type === "workflow" ? "list" : it.icon || "sparkle")),
                h("span.result-main", [
                    h("span.result-title", [r.favorite ? h("span.result-star", "★ ") : null, r.favorite ? r.favorite.label : it.title]),
                    h("span.result-sub", { text: it.type === "shortcut" ? it.keys + " — " + it.summary : it.summary })
                ]),
                h("span.result-type", { text: TYPE_LABEL[it.type] })
            ]);
            panel.appendChild(row);
        });
    }

    function activate(item, row) {
        if (item.type === "action" || item.type === "preset") {
            AT.run(item, null, row);
        } else {
            AT.app.open(item);
        }
    }

    function closeSearch() {
        var panel = document.getElementById("search-results");
        if (panel) {
            panel.hidden = true;
            panel.innerHTML = "";
        }
        document.body.classList.remove("searching");
    }

    // ---- detail sheet (lessons, workflows, shortcuts) ------------------------------------
    function sheet(title, body) {
        closeSheet();
        var el = h("div.sheet-wrap", { on: { click: function (e) { if (e.target === el) closeSheet(); } } }, [
            h("div.sheet", { role: "dialog", "aria-label": title }, [
                h("div.sheet-head", [
                    h("h2.sheet-title", { text: title }),
                    h("button.sheet-close", { type: "button", "aria-label": "Close", on: { click: closeSheet } }, AT.icon("close"))
                ]),
                h("div.sheet-body", body)
            ])
        ]);
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.classList.add("in"); });
        var btn = el.querySelector(".sheet-close");
        if (btn) btn.focus();
    }

    function closeSheet() {
        var el = document.querySelector(".sheet-wrap");
        if (el) el.remove();
    }

    function open(item) {
        closeSearch();
        if (item.type === "lesson") return AT.learn.openLesson(item);
        if (item.type === "shortcut") {
            show("learn");
            AT.learn.focusShortcut(item);
            return;
        }
        show(item.view);
    }

    // ---- onboarding -------------------------------------------------------------------------
    function onboarding() {
        var step = 0;
        var wrap = h("div.onboard", { role: "dialog", "aria-label": "Welcome" });
        function render() {
            wrap.innerHTML = "";
            var card = h("div.onboard-card");
            wrap.appendChild(card);
            var dots = h("div.onboard-dots", [0, 1].map(function (i) { return h("span" + (i === step ? ".on" : "")); }));
            if (step === 0) {
                card.appendChild(AT.illustration("welcome", "onboard-illo"));
                card.appendChild(h("h2", { text: "Welcome to the Amir Anderson Animator Toolkit" }));
                card.appendChild(h("p", { text: "Fast tools for the things you do all day in After Effects — and a short explanation of each, so you learn the program while you work." }));
                card.appendChild(h("button.btn.btn-primary.btn-block", { type: "button", text: "Get started", on: { click: function () { step = 1; render(); } } }));
            } else {
                card.appendChild(h("h2", { text: "Start with 5 essential skills" }));
                card.appendChild(h("p", { text: "Each takes about a minute. They're always under Learn." }));
                var ol = h("ol.essentials");
                AT.content.essentials.forEach(function (id) {
                    var l = AT.catalog.get(id);
                    ol.appendChild(h("li", [h("span", { text: l.title }), h("span.muted", { text: Math.round(l.seconds / 60 * 10) / 10 + " min" })]));
                });
                card.appendChild(ol);
                card.appendChild(h("div.row", [
                    h("button.btn.btn-primary", { type: "button", text: "First lesson", on: { click: function () { finish(); AT.app.open(AT.catalog.get(AT.content.essentials[0])); } } }),
                    h("button.btn", { type: "button", text: "Start working", on: { click: finish } })
                ]));
            }
            card.appendChild(dots);
            requestAnimationFrame(function () { card.classList.add("in"); });
        }
        function finish() {
            AT.store.update("settings", function (s) { s.onboarded = true; });
            wrap.remove();
            rerender();
        }
        document.body.appendChild(wrap);
        render();
    }

    // ---- settings ------------------------------------------------------------------------------
    function applySettings() {
        var s = AT.store.get("settings");
        // One mode for everyone: explanations stay on (Pro mode was removed).
        document.body.classList.remove("mode-pro");
        document.body.classList.add("mode-beginner");
        document.body.classList.toggle("density-compact", s.density === "compact");
    }


    // ---- host connection ----------------------------------------------------------------
    // Boots the host scripts (retrying: the ExtendScript engine can still be
    // busy while After Effects starts). On failure, a persistent banner says
    // why and offers Retry, instead of every button silently failing.
    function connect(retries) {
        hostBanner(null);
        return AT.bridge.boot(retries).then(function () {
            refreshContext();
            startPolling();
        }).catch(function (err) {
            hostBanner(err.message);
            startPolling();
        });
    }

    function hostBanner(message) {
        var old = document.getElementById("host-banner");
        if (old) old.remove();
        if (!message) return;
        var retry = h("button.btn.btn-sm", { type: "button", text: "Retry", on: { click: function () {
            retry.disabled = true;
            connect(2).then(function () { if (AT.bridge.status().booted) AT.toast("✓ Connected to After Effects", "ok"); });
        } } });
        var banner = h("div#host-banner.host-banner", { role: "alert" }, [
            h("div.host-banner-text", [h("strong", { text: "Buttons can't reach After Effects. " }), message]),
            retry
        ]);
        var header = document.querySelector(".header");
        header.parentNode.insertBefore(banner, header.nextSibling);
    }

    // ---- boot ----------------------------------------------------------------------------------
    function buildShell() {
        var root = document.getElementById("app");
        root.innerHTML = "";
        searchEl = h("input#search.search-input", {
            type: "search", placeholder: "Search tools, presets, lessons…  ( / )", autocomplete: "off", spellcheck: "false", "aria-label": "Search"
        });
        searchEl.addEventListener("input", function () { runSearch(searchEl.value); });
        searchEl.addEventListener("keydown", function (e) {
            var rows = Array.prototype.slice.call(document.querySelectorAll(".result"));
            var idx = rows.findIndex(function (r) { return r.classList.contains("active"); });
            if (e.key === "Escape") { searchEl.value = ""; closeSearch(); searchEl.blur(); }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (!rows.length) return;
                if (idx >= 0) rows[idx].classList.remove("active");
                idx = (idx + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length;
                rows[idx].classList.add("active");
                rows[idx].scrollIntoView({ block: "nearest" });
            }
            if (e.key === "Enter" && idx >= 0) rows[idx].click();
        });

        var header = h("header.header", [
            h("div.header-row", [
                h("div.brand", [h("img.brand-logo", { src: "icons/logo.svg", alt: "" }), h("span.brand-name", { text: "Amir Anderson Animator Toolkit" })]),
                h("span.header-spacer")
            ]),
            h("div.search", [AT.icon("search", "search-ico"), searchEl])
        ]);

        var nav = h("nav.tabs", { role: "tablist", "aria-label": "Sections" }, views.map(function (v, i) {
            return h("button.tab", {
                type: "button", role: "tab", "data-view": v.id, title: v.title + " (" + (i + 1) + ")",
                on: { click: function () { show(v.id); } }
            }, [AT.icon(v.icon), h("span.tab-label", { text: v.title })]);
        }));

        if (AT.bridge.isPreview()) {
            root.appendChild(h("div.preview-banner", { text: "Preview mode — open inside After Effects to control a project." }));
        }
        root.appendChild(header);
        root.appendChild(nav);
        root.appendChild(h("div#search-results.results", { hidden: true, role: "listbox" }));
        root.appendChild(h("main#view.view"));
        root.appendChild(h("div#toast.toast-region", { "aria-live": "polite" }));
        document.addEventListener("keydown", function (e) {
            var typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
            if (typing) return;
            if (e.key === "/") { e.preventDefault(); searchEl.focus(); }
            var n = parseInt(e.key, 10);
            if (n >= 1 && n <= views.length && !e.metaKey && !e.ctrlKey) show(views[n - 1].id);
        });
    }

    function boot() {
        AT.store.init();
        AT.catalog.build();
        buildShell();
        applySettings();
        var s = AT.store.get("settings");
        show(s.lastView && view(s.lastView).id === s.lastView ? s.lastView : "home");
        renderContext();
        connect(4);
        if (!s.onboarded) onboarding();
        document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refreshContext(); });
    }

    AT.app = {
        boot: boot,
        show: show,
        rerender: rerender,
        open: open,
        sheet: sheet,
        closeSheet: closeSheet,
        refreshContext: refreshContext,
        connect: connect,
        current: function () { return current ? current.id : null; },
        context: function () { return context; },
        applySettings: applySettings,
        onboarding: onboarding,
        describeContext: describeContext
    };

    document.addEventListener("DOMContentLoaded", function () {
        try {
            boot();
        } catch (err) {
            document.getElementById("app").innerHTML = '<div class="fatal"><h2>The panel couldn\'t start</h2><p></p></div>';
            document.querySelector(".fatal p").textContent = err && err.message ? err.message : String(err);
            throw err;
        }
    });
})(window.AT = window.AT || {});
