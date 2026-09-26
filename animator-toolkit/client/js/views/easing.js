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

        var points = null;
        // b: a bezier, null for Hold, or { points } for a physics shape.
        function set(b, text) {
            points = b && b.points ? b.points : null;
            bez = points ? null : b;
            graphWrap.innerHTML = "";
            svg = AT.ui.curve(points ? null : b, { width: 150, height: 110, handles: !points, dot: true, cls: "curve-hero", points: points });
            graphWrap.appendChild(svg);
            caption.textContent = text;
            start = performance.now();
        }

        function frame(now) {
            if (!document.body.contains(el)) return; // page left
            var period = 1800, pause = 500;
            var t = ((now - start) % (period + pause)) / period;
            var x = Math.min(1, t);
            var y = points ? piecewise(points, x) : bez ? AT.ui.yForX(bez, x) : (x < 1 ? 0 : 1);
            ball.style.setProperty("--p", String(y));
            ghost.style.setProperty("--p", String(x));
            if (svg && svg._dot) {
                svg._dot.setAttribute("cx", svg._geom.gx(x));
                svg._dot.setAttribute("cy", svg._geom.gy(points ? y / 1.3 : y));
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        return { el: el, set: set, get: function () { return bez; } };
    }

    // Smooth-ish playback of a physics shape (eased between its keys).
    function piecewise(pts, x) {
        for (var i = 1; i < pts.length; i++) {
            if (x <= pts[i][0]) {
                var a = pts[i - 1], b = pts[i];
                var f = (x - a[0]) / (b[0] - a[0] || 1);
                f = f * f * (3 - 2 * f);
                return a[1] + (b[1] - a[1]) * f;
            }
        }
        return pts[pts.length - 1][1];
    }

    function curveOrPoints(item) {
        return item.points ? { points: item.points } : item.curve;
    }

    function presetButton(id) {
        var item = AT.catalog.get(id);
        var b = h("button.ease-btn", {
            type: "button", title: item.summary,
            on: {
                click: function () { AT.run(item, null, b); hero.set(curveOrPoints(item), item.title + " — " + item.summary); },
                mouseenter: function () { hero.set(curveOrPoints(item), item.title + " — " + item.summary); }
            }
        }, [
            AT.ui.curve(item.points ? null : item.curve, { width: 64, height: 40, pad: 4, cls: "curve-mini", points: item.points }),
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
            AT.ui.isBeginner() ? h("p.hint", { text: "Out = leaving each key, In = arriving. 0% = linear, higher = softer." }) : null
        ]);
    }

    function render(page) {
        hero = Hero();
        hero.set([0.33, 0, 0.67, 1], "Easy Ease — hover a preset to compare");
        page.appendChild(AT.ui.lead("Select keyframes, then pick an ease. On the graph, flat = slow and steep = fast."));
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

        var curves = AT.content.actions.filter(function (a) { return a.tier === "curve"; }).map(function (a) { return a.id; });
        page.appendChild(AT.ui.section("Curves", { icon: "ease", hint: "custom In/Out influence, one click" },
            h("div.ease-grid", curves.map(presetButton))));
        var physics = AT.content.actions.filter(function (a) { return a.tier === "physics"; }).map(function (a) { return a.id; });
        page.appendChild(AT.ui.section("Physics", { icon: "motion", hint: "adds settle keyframes between selected keys" },
            h("div.ease-grid", physics.map(presetButton))));
        page.appendChild(AT.ui.section("Sliders", { icon: "easing" }, sliders()));
    }

    AT.registerView({ id: "easing", title: "Easing", icon: "easing", render: render });
})(window.AT = window.AT || {});
