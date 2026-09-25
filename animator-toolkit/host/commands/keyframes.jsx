// ============================================================================
// Animator Toolkit - keyframe tools
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.KEYFRAME_TARGETS = {
    position: ["position"],
    scale: ["scale"],
    rotation: ["rotation"],
    opacity: ["opacity"],
    anchor: ["anchor"],
    all: ["anchor", "position", "scale", "rotation", "opacity"]
};

// Positions with separated dimensions are keyed on X/Y(/Z) instead.
AT.keyableProps = function (layer, name) {
    if (name === "position" && AT.tprop(layer, "position").dimensionsSeparated) {
        var list = [AT.tprop(layer, "positionX"), AT.tprop(layer, "positionY")];
        if (layer.threeDLayer) list.push(AT.tprop(layer, "positionZ"));
        return list;
    }
    return [AT.tprop(layer, name)];
};

AT.register("keyframes.add", {
    label: "Add Keyframes",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var targets = AT.KEYFRAME_TARGETS[payload.property || "all"];
        if (!targets) AT.fail("bad-payload", "Unknown property: " + payload.property);
        var t = ctx.comp.time;
        var count = 0;
        var skipped = 0;
        for (var i = 0; i < ctx.layers.length; i++) {
            var layer = ctx.layers[i];
            if (AT.layerKind(layer) === "light") { skipped++; continue; }
            for (var j = 0; j < targets.length; j++) {
                var props = AT.keyableProps(layer, targets[j]);
                for (var p = 0; p < props.length; p++) {
                    var prop = props[p];
                    if (!prop || !prop.canVaryOverTime) continue;
                    // Pre-expression value: keying what the expression shows
                    // would bake the expression result into the keyframe.
                    prop.setValueAtTime(t, prop.valueAtTime(t, true));
                    count++;
                }
            }
        }
        if (count === 0) AT.fail("unsupported-layer", "Those layers don't have that property.");
        var name = payload.property === "all" || !payload.property ? "Transform" : payload.property.charAt(0).toUpperCase() + payload.property.slice(1);
        return { result: { keyframes: count }, feedback: name + " keyframe added on " + AT.plural(count, "property", "properties") };
    }
});

AT.register("keyframes.delete", {
    label: "Delete Keyframes",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var sel = AT.requireSelectedKeyframes(ctx.comp);
        var count = 0;
        for (var i = 0; i < sel.length; i++) {
            var keys = sel[i].keys.slice(0).sort(function (a, b) { return b - a; });
            for (var k = 0; k < keys.length; k++) {
                sel[i].prop.removeKey(keys[k]);
                count++;
            }
        }
        return { result: { keyframes: count }, feedback: AT.plural(count, "keyframe") + " deleted" };
    }
});

AT.snapshotKey = function (prop, k) {
    var snap = {
        time: prop.keyTime(k),
        value: prop.keyValue(k),
        inType: prop.keyInInterpolationType(k),
        outType: prop.keyOutInterpolationType(k),
        inEase: prop.keyInTemporalEase(k),
        outEase: prop.keyOutTemporalEase(k)
    };
    if (prop.isSpatial) {
        snap.inTangent = prop.keyInSpatialTangent(k);
        snap.outTangent = prop.keyOutSpatialTangent(k);
    }
    return snap;
};

// Mirrors the selected keyframes in time. In/out sides swap, so an ease
// that used to slow into a key now slows out of its mirror.
AT.register("keyframes.reverse", {
    label: "Reverse Keyframes",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var sel = AT.requireSelectedKeyframes(ctx.comp, 2);
        var count = 0;
        for (var i = 0; i < sel.length; i++) {
            var prop = sel[i].prop;
            var keys = sel[i].keys;
            if (keys.length < 2) continue;
            var snaps = [];
            var tMin = Infinity, tMax = -Infinity;
            for (var k = 0; k < keys.length; k++) {
                var s = AT.snapshotKey(prop, keys[k]);
                snaps.push(s);
                tMin = Math.min(tMin, s.time);
                tMax = Math.max(tMax, s.time);
            }
            var desc = keys.slice(0).sort(function (a, b) { return b - a; });
            for (var d = 0; d < desc.length; d++) prop.removeKey(desc[d]);
            for (var n = 0; n < snaps.length; n++) {
                var sn = snaps[n];
                var t = tMin + tMax - sn.time;
                prop.setValueAtTime(t, sn.value);
                var idx = prop.nearestKeyIndex(t);
                prop.setInterpolationTypeAtKey(idx, sn.outType, sn.inType);
                if (sn.outType !== KeyframeInterpolationType.HOLD) {
                    prop.setTemporalEaseAtKey(idx, sn.outEase, sn.inEase);
                }
                if (prop.isSpatial) prop.setSpatialTangentsAtKey(idx, sn.outTangent, sn.inTangent);
                count++;
            }
        }
        return { result: { keyframes: count }, feedback: AT.plural(count, "keyframe") + " reversed" };
    }
});

// Staggers selected layers in selection order by N frames - the classic
// "cascade" for lists, lower-third elements and bullet points.
AT.register("layers.stagger", {
    label: "Stagger Layers",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        if (ctx.layers.length < 2) AT.fail("too-few-layers", "Select two or more layers to stagger.");
        var step = AT.frames(ctx.comp, payload.frames || 3);
        var base = ctx.layers[0].inPoint;
        for (var i = 0; i < ctx.layers.length; i++) {
            var layer = ctx.layers[i];
            // Shift startTime so keyframes move with the layer.
            layer.startTime += (base + i * step) - layer.inPoint;
        }
        return {
            result: { layers: ctx.layers.length },
            feedback: AT.plural(ctx.layers.length, "layer") + " staggered by " + AT.plural(payload.frames || 3, "frame")
        };
    }
});

}($["com.cnn.animatortoolkit"]));
