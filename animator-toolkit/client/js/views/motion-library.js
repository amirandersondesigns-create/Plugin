/*
 * Motion library block shared by Animate (graphics) and Text: Entrance /
 * Exit switch, timing and duration controls, then preset tiles split into
 * Essentials and More effects.
 */
(function (AT) {
    "use strict";

    var h = AT.h;

    function controls(onPhase) {
        var s = AT.store.get("settings");
        var dur = AT.ui.duration({ key: "presetDur", label: "Duration", allowAuto: true });
        return h("div.motion-controls", [
            AT.ui.segmented([
                { value: "in", label: "Entrance", icon: "up" },
                { value: "out", label: "Exit", icon: "down" }
            ], AT.state.phase, function (v) { AT.state.phase = v; onPhase(); }, { cls: "seg-phase", label: "Entrance or exit" }),
            h("div.motion-opts", [
                AT.ui.segmented([
                    { value: "layer", label: "Layer in/out", title: "Entrances start at the layer's In point; exits end at its Out point. Lets entrances and exits stack." },
                    { value: "playhead", label: "Playhead", title: "Start the animation at the current time." }
                ], s.presetTiming || "layer", function (v) {
                    AT.store.update("settings", function (x) { x.presetTiming = v; });
                }, { cls: "seg-sm", label: "Timing" }),
                dur
            ])
        ]);
    }

    function grid(group, tier) {
        var list = AT.content.presets.filter(function (p) {
            return p.phase === AT.state.phase && p.groups.indexOf(group) >= 0 && p.tier === tier;
        });
        return h("div.preset-grid", list.map(AT.ui.presetTile));
    }

    function render(container, group) {
        var tiles = h("div.motion-tiles");
        function fill() {
            tiles.innerHTML = "";
            tiles.appendChild(h("div.subhead", [h("span", { text: "Essentials" })]));
            tiles.appendChild(grid(group, "essential"));
            tiles.appendChild(h("div.subhead", [h("span", { text: "More effects" }), AT.ui.isBeginner() ? h("span.subhead-hint", { text: "overshoot, bounce & reveals" }) : null]));
            tiles.appendChild(grid(group, "more"));
        }
        fill();
        container.appendChild(controls(fill));
        if (AT.ui.isBeginner()) {
            container.appendChild(h("p.tip", [
                AT.icon("info"),
                h("span", { text: "Presets stack: add an Entrance and an Exit (or Fade + Slide + Blur) to the same layer. Each one leaves a labelled marker on the layer so you can see where it lands. Hover a tile to preview it." })
            ]));
        }
        container.appendChild(tiles);
    }

    AT.motionLibrary = { render: render };
})(window.AT = window.AT || {});
