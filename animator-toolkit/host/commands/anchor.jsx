// ============================================================================
// Animator Toolkit - anchor.set
//
// Moves each selected layer's Anchor Point to a point on its bounds (a 3x3
// grid position, or any normalized x/y) WITHOUT moving the layer on screen.
//
// The math: a point p in layer space lands in parent space at
//     Position + R(rotation) * (Scale * (p - Anchor))
// so moving the anchor by d (layer space) must move Position by
//     D = R(rotation) * (Scale * d)
// for the layer to stay put. That holds per-frame, so if Scale or Rotation
// is animated a single D can't be right on every frame; in that case (and a
// few others) we refuse for that layer with a specific reason instead of
// silently shifting the artwork.
// ============================================================================

AT.ANCHOR_GRID = {
    "top-left": [0, 0], "top-center": [0.5, 0], "top-right": [1, 0],
    "middle-left": [0, 0.5], "center": [0.5, 0.5], "middle-right": [1, 0.5],
    "bottom-left": [0, 1], "bottom-center": [0.5, 1], "bottom-right": [1, 1]
};

AT.anchorBounds = function (layer, time, includeExtents) {
    var r = layer.sourceRectAtTime(time, includeExtents);
    return { left: r.left, top: r.top, width: r.width, height: r.height };
};

// Returns null if the layer can be handled, otherwise a short reason.
AT.anchorBlocker = function (layer) {
    if (!AT.isVisualLayer(layer)) return "cameras and lights have no bounds";
    if (layer.locked) return "layer is locked";
    var anchor = AT.tprop(layer, "anchor");
    var position = AT.tprop(layer, "position");
    if (AT.hasLiveExpression(anchor)) return "Anchor Point has an expression";
    if (position.dimensionsSeparated) {
        var axes = ["positionX", "positionY", "positionZ"];
        for (var i = 0; i < axes.length; i++) {
            var p = AT.tprop(layer, axes[i]);
            if (p && AT.hasLiveExpression(p)) return "Position has an expression";
        }
    } else if (AT.hasLiveExpression(position)) {
        return "Position has an expression";
    }
    var scale = AT.tprop(layer, "scale");
    var rotation = AT.tprop(layer, "rotation");
    if (AT.hasLiveExpression(scale) || AT.hasLiveExpression(rotation)) {
        return "Scale or Rotation has an expression";
    }
    if (scale.numKeys > 0 || rotation.numKeys > 0) {
        return "its Scale or Rotation is animated (e.g. by Pop or Bounce). Set the anchor first, then add the animation - or delete the Scale/Rotation keyframes, set the anchor and re-apply the preset";
    }
    if (layer.threeDLayer) {
        var o = AT.tprop(layer, "orientation").value;
        if (AT.tprop(layer, "rotationX").value !== 0 || AT.tprop(layer, "rotationY").value !== 0 ||
            o[0] !== 0 || o[1] !== 0) {
            return "3D layer is tilted (X/Y rotation or orientation isn't 0)";
        }
    }
    return null;
};

AT.moveAnchor = function (layer, time, nx, ny, includeExtents) {
    var b = AT.anchorBounds(layer, time, includeExtents);
    var anchorProp = AT.tprop(layer, "anchor");
    var a = anchorProp.valueAtTime(time, true);
    var dx = b.left + nx * b.width - a[0];
    var dy = b.top + ny * b.height - a[1];

    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return false;

    var s = AT.tprop(layer, "scale").value;
    var sx = s[0] / 100;
    var sy = s[1] / 100;
    var theta = AT.tprop(layer, "rotation").value * Math.PI / 180;
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    var Dx = cos * (sx * dx) - sin * (sy * dy);
    var Dy = sin * (sx * dx) + cos * (sy * dy);

    AT.offsetProperty(anchorProp, [dx, dy, 0]);

    var position = AT.tprop(layer, "position");
    if (position.dimensionsSeparated) {
        AT.offsetProperty(AT.tprop(layer, "positionX"), [Dx]);
        AT.offsetProperty(AT.tprop(layer, "positionY"), [Dy]);
    } else {
        AT.offsetProperty(position, [Dx, Dy, 0]);
    }
    return true;
};

AT.register("anchor.set", {
    label: "Set Anchor Point",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var nx, ny;
        var name = payload.position || "center";
        if (typeof payload.x === "number" && typeof payload.y === "number") {
            nx = payload.x;
            ny = payload.y;
        } else if (AT.ANCHOR_GRID[name]) {
            nx = AT.ANCHOR_GRID[name][0];
            ny = AT.ANCHOR_GRID[name][1];
        } else {
            AT.fail("bad-payload", "Unknown anchor position: " + name);
        }
        var includeExtents = payload.includeExtents !== false;
        var time = ctx.comp.time;

        var moved = 0;
        var unchanged = 0;
        var skipped = [];
        for (var i = 0; i < ctx.layers.length; i++) {
            var layer = ctx.layers[i];
            var reason = AT.anchorBlocker(layer);
            if (reason) {
                skipped.push({ layer: layer.name, reason: reason });
                continue;
            }
            if (AT.moveAnchor(layer, time, nx, ny, includeExtents)) moved++;
            else unchanged++;
        }

        if (moved === 0 && unchanged === 0) {
            AT.fail("unsupported-layer", "Anchor not moved: " + skipped[0].layer + " - " + skipped[0].reason + ".");
        }

        var label = name.replace("-", " ");
        var feedback = moved > 0
            ? "Anchor moved to " + label + " on " + AT.plural(moved, "layer")
            : "Anchor was already at " + label;
        if (skipped.length) feedback += " - skipped " + AT.plural(skipped.length, "layer");
        return { result: { moved: moved, unchanged: unchanged, skipped: skipped }, feedback: feedback };
    }
});
