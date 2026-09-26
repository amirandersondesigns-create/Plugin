/*
 * Preview: how to animate at real-time speed, and audio levels.
 * Buttons change real settings (resolution, fast previews, color depth,
 * draft 3D, work area, cache); the Preview-panel options scripting can't
 * reach are explained with recommended values.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var sub = "preview";

    function choiceRow(ids, isOn) {
        return h("div.choice-row", ids.map(function (id) {
            var item = AT.catalog.get(id);
            var b = h("button.choice-btn" + (isOn(item) ? ".on" : ""), { type: "button", title: item.summary, on: { click: function () {
                AT.run(item, null, b).then(function (res) {
                    if (!res.ok) return;
                    b.parentNode.querySelectorAll(".choice-btn").forEach(function (x) { x.classList.remove("on"); });
                    b.classList.add("on");
                });
            } } }, [h("span.choice-btn-title", { text: item.title.replace(" Resolution", "") }), h("span.choice-btn-why", { text: item.why })]);
            return b;
        }));
    }

    function explain(items) {
        return h("dl.explain", items.map(function (it) { return [h("dt", { text: it[0] }), h("dd", { text: it[1] })]; }));
    }

    function previewPage(body, state) {
        state = state || {};
        body.appendChild(AT.ui.lead("Previews play in real time once frames are cached (the green bar over the timeline). Every setting below trades detail for speed while you animate. Timing never changes, so animate fast and check at Full before you render."));

        body.appendChild(AT.ui.section("Resolution / Down Sample Factor", { icon: "grid", hint: "menu under the viewer" }, h("div", [
            AT.illustration("preview", "section-illo"),
            choiceRow(["preview.res.1", "preview.res.2", "preview.res.3", "preview.res.4"], function (it) { return it.payload.factor === (state.resolution || 1); }),
            explain([
                ["Auto", "Drops resolution automatically when you zoom the viewer out: you never render pixels you can't see. A great default (set it in the viewer menu)."],
                ["Custom", "Any factor, e.g. every 6th pixel for heavy comps (Ctrl/Cmd+Alt+J)."],
                ["Tip", "Animate at Half or Quarter, check at Full. Shortcuts: Ctrl/Cmd+J Full, +Shift Half, +Alt+Shift Quarter."]
            ])
        ])));

        body.appendChild(AT.ui.section("Fast Previews", { icon: "bolt", hint: "lightning icon under the viewer" },
            choiceRow(["preview.fast.off", "preview.fast.adaptive", "preview.fast.draft", "preview.fast.fastDraft", "preview.fast.wireframe"],
                function (it) { return it.payload.mode === (state.fastPreview || "off"); })));

        body.appendChild(AT.ui.section("Color depth", { icon: "sparkle", hint: "click '8 bpc' in the Project panel" },
            choiceRow(["project.bpc.8", "project.bpc.16", "project.bpc.32"], function (it) { return it.payload.bits === (state.bpc || 8); })));

        body.appendChild(AT.ui.section("Speed tools", { icon: "clock" },
            h("div.tool-grid", ["preview.draft3d", "preview.workArea.3", "preview.workArea.6", "preview.purge", "layers.rasterize"].map(function (id) { return AT.ui.toolButton(id); }))));

        body.appendChild(AT.ui.section("Preview panel settings", { icon: "gauge", hint: "Window > Preview (Ctrl/Cmd+3)" }, explain([
            ["Shortcut", "Spacebar for quick plays; Numpad 0 with Cache Before Playback on for smooth reviews."],
            ["Cache Before Playback", "On for reviews: it renders the range first, then plays in real time."],
            ["Frame Rate", "Auto (the comp's rate)."],
            ["Skip", "0 for final timing checks; 1 renders every other frame, twice as fast, for rough passes."],
            ["Resolution", "Auto, so it follows the viewer's zoom."],
            ["Range", "Work Area Extended by Current Time. Keep the work area short (B / N)."],
            ["While animating", "Turn off comp motion blur and depth of field; switch them back on for the final check."]
        ])));

        var lesson = AT.catalog.get("lesson.preview-speed");
        body.appendChild(h("p.tip", [AT.icon("learn"), h("span", ["New to this? ", h("button.link", { type: "button", text: "Read 'Previewing at full speed'", on: { click: function () { AT.app.open(lesson); } } })])]));
    }

    function audioPage(body) {
        var s = AT.store.get("settings");
        body.appendChild(AT.ui.lead("Watch the Audio panel's meter while previewing (Numpad . plays audio only). The file's own level is 0 dB in Audio Levels; that's 'unchanged', not 'maximum'."));
        body.appendChild(AT.ui.section("Level guide", { icon: "audio" }, h("div", [
            AT.illustration("audio", "section-illo"),
            h("table.levels", [
                h("thead", h("tr", [h("th", { text: "Where it airs" }), h("th", { text: "Loudness" }), h("th", { text: "Peaks" })])),
                h("tbody", [
                    ["Any mix in After Effects", "Dialogue peaks -12 to -6 dB", "Never hit 0 dB"],
                    ["Music under voice-over", "About -18 to -24 dB", "Duck under VO"],
                    ["US TV & commercials (ATSC A/85, CALM Act)", "-24 LKFS", "-2 dBTP"],
                    ["EU broadcast (EBU R128)", "-23 LUFS", "-1 dBTP"],
                    ["YouTube / streaming / social", "About -14 LUFS", "-1 dBTP"],
                    ["Podcast / web audio", "About -16 LUFS", "-1 dBTP"]
                ].map(function (r) { return h("tr", r.map(function (c) { return h("td", { text: c }); })); }))
            ]),
            h("p.hint", { text: "LUFS/LKFS is average loudness measured with a loudness meter (Premiere Pro, Audition, Media Encoder). Always follow your network's own spec sheet when you have one." })
        ])));
        body.appendChild(AT.ui.section("Adjust selected audio", { icon: "audio" }, h("div", [
            h("div.tool-grid", ["audio.minus3", "audio.plus3", "audio.bed", "audio.reset", "audio.fadeIn", "audio.fadeOut"].map(function (id) { return AT.ui.toolButton(id); })),
            AT.ui.slider({ label: "Fade length", min: 2, max: 60, value: s.audioFadeFrames || 15, unit: "f",
                onChange: function (v) { AT.store.update("settings", function (x) { x.audioFadeFrames = v; }); } }),
            h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Audio-only preview" }), AT.ui.keycaps("Numpad .")]),
            h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Show Audio Levels / waveform" }), AT.ui.keycaps("L / LL")])
        ])));
        var lesson = AT.catalog.get("lesson.audio");
        body.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Audio levels for TV, web & ads'", on: { click: function () { AT.app.open(lesson); } } })])]));
    }

    function render(page) {
        page.appendChild(AT.ui.segmented([
            { value: "preview", label: "Preview speed", icon: "gauge" },
            { value: "audio", label: "Audio", icon: "audio" }
        ], sub, function (v) { sub = v; AT.app.rerender(); }, { cls: "seg-tabs", label: "Preview section" }));
        var body = h("div");
        page.appendChild(body);
        if (sub === "audio") return audioPage(body);
        // Read the current settings so the active choice is highlighted.
        AT.bridge.run("preview.read").then(function (res) {
            if (!document.body.contains(body)) return;
            previewPage(body, res.ok ? res.result : {});
        });
    }

    AT.registerView({ id: "preview", title: "Preview", icon: "gauge", render: render });
})(window.AT = window.AT || {});
