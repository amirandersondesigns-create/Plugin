// ============================================================================
// Animator Toolkit - masks: reveal presets + quick mask tools
//
// Reveal presets register into AT.PRESET_KINDS, so they get the same timing,
// stacking and marker rules as every other preset. Each kind owns ONE mask
// ("AT Mask Wipe", "AT Mask Iris", ...), reused by its In and Out, exactly
// like "AT Blur": an entrance and an exit on one layer share the mask and
// land at opposite ends of the layer.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.MASK_MN = {
    parade: "ADBE Mask Parade",
    atom: "ADBE Mask Atom",
    path: "ADBE Mask Shape",
    feather: "ADBE Mask Feather",
    opacity: "ADBE Mask Opacity",
    expansion: "ADBE Mask Offset"
};

// Layer bounds with a small margin so edges never show a sliver.
AT.maskBounds = function (layer, time) {
    var r = layer.sourceRectAtTime(time, true);
    var m = 2;
    return { l: r.left - m, t: r.top - m, r: r.left + r.width + m, b: r.top + r.height + m };
};

AT.rectShape = function (l, t, r, b) {
    var s = new Shape();
    s.vertices = [[l, t], [r, t], [r, b], [l, b]];
    s.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
    s.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
    s.closed = true;
    return s;
};

// Ellipse through 4 points with the standard 0.5523 bezier handle ratio.
AT.ellipseShape = function (cx, cy, rx, ry) {
    var k = 0.5523;
    var s = new Shape();
    s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
    s.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
    s.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
    s.closed = true;
    return s;
};

AT.masksOf = function (layer) {
    var parade = layer.property(AT.MASK_MN.parade);
    if (!parade) AT.fail("unsupported", "This layer type can't have masks.");
    return parade;
};

// Finds the named mask or creates it. Returns a getter: adding properties
// can invalidate references in After Effects, so always re-fetch.
AT.ensureMask = function (layer, name, makeShape) {
    var created = false;
    if (!AT.masksOf(layer).property(name)) {
        var m = AT.masksOf(layer).addProperty(AT.MASK_MN.atom);
        m.name = name;
        created = true;
    }
    var get = function () { return AT.masksOf(layer).property(name); };
    if (created) {
        get().maskMode = MaskMode.ADD;
        get().property(AT.MASK_MN.path).setValue(makeShape());
    }
    return get;
};

// Two-key animation of a mask path between shapes (paths can't be
// multiplied like numbers, so they don't use AT.animateProperty).
AT.animateMaskPath = function (prop, win, def, away, rest) {
    AT.clearWindow(prop, win.start, win.end);
    var first = def.phase === "out" ? rest : away;
    var second = def.phase === "out" ? away : rest;
    prop.setValueAtTime(win.start, first);
    prop.setValueAtTime(win.end, second);
    var profile = AT.profile(def.easing || (def.phase === "out" ? "accelerate" : "decelerate"));
    AT.easeSegment(prop, prop.nearestKeyIndex(win.start), prop.nearestKeyIndex(win.end), profile);
    return 2;
};

AT.applyMaskFeather = function (get, def) {
    if (def.feather === undefined) return;
    var f = get().property(AT.MASK_MN.feather);
    if (f.numKeys === 0) f.setValue([def.feather, def.feather]);
};

// Wipe: a rectangle that grows from one edge. direction = travel direction.
AT.PRESET_KINDS["mask-wipe"] = function (layer, win, def) {
    var b = AT.maskBounds(layer, win.start);
    var full = function () { return AT.rectShape(b.l, b.t, b.r, b.b); };
    var get = AT.ensureMask(layer, "AT Mask Wipe", full);
    AT.applyMaskFeather(get, def);
    var d = def.direction || "right";
    var away = d === "right" ? AT.rectShape(b.l, b.t, b.l, b.b)
        : d === "left" ? AT.rectShape(b.r, b.t, b.r, b.b)
        : d === "up" ? AT.rectShape(b.l, b.b, b.r, b.b)
        : AT.rectShape(b.l, b.t, b.r, b.t);
    return AT.animateMaskPath(get().property(AT.MASK_MN.path), win, def, away, full());
};

