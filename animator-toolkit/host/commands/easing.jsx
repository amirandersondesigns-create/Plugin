// ============================================================================
// Animator Toolkit - easing engine
//
// After Effects stores easing per keyframe *side* as speed + influence, not
// as a CSS-style cubic-bezier. Naming follows After Effects' own menus:
//
//   Easy Ease In  (Shift+F9)      - incoming side: motion slows INTO the key
//   Easy Ease Out (Ctrl/Cmd+Shift+F9) - outgoing side: motion eases OUT of it
//   Easy Ease     (F9)            - both sides
//
// AT.applyEase() is the single entry point every other feature (keyframe
// tools, motion presets, text presets) uses, so there's one definition of
// what "ease out" means in the whole toolkit.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.EASE_DEFAULT_INFLUENCE = 33.33;

AT.easeArray = function (length, speed, influence) {
    var arr = [];
    for (var i = 0; i < length; i++) arr.push(new KeyframeEase(speed, influence));
    return arr;
};

// side: "in" | "out" | "both" | "linear" | "hold"
AT.applyEase = function (prop, keyIndex, side, influence) {
    var k = keyIndex;
    if (side === "linear") {
        prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        return;
    }
    if (side === "hold") {
        prop.setInterpolationTypeAtKey(k, prop.keyInInterpolationType(k), KeyframeInterpolationType.HOLD);
        return;
    }

    var inf = Math.max(0.1, Math.min(100, influence || AT.EASE_DEFAULT_INFLUENCE));
    var setIn = side === "in" || side === "both";
    var setOut = side === "out" || side === "both";

    var inEase = prop.keyInTemporalEase(k);
    var outEase = prop.keyOutTemporalEase(k);
    var inType = setIn ? KeyframeInterpolationType.BEZIER : prop.keyInInterpolationType(k);
    var outType = setOut ? KeyframeInterpolationType.BEZIER : prop.keyOutInterpolationType(k);

    // Auto-bezier / continuous keys would immediately re-smooth our values.
    prop.setTemporalContinuousAtKey(k, false);
    prop.setTemporalAutoBezierAtKey(k, false);
    prop.setInterpolationTypeAtKey(k, inType, outType);
    prop.setTemporalEaseAtKey(k,
        setIn ? AT.easeArray(inEase.length, 0, inf) : inEase,
        setOut ? AT.easeArray(outEase.length, 0, inf) : outEase);
};

AT.applyCustomEase = function (prop, k, influenceIn, influenceOut) {
    if (influenceIn > 0) AT.applyEase(prop, k, "in", influenceIn);
    else AT.setSide(prop, k, "in", KeyframeInterpolationType.LINEAR);
    if (influenceOut > 0) AT.applyEase(prop, k, "out", influenceOut);
    else AT.setSide(prop, k, "out", KeyframeInterpolationType.LINEAR);
};

// Ease a "move" between two keyframes the way designers think about it:
// how the motion leaves the first key and arrives at the second.
// profile: { leave: influence|0 for linear, arrive: influence|0 }
AT.easeSegment = function (prop, k1, k2, profile) {
    if (profile.leave > 0) AT.applyEase(prop, k1, "out", profile.leave);
    else AT.setSide(prop, k1, "out", KeyframeInterpolationType.LINEAR);
    if (profile.arrive > 0) AT.applyEase(prop, k2, "in", profile.arrive);
    else AT.setSide(prop, k2, "in", KeyframeInterpolationType.LINEAR);
};

AT.setSide = function (prop, k, side, type) {
    var inType = side === "in" ? type : prop.keyInInterpolationType(k);
    var outType = side === "out" ? type : prop.keyOutInterpolationType(k);
    prop.setInterpolationTypeAtKey(k, inType, outType);
};

// Named motion profiles shared by presets. "decelerate" is what most
// designers mean by an entrance "ease out": quick start, soft landing.
AT.EASE_PROFILES = {
    "linear": { leave: 0, arrive: 0 },
    "smooth": { leave: 33.33, arrive: 33.33 },
    "decelerate": { leave: 15, arrive: 75 },
    "accelerate": { leave: 75, arrive: 15 },
    "strong": { leave: 60, arrive: 90 }
};

AT.profile = function (name) {
    return AT.EASE_PROFILES[name] || AT.EASE_PROFILES.smooth;
};

AT.EASE_LABELS = {
    "linear": "Linear", "both": "Easy Ease", "in": "Easy Ease In", "out": "Easy Ease Out", "hold": "Hold"
};

AT.register("easing.apply", {
    validate: function (p, ctx) { AT.requireSelectedKeyframes(ctx.comp); },
    label: "Apply Easing",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var side = payload.mode || "both";
        if (side !== "custom" && !AT.EASE_LABELS[side]) AT.fail("bad-payload", "Unknown easing mode: " + side);
        var selection = AT.requireSelectedKeyframes(ctx.comp);
        var count = 0;
        for (var i = 0; i < selection.length; i++) {
            var s = selection[i];
            for (var j = 0; j < s.keys.length; j++) {
                if (side === "custom") {
                    // Slider mode: independent influence for each side of every
                    // selected key (0 = leave that side linear).
                    AT.applyCustomEase(s.prop, s.keys[j], payload.influenceIn, payload.influenceOut);
                } else {
                    AT.applyEase(s.prop, s.keys[j], side, payload.influence);
                }
                count++;
            }
        }
        var label;
        if (side === "custom") {
            label = "Ease In " + Math.round(payload.influenceIn || 0) + "% - Out " + Math.round(payload.influenceOut || 0) + "%";
        } else {
            label = AT.EASE_LABELS[side];
            if (payload.influence && side !== "linear" && side !== "hold") {
                label += " " + Math.round(payload.influence) + "%";
            }
        }
        return {
            result: { keyframes: count, properties: selection.length },
            feedback: label + " applied to " + AT.plural(count, "keyframe")
        };
    }
});

