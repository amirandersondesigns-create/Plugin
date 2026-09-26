/*
 * Audio: quick level and fade tools for selected audio layers.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    function render(page) {
        page.appendChild(AT.ui.lead("Rule of thumb: keep dialogue peaking around -12 dB and never let the meter hit 0 dB."));

        page.appendChild(AT.ui.section("Adjust selected audio", { icon: "audio" }, h("div", [
            h("div.tool-grid", ["audio.minus3", "audio.plus3", "audio.bed", "audio.reset", "audio.fadeIn", "audio.fadeOut"].map(function (id) { return AT.ui.toolButton(id); })),
            AT.ui.duration({ key: "audioFadeDur", label: "Fade length", defaultFrames: 15, max: 60 })
        ])));

        page.appendChild(AT.ui.section("Shortcuts", { icon: "key" }, h("div", [
            h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Audio-only preview" }), AT.ui.keycaps("Numpad .")]),
            h("div.sc-row.sc-compact", [h("span.sc-title", { text: "Show Audio Levels / waveform" }), AT.ui.keycaps("L / LL")])
        ])));

        var lesson = AT.catalog.get("lesson.audio");
        page.appendChild(h("p.tip", [AT.icon("learn"), h("span", [h("button.link", { type: "button", text: "Read 'Audio levels'", on: { click: function () { AT.app.open(lesson); } } })])]));
    }

    AT.registerView({ id: "audio", title: "Audio", icon: "audio", render: render });
})(window.AT = window.AT || {});
