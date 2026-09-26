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
    function optionRow(ids, isOn, label) {
        var items = ids.map(function (id) { return AT.catalog.get(id); });
        var active = items.filter(isOn)[0] || items[0];
        var line = h("p.option-why", { text: active.why });
        var row = h("div.option-row", { role: "radiogroup" }, items.map(function (item) {
            var b = h("button.option" + (item === active ? ".on" : ""), { type: "button", title: item.summary, on: {
                click: function () {
                    AT.run(item, null, b).then(function (res) {
                        if (!res.ok) return;
                        active = item;
                        row.querySelectorAll(".option").forEach(function (x) { x.classList.remove("on"); });
                        b.classList.add("on");
                        line.textContent = item.why;
                    });
                },
                mouseenter: function () { line.textContent = item.why; },
                mouseleave: function () { line.textContent = active.why; }
            } }, h("span", { text: label(item) }));
            return b;
        }));
        return h("div", [row, line]);
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
        page.appendChild(AT.ui.lead("Previews play in real time once frames are cached (the green bar over the timeline). Animate fast, then check at full quality before you render. Timing never changes."));
        var body = h("div");
        page.appendChild(body);
        AT.bridge.run("preview.read").then(function (res) {
            if (!document.body.contains(body)) return;
            var st = res.ok ? res.result : {};

            body.appendChild(AT.ui.section("One-click setup", { icon: "bolt" },
                h("div.setup-row", [setupCard("preview.mode.fast", "setup-fast"), setupCard("preview.mode.final")])));

            body.appendChild(AT.ui.section("Resolution", { icon: "grid", hint: "Down Sample Factor, under the viewer" }, h("div", [
                optionRow(["preview.res.1", "preview.res.2", "preview.res.3", "preview.res.4"],
                    function (it) { return it.payload.factor === (st.resolution || 1); },
                    function (it) { return it.title.replace(" Resolution", ""); }),
                h("details.more", [h("summary", { text: "Auto and Custom" }), h("p", { text: "Auto lowers resolution when the viewer is zoomed out, so you never render pixels you can't see. Custom sets any factor (Ctrl/Cmd+Alt+J). Both are in the viewer's resolution menu." })])
            ])));

            body.appendChild(AT.ui.section("Fast Previews", { icon: "bolt", hint: "lightning icon under the viewer" },
                optionRow(["preview.fast.off", "preview.fast.adaptive", "preview.fast.draft", "preview.fast.fastDraft", "preview.fast.wireframe"],
                    function (it) { return it.payload.mode === (st.fastPreview || "off"); },
                    function (it) { return it.title.replace(" (Final Quality)", "").replace(" Resolution", ""); })));

            body.appendChild(AT.ui.section("Color depth", { icon: "sparkle", hint: "project-wide" },
                optionRow(["project.bpc.8", "project.bpc.16", "project.bpc.32"],
                    function (it) { return it.payload.bits === (st.bpc || 8); },
                    function (it) { return it.title; })));

            body.appendChild(AT.ui.section("Speed tools", { icon: "clock" },
                h("div.tool-grid", ["preview.draft3d", "preview.workArea.3", "preview.workArea.6", "preview.purge"].map(function (id) { return AT.ui.toolButton(id); }))));

            body.appendChild(AT.ui.section("Preview panel settings", { icon: "gauge", hint: "Window > Preview (Ctrl/Cmd+3)" }, h("details.more", [
                h("summary", { text: "Recommended settings (set by hand)" }),
                h("dl.explain", [
                    ["Cache Before Playback", "On for reviews: renders the range, then plays in real time."],
                    ["Skip", "0 for final timing; 1 plays every other frame, twice as fast."],
                    ["Resolution", "Auto, so it follows the viewer."],
                    ["Frame Rate", "Auto (the comp's rate)."],
                    ["Range", "Work Area Extended by Current Time; keep the work area short (B / N)."],
                    ["While animating", "Turn off motion blur and depth of field; turn them back on to check."]
                ].map(function (r) { return [h("dt", { text: r[0] }), h("dd", { text: r[1] })]; }))
            ])));

            var lesson = AT.catalog.get("lesson.preview-speed");
            body.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Previewing at full speed'", on: { click: function () { AT.app.open(lesson); } } })])]));
        });
    }

    AT.registerView({ id: "preview", title: "Preview", icon: "gauge", render: render });
})(window.AT = window.AT || {});