// Reads the real curve between the first two selected keyframes so the
// panel's preview reflects the user's animation, not a decorative graph.
AT.register("easing.read", {
    needs: "comp",
    run: function (payload, ctx) {
        var sel = AT.selectedKeyframes(ctx.comp);
        for (var i = 0; i < sel.length; i++) {
            var p = sel[i].prop;
            var k1 = sel[i].keys[0];
            var k2 = sel[i].keys.length > 1 ? sel[i].keys[1] : k1 + 1;
            if (k2 > p.numKeys) continue;

            var dt = p.keyTime(k2) - p.keyTime(k1);
            var v1 = p.keyValue(k1);
            var v2 = p.keyValue(k2);
            var dv = AT.valueDistance(v1, v2);
            var out1 = p.keyOutTemporalEase(k1)[0];
            var in2 = p.keyInTemporalEase(k2)[0];
            var outType = p.keyOutInterpolationType(k1);
            var inType = p.keyInInterpolationType(k2);

            var curve;
            if (outType === KeyframeInterpolationType.HOLD) {
                curve = { hold: true };
            } else {
                var x1 = outType === KeyframeInterpolationType.LINEAR ? 1 / 3 : out1.influence / 100;
                var x2 = inType === KeyframeInterpolationType.LINEAR ? 2 / 3 : 1 - in2.influence / 100;
                var y1 = x1;
                var y2 = x2;
                if (dv > 1e-9 && outType !== KeyframeInterpolationType.LINEAR) y1 = out1.speed * x1 * dt / dv;
                if (dv > 1e-9 && inType !== KeyframeInterpolationType.LINEAR) y2 = 1 - in2.speed * (1 - x2) * dt / dv;
                curve = { x1: x1, y1: y1, x2: x2, y2: y2 };
            }
            return {
                result: {
                    property: p.name,
                    layer: AT.ownerLayer(p) ? AT.ownerLayer(p).name : "",
                    fromTime: p.keyTime(k1),
                    toTime: p.keyTime(k2),
                    curve: curve
                }
            };
        }
        return { result: { curve: null } };
    }
});

// Physics easing between selected keyframes. A plain ease can only slow a
// move down; overshoot, bounce and elastic need extra keyframes past the
// target. For each pair of consecutive selected keys, this inserts the
// settle keys (shapes from presets.jsx) between them, eased so the motion
// reads as one gesture. The artist sees the real keys it made.
AT.PHYSICS = { overshoot: "pop", bounce: "bounce", elastic: "elastic" };

AT.register("easing.physics", {
    validate: function (p, ctx) { AT.requireSelectedKeyframes(ctx.comp, 2); },
    label: "Physics Easing",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var shapeName = AT.PHYSICS[payload.shape];
        if (!shapeName) AT.fail("bad-payload", "Unknown physics ease: " + payload.shape);
        var shape = AT.SHAPES[shapeName];
        var sel = AT.requireSelectedKeyframes(ctx.comp, 2);
        var segments = 0;
        for (var i = 0; i < sel.length; i++) {
            var prop = sel[i].prop;
            var v0 = prop.keyValue(sel[i].keys[0]);
            if (typeof v0 !== "number" && !(v0 instanceof Array)) continue; // text, markers, paths
            var times = [];
            var keys = sel[i].keys.slice(0).sort(function (a, b) { return a - b; });
            for (var k = 0; k < keys.length; k++) times.push(prop.keyTime(keys[k]));
            for (var j = times.length - 2; j >= 0; j--) {
                var t1 = times[j], t2 = times[j + 1];
                var a = prop.valueAtTime(t1, true), b = prop.valueAtTime(t2, true);
                AT.clearWindow(prop, t1, t2);
                for (var n = 1; n < shape.length - 1; n++) {
                    prop.setValueAtTime(t1 + shape[n][0] * (t2 - t1), AT.lerpValue(a, b, shape[n][1]));
                }
                var first = prop.nearestKeyIndex(t1), last = prop.nearestKeyIndex(t2);
                for (var q = first; q <= last; q++) {
                    if (prop.isSpatial) {
                        var zero = [];
                        for (var z = 0; z < a.length; z++) zero.push(0);
                        prop.setSpatialAutoBezierAtKey(q, false);
                        prop.setSpatialTangentsAtKey(q, zero, zero);
                    }
                    if (q === first) AT.applyEase(prop, q, "out", 20);
                    else if (q === last) AT.applyEase(prop, q, "in", 60);
                    else AT.applyEase(prop, q, "both", 40);
                }
                segments++;
            }
        }
        if (!segments) AT.fail("unsupported", "Physics easing works on number and position properties (not text, markers or paths).");
        var title = payload.shape.charAt(0).toUpperCase() + payload.shape.slice(1);
        return { result: { segments: segments }, feedback: title + " added to " + AT.plural(segments, "move") };
    }
});

AT.valueDistance = function (a, b) {
    if (typeof a === "number") return Math.abs(b - a);
    var sum = 0;
    for (var i = 0; i < a.length; i++) sum += (b[i] - a[i]) * (b[i] - a[i]);
    return Math.sqrt(sum);
};

AT.ownerLayer = function (prop) {
    try {
        return prop.propertyGroup(prop.propertyDepth);
    } catch (e) {
        return null;
    }
};

}($["com.aanders.animatortoolkit"]));
