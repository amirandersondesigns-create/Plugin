/*
 * Preview: animate at real-time speed. One-click setups and resolution
 * cards (each shows how blocky the picture gets), choice rows with one line
 * of explanation, and the Preview-panel settings (which scripting can't
 * change) as a compact Animating / Final check board.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    // A row of mutually exclusive choices. Clicking runs the tool; the line
    // below always explains the active (or hovered) choice.
    function optionRow(ids, isOn, label, onPick, rowCls) {
        var items = ids.map(function (id) { return AT.catalog.get(id); });
        var active = items.filter(isOn)[0] || items[0];
        var line = h("p.option-why", { text: active.why });
        var row = h("div.option-row" + (rowCls ? "." + rowCls : ""), { role: "radiogroup" }, items.map(function (item) {
            var content = label(item);
            var b = h("button.option" + (item === active ? ".on" : ""), { type: "button", title: item.summary, on: {
                click: function () {
                    AT.run(item, null, b).then(function (res) {
                        if (!res.ok) return;
                        if (onPick) onPick(item);
                        active = item;
                        row.querySelectorAll(".option").forEach(function (x) { x.classList.remove("on"); });
                        b.classList.add("on");
                        line.textContent = item.why;
                    });
                },
                mouseenter: function () { line.textContent = item.why; },
                mouseleave: function () { line.textContent = active.why; }
            } }, typeof content === "string" ? [h("span", { text: content }), item.tag ? h("sup.opt-tag", { text: item.tag }) : null] : content);
            return b;
        }));
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

    // Preview panel settings: [setting, animating, final check, what it does].
    var PANEL = [
        ["Frame Rate", "Auto", "Auto", "Frame Rate: Auto plays at the comp's rate. A lower rate plays sooner but looks choppy."],
        ["Skip", "1", "0", "Skip: frames skipped between rendered ones. 1 = every other frame: twice as fast, choppier."],
        ["Resolution", "Auto", "Full", "Resolution: the preview's own. Auto follows the viewer."],
        ["Cache", "Off", "On", "Cache Before Playback: On renders the range first, then plays in true real time."],
        ["Range", "Work Area + Time", "Work Area", "Range: what plays. Work Area Extended by Current Time while animating. Keep the work area short (B and N set it)."],
        ["Play From", "Current Time", "Range Start", "Play From: where playback starts."]
    ];

    // Recommended Preview-panel values as a compact board: flip between
    // Animating and Final check; tiles that change get a dot; tap a tile
    // (or hover) to read what it does.
    function panelBoard() {
        var mode = 1, picked = 1; // 1 = animating, 2 = final check; picked = Skip
        var why = h("p.option-why.pp-why");
        var grid = h("div.pp-grid");
        var tiles = PANEL.map(function (r, i) {
            var val = h("span.pp-val");
            var t = h("button.pp-tile" + (r[1] !== r[2] ? ".changes" : ""), { type: "button", "aria-label": r[0], on: {
                click: function () { picked = i; paint(); },
                mouseenter: function () { why.textContent = r[3]; },
                mouseleave: function () { why.textContent = PANEL[picked][3]; }
            } }, [h("span.pp-name", { text: r[0] }), val]);
            t.val = val;
            grid.appendChild(t);
            return t;
        });
        function paint() {
            tiles.forEach(function (t, i) {
                var v = PANEL[i][mode];
                if (t.val.textContent !== v) {
                    t.val.textContent = v;
                    t.val.classList.remove("flip");
                    void t.val.offsetWidth; // restart the animation
                    t.val.classList.add("flip");
                }
                t.classList.toggle("on", i === picked);
            });
            why.textContent = PANEL[picked][3];
        }
        var changes = PANEL.filter(function (r) { return r[1] !== r[2]; }).length;
        var seg = AT.ui.segmented([{ value: 1, label: "Animating", icon: "bolt" }, { value: 2, label: "Final check", icon: "check" }], mode,
            function (v) { mode = v; paint(); }, { cls: "pp-seg", label: "Preview panel values for" });
        paint();
        return h("div", [
            seg,
            grid,
            why,
            h("div.pp-foot", [
                h("span.pp-legend", [h("span.pp-dot"), h("span", { text: changes + " settings change for the final check" })]),
                h("span.pp-keys", [AT.ui.keycaps("Space"), h("span", { text: "play" }), AT.ui.keycaps("Numpad 0"), h("span", { text: "cache + play" })])
            ])
        ]);
    }

    function setupCard(id, cls) {
        var item = AT.catalog.get(id);
        var b = h("button.setup" + (cls ? "." + cls : ""), { type: "button", on: { click: function () { AT.run(item, null, b); } } }, [
            h("span.setup-icon", AT.icon(item.icon)),
            h("span.setup-title", { text: item.title }),
            h("span.setup-sub", { text: item.summary })
        ]);
        return b;
    }

    function render(page) {
        page.appendChild(AT.ui.lead("Animate fast, then check at full quality before you render. Timing never changes."));
        var body = h("div");
        page.appendChild(body);
        AT.bridge.run("preview.read").then(function (res) {
            if (!document.body.contains(body)) return;
            var st = res.ok ? res.result : {};

            var auto = !!AT.store.get("settings").previewResAuto;
            body.appendChild(AT.ui.section("One-click setup", { icon: "bolt" }, h("div", [
                h("div.setup-row", [setupCard("preview.mode.fast", "setup-fast"), setupCard("preview.mode.final")]),
                h("div.sub-label", { text: "Resolution (Down Sample Factor)" }),
                optionRow(["preview.res.auto", "preview.res.1", "preview.res.2", "preview.res.3", "preview.res.4"],
                    function (it) { return it.payload.auto ? auto : !auto && it.payload.factor === (st.resolution || 1); },
                    resCard,
                    function (it) { auto = !!it.payload.auto; AT.store.update("settings", function (x) { x.previewResAuto = auto; }); },
                    "res-cards"),
                h("details.more", [h("summary", { text: "Custom and shortcuts" }), h("p", { text: "Custom sets any factor, e.g. every 6th pixel for heavy comps (Ctrl/Cmd+Alt+J). Shortcuts: Ctrl/Cmd+J Full, Ctrl/Cmd+Shift+J Half, Ctrl/Cmd+Alt+Shift+J Quarter. After Effects' own live Auto is in the viewer's resolution menu." })])
            ])));

            body.appendChild(AT.ui.section("Fast Previews", { icon: "bolt", hint: "how the viewer draws while you drag" },
                optionRow(["preview.fast.off", "preview.fast.adaptive", "preview.fast.draft", "preview.fast.fastDraft", "preview.fast.wireframe"],
                    function (it) { return it.payload.mode === (st.fastPreview || "off"); },
                    function (it) { return it.title.replace(" (Final Quality)", "").replace(" Resolution", ""); })));

            body.appendChild(AT.ui.section("Color depth", { icon: "sparkle", hint: "project-wide" },
                optionRow(["project.bpc.8", "project.bpc.16", "project.bpc.32"],
                    function (it) { return it.payload.bits === (st.bpc || 8); },
                    function (it) { return it.title; })));

            body.appendChild(AT.ui.section("Preview panel", { icon: "gauge", hint: "Ctrl/Cmd+3 \u00b7 set by hand" }, panelBoard()));

            body.appendChild(AT.ui.section("Speed tools", { icon: "clock" },
                h("div.tool-grid", ["preview.draft3d", "preview.workArea.90", "preview.workArea.180", "preview.purge"].map(function (id) { return AT.ui.toolButton(id); }))));

            var lesson = AT.catalog.get("lesson.preview-speed");
            body.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Previewing at full speed'", on: { click: function () { AT.app.open(lesson); } } })])]));
        });
    }

    AT.registerView({ id: "preview", title: "Preview", icon: "gauge", render: render });
})(window.AT = window.AT || {});
