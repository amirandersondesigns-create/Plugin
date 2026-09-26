// ============================================================================
// Animator Toolkit - preview speed, color depth, audio, layer quality
//
// Everything here maps to a real After Effects setting the artist could
// change by hand; the panel explains each one. Settings that scripting
// can't reach (the Preview panel's Cache Before Playback / Skip frames,
// the viewer's "Auto" resolution) are taught in the panel instead.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.RES_NAMES = { 1: "Full", 2: "Half", 3: "Third", 4: "Quarter" };

AT.fastPreviewTypes = function () {
    if (typeof FastPreviewType === "undefined") return null;
    return {
        off: FastPreviewType.FP_OFF,
        adaptive: FastPreviewType.FP_ADAPTIVE_RESOLUTION,
        draft: FastPreviewType.FP_DRAFT,
        fastDraft: FastPreviewType.FP_FAST_DRAFT,
        wireframe: FastPreviewType.FP_WIREFRAME
    };
};

AT.viewOptions = function () {
    try {
        var v = app.activeViewer;
        return v && v.views && v.views.length ? v.views[0].options : null;
    } catch (e) {
        return null;
    }
};

// Current state, so the panel can highlight what's active.
AT.register("preview.read", {
    needs: "comp",
    run: function (payload, ctx) {
        var c = ctx.comp;
        var fast = null;
        var opts = AT.viewOptions();
        var types = AT.fastPreviewTypes();
        if (opts && types) for (var k in types) if (types.hasOwnProperty(k) && opts.fastPreview === types[k]) fast = k;
        return { result: {
            resolution: c.resolutionFactor ? c.resolutionFactor[0] : 1,
            bpc: app.project.bitsPerChannel,
            draft3d: !!c.draft3d,
            fastPreview: fast,
            workAreaStart: c.workAreaStart,
            workAreaDuration: c.workAreaDuration
        } };
    }
});

AT.register("preview.resolution", {
    label: "Preview Resolution",
    mutating: false, // viewer setting, not part of undo history
    needs: "comp",
    run: function (payload, ctx) {
        var f = payload.factor;
        if (!AT.RES_NAMES[f]) AT.fail("bad-payload", "Resolution must be Full, Half, Third or Quarter.");
        ctx.comp.resolutionFactor = [f, f];
        return { result: { factor: f }, feedback: "Resolution: " + AT.RES_NAMES[f] + " (renders 1 of every " + (f * f) + " pixels)" };
    }
});

AT.register("project.bpc", {
    label: "Color Depth",
    mutating: true,
    needs: "project",
    run: function (payload) {
        var bits = payload.bits;
        if (bits !== 8 && bits !== 16 && bits !== 32) AT.fail("bad-payload", "Color depth must be 8, 16 or 32 bpc.");
        app.project.bitsPerChannel = bits;
        return { result: { bits: bits }, feedback: "Project color depth: " + bits + " bpc" + (bits === 8 ? " (fastest)" : bits === 32 ? " (slowest, float)" : "") };
    }
});

AT.register("preview.fast", {
    label: "Fast Previews",
    mutating: false,
    needs: "comp",
    run: function (payload) {
        var types = AT.fastPreviewTypes();
        var opts = AT.viewOptions();
        if (!types || !opts) AT.fail("unsupported", "Click in the Composition viewer first (Fast Previews is a viewer setting), then try again.");
        if (types[payload.mode] === undefined) AT.fail("bad-payload", "Unknown Fast Previews mode: " + payload.mode);
        opts.fastPreview = types[payload.mode];
        var names = { off: "Off (Final Quality)", adaptive: "Adaptive Resolution", draft: "Draft", fastDraft: "Fast Draft", wireframe: "Wireframe" };
        return { result: { mode: payload.mode }, feedback: "Fast Previews: " + names[payload.mode] };
    }
});

AT.register("preview.draft3d", {
    label: "Draft 3D",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        if (ctx.comp.draft3d === undefined) AT.fail("unsupported", "Draft 3D needs After Effects 2022 or newer.");
        ctx.comp.draft3d = payload.on === undefined ? !ctx.comp.draft3d : !!payload.on;
        return { result: { on: ctx.comp.draft3d }, feedback: "Draft 3D " + (ctx.comp.draft3d ? "on (fast, lights/shadows simplified)" : "off") };
    }
});

