// Copyright (c) 2026 Amir Anderson. All rights reserved. Unauthorized copying,
// recreation or distribution is prohibited. See LICENSE.txt.
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

    // A copy of After Effects' Preview panel (Window > Preview), laid out
    // the same way: Shortcut, Include, Cache Before Playback, Range, Play
    // From, Frame Rate / Skip / Resolution, Full Screen and the "On Stop"
    // options. After Effects doesn't let plugins read or change this panel,
    // so it's a planner: set it here per shortcut, then copy it across.
    var SHORTCUTS = ["Spacebar", "Shift + Spacebar", "Numpad 0", "Shift + Numpad 0", "Alt + Numpad 0"];
    var PP_FIELDS = {
        range: { label: "Range", options: ["Work Area", "Work Area Extended By Current Time", "Entire Duration", "Play Around Current Time"] },
        from: { label: "Play From", options: ["Current Time", "Start of Range"] },
        fps: { label: "Frame Rate", options: ["Auto", "15", "24", "25", "29.97", "30", "59.94", "60", "120"] }, // as in After Effects' list
        skip: { label: "Skip", options: ["0", "1", "2", "5"] },
        res: { label: "Resolution", options: ["Auto", "Full", "Half", "Third", "Quarter"] }
    };
    // After Effects' own starting values (as in its Spacebar shortcut).
    var PP_DEFAULT = { video: true, audio: true, overlays: false, external: false, cache: false,
        range: "Work Area Extended By Current Time", from: "Current Time", fps: "Auto", skip: "0", res: "Auto",
        fullScreen: false, playCached: false, moveTime: true };
    var PP_PRESETS = {
        animating: { cache: false, range: "Work Area Extended By Current Time", from: "Current Time", fps: "Auto", skip: "1", res: "Auto", playCached: true },
        final: { cache: true, range: "Work Area", from: "Start of Range", fps: "Auto", skip: "0", res: "Full", playCached: false }
    };
    function ppWhy(key, v, fps) {
        switch (key) {
            case "video": return "Include video: " + (v ? "on. The frames play." : "off. Only audio plays.");
            case "audio": return "Include audio: " + (v ? "on. Sound plays with the preview." : "off. Silent previews start sooner.");
            case "overlays": return "Include overlays and layer controls: " + (v ? "on. Handles, paths and guides stay visible while it plays." : "off. A clean picture while it plays.");
            case "external": return "Include external video (Mercury Transmit): " + (v ? "on. Also plays on a connected video monitor." : "off.");
            case "cache": return "Cache Before Playback: " + (v ? "on. Renders the whole range first, then plays in true real time." : "off. Plays straight away, as fast as frames render.");
            case "range": return { "Work Area": "Range: Work Area only. Set it with B and N.", "Work Area Extended By Current Time": "Range: the work area, stretched to include the playhead if it's outside.", "Entire Duration": "Range: the whole comp. Slowest to cache.", "Play Around Current Time": "Range: a few seconds either side of the playhead." }[v];
            case "from": return v === "Current Time" ? "Play From: the playhead." : "Play From: the start of the range, every time.";
            case "fps": return v === "Auto" ? "Frame Rate (" + fps + "): Auto plays at the comp's own rate." : "Frame Rate " + v + ": plays " + v + " frames a second. Lower plays sooner but choppier; timing isn't changed.";
            case "skip": return v === "0" ? "Skip 0: every frame is rendered, so timing is exact." : "Skip " + v + ": renders 1 of every " + (+v + 1) + " frames, about " + (+v + 1) + "x faster, choppier.";
            case "res": return v === "Auto" ? "Resolution Auto: the preview follows the viewer's resolution." : "Resolution " + v + ": " + { Full: "every pixel.", Half: "1/4 of the pixels.", Third: "1/9 of the pixels.", Quarter: "1/16 of the pixels." }[v];
            case "fullScreen": return "Full Screen: " + (v ? "on. Plays the comp alone on screen." : "off.");
            case "playCached": return "If caching, play cached frames: " + (v ? "on. Stopping while it caches plays what's ready." : "off. Stopping while it caches just stops.");
            case "moveTime": return "Move time to preview time: " + (v ? "on. The playhead stays where you stopped." : "off. The playhead jumps back to where it started.");
        }
        return "";
    }
    function panelBoard() {
        var mac = /Mac/.test(navigator.platform);
        var saved = AT.store.get("settings").previewPanel2 || {};
        var shortcut = saved.last && SHORTCUTS.indexOf(saved.last) >= 0 ? saved.last : "Spacebar";
        var fps = (AT.app && AT.app.context && AT.app.context() && AT.app.context().comp && AT.app.context().comp.fps) || 29.97;
        function vals() {
            var v = {}, s2 = (AT.store.get("settings").previewPanel2 || {})[shortcut] || {};
            for (var k in PP_DEFAULT) v[k] = s2[k] !== undefined ? s2[k] : PP_DEFAULT[k];
            return v;
        }
        var cur = vals();
        var why = h("p.option-why.pp-why");
        var form = h("div.pp-form");
        function save() {
            AT.store.update("settings", function (x) {
                x.previewPanel2 = x.previewPanel2 || {};
                x.previewPanel2[shortcut] = cur;
                x.previewPanel2.last = shortcut;
            });
        }
        function set(key, v) { cur[key] = v; save(); why.textContent = ppWhy(key, v, fps); draw(); }
        function explain(el, key) {
            el.addEventListener("mouseenter", function () { why.textContent = ppWhy(key, cur[key], fps); });
            el.addEventListener("focus", function () { why.textContent = ppWhy(key, cur[key], fps); });
        }
        function select(key, extraCls) {
            var f = PP_FIELDS[key];
            var sel = h("select.pp-select" + (extraCls ? "." + extraCls : ""), { "aria-label": f.label, "data-key": key });
            f.options.forEach(function (o) {
                var label = key === "fps" && o === "Auto" ? "(" + fps + ")" : key === "range" && o === "Play Around Current Time" ? "Play Around Current Time..." : o;
                var opt = h("option", { value: o, text: label });
                if (cur[key] === o) opt.selected = true;
                sel.appendChild(opt);
            });
            sel.addEventListener("change", function () { set(key, sel.value); });
            explain(sel, key);
            return sel;
        }
        function check(key, label) {
            var box = h("input", { type: "checkbox", "data-key": key });
            box.checked = !!cur[key];
            box.addEventListener("change", function () { set(key, box.checked); });
            var l = h("label.pp-check", [box, h("span", { text: label })]);
            explain(l, key);
            return l;
        }
        function include(key, icon, label) {
            var b = h("button.pp-inc" + (cur[key] ? ".on" : ""), { type: "button", title: label, "aria-label": label, "aria-pressed": cur[key] ? "true" : "false", "data-key": key,
                on: { click: function () { set(key, !cur[key]); } } }, AT.icon(icon));
            explain(b, key);
            return b;
        }
        function shortcutLabel(sc) { return mac ? sc.replace("Alt", "Option") : sc; }
        function draw() {
            form.innerHTML = "";
            var sc = h("select.pp-select.pp-shortcut", { "aria-label": "Shortcut" }, SHORTCUTS.map(function (x) {
                var o = h("option", { value: x, text: shortcutLabel(x) }); if (x === shortcut) o.selected = true; return o;
            }));
            sc.addEventListener("change", function () {
                shortcut = sc.value; cur = vals();
                AT.store.update("settings", function (x) { x.previewPanel2 = x.previewPanel2 || {}; x.previewPanel2.last = shortcut; });
                why.textContent = "Settings for the " + shortcutLabel(shortcut) + " shortcut. Each shortcut keeps its own.";
                draw();
            });
            form.appendChild(h("div.pp-label", { text: "Shortcut" }));
            form.appendChild(sc);
            form.appendChild(h("div.pp-inc-row", [h("span.pp-label", { text: "Include:" }), h("span.pp-incs", [
                include("video", "eye", "Include video"), include("audio", "audio", "Include audio"),
                include("overlays", "overlays", "Include overlays and layer controls"), include("external", "external", "Include external video")
            ])]));
            form.appendChild(check("cache", "Cache Before Playback"));
            form.appendChild(h("div.pp-label", { text: "Range" }));
            form.appendChild(select("range"));
            form.appendChild(h("div.pp-label", { text: "Play From" }));
            form.appendChild(select("from"));
            form.appendChild(h("div.pp-trio", [
                h("div", [h("div.pp-label", { text: "Frame Rate" }), select("fps")]),
                h("div", [h("div.pp-label", { text: "Skip" }), select("skip")]),
                h("div", [h("div.pp-label", { text: "Resolution" }), select("res")])
            ]));
            form.appendChild(check("fullScreen", "Full Screen"));
            form.appendChild(h("div.pp-sep"));
            form.appendChild(h("div.pp-label", { text: "On (" + shortcutLabel(shortcut) + ") Stop:" }));
            form.appendChild(check("playCached", "If caching, play cached frames"));
            form.appendChild(check("moveTime", "Move time to preview time"));
        }
        function apply(preset) {
            var p = PP_PRESETS[preset];
            for (var k in p) cur[k] = p[k];
            save();
            draw();
            why.textContent = preset === "animating"
                ? "Filled in for animating: Skip 1, Resolution Auto, no caching, playing from the playhead."
                : "Filled in for a final check: Cache Before Playback on, Skip 0, Full resolution, the whole work area from its start.";
        }
        draw();
        why.textContent = ppWhy("skip", cur.skip, fps);
        return h("div", [
            h("div.pp-presets", [
                h("span.pp-label", { text: "Fill in for:" }),
                h("button.btn.btn-sm.pp-fill", { type: "button", "data-preset": "animating", on: { click: function () { apply("animating"); } } }, [AT.icon("bolt"), h("span", { text: "Animating" })]),
                h("button.btn.btn-sm.pp-fill", { type: "button", "data-preset": "final", on: { click: function () { apply("final"); } } }, [AT.icon("check"), h("span", { text: "Final check" })]),
                h("button.link.pp-reset", { type: "button", text: "Reset", on: { click: function () {
                    cur = {}; for (var k in PP_DEFAULT) cur[k] = PP_DEFAULT[k]; save(); draw();
                    why.textContent = "Back to After Effects' own starting values.";
                } } })
            ]),
            form,
            why,
            h("p.hint.pp-note", { text: "Plugins can't change After Effects' Preview panel, so set these in Window > Preview (Ctrl/Cmd+3). Your settings are saved here for each shortcut." })
        ]);
    }

    // Real on/off switch; snaps back if After Effects refuses.
    // Viewer toggles as cards (like the one-click setup): a card is lit while
    // its setting is on. Neither is an undo step in After Effects (viewer
    // settings), so press the card again to turn it off.
    //  - Transparency grid: the viewer's checkerboard, set exactly.
    //  - Rulers: the viewer's own setting where After Effects reports it,
    //    otherwise View > Show Rulers (then the card follows your presses).
    function viewerCard(o) {
        var state = h("span.vc-state");
        var b = h("button.setup.vc-card", { type: "button", "data-card": o.key, "aria-pressed": "false", on: { click: function () {
            var want = !o.isOn();
            o.run(want).then(function () { paint(); });
        } } }, [
            h("span.setup-head", [h("span.setup-icon", AT.icon(o.icon)), h("span.setup-title", { text: o.title }), state]),
            h("span.setup-sub", { text: o.sub }),
            o.keys ? h("span.vc-keys", AT.ui.keycaps(o.keys)) : null
        ]);
        function paint() {
            var on = o.isOn();
            b.classList.toggle("on", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
            state.textContent = on ? "On" : "Off";
        }
        paint();
        return b;
    }
    function viewerCards() {
        var rulersKnown = typeof (st.view && st.view.rulers) === "boolean";
        return h("div.setup-row.vc-row", [
            viewerCard({ key: "rulers", title: "Rulers", icon: "ruler", keys: "Mod + R",
                sub: "Rulers along the viewer. Drag from them to make guides.",
                isOn: function () { return rulersKnown ? !!st.view.rulers : AT.viewToggleState("rulers"); },
                run: function (want) {
                    return AT.run("view.rulers", rulersKnown ? { on: want } : null).then(function (res) {
                        if (res.ok && res.result && typeof res.result.on === "boolean") { st.view = st.view || {}; st.view.rulers = res.result.on; }
                    });
                } }),
            viewerCard({ key: "transparency", title: "Transparency grid", icon: "checker",
                sub: "Shows empty areas as a checkerboard, so you see what's really transparent.",
                isOn: function () { return !!st.transparency; },
                run: function (want) {
                    return AT.run("viewer.transparency", { on: want }).then(function (res) {
                        if (res.ok && res.result) st.transparency = !!res.result.on;
                        else if (res.unconfirmed) st.transparency = want;
                    });
                } })
        ]);
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
        page.appendChild(AT.ui.lead("Animate fast, then check at full quality before you render (timing never changes). Rulers and the transparency grid are here too."));
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

            body.appendChild(AT.ui.section("Viewer", { icon: "checker", hint: "press again to turn off" }, h("div", [
                viewerCards(),
                h("p.hint.vc-note", { text: "Title/Action Safe, grids, guides and snapping are in Learn \u203a Shortcuts (View)." })
            ])));

            body.appendChild(AT.ui.section("Fast Previews", { icon: "bolt", hint: "how the viewer draws while you drag" },
                optionRow(["preview.fast.off", "preview.fast.adaptive", "preview.fast.draft", "preview.fast.fastDraft", "preview.fast.wireframe"],
                    function (it) { return it.payload.mode === (st.fastPreview || "off"); },
                    function (it) { return it.title.replace(" (Final Quality)", "").replace(" Resolution", ""); },
                    function (it) { st.fastPreview = it.payload.mode; handPicked(); })));

            body.appendChild(AT.ui.section("Speed tools", { icon: "clock" },
                h("div.tool-grid", ["preview.workArea.3s", "preview.workArea.5s", "preview.workArea.10s", "preview.draft3d", "preview.purge", "preview.purgeDisk"].map(function (id) { return AT.ui.toolButton(id); }))));

            body.appendChild(AT.ui.section("Color depth", { icon: "sparkle", hint: "project-wide" },
                optionRow(["project.bpc.8", "project.bpc.16", "project.bpc.32"],
                    function (it) { return it.payload.bits === (st.bpc || 8); },
                    function (it) { return it.title; },
                    function (it) { st.bpc = it.payload.bits; })));

            body.appendChild(AT.ui.section("Preview panel", { icon: "gauge", hint: "Window > Preview \u00b7 Ctrl/Cmd+3" }, panelBoard()));


            syncAll();
            var lesson = AT.catalog.get("lesson.preview-speed");
            body.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Previewing at full speed'", on: { click: function () { AT.app.open(lesson); } } })])]));
        });
    }

    AT.registerView({ id: "preview", title: "Preview", icon: "gauge", render: render });
})(window.AT = window.AT || {});
