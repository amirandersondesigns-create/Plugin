// ============================================================================
// Animator Toolkit - declarative motion presets (preset.apply)
//
// A preset is data, not code: { kind, phase, durationFrames, ... }. This
// module turns it into keyframes. Rules that make presets STACK cleanly:
//
// 1. Timing. Entrances ("in") start at the layer's In point, exits ("out")
//    end at its Out point - so Bounce In and Bounce Out on the same layer
//    land at opposite ends instead of fighting over the same frames.
//    (timing: "playhead" starts the animation at the current time instead.)
// 2. Rest value. An entrance animates TO whatever the property is at the
//    end of its window; an exit animates FROM its value at the start. So
//    presets build on the layer's real position/scale instead of resetting
//    it, and on each other.
// 3. Own window only. Before writing, any keyframes strictly inside the
//    preset's window on that property are removed, so re-applying (or
//    swapping Bounce In for Pop In) replaces rather than piling up.
// 4. Different properties never interact: Fade (Opacity) + Slide (Position)
//    + Blur (effect) on one layer all coexist. Effect presets reuse one
//    effect instance ("AT Blur", "AT Wipe") so an In and an Out share it.
// 5. Every application drops a layer marker spanning the animation, labelled
//    with the preset name, so artists can see what was added and where.
//    Presets landing on the same frame merge into one marker ("Fade In +
//    Slide Up").
//
// One click = one undo group (the dispatcher wraps the whole command, even
// when `steps` applies several presets at once).
// ============================================================================

// Keyframe shapes as (time fraction, value factor). For an entrance, factor
// 0 = the "away" state and 1 = the rest value; exits are the time-reverse.
AT.SHAPES = {
    "simple": [[0, 0], [1, 1]],
    "pop": [[0, 0], [0.6, 1.12], [1, 1]],
    "bounce": [[0, 0], [0.4, 1.16], [0.6, 0.92], [0.78, 1.04], [0.9, 0.99], [1, 1]],
    // Drop: falls in, hits rest, rebounds with decaying height. Factor is
    // "fraction of the way from away to rest", so >1 never happens and the
    // ground contacts are exact.
    "drop": [[0, 0], [0.42, 1], [0.6, 0.78], [0.76, 1], [0.87, 0.93], [1, 1]]
};

AT.presetWindow = function (layer, comp, def) {
    var dur = AT.frames(comp, def.durationFrames || 15);
    var start;
    if (def.timing === "playhead") {
        start = comp.time;
    } else if (def.phase === "out") {
        start = layer.outPoint - dur;
    } else {
        start = layer.inPoint;
    }
    // Keep the whole animation inside the layer so it's actually visible.
    if (start < layer.inPoint) start = layer.inPoint;
    if (start + dur > layer.outPoint) dur = Math.max(comp.frameDuration, layer.outPoint - start);
    return { start: start, end: start + dur, duration: dur };
};

AT.clearWindow = function (prop, start, end) {
    var eps = 1e-4;
    for (var k = prop.numKeys; k >= 1; k--) {
        var t = prop.keyTime(k);
        if (t > start + eps && t < end - eps) prop.removeKey(k);
    }
};

AT.lerpValue = function (away, rest, f) {
    if (typeof rest === "number") return away + (rest - away) * f;
    var out = [];
    for (var i = 0; i < rest.length; i++) out.push(away[i] + (rest[i] - away[i]) * f);
    return out;
};

