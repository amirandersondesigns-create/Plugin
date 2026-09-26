// ============================================================================
// Animator Toolkit - shared layer / property helpers
//
// Everything here is read-mostly plumbing used by several command modules:
// match names, layer classification, keyframe-safe value offsets and the
// "selected keyframes" query that easing and keyframe tools share.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {


AT.MN = {
    transform: "ADBE Transform Group",
    anchor: "ADBE Anchor Point",
    position: "ADBE Position",
    positionX: "ADBE Position_0",
    positionY: "ADBE Position_1",
    positionZ: "ADBE Position_2",
    scale: "ADBE Scale",
    rotation: "ADBE Rotate Z",
    rotationX: "ADBE Rotate X",
    rotationY: "ADBE Rotate Y",
    orientation: "ADBE Orientation",
    opacity: "ADBE Opacity",
    effects: "ADBE Effect Parade",
    text: "ADBE Text Properties",
    textAnimators: "ADBE Text Animators",
    cameraOptions: "ADBE Camera Options Group",
    cameraZoom: "ADBE Camera Zoom"
};

AT.transform = function (layer) {
    return layer.property(AT.MN.transform);
};

AT.tprop = function (layer, key) {
    return AT.transform(layer).property(AT.MN[key]);
};

// "text" | "shape" | "camera" | "light" | "null" | "precomp" | "solid" |
// "adjustment" | "footage" | "other"
AT.layerKind = function (layer) {
    if (layer instanceof TextLayer) return "text";
    if (layer instanceof ShapeLayer) return "shape";
    if (layer instanceof CameraLayer) return "camera";
    if (layer instanceof LightLayer) return "light";
    if (layer instanceof AVLayer) {
        if (layer.nullLayer) return "null";
        if (layer.adjustmentLayer) return "adjustment";
        var src = layer.source;
        if (src instanceof CompItem) return "precomp";
        if (src && src.mainSource && src.mainSource instanceof SolidSource) return "solid";
        return "footage";
    }
    return "other";
};

AT.isVisualLayer = function (layer) {
    var kind = AT.layerKind(layer);
    return kind !== "camera" && kind !== "light" && kind !== "other";
};

AT.frames = function (comp, n) {
    return n * comp.frameDuration;
};

// Duration in seconds from a payload that gives either durationSeconds or
// durationFrames (the panel lets artists choose frames or seconds).
AT.durationOf = function (comp, p, defaultFrames) {
    if (typeof p.durationSeconds === "number" && p.durationSeconds > 0) return p.durationSeconds;
    return AT.frames(comp, p.durationFrames || defaultFrames);
};

AT.addArrays = function (a, b) {
    if (typeof a === "number") return a + b[0];
    var out = [];
    for (var i = 0; i < a.length; i++) out.push(a[i] + (i < b.length ? b[i] : 0));
    return out;
};

// Add `delta` to a property everywhere it has a value: every keyframe if
// animated, otherwise the static value. Interpolation and spatial tangents
// are left alone (tangents are relative, so they stay correct).
AT.offsetProperty = function (prop, delta) {
    if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
            prop.setValueAtKey(k, AT.addArrays(prop.keyValue(k), delta));
        }
    } else {
        prop.setValue(AT.addArrays(prop.value, delta));
    }
};

AT.hasLiveExpression = function (prop) {
    return prop.canSetExpression && prop.expressionEnabled && prop.expression !== "";
};

// Every keyframed property the user has selected keyframes on, with those
// key indices. Used by easing and keyframe-editing commands.
AT.selectedKeyframes = function (comp) {
    var out = [];
    var props = comp.selectedProperties;
    for (var i = 0; i < props.length; i++) {
        var p = props[i];
        if (!(p instanceof Property)) continue;
        if (!p.canVaryOverTime || p.numKeys === 0) continue;
        var keys = p.selectedKeys;
        if (!keys || keys.length === 0) continue;
        var list = [];
        for (var k = 0; k < keys.length; k++) list.push(keys[k]);
        out.push({ prop: p, keys: list });
    }
    return out;
};

AT.requireSelectedKeyframes = function (comp, minPerProp) {
    var sel = AT.selectedKeyframes(comp);
    if (sel.length === 0) {
        AT.fail("no-keyframes",
            "Select keyframes in the timeline first (drag a box around them, or click one).");
    }
    if (minPerProp) {
        for (var i = 0; i < sel.length; i++) {
            if (sel[i].keys.length >= minPerProp) return sel;
        }
        AT.fail("too-few-keyframes", "Select at least " + minPerProp + " keyframes on the same property.");
    }
    return sel;
};

AT.plural = function (n, one, many) {
    return n + " " + (n === 1 ? one : (many || one + "s"));
};

}($["com.cnn.animatortoolkit"]));
