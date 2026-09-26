// ============================================================================
// Animator Toolkit - easy 3D: 3D switch, depth spread, renderer, extrusion
//
// 3D motion presets (Flip, Tumble, Fly From Depth) are preset kinds in
// presets.jsx; camera rigs live in camera.jsx. This file holds the layer
// and composition setup that makes those work.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.register("threed.make", {
    label: "Make 3D",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var on = payload.on !== false;
        var n = 0;
        for (var i = 0; i < ctx.layers.length; i++) {
            var l = ctx.layers[i];
            if (!AT.isVisualLayer(l) || l.threeDLayer === on) continue;
            l.threeDLayer = on;
            n++;
        }
        return { result: { layers: n }, feedback: n ? AT.plural(n, "layer") + (on ? " made 3D" : " made 2D") : "Already " + (on ? "3D" : "2D") };
    }
});

// Spreads the selection in depth: first selected stays at Z 0, each next one
// `spacing` px further back. With a camera move this gives instant parallax.
AT.register("threed.depthSpread", {
    label: "Spread in Depth",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var spacing = typeof payload.spacing === "number" ? payload.spacing : 300;
        var t = ctx.comp.time;
        var n = 0;
        for (var i = 0; i < ctx.layers.length; i++) {
            var l = ctx.layers[i];
            if (!AT.isVisualLayer(l)) continue;
            if (!l.threeDLayer) l.threeDLayer = true;
            var targetZ = n * spacing;
            var position = AT.tprop(l, "position");
            if (position.dimensionsSeparated) {
                var pz = AT.tprop(l, "positionZ");
                AT.offsetProperty(pz, [targetZ - pz.valueAtTime(t, true)]);
            } else {
                var cur = position.valueAtTime(t, true);
                AT.offsetProperty(position, [0, 0, targetZ - (cur.length > 2 ? cur[2] : 0)]);
            }
            n++;
        }
        if (n < 2) AT.fail("too-few-layers", "Select two or more layers to spread in depth.");
        return { result: { layers: n }, feedback: AT.plural(n, "layer") + " spread " + spacing + "px apart in depth" };
    }
});

// Renderer match names differ between After Effects versions, so pick from
// what this comp actually offers.
AT.RENDERER_HINTS = {
    classic: ["ADBE Advanced 3d"],
    extrude: ["ADBE Mercury 3D", "ADBE Ernst", "ADBE Calder"]
};

AT.register("threed.renderer", {
    label: "3D Renderer",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var want = AT.RENDERER_HINTS[payload.kind === "classic" ? "classic" : "extrude"];
        var available = ctx.comp.renderers || [];
        for (var w = 0; w < want.length; w++) {
            for (var a = 0; a < available.length; a++) {
                if (available[a] === want[w]) {
                    ctx.comp.renderer = available[a];
                    return { result: { renderer: available[a], available: available },
                        feedback: payload.kind === "classic" ? "Classic 3D renderer set" : "3D renderer set for extrusion (" + available[a] + ")" };
                }
            }
        }
        AT.fail("unsupported", "Couldn't find that renderer in this version. Set it in Composition > Composition Settings > 3D Renderer. Available: " + available.join(", "));
    }
});

// Extrudes selected text (and shape) layers. Needs a renderer that supports
// geometry (Advanced 3D / Cinema 4D); explains how if it isn't set.
AT.register("text.extrude", {
    label: "Extrude",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var depth = typeof payload.depth === "number" ? payload.depth : 40;
        var n = 0;
        for (var i = 0; i < ctx.layers.length; i++) {
            var l = ctx.layers[i];
            var kind = AT.layerKind(l);
            if (kind !== "text" && kind !== "shape") continue;
            if (!l.threeDLayer) l.threeDLayer = true;
            var prop = null;
            try {
                // Hidden (null / throws) unless the comp's renderer supports geometry.
                var geo = l.property("ADBE Extrsn Options Group");
                prop = geo ? geo.property("ADBE Extrsn Depth") : null;
            } catch (e) { prop = null; }
            if (!prop) {
                AT.fail("renderer", "Extrusion needs the Advanced 3D (or Cinema 4D) renderer. Use '3D renderer for extrusion' first, or set it in Composition Settings > 3D Renderer.");
            }
            if (prop.numKeys > 0) prop.setValueAtTime(ctx.comp.time, depth);
            else prop.setValue(depth);
            n++;
        }
        if (!n) AT.fail("unsupported-layer", "Select a text or shape layer to extrude.");
        return { result: { layers: n }, feedback: AT.plural(n, "layer") + " extruded " + depth + "px" };
    }
});

}($["com.aanders.animatortoolkit"]));
