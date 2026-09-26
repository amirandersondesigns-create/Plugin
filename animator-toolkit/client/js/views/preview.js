/*
 * Preview: animate at real-time speed. One-click setups (each card lists
 * exactly what it sets, ticked as After Effects confirms it), resolution
 * cards, choice rows with one line of explanation, and the Preview-panel
 * settings (which scripting can't change) as a compact board.
 *
 * Highlights follow YOUR clicks: the button you press lights up and stays
 * lit. The tab reads After Effects' settings once when it opens; clicks
 * update that state from each command's own reply.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    // st: the tab's view of the settings. syncs: re-light every row from st
    // (used when a setup card changes several settings at once).
    var st = {}, syncs = [], setupMode = null;
    function syncAll() { syncs.forEach(function (fn) { fn(); }); }
    function setMode(m) {
        setupMode = m;
        AT.store.update("settings", function (x) { x.previewMode = m; });
    }

    // A row of mutually exclusive choices. Clicking runs the tool; the line
    // below always explains the active (or hovered) choice.
    function optionRow(ids, isOn, label, onPick, rowCls) {
        var items = ids.map(function (id) { return AT.catalog.get(id); });
        var active = items.filter(isOn)[0] || items[0];
        var line = h("p.option-why", { text: active.why });
        var row = h("div.option-row" + (rowCls ? "." + rowCls : ""), { role: "radiogroup" }, items.map(function (item) {
            var content = label(item);
            var b = h("button.option" + (item === active ? ".on" : ""), { type: "button", role: "radio", "aria-checked": item === active ? "true" : "false", title: item.summary, on: {
                click: function () {
                    AT.run(item, null, b).then(function (res) {
                        if (!AT.worked(res)) return;
                        if (onPick) onPick(item, res);
                        syncAll(); // lights this button; clears a setup card that no longer applies
                        mark(item);
                    });
                },
                mouseenter: function () { line.textContent = item.why; },
                mouseleave: function () { line.textContent = active.why; }
            } }, typeof content === "string" ? [h("span", { text: content }), item.tag ? h("sup.opt-tag", { text: item.tag }) : null] : content);
            return b;
        }));
        var buttons = row.children;
        function mark(item) {
            active = item;
            items.forEach(function (it, i) { buttons[i].classList.toggle("on", it === item); buttons[i].setAttribute("aria-checked", it === item ? "true" : "false"); });
            line.textContent = item.why;
        }
        syncs.push(function () { var a = items.filter(isOn)[0]; if (a) mark(a); });
        return h("div", [row, line]);
    }

    // A lit ball drawn on a 36x36 grid in blocks: roughly how the viewer
    // looks at Full (1), Half (3), Third (4) and Quarter (6); exaggerated
    // a little so the difference reads at icon size.
    var SVGNS = "http://www.w3.org/2000/svg";
    var BLOCK = { 1: 1, 2: 3, 3: 4, 4: 6 };
    function pixelArt(f, cls) {
        var b = BLOCK[f], R = 15;
        var svg = document.createElementNS(SVGNS, "svg");
        svg.setAttribute("viewBox", "0 0 36 36");
        svg.setAttribute("class", "res-art" + (cls ? " " + cls : ""));
        svg.setAttribute("aria-hidden", "true");
        for (var y = 0; y < 36; y += b) {
            for (var x = 0; x < 36; x += b) {
                var cx = x + b / 2 - 18, cy = y + b / 2 - 18;
                if (Math.sqrt(cx * cx + cy * cy) > R) continue;
                // Light from the top-left.
                var lx = cx + 6, ly = cy + 6, l = Math.sqrt(lx * lx + ly * ly) / R;
                var r = document.createElementNS(SVGNS, "rect");
                r.setAttribute("x", x); r.setAttribute("y", y);
                r.setAttribute("width", b); r.setAttribute("height", b);
                r.setAttribute("class", l < 0.35 ? "px-hi" : l < 0.8 ? "px-mid" : "px-lo");
                svg.appendChild(r);
            }
        }
        return svg;
    }

    var RES_CARD = {
        auto: { name: "Auto", note: "follows zoom" },
        1: { name: "Full", note: "every pixel" },
        2: { name: "Half", note: "\u00bc the pixels" },
        3: { name: "Third", note: "1/9 the pixels" },
        4: { name: "Quarter", note: "1/16 the pixels" }
    };
    function resCard(item) {
        var key = item.payload.auto ? "auto" : item.payload.factor;
        var art = key === "auto"
            ? h("span.res-stage.res-auto", [pixelArt(4, "a4"), pixelArt(3, "a3"), pixelArt(2, "a2"), pixelArt(1, "a1"), h("span.res-zoom", AT.icon("search"))])
            : h("span.res-stage", pixelArt(key));
        return [art, h("span.res-name", { text: RES_CARD[key].name }), h("span.res-note", { text: RES_CARD[key].note })];
    }

    // Preview panel settings (Window > Preview). After Effects doesn't let
    // plugins change these, so the board is a chooser: pick values for
    // Animating and for Final check, and copy them into the Preview panel.
    // [key, label, options, recommended animating, recommended final, what it does]
    function skipWhy(n) { return n === 0 ? "Skip 0: every frame is rendered: true timing." : "Skip " + n + ": renders 1 of every " + (n + 1) + " frames, about " + (n + 1) + "x faster, choppier."; }
    var PANEL = [
        { key: "fps", name: "Frame Rate", options: ["Auto", "12", "15", "24", "25", "29.97", "30"], anim: "Auto", final: "Auto",
          why: function (v) { return v === "Auto" ? "Frame Rate: Auto plays at the comp's rate." : "Frame Rate " + v + ": plays " + v + " frames a second; lower plays sooner but choppier. Timing isn't changed."; } },
        { key: "skip", name: "Skip", options: ["0", "1", "2", "3", "4"], anim: "1", final: "0",
          why: function (v) { return skipWhy(+v); } },
        { key: "res", name: "Resolution", options: ["Auto", "Full", "Half", "Third", "Quarter"], anim: "Auto", final: "Full",
          why: function (v) { return v === "Auto" ? "Resolution Auto: the preview follows the viewer's resolution." : "Resolution " + v + ": " + ({ Full: "every pixel.", Half: "1/4 of the pixels.", Third: "1/9 of the pixels.", Quarter: "1/16 of the pixels." })[v]; } },
        { key: "cache", name: "Cache", options: ["Off", "On"], anim: "Off", final: "On",
          why: function (v) { return v === "On" ? "Cache Before Playback On: renders the range first, then plays in true real time." : "Cache Before Playback Off: plays straight away, as fast as frames render."; } },
        { key: "range", name: "Range", options: ["Work Area + Time", "Work Area", "Entire Duration", "Around Time"], anim: "Work Area + Time", final: "Work Area",
          why: function (v) { return ({ "Work Area + Time": "Range: Work Area Extended by Current Time: the work area, stretched to include the playhead.", "Work Area": "Range: Work Area only. Set it with B and N.", "Entire Duration": "Range: the whole comp. Slowest to cache.", "Around Time": "Range: Play Around Current Time: a few seconds either side of the playhead." })[v]; } },
        { key: "from", name: "Play From", options: ["Current Time", "Range Start"], anim: "Current Time", final: "Range Start",
          why: function (v) { return v === "Current Time" ? "Play From: the playhead." : "Play From: the start of the range, every time."; } }
    ];
    function panelValues() {
        var saved = AT.store.get("settings").previewPanel || {};
        var out = { anim: {}, final: {} };
        PANEL.forEach(function (r) {
            ["anim", "final"].forEach(function (m) {
                var v = saved[m] && saved[m][r.key];
                out[m][r.key] = r.options.indexOf(v) >= 0 ? v : r[m];
            });
        });
        return out;
    }
    function panelBoard() {
        var mode = "anim", picked = 1; // Skip
        var vals = panelValues();
        var why = h("p.option-why.pp-why");
        var grid = h("div.pp-grid");
        var chooser = h("div.option-row.pp-choices", { role: "radiogroup" });
        var legend = h("span");
        function save() { AT.store.update("settings", function (x) { x.previewPanel = vals; }); }
        var tiles = PANEL.map(function (r, i) {
            var val = h("span.pp-val");
            var t = h("button.pp-tile", { type: "button", "aria-label": r.name, on: {
                click: function () { picked = i; paint(); },
                mouseenter: function () { why.textContent = r.why(vals[mode][r.key]); },
                mouseleave: function () { why.textContent = PANEL[picked].why(vals[mode][PANEL[picked].key]); }
            } }, [h("span.pp-name", { text: r.name }), val]);
            t.val = val;
            grid.appendChild(t);
            return t;
        });
        function paint() {
            var changes = 0;
            tiles.forEach(function (t, i) {
                var r = PANEL[i], v = vals[mode][r.key];
                if (t.val.textContent !== v) {
                    t.val.textContent = v;
                    t.val.classList.remove("flip");
                    void t.val.offsetWidth; // restart the animation
                    t.val.classList.add("flip");
                }
                var differs = vals.anim[r.key] !== vals.final[r.key];
                if (differs) changes++;
                t.classList.toggle("changes", differs);
                t.classList.toggle("on", i === picked);
            });
            // The picked setting's choices, current one lit.
            var r = PANEL[picked];
            chooser.innerHTML = "";
            chooser.setAttribute("aria-label", r.name);
            r.options.forEach(function (o) {
                var on = vals[mode][r.key] === o;
                chooser.appendChild(h("button.option" + (on ? ".on" : ""), { type: "button", role: "radio", "aria-checked": on ? "true" : "false", on: {
                    click: function () { vals[mode][r.key] = o; save(); paint(); },
                    mouseenter: function () { why.textContent = r.why(o); },
                    mouseleave: function () { why.textContent = r.why(vals[mode][r.key]); }
                } }, h("span", { text: o })));
            });
            why.textContent = r.why(vals[mode][r.key]);
            legend.textContent = changes + " settings change for the final check";
        }
        var seg = AT.ui.segmented([{ value: "anim", label: "Animating", icon: "bolt" }, { value: "final", label: "Final check", icon: "check" }], mode,
            function (v) { mode = v; paint(); }, { cls: "pp-seg", label: "Preview panel values for" });
        paint();
        return h("div", [
            seg,
            grid,
            h("div.sub-label.pp-choose-label", { text: "Choose a value" }),
            chooser,
            why,
            h("p.hint.pp-note", { text: "After Effects doesn't let plugins change the Preview panel, so copy these into Window > Preview (Ctrl/Cmd+3). Your picks are saved here." }),
            h("div.pp-foot", [
                h("span.pp-legend", [h("span.pp-dot"), legend]),
                h("button.link.pp-reset", { type: "button", text: "Reset to recommended", on: { click: function () {
                    AT.store.update("settings", function (x) { delete x.previewPanel; });
                    vals = panelValues(); paint();
                } } })
            ]),
            h("div.pp-keys", [AT.ui.keycaps("Space"), h("span", { text: "play" }), AT.ui.keycaps("Numpad 0"), h("span", { text: "cache + play" })])
        ]);
    }

    // Real on/off switch; snaps back if After Effects refuses.
    function transparencyToggle(on) {
        // Sends the exact state wanted (not "flip"), then shows what After
        // Effects reports, so the switch can't drift out of step with the
        // viewer even if a reply is lost. Not an undo step: click to turn off.
        var tg = AT.ui.toggle("Transparency grid (checkerboard)", on, function (v) {
            var input = tg.querySelector("input");
            AT.run("viewer.transparency", { on: v }).then(function (res) {
                if (res.ok && res.result) input.checked = !!res.result.on;
                else if (!res.unconfirmed) input.checked = !v;
                st.transparency = input.checked;
            });
        });
        tg.classList.add("tg-transparency");
        return tg;
    }

    // One-click setup card. It lists exactly what it sets; while it's the
    // active setup each part is ticked, or flagged if After Effects didn't
    // take it (Fast Previews needs the Composition viewer).
    var SETUPS = {
        fast:  { id: "preview.mode.fast",  target: { resolution: 2, fastPreview: "adaptive", draft3d: true } },
        final: { id: "preview.mode.final", target: { resolution: 1, fastPreview: "off", draft3d: false } }
    };
    var PARTS = [
        ["resolution", "Resolution", function (v) { return { 1: "Full", 2: "Half", 3: "Third", 4: "Quarter" }[v] || "-"; }],
        ["fastPreview", "Fast Previews", function (v) { return v === "adaptive" ? "Adaptive" : v === "off" ? "Off" : "-"; }],
        ["draft3d", "Draft 3D", function (v) { return v ? "On" : "Off"; }]
    ];
    function setupCard(mode, afterClick) {
        var def = SETUPS[mode], item = AT.catalog.get(def.id);
        var list = h("span.setup-list");
        var status = h("span.setup-status");
        var b = h("button.setup", { type: "button", "aria-pressed": "false", on: { click: function () {
            AT.run(item, null, b).then(function (res) {
                if (!AT.worked(res)) return;
                var applied = res.ok && res.result && res.result.applied;
                PARTS.forEach(function (p) {
                    var k = p[0];
                    if (!applied) st[k] = def.target[k];                 // reply lost: assume it ran
                    else if (applied[k] !== null && applied[k] !== undefined) st[k] = applied[k];
                });
                setMode(mode);
                if (afterClick) afterClick();
                syncAll();
            });
        } } }, [
            h("span.setup-head", [h("span.setup-icon", AT.icon(item.icon)), h("span.setup-title", { text: item.title }), status]),
            list
        ]);
        syncs.push(function () {
            // A card stays lit until you change one of its settings by hand.
            if (setupMode === mode && PARTS[0] && st.resolution !== undefined && st.resolution !== def.target.resolution) setupMode = null;
            var on = setupMode === mode;
            b.classList.toggle("on", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
            status.textContent = on ? "Active" : "";
            list.innerHTML = "";
            PARTS.forEach(function (p) {
                var want = def.target[p[0]], ok = st[p[0]] === want;
                list.appendChild(h("span.setup-part" + (on ? (ok ? ".ok" : ".miss") : ""), [
                    h("span.setup-tick", on ? AT.icon(ok ? "check" : "info") : null),
                    h("span", { text: p[1] + ": " + p[2](want) })
                ]));
            });
            if (on && PARTS.some(function (p) { return st[p[0]] !== def.target[p[0]]; })) {
                list.appendChild(h("span.setup-note", { text: "Click the Composition viewer once, then press this again." }));
            }
        });
        return b;
    }

    function render(page) {
        page.appendChild(AT.ui.lead("Animate fast, then check at full quality before you render. Timing never changes."));
        var body = h("div");
        page.appendChild(body);
        syncs = [];
        AT.bridge.run("preview.read").then(function (res) {
            if (!document.body.contains(body)) return;
            st = res.ok && res.result ? res.result : {};
            // Remember the last one-click setup, if its resolution still matches.
            var saved = AT.store.get("settings").previewMode;
            setupMode = SETUPS[saved] && (st.resolution === undefined || st.resolution === SETUPS[saved].target.resolution) ? saved : null;
            function notAuto() { auto = false; AT.store.update("settings", function (x) { x.previewResAuto = false; }); }
            function handPicked() { if (setupMode) setMode(null); }

            var auto = !!AT.store.get("settings").previewResAuto;
            body.appendChild(AT.ui.section("One-click setup", { icon: "bolt", hint: "pick one; it stays lit while it's active" }, h("div", [
                h("div.setup-row", [setupCard("fast", notAuto), setupCard("final", notAuto)]),
                h("div.sub-label", { text: "Resolution (Down Sample Factor)" }),
                optionRow(["preview.res.auto", "preview.res.1", "preview.res.2", "preview.res.3", "preview.res.4"],
                    function (it) { return it.payload.auto ? auto : !auto && it.payload.factor === (st.resolution || 1); },
                    resCard,
                    function (it, res) {
                        auto = !!it.payload.auto;
                        AT.store.update("settings", function (x) { x.previewResAuto = auto; });
                        st.resolution = res.ok && res.result && res.result.factor ? res.result.factor : it.payload.factor || st.resolution;
                        handPicked();
                    },
                    "res-cards"),
                h("details.more", [h("summary", { text: "Custom and shortcuts" }), h("p", { text: "Custom sets any factor, e.g. every 6th pixel for heavy comps (Ctrl/Cmd+Alt+J). Shortcuts: Ctrl/Cmd+J Full, Ctrl/Cmd+Shift+J Half, Ctrl/Cmd+Alt+Shift+J Quarter. After Effects' own live Auto is in the viewer's resolution menu." })])
            ])));

            body.appendChild(AT.ui.section("Viewer", { icon: "checker", hint: "buttons under the viewer" }, h("div", [
                transparencyToggle(!!st.transparency),
                h("p.hint.tg-note", { text: "A viewer setting, like the button under the viewer: click again to turn it off. After Effects doesn't put viewer settings in Undo." })
            ])));

            body.appendChild(AT.ui.section("Fast Previews", { icon: "bolt", hint: "how the viewer draws while you drag" },
                optionRow(["preview.fast.off", "preview.fast.adaptive", "preview.fast.draft", "preview.fast.fastDraft", "preview.fast.wireframe"],
                    function (it) { return it.payload.mode === (st.fastPreview || "off"); },
                    function (it) { return it.title.replace(" (Final Quality)", "").replace(" Resolution", ""); },
                    function (it) { st.fastPreview = it.payload.mode; handPicked(); })));

            body.appendChild(AT.ui.section("Color depth", { icon: "sparkle", hint: "project-wide" },
                optionRow(["project.bpc.8", "project.bpc.16", "project.bpc.32"],
                    function (it) { return it.payload.bits === (st.bpc || 8); },
                    function (it) { return it.title; },
                    function (it) { st.bpc = it.payload.bits; })));

            body.appendChild(AT.ui.section("Preview panel", { icon: "gauge", hint: "Ctrl/Cmd+3 \u00b7 set by hand" }, panelBoard()));

            body.appendChild(AT.ui.section("Speed tools", { icon: "clock" },
                h("div.tool-grid", ["preview.draft3d", "preview.workArea.90", "preview.workArea.180", "preview.purge"].map(function (id) { return AT.ui.toolButton(id); }))));

            syncAll();
            var lesson = AT.catalog.get("lesson.preview-speed");
            body.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Previewing at full speed'", on: { click: function () { AT.app.open(lesson); } } })])]));
        });
    }

    AT.registerView({ id: "preview", title: "Preview", icon: "gauge", render: render });
})(window.AT = window.AT || {});
