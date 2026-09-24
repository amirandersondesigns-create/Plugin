// ============================================================================
// Animator Toolkit - layer utilities: align, distribute, null/parent,
// pre-compose, markers, motion blur.
// ============================================================================

// Visual bounds of a layer in its parent's space (the comp, when
// unparented), at `time`: the four corners of sourceRectAtTime pushed
// through Position/Anchor/Scale/Rotation.
AT.layerBoundsInParent = function (layer, time) {
    var r = layer.sourceRectAtTime(time, true);
    var a = AT.tprop(layer, "anchor").valueAtTime(time, false);
    var p = AT.tprop(layer, "position").valueAtTime(time, false);
    var s = AT.tprop(layer, "scale").valueAtTime(time, false);
    var th = AT.tprop(layer, "rotation").valueAtTime(time, false) * Math.PI / 180;
    var cos = Math.cos(th), sin = Math.sin(th);
    var corners = [[r.left, r.top], [r.left + r.width, r.top], [r.left, r.top + r.height], [r.left + r.width, r.top + r.height]];
    var b = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (var i = 0; i < 4; i++) {
        var x = (corners[i][0] - a[0]) * s[0] / 100;
        var y = (corners[i][1] - a[1]) * s[1] / 100;
        var cx = p[0] + cos * x - sin * y;
        var cy = p[1] + sin * x + cos * y;
        b.left = Math.min(b.left, cx);
        b.right = Math.max(b.right, cx);
        b.top = Math.min(b.top, cy);
        b.bottom = Math.max(b.bottom, cy);
    }
    return b;
};

AT.shiftLayer = function (layer, dx, dy) {
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;
    var position = AT.tprop(layer, "position");
    if (position.dimensionsSeparated) {
        AT.offsetProperty(AT.tprop(layer, "positionX"), [dx]);
        AT.offsetProperty(AT.tprop(layer, "positionY"), [dy]);
    } else {
        AT.offsetProperty(position, [dx, dy, 0]);
    }
};

AT.alignBlocker = function (layer) {
    if (!AT.isVisualLayer(layer)) return "cameras and lights have no bounds";
    if (layer.locked) return "layer is locked";
    if (layer.parent) return "layer is parented (align the parent instead)";
    if (layer.threeDLayer) return "3D layers depend on the camera, so 2D alignment would be misleading";
    var position = AT.tprop(layer, "position");
    if (AT.hasLiveExpression(position)) return "Position has an expression";
    return null;
};

// edge: left | hcenter | right | top | vcenter | bottom | center
AT.register("layers.align", {
    label: "Align Layers",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var edge = payload.edge || "center";
        var t = ctx.comp.time;
        var usable = [];
        var skipped = [];
        for (var i = 0; i < ctx.layers.length; i++) {
            var reason = AT.alignBlocker(ctx.layers[i]);
            if (reason) skipped.push({ layer: ctx.layers[i].name, reason: reason });
            else usable.push({ layer: ctx.layers[i], b: AT.layerBoundsInParent(ctx.layers[i], t) });
        }
        if (usable.length === 0) AT.fail("unsupported-layer", "Nothing aligned: " + skipped[0].layer + " - " + skipped[0].reason + ".");

        // Target: the comp frame, or the selection's combined bounds.
        var toSelection = payload.to === "selection" && usable.length > 1;
        var T = { left: 0, top: 0, right: ctx.comp.width, bottom: ctx.comp.height };
        if (toSelection) {
            T = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
            for (var u = 0; u < usable.length; u++) {
                T.left = Math.min(T.left, usable[u].b.left);
                T.top = Math.min(T.top, usable[u].b.top);
                T.right = Math.max(T.right, usable[u].b.right);
                T.bottom = Math.max(T.bottom, usable[u].b.bottom);
            }
        }
        for (var j = 0; j < usable.length; j++) {
            var b = usable[j].b;
            var dx = 0, dy = 0;
            if (edge === "left") dx = T.left - b.left;
            if (edge === "right") dx = T.right - b.right;
            if (edge === "hcenter" || edge === "center") dx = (T.left + T.right) / 2 - (b.left + b.right) / 2;
            if (edge === "top") dy = T.top - b.top;
            if (edge === "bottom") dy = T.bottom - b.bottom;
            if (edge === "vcenter" || edge === "center") dy = (T.top + T.bottom) / 2 - (b.top + b.bottom) / 2;
            AT.shiftLayer(usable[j].layer, dx, dy);
        }
        var feedback = "Aligned " + AT.plural(usable.length, "layer") + " to " + (toSelection ? "selection" : "comp") + " " + edge.replace("hcenter", "horizontal center").replace("vcenter", "vertical center");
        if (skipped.length) feedback += " - skipped " + AT.plural(skipped.length, "layer");
        return { result: { layers: usable.length, skipped: skipped }, feedback: feedback };
    }
});