// Writes a shape onto one property. `awayFn(rest)` gives the off state.
AT.animateProperty = function (prop, win, def, awayFn) {
    if (!prop || !prop.canVaryOverTime) AT.fail("unsupported", "This layer has no " + def.title + " property to animate.");
    if (AT.hasLiveExpression(prop)) AT.fail("expression", prop.name + " has an expression, so keyframes wouldn't show. Disable it first.");

    var restTime = def.phase === "out" ? win.start : win.end;
    var rest = prop.valueAtTime(restTime, true);
    var away = awayFn(rest);
    var shape = AT.SHAPES[def.shape || "simple"];

    AT.clearWindow(prop, win.start, win.end);

    var times = [];
    for (var i = 0; i < shape.length; i++) {
        var frac = def.phase === "out" ? 1 - shape[i][0] : shape[i][0];
        var t = win.start + frac * win.duration;
        prop.setValueAtTime(t, AT.lerpValue(away, rest, shape[i][1]));
        times.push(t);
    }
    times.sort(function (a, b) { return a - b; });

    // Ease: the first move leaves/arrives per the preset's profile; inner
    // overshoot keys get a smooth ease so the settle reads as one motion.
    var profile = AT.profile(def.easing || (def.phase === "out" ? "accelerate" : "decelerate"));
    var keys = [];
    for (var j = 0; j < times.length; j++) keys.push(prop.nearestKeyIndex(times[j]));

    // Straight-line motion paths: auto-bezier tangents would bow the path
    // (and loop on a bounce, where keys revisit the same point).
    if (prop.isSpatial) {
        var zero = [];
        for (var z = 0; z < rest.length; z++) zero.push(0);
        for (var q = 0; q < keys.length; q++) {
            prop.setSpatialContinuousAtKey(keys[q], false);
            prop.setSpatialAutoBezierAtKey(keys[q], false);
            prop.setSpatialTangentsAtKey(keys[q], zero, zero);
        }
    }
    if (keys.length === 2) {
        AT.easeSegment(prop, keys[0], keys[1], profile);
    } else {
        var last = keys.length - 1;
        for (var n = 0; n <= last; n++) {
            if (n === 0) {
                if (profile.leave > 0) AT.applyEase(prop, keys[n], "out", profile.leave);
                else AT.setSide(prop, keys[n], "out", KeyframeInterpolationType.LINEAR);
            } else if (n === last) {
                if (profile.arrive > 0) AT.applyEase(prop, keys[n], "in", profile.arrive);
                else AT.setSide(prop, keys[n], "in", KeyframeInterpolationType.LINEAR);
            } else {
                AT.applyEase(prop, keys[n], "both", 40);
            }
        }
    }
    return keys.length;
};

// Direction vector for slide/drop, in layer-parent pixels (y is down).
AT.DIRS = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };

AT.animatePosition = function (layer, win, def) {
    var dir = AT.DIRS[def.direction || "up"];
    // For an entrance "up" means travelling upward into place, so the away
    // state is BELOW (+y). For an exit "up" means leaving upward (-y).
    var sign = def.phase === "out" ? -1 : 1;
    var dx = dir[0] * (def.distance || 80) * sign;
    var dy = dir[1] * (def.distance || 80) * sign;
    var position = AT.tprop(layer, "position");
    if (position.dimensionsSeparated) {
        var n = 0;
        if (dx !== 0) n += AT.animateProperty(AT.tprop(layer, "positionX"), win, def, function (r) { return r + dx; });
        if (dy !== 0) n += AT.animateProperty(AT.tprop(layer, "positionY"), win, def, function (r) { return r + dy; });
        return n;
    }
    return AT.animateProperty(position, win, def, function (r) {
        var v = [r[0] + dx, r[1] + dy];
        if (r.length > 2) v.push(r[2]);
        return v;
    });
};

AT.ensureEffect = function (layer, matchName, name) {
    var parade = layer.property(AT.MN.effects);
    if (!parade) AT.fail("unsupported", "This layer type can't take effects.");
    for (var i = 1; i <= parade.numProperties; i++) {
        var fx = parade.property(i);
        if (fx.matchName === matchName && fx.name === name) return fx;
    }
    if (!parade.canAddProperty(matchName)) AT.fail("unsupported", "This layer type can't take " + name + ".");
    var added = parade.addProperty(matchName);
    added.name = name;
    // Re-fetch: adding properties can invalidate earlier references.
    return layer.property(AT.MN.effects).property(name);
};

AT.WIPE_ANGLES = { up: 180, down: 0, left: 90, right: 270 };

// ---- kinds -----------------------------------------------------------------

