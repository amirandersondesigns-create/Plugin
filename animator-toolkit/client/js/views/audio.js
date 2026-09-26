/*
 * Audio: level targets for where the piece will air, and quick level and
 * fade tools for selected audio layers.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    function render(page) {
        page.appendChild(AT.ui.lead("Watch the Audio panel's meter while previewing (Numpad . plays audio only). In Audio Levels, 0 dB means 'the file as recorded', not 'maximum'."));

        page.appendChild(AT.ui.section("Adjust selected audio", { icon: "audio" }, h("div", [
            h("div.tool-grid", ["audio.minus3", "audio.plus3", "audio.bed", "audio.reset", "audio.fadeIn", "audio.fadeOut"].map(function (id) { return AT.ui.toolButton(id); })),
            AT.ui.duration({ key: "audioFadeDur", label: "Fade length", defaultFrames: 15 })
        ])));

        page.appendChild(AT.ui.section("Level guide", { icon: "audio" }, h("div", [
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
            h("p.hint", { text: "LUFS/LKFS is average loudness, measured with a loudness meter (Premiere Pro, Audition, Media Encoder). Always follow your network's own spec sheet when you have one." })
        ])));

        page.appendChild(AT.ui.section("Shortcuts", { icon: "key" }, h("div", [
            h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Audio-only preview" }), AT.ui.keycaps("Numpad .")]),
            h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Show Audio Levels / waveform" }), AT.ui.keycaps("L / LL")])
        ])));

        var lesson = AT.catalog.get("lesson.audio");
        page.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Audio levels for TV, web & ads'", on: { click: function () { AT.app.open(lesson); } } })])]));
    }

    AT.registerView({ id: "audio", title: "Audio", icon: "audio", render: render });
})(window.AT = window.AT || {});