// Work area starting at the playhead: preview only what you're working on.
AT.register("preview.workArea", {
    label: "Set Work Area",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var c = ctx.comp;
        var secs = typeof payload.seconds === "number" ? payload.seconds : 3;
        var start = Math.min(c.time, Math.max(0, c.duration - c.frameDuration));
        var dur = Math.max(c.frameDuration, Math.min(secs, c.duration - start));
        c.workAreaStart = start;
        c.workAreaDuration = dur;
        return { result: {}, feedback: "Work area: " + (Math.round(dur * 10) / 10) + "s from the playhead" };
    }
});

AT.register("preview.purge", {
    needs: "none",
    run: function () {
        if (typeof PurgeTarget === "undefined") AT.fail("unsupported", "Use Edit > Purge > All Memory & Disk Cache.");
        app.purge(PurgeTarget.ALL_CACHES);
        return { result: {}, feedback: "Preview cache purged (RAM + disk)" };
    }
});

// Continuous Rasterize (vector/shape/Illustrator layers) = Collapse
// Transformations (pre-comps): the same switch in the timeline.
AT.register("layers.rasterize", {
    label: "Continuous Rasterize",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var on = payload.on === undefined ? !ctx.layers[0].collapseTransformation : !!payload.on;
        var n = 0;
        for (var i = 0; i < ctx.layers.length; i++) {
            var l = ctx.layers[i];
            if (!AT.isVisualLayer(l) || AT.layerKind(l) === "text" || l.nullLayer) continue;
            try { l.collapseTransformation = on; n++; } catch (e) { /* not available on this layer */ }
        }
        if (!n) AT.fail("unsupported-layer", "Continuous Rasterize applies to shape, Illustrator, solid and pre-comp layers (text is always sharp).");
        return { result: { on: on, layers: n }, feedback: "Continuous Rasterize " + (on ? "on" : "off") + " for " + AT.plural(n, "layer") };
    }
});

// ---- audio ----------------------------------------------------------------------------

AT.audioLevels = function (layer) {
    if (!layer.hasAudio) return null;
    var g = layer.property("ADBE Audio Group");
    return g ? g.property("ADBE Audio Levels") : null;
};

AT.audioLayers = function (ctx) {
    var out = [];
    for (var i = 0; i < ctx.layers.length; i++) if (AT.audioLevels(ctx.layers[i])) out.push(ctx.layers[i]);
    if (!out.length) AT.fail("no-audio", "Select a layer with audio (the speaker switch shows in the timeline).");
    return out;
};

// payload.db sets an absolute level; payload.delta nudges; payload.reset = 0 dB.
AT.register("audio.levels", {
    label: "Audio Levels",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var layers = AT.audioLayers(ctx);
        var t = ctx.comp.time;
        var last = 0;
        for (var i = 0; i < layers.length; i++) {
            var p = AT.audioLevels(layers[i]);
            var cur = p.valueAtTime(t, true);
            var db = payload.reset ? 0 : typeof payload.db === "number" ? payload.db : cur[0] + (payload.delta || 0);
            AT.setOrKey(p, t, [db, db]);
            last = db;
        }
        return { result: { db: last }, feedback: "Audio level " + (last > 0 ? "+" : "") + Math.round(last * 10) / 10 + " dB on " + AT.plural(layers.length, "layer") };
    }
});

// Audio fade in/out at the layer's In/Out point (same timing rules as presets).
AT.register("audio.fade", {
    label: "Audio Fade",
    mutating: true,
    needs: "layers",
    run: function (payload, ctx) {
        var layers = AT.audioLayers(ctx);
        var def = { phase: payload.phase === "out" ? "out" : "in", durationFrames: payload.durationFrames || 15, easing: "smooth",
            title: payload.phase === "out" ? "Audio Fade Out" : "Audio Fade In", timing: payload.timing };
        for (var i = 0; i < layers.length; i++) {
            var win = AT.presetWindow(layers[i], ctx.comp, def);
            AT.animateProperty(AT.audioLevels(layers[i]), win, def, function () { return [-48, -48]; });
            AT.addMarker(layers[i], win.start, win.duration, def.title);
        }
        return { result: {}, feedback: def.title + " on " + AT.plural(layers.length, "layer") };
    }
});

}($["com.cnn.animatortoolkit"]));
