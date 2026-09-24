/*
 * Easing: a live curve + motion preview, one-click presets, strength chips
 * and In/Out influence sliders. The preview can read the real curve from
 * the selected keyframes (easing.read), so it teaches with the artist's own
 * animation.
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var hero = null;

    function sliderCurve(inf) {
        return [
            inf.out > 0 ? inf.out / 100 : 1 / 3, inf.out > 0 ? 0 : 1 / 3,
            inf.in > 0 ? 1 - inf.in / 100 : 2 / 3, inf.in > 0 ? 1 : 2 / 3
        ];
    }

    function Hero() {
        var graphWrap = h("div.hero-graph");
        var caption = h("div.hero-caption");
        var ball = h("div.track-ball");
        var ghost = h("div.track-ball.ghost");
        var track = h("div.track", [h("div.track-line"), ghost, ball]);
        var el = h("div.hero", [graphWrap, h("div.hero-side", [caption, track, h("div.track-legend", [
            h("span", [h("i.lg-ball"), "eased"]), h("span", [h("i.lg-ghost"), "linear"])
        ])])]);
        var bez = [0.33, 0, 0.67, 1];
        var svg = null;
        var start = performance.now();

        function set(b, text) {
            bez = b;
            graphWrap.innerHTML = "";
            svg = AT.ui.curve(b, { width: 150, height: 110, handles: true, dot: true, cls: "curve-hero" });
            graphWrap.appendChild(svg);
            caption.textContent = text;
            start = performance.now();
        }

        function frame(now) {
            if (!document.body.contains(el)) return; // page left
            var period = 1800, pause = 500;
            var t = ((now - start) % (period + pause)) / period;
            var x = Math.min(1, t);
            var y = bez ? AT.ui.yForX(bez, x) : (x < 1 ? 0 : 1);
            ball.style.setProperty("--p", String(y));
            ghost.style.setProperty("--p", String(x));
            if (svg && svg._dot) {
                svg._dot.setAttribute("cx", svg._geom.gx(x));
                svg._dot.setAttribute("cy", svg._geom.gy(y));
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        return { el: el, set: set, get: function () { return bez; } };
    }

    function presetButton(id) {
        var item = AT.catalog.get(id);
        var b = h("button.ease-btn", {
            type: "button", title: item.summary,
            on: {
                click: function () { AT.run(item, null, b); hero.set(item.curve, item.title + " — " + item.summary); },
                mouseenter: function () { hero.set(item.curve, item.title + " — " + item.summary); }
            }
        }, [
            AT.ui.curve(item.curve, { width: 64, height: 40, pad: 4, cls: "curve-mini" }),
            h("span.ease-name", { text: item.title }),
            AT.ui.favButton(id)
        ]);
        return b;
    }

    function sliders() {
        var s = AT.store.get("settings");
        var inf = { "in": s.easeIn === undefined ? 60 : s.easeIn, out: s.easeOut === undefined ? 30 : s.easeOut };
        var linked = !!s.easeLinked;
        var inS, outS;
        function preview() {
            hero.set(sliderCurve(inf), "Custom — leaves at " + inf.out + "%, arrives at " + inf["in"] + "%");
        }
        function save() {
            AT.store.update("settings", function (x) { x.easeIn = inf["in"]; x.easeOut = inf.out; x.easeLinked = linked; });
        }
        outS = AT.ui.slider({ label: "Ease Out · leaving", min: 0, max: 100, value: inf.out, unit: "%",
            onInput: function (v) { inf.out = v; if (linked) { inf["in"] = v; inS.set(v); } preview(); }, onChange: save });
        inS = AT.ui.slider({ label: "Ease In · arriving", min: 0, max: 100, value: inf["in"], unit: "%",
            onInput: function (v) { inf["in"] = v; if (linked) { inf.out = v; outS.set(v); } preview(); }, onChange: save });
        var apply = h("button.btn.btn-primary", { type: "button", on: { click: function () {
            AT.run({ type: "action", id: "ease.custom", title: "Custom ease", command: "easing.apply", payload: {},
                why: AT.catalog.get("ease.both").why, summary: "Custom ease" },
            { mode: "custom", influenceIn: inf["in"], influenceOut: inf.out }, apply);
        } } }, [AT.icon("play"), h("span", { text: "Apply to selected keys" })]);
        return h("div.sliders-card", [
            outS, inS,
            h("div.row.row-between", [
                AT.ui.toggle("Link", linked, function (v) { linked = v; save(); }),
                apply
            ]),
            AT.ui.isBeginner() ? h("p.hint", { text: "0% leaves that side linear. Out shapes how motion leaves each selected keyframe; In shapes how it arrives. Higher = longer, softer slowdown." }) : null
        ]);
    }

    function render(page) {
        hero = Hero();
        hero.set([0.33, 0, 0.67, 1], "Easy Ease — hover a preset to compare");
        page.appendChild(AT.ui.lead("Select two or more keyframes in the timeline, then pick an ease. The graph is the Graph Editor's value curve: flat = slow, steep = fast."));
        page.appendChild(AT.ui.section("Preview", {
            icon: "easing",
            right: h("button.link", { type: "button", text: "Read selected keys", on: { click: function (e) {
                var btn = e.currentTarget;
                AT.bridge.run("easing.read").then(function (res) {
                    if (!res.ok) return AT.toast(res.error.message, "error");
                    var r = res.result;
                    if (!r.curve) return AT.toast("Select two keyframes on one property to see their curve.", "info");
                    var c = r.curve;
                    hero.set(c.hold ? null : [c.x1, c.y1, c.x2, c.y2], "Your keys: " + r.layer + " › " + r.property);
                    AT.ui.pulse(btn);
                });
            } } })
        }, hero.el));

        page.appendChild(AT.ui.section("Presets", { icon: "ease", hint: "F9 · Shift+F9 · Ctrl/Cmd+Shift+F9" },
            h("div.ease-grid", ["ease.both", "ease.in", "ease.out", "ease.linear", "ease.hold"].map(presetButton))));

        var strengths = ["ease.gentle", "ease.smooth", "ease.strong", "ease.extreme"];
        page.appendChild(AT.ui.section("Strength", { icon: "bolt", hint: "Easy Ease with more influence" },
            h("div.chips", strengths.map(function (id) {
                var it = AT.catalog.get(id);
                var b = h("button.chip.chip-curve", { type: "button", title: it.summary, on: {
                    click: function () { AT.run(it, null, b); },
                    mouseenter: function () { hero.set(it.curve, it.title + " — " + it.summary); }
                } }, [AT.ui.curve(it.curve, { width: 28, height: 18, pad: 2, cls: "curve-chip" }), h("span", { text: it.title.replace(" Ease", "") })]);
                return b;
            }))));

        page.appendChild(AT.ui.section("Sliders", { icon: "easing" }, sliders()));
    }

    AT.registerView({ id: "easing", title: "Easing", icon: "easing", render: render });
})(window.AT = window.AT || {});