AT.PRESET_KINDS = {
    fade: function (layer, win, def) {
        return AT.animateProperty(AT.tprop(layer, "opacity"), win, def, function () { return 0; });
    },
    slide: function (layer, win, def) {
        return AT.animatePosition(layer, win, def);
    },
    scale: function (layer, win, def) {
        var from = (def.from === undefined ? 0 : def.from) / 100;
        return AT.animateProperty(AT.tprop(layer, "scale"), win, def, function (r) {
            var v = [];
            for (var i = 0; i < r.length; i++) v.push(i < 2 ? r[i] * from : r[i]);
            return v;
        });
    },
    rotate: function (layer, win, def) {
        var angle = def.angle || 90;
        return AT.animateProperty(AT.tprop(layer, "rotation"), win, def, function (r) { return r - angle; });
    },
    blur: function (layer, win, def) {
        var fx = AT.ensureEffect(layer, "ADBE Gaussian Blur 2", "AT Blur");
        var amount = def.amount || 40;
        return AT.animateProperty(fx.property("ADBE Gaussian Blur 2-0001"), win, def, function () { return amount; });
    },
    wipe: function (layer, win, def) {
        var fx = AT.ensureEffect(layer, "ADBE Linear Wipe", "AT Wipe");
        var angle = fx.property("ADBE Linear Wipe-0002");
        if (angle.numKeys === 0) angle.setValue(AT.WIPE_ANGLES[def.direction || "right"]);
        var feather = fx.property("ADBE Linear Wipe-0003");
        if (feather.numKeys === 0 && feather.value === 0) feather.setValue(def.feather || 0);
        return AT.animateProperty(fx.property("ADBE Linear Wipe-0001"), win, def, function () { return 100; });
    }
};

// Text-animator kinds live in text.jsx and register into AT.PRESET_KINDS.

AT.addMarker = function (layer, time, duration, label) {
    var markers = layer.property("ADBE Marker");
    if (!markers) return;
    var eps = 1e-4;
    for (var k = 1; k <= markers.numKeys; k++) {
        if (Math.abs(markers.keyTime(k) - time) < eps) {
            var existing = markers.keyValue(k);
            // Merge rather than overwrite, so stacked presets that start on
            // the same frame are all listed.
            if (existing.comment.indexOf(label) === -1) {
                var merged = new MarkerValue(existing.comment ? existing.comment + " + " + label : label);
                merged.duration = Math.max(existing.duration, duration);
                markers.setValueAtKey(k, merged);
            }
            return;
        }
    }
    var mv = new MarkerValue(label);
    mv.duration = duration;
    markers.setValueAtTime(time, mv);
};

AT.applyPresetToLayer = function (layer, comp, def) {
    var kind = AT.PRESET_KINDS[def.kind];
    if (!kind) AT.fail("bad-payload", "Unknown preset type: " + def.kind);
    if (def.requires === "text" && AT.layerKind(layer) !== "text") {
        return { skipped: "not a text layer" };
    }
    if (!AT.isVisualLayer(layer)) return { skipped: "cameras and lights can't take motion presets" };
    if (layer.locked) return { skipped: "layer is locked" };
    var win = AT.presetWindow(layer, comp, def);
    var keys = kind(layer, win, def);
    if (def.marker !== false) AT.addMarker(layer, win.start, win.duration, def.title || def.kind);
    return { keys: keys, start: win.start, end: win.end };
};

AT.register("preset.apply", {
    label: "Apply Preset",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        // Either a single definition or { title, steps: [def, def, ...] }.
        var steps = payload.steps || [payload];
        var applied = 0;
        var keyCount = 0;
        var skipped = [];
        for (var i = 0; i < ctx.layers.length; i++) {
            var layer = ctx.layers[i];
            var layerOk = false;
            for (var s = 0; s < steps.length; s++) {
                var def = steps[s];
                if (payload.timing && !def.timing) def.timing = payload.timing;
                if (payload.durationFrames && !def.durationFrames) def.durationFrames = payload.durationFrames;
                var r = AT.applyPresetToLayer(layer, ctx.comp, def);
                if (r.skipped) {
                    skipped.push({ layer: layer.name, reason: r.skipped });
                    break;
                }
                keyCount += r.keys;
                layerOk = true;
            }
            if (layerOk) applied++;
        }
        if (applied === 0) {
            AT.fail("unsupported-layer", (payload.title || "Preset") + " not applied: " +
                skipped[0].layer + " - " + skipped[0].reason + ".");
        }
        var feedback = (payload.title || "Preset") + " added to " + AT.plural(applied, "layer");
        if (skipped.length) feedback += " - skipped " + AT.plural(skipped.length, "layer");
        return { result: { layers: applied, keyframes: keyCount, skipped: skipped }, feedback: feedback };
    }
});