// axis: "h" | "v" - evenly spaces layer centers between the outermost two.
AT.register("layers.distribute", {
    label: "Distribute Layers",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var axis = payload.axis === "v" ? "v" : "h";
        var t = ctx.comp.time;
        var items = [];
        for (var i = 0; i < ctx.layers.length; i++) {
            if (AT.alignBlocker(ctx.layers[i])) continue;
            var b = AT.layerBoundsInParent(ctx.layers[i], t);
            items.push({ layer: ctx.layers[i], c: axis === "h" ? (b.left + b.right) / 2 : (b.top + b.bottom) / 2 });
        }
        if (items.length < 3) AT.fail("too-few-layers", "Select three or more unparented 2D layers to distribute.");
        items.sort(function (x, y) { return x.c - y.c; });
        var first = items[0].c;
        var step = (items[items.length - 1].c - first) / (items.length - 1);
        for (var j = 1; j < items.length - 1; j++) {
            var d = first + step * j - items[j].c;
            AT.shiftLayer(items[j].layer, axis === "h" ? d : 0, axis === "v" ? d : 0);
        }
        return { result: { layers: items.length }, feedback: "Distributed " + AT.plural(items.length, "layer") + (axis === "h" ? " horizontally" : " vertically") };
    }
});

AT.register("layers.nullParent", {
    label: "Parent to Null",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var t = ctx.comp.time;
        var sx = 0, sy = 0, n = 0;
        var topIndex = Infinity;
        for (var i = 0; i < ctx.layers.length; i++) {
            var p = AT.tprop(ctx.layers[i], "position").valueAtTime(t, false);
            if (!ctx.layers[i].parent) { sx += p[0]; sy += p[1]; n++; }
            topIndex = Math.min(topIndex, ctx.layers[i].index);
        }
        var nul = ctx.comp.layers.addNull(ctx.comp.duration);
        nul.name = payload.name || "Controller";
        nul.label = 1;
        AT.tprop(nul, "position").setValue(n ? [sx / n, sy / n] : [ctx.comp.width / 2, ctx.comp.height / 2]);
        nul.moveBefore(ctx.comp.layer(topIndex + 1));
        var parented = 0;
        for (var j = 0; j < ctx.layers.length; j++) {
            // Only reparent top-level layers so existing rigs keep working.
            if (!ctx.layers[j].parent) { ctx.layers[j].parent = nul; parented++; }
        }
        return { result: { parented: parented }, feedback: AT.plural(parented, "layer") + " parented to \"" + nul.name + "\"" };
    }
});

AT.register("layers.null", {
    label: "Create Null",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var nul = ctx.comp.layers.addNull(ctx.comp.duration);
        nul.name = payload.name || "Null";
        return { result: {}, feedback: "Null created" };
    }
});

AT.register("layers.precompose", {
    label: "Pre-compose",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var indices = [];
        for (var i = 0; i < ctx.layers.length; i++) indices.push(ctx.layers[i].index);
        var name = payload.name || (ctx.layers.length === 1 ? ctx.layers[0].name + " Comp" : "Pre-comp");
        ctx.comp.layers.precompose(indices, name, true);
        return { result: { layers: indices.length }, feedback: AT.plural(indices.length, "layer") + " pre-composed into \"" + name + "\"" };
    }
});

AT.register("layers.marker", {
    label: "Add Marker",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var t = ctx.comp.time;
        var layers = ctx.comp.selectedLayers;
        if (layers.length === 0) {
            if (!ctx.comp.markerProperty) AT.fail("no-selection", "Select a layer to mark (comp markers need After Effects 2023+).");
            ctx.comp.markerProperty.setValueAtTime(t, new MarkerValue(payload.comment || ""));
            return { result: {}, feedback: "Comp marker added" };
        }
        for (var i = 0; i < layers.length; i++) {
            layers[i].property("ADBE Marker").setValueAtTime(t, new MarkerValue(payload.comment || ""));
        }
        return { result: {}, feedback: "Marker added to " + AT.plural(layers.length, "layer") };
    }
});

AT.register("layers.motionBlur", {
    label: "Motion Blur",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var on = !ctx.layers[0].motionBlur;
        for (var i = 0; i < ctx.layers.length; i++) {
            if (AT.isVisualLayer(ctx.layers[i])) ctx.layers[i].motionBlur = on;
        }
        // Layer switches do nothing until the comp switch is on too.
        if (on) ctx.comp.motionBlur = true;
        return { result: { on: on }, feedback: "Motion blur " + (on ? "on" : "off") + " for " + AT.plural(ctx.layers.length, "layer") };
    }
});