// Split: opens from the centre line outwards (horizontal = left/right).
AT.PRESET_KINDS["mask-split"] = function (layer, win, def) {
    var b = AT.maskBounds(layer, win.start);
    var full = function () { return AT.rectShape(b.l, b.t, b.r, b.b); };
    var get = AT.ensureMask(layer, "AT Mask Split", full);
    AT.applyMaskFeather(get, def);
    var cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2;
    var away = def.direction === "vertical" ? AT.rectShape(b.l, cy, b.r, cy) : AT.rectShape(cx, b.t, cx, b.b);
    return AT.animateMaskPath(get().property(AT.MASK_MN.path), win, def, away, full());
};

// Iris: an ellipse covering the layer, opened with Mask Expansion (a
// number, so overshoot shapes work too).
AT.PRESET_KINDS["mask-iris"] = function (layer, win, def) {
    var b = AT.maskBounds(layer, win.start);
    var cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2;
    var rx = (b.r - b.l) / 2 * Math.SQRT2, ry = (b.b - b.t) / 2 * Math.SQRT2;
    var get = AT.ensureMask(layer, "AT Mask Iris", function () { return AT.ellipseShape(cx, cy, rx, ry); });
    AT.applyMaskFeather(get, def);
    var closed = -Math.max(rx, ry);
    return AT.animateProperty(get().property(AT.MASK_MN.expansion), win, def, function () { return closed; });
};

// ---- quick mask tools -----------------------------------------------------------

AT.maskableLayers = function (ctx) {
    var out = [];
    for (var i = 0; i < ctx.layers.length; i++) {
        if (AT.isVisualLayer(ctx.layers[i]) && ctx.layers[i].property(AT.MASK_MN.parade)) out.push(ctx.layers[i]);
    }
    if (!out.length) AT.fail("unsupported-layer", "Select a layer that can have masks (not a camera or light).");
    return out;
};

AT.register("mask.add", {
    label: "Add Mask",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var layers = AT.maskableLayers(ctx);
        var ellipse = payload.shape === "ellipse";
        for (var i = 0; i < layers.length; i++) {
            var b = AT.maskBounds(layers[i], ctx.comp.time);
            var m = AT.masksOf(layers[i]).addProperty(AT.MASK_MN.atom);
            m.maskMode = MaskMode.ADD;
            m.property(AT.MASK_MN.path).setValue(ellipse
                ? AT.ellipseShape((b.l + b.r) / 2, (b.t + b.b) / 2, (b.r - b.l) / 2, (b.b - b.t) / 2)
                : AT.rectShape(b.l, b.t, b.r, b.b));
        }
        return { result: { layers: layers.length }, feedback: (ellipse ? "Ellipse" : "Rectangle") + " mask added to " + AT.plural(layers.length, "layer") };
    }
});

AT.register("mask.invert", {
    label: "Invert Masks",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var layers = AT.maskableLayers(ctx);
        var n = 0;
        for (var i = 0; i < layers.length; i++) {
            var p = AT.masksOf(layers[i]);
            for (var k = 1; k <= p.numProperties; k++) { p.property(k).inverted = !p.property(k).inverted; n++; }
        }
        if (!n) AT.fail("no-masks", "The selected layers have no masks yet. Add one first.");
        return { result: { masks: n }, feedback: AT.plural(n, "mask") + " inverted" };
    }
});

AT.register("mask.feather", {
    label: "Feather Masks",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var layers = AT.maskableLayers(ctx);
        var amount = typeof payload.amount === "number" ? payload.amount : 20;
        var n = 0;
        for (var i = 0; i < layers.length; i++) {
            var p = AT.masksOf(layers[i]);
            for (var k = 1; k <= p.numProperties; k++) {
                var f = p.property(k).property(AT.MASK_MN.feather);
                if (f.numKeys > 0) f.setValueAtTime(ctx.comp.time, [amount, amount]);
                else f.setValue([amount, amount]);
                n++;
            }
        }
        if (!n) AT.fail("no-masks", "The selected layers have no masks yet. Add one first.");
        return { result: { masks: n }, feedback: "Feather " + amount + "px on " + AT.plural(n, "mask") };
    }
});

}($["com.aanders.animatortoolkit"]));
