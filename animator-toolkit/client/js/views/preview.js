/*
 * Preview: animate at real-time speed. Laid out as simple steps:
 * one-click setups, then each setting as a single row of choices with one
 * line of explanation, speed tools, and the Preview-panel settings
 * (which scripting can't change) folded away.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    // A row of mutually exclusive choices. Clicking runs the tool; the line
    // below always explains the active (or hovered) choice.
    function optionRow(ids, isOn, label, onPick) {
        var items = ids.map(function (id) { return AT.catalog.get(id); });
        var active = items.filter(isOn)[0] || items[0];
        var line = h("p.option-why", { text: active.why });
        var row = h("div.option-row", { role: "radiogroup" }, items.map(function (item) {
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
            } }, [h("span", { text: label(item) }), item.tag ? h("sup.opt-tag", { text: item.tag }) : null]);
            return b;
        }));
        return h("div", [row, line]);
    }

    // Preview panel settings: [setting, animating, final check, what it does].
    var PANEL = [
        ["Frame Rate", "Auto", "Auto", "Auto plays at the comp's rate. A lower rate plays sooner but looks choppy."],
        ["Skip", "1", "0", "Frames skipped between rendered ones. 1 = every other frame: twice as fast, choppier."],
        ["Resolution", "Auto", "Full", "The preview's own resolution. Auto follows the viewer."],
        ["Cache Before Playback", "Off", "On", "On renders the range first, then plays in true real time."],
        ["Range", "Work Area + Current Time", "Work Area", "What plays. Keep the work area short (B and N set it)."],
        ["Play From", "Current Time", "Start of Range", "Where playback starts."],
        ["Full Screen", "Off", "Optional", "Plays the comp alone on screen, like a client would see it."]
    ];

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
                    function (it) { return it.title.replace(" Resolution", ""); },
                    function (it) { auto = !!it.payload.auto; AT.store.update("settings", function (x) { x.previewResAuto = auto; }); }),
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

            body.appendChild(AT.ui.section("Preview panel", { icon: "gauge", hint: "Window > Preview · Ctrl/Cmd+3" }, h("div", [
                h("p.hint", { text: "Set these by hand in the Preview panel (scripts can't change them). Recommended values:" }),
                h("table.pp-table", [
                    h("thead", h("tr", [h("th", { text: "Setting" }), h("th", { text: "Animating" }), h("th", { text: "Final check" })])),
                    h("tbody", PANEL.map(function (r) {
                        return h("tr", [h("td", [h("strong", { text: r[0] }), h("span", { text: r[3] })]), h("td", { text: r[1] }), h("td", { text: r[2] })]);
                    }))
                ]),
                h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Play / stop" }), AT.ui.keycaps("Space")]),
                h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Cache, then play in real time" }), AT.ui.keycaps("Numpad 0")])
            ])));

            body.appendChild(AT.ui.section("Speed tools", { icon: "clock" },
                h("div.tool-grid", ["preview.draft3d", "preview.workArea.90", "preview.workArea.180", "preview.purge"].map(function (id) { return AT.ui.toolButton(id); }))));

            var lesson = AT.catalog.get("lesson.preview-speed");
            body.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Previewing at full speed'", on: { click: function () { AT.app.open(lesson); } } })])]));
        });
    }

    AT.registerView({ id: "preview", title: "Preview", icon: "gauge", render: render });
})(window.AT = window.AT || {});
