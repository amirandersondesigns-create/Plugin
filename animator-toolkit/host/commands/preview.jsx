// ============================================================================
// Animator Toolkit - preview speed, color depth, audio, layer quality
//
// Everything here maps to a real After Effects setting the artist could
// change by hand; the panel explains each one. Settings that scripting
// can't reach (the Preview panel's Cache Before Playback / Skip frames,
// the viewer's live "Auto" resolution) are taught in the panel instead;
// "Auto" here matches the resolution to the current zoom once.
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

// Sets one viewer option and reads it back. Some After Effects versions hand
// out a copy of the view options, so a plain assignment can be lost; then
// the whole options object is written back. Returns true when it stuck.
AT.setViewOption = function (key, value) {
    var v = null;
    try { v = app.activeViewer; } catch (e) {}
    if (!v || !v.views || !v.views.length) return false;
    function attempt() {
        var view = v.views[0];
        try { view.options[key] = value; } catch (e1) {}
        try { if (view.options[key] === value) return true; } catch (e2) {}
        try {
            var o = view.options;
            o[key] = value;
            view.options = o;
            return view.options[key] === value;
        } catch (e3) {
            return false;
        }
    }
    if (attempt()) return true;
    // Some settings only take while the viewer is the active panel.
    try { v.setActive(); } catch (e4) {}
    return attempt();
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
            draft3d: (function () { try { return !!c.draft3d; } catch (e) { return false; } }()),
            fastPreview: fast,
            transparency: !!(opts && opts.checkerboards),
            view: (function () {
                var o = {}, k;
                for (k in AT.VIEW_ITEMS) if (AT.VIEW_ITEMS.hasOwnProperty(k)) o[k] = AT.viewItemState(opts, k);
                o.safe = AT.overlayLayers(c, "safe").length > 0;
                o.propGrid = AT.overlayLayers(c, "propGrid").length > 0;
                o.axes = AT.overlayLayers(c, "axes").length > 0;
                return o;
            }()),
            // Old 0.3.8 "AT Grid" layers, so the panel can offer to remove them.
            oldOverlays: AT.overlayLayers(c, "grid").length,
            workAreaStart: c.workAreaStart,
            workAreaDuration: c.workAreaDuration
        } };
    }
});

AT.register("preview.resolution", {
    label: "Preview Resolution",
    mutating: true, // the comp's resolution is saved in the project: one Ctrl/Cmd+Z
    needs: "comp",
    run: function (payload, ctx) {
        var f = payload.factor;
        if (payload.auto) {
            // The viewer's live "Auto" mode has no scripting API, so match
            // the current zoom once: 50% -> Half, 33% -> Third, 25% -> Quarter.
            var opts = AT.viewOptions(), zoom = null;
            try { zoom = opts ? opts.zoom : null; } catch (e) {}
            if (!(zoom > 0)) AT.fail("no-viewer", "Click the Composition viewer once so After Effects knows which view to match, then try Auto again.");
            f = Math.max(1, Math.min(4, Math.floor(1 / zoom + 0.01)));
            ctx.comp.resolutionFactor = [f, f];
            return { result: { factor: f, auto: true, zoom: zoom },
                feedback: "Auto: " + AT.RES_NAMES[f] + " resolution to match " + Math.round(zoom * 100) + "% zoom" };
        }
        if (!AT.RES_NAMES[f]) AT.fail("bad-payload", "Resolution must be Full, Half, Third or Quarter.");
        ctx.comp.resolutionFactor = [f, f];
        return { result: { factor: f }, feedback: "Resolution: " + AT.RES_NAMES[f] + " (renders 1 of every " + (f * f) + " pixels)" };
    }
});

// Transparency grid (the checkerboard button under the viewer).
AT.register("viewer.transparency", {
    label: "Transparency Grid",
    mutating: false, // viewer setting, not part of undo history
    needs: "comp",
    run: function (payload) {
        var opts = AT.viewOptions();
        if (!opts) AT.fail("no-viewer", "Click the Composition viewer once, then try again.");
        var on = payload.on === undefined ? !opts.checkerboards : !!payload.on;
        if (!AT.setViewOption("checkerboards", on)) AT.fail("no-viewer", "After Effects didn't change the transparency grid. Click the Composition viewer once, then try again.");
        return { result: { on: on }, feedback: "Transparency grid " + (on ? "on: empty areas show as a checkerboard" : "off") };
    }
});

// Grid & guides. Where After Effects exposes the setting on the viewer
// (ViewOptions.rulers / guidesVisibility / guidesSnap / guidesLocked, AE
// 22.5+) it's set exactly and read back; otherwise the View menu command
// is run (a toggle whose state scripts can't read).
AT.VIEW_ITEMS = {
    rulers:      { name: "Rulers",          option: "rulers",           menus: ["Show Rulers", "Hide Rulers"] },
    guides:      { name: "Guides",          option: "guidesVisibility", menus: ["Show Guides", "Hide Guides"] },
    snapGuides:  { name: "Snap to Guides",  option: "guidesSnap",       menus: ["Snap to Guides"] },
    lockGuides:  { name: "Lock Guides",     option: "guidesLocked",     menus: ["Lock Guides", "Unlock Guides"] },
    snapGrid:    { name: "Snap to Grid",    option: null,               menus: ["Snap to Grid"] },
    grid:        { name: "Grid",            option: null,               menus: ["Show Grid", "Hide Grid"] }
};


// ---- overlays: guide layers ------------------------------------------------------
// Title/Action Safe, Proportional Grid and 3D Reference Axes live only in the
// viewer's own menu, which scripts can't reach. The toolkit draws them in the
// comp instead (Grid's layer version stays for cleaning up older comps),
// as locked GUIDE layers (visible in the viewer, never rendered). Unlike the
// viewer's own overlays, which scripts can't switch, these always work, show
// their real state (the layer exists or not) and are one Ctrl/Cmd+Z.
AT.OVERLAYS = {
    safe:     { name: "AT Title/Action Safe", label: "Title/Action Safe" },
    propGrid: { name: "AT Proportional Grid", label: "Proportional Grid" },
    grid:     { name: "AT Grid", label: "Grid" },
    axes:     { name: "AT 3D Reference Axes", label: "3D Reference Axes" }
};

AT.overlayLayers = function (comp, key) {
    var n = AT.OVERLAYS[key].name, out = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        if (l.name === n || l.name.indexOf(n + " ") === 0) out.push(l);
    }
    return out;
};

// One locked guide shape layer; paths are [[x, y], ...] in comp pixels.
AT.guideLayer = function (comp, name, paths, color, width, opacity) {
    var l = comp.layers.addShape();
    l.name = name;
    var cx = comp.width / 2, cy = comp.height / 2; // a new shape layer sits at the comp centre
    var contents = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
    for (var p = 0; p < paths.length; p++) {
        var sh = new Shape(), v = [];
        for (var k = 0; k < paths[p].pts.length; k++) v.push([paths[p].pts[k][0] - cx, paths[p].pts[k][1] - cy]);
        sh.vertices = v;
        sh.closed = !!paths[p].closed;
        contents.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
    }
    var st = contents.addProperty("ADBE Vector Graphic - Stroke");
    try { st.property("ADBE Vector Stroke Color").setValue(color); } catch (e) { st.property("ADBE Vector Stroke Color").setValue([color[0], color[1], color[2]]); }
    st.property("ADBE Vector Stroke Width").setValue(width);
    st.property("ADBE Vector Stroke Opacity").setValue(opacity);
    l.guideLayer = true;
    l.selected = false;
    l.locked = true;
    return l;
};

AT.drawOverlay = function (comp, key) {
    var w = comp.width, h = comp.height, n = AT.OVERLAYS[key].name, paths = [], i;
    function rect(m) { return { pts: [[w * m, h * m], [w * (1 - m), h * m], [w * (1 - m), h * (1 - m)], [w * m, h * (1 - m)]], closed: true }; }
    function line(x1, y1, x2, y2) { return { pts: [[x1, y1], [x2, y2]] }; }
    if (key === "safe") {
        // After Effects' defaults: action safe 10% (5% each side), title safe 20%.
        var c = Math.min(w, h) * 0.02;
        paths = [rect(0.05), rect(0.1), line(w / 2 - c, h / 2, w / 2 + c, h / 2), line(w / 2, h / 2 - c, w / 2, h / 2 + c)];
        AT.guideLayer(comp, n, paths, [0.55, 0.8, 1, 1], 2, 80);
    } else if (key === "propGrid") {
        paths = [line(w / 3, 0, w / 3, h), line(2 * w / 3, 0, 2 * w / 3, h), line(0, h / 3, w, h / 3), line(0, 2 * h / 3, w, 2 * h / 3)];
        AT.guideLayer(comp, n, paths, [1, 1, 1, 1], 1.5, 55);
    } else if (key === "grid") {
        var step = Math.max(10, Math.round(w / 16));
        for (i = step; i < w; i += step) paths.push(line(i, 0, i, h));
        for (i = step; i < h; i += step) paths.push(line(0, i, w, i));
        AT.guideLayer(comp, n, paths, [1, 1, 1, 1], 1, 30);
    } else if (key === "axes") {
        var len = Math.min(w, h) * 0.25, x = AT.guideLayer(comp, n, [line(w / 2, h / 2, w / 2 + len, h / 2)], [1, 0.3, 0.3, 1], 3, 100);
        var y = AT.guideLayer(comp, n + " Y", [line(w / 2, h / 2, w / 2, h / 2 - len)], [0.4, 0.9, 0.4, 1], 3, 100);
        var z = AT.guideLayer(comp, n + " Z", [line(w / 2, h / 2, w / 2 + len, h / 2)], [0.4, 0.6, 1, 1], 3, 100);
        var ls = [x, y, z];
        for (i = 0; i < 3; i++) { ls[i].locked = false; ls[i].threeDLayer = true; }
        z.property("ADBE Transform Group").property("ADBE Rotate Y").setValue(-90); // its X line now points along Z
        for (i = 0; i < 3; i++) ls[i].locked = true;
    }
};

AT.register("view.overlay", {
    label: "Grid & Guides",
    mutating: true, // real guide layers, so Ctrl/Cmd+Z removes or restores them
    needs: "comp",
    run: function (payload, ctx) {
        var o = AT.OVERLAYS[payload.item];
        if (!o) AT.fail("bad-payload", "Unknown overlay: " + payload.item);
        var have = AT.overlayLayers(ctx.comp, payload.item);
        var want = payload.on === undefined ? !have.length : !!payload.on;
        if (want && !have.length) AT.drawOverlay(ctx.comp, payload.item);
        if (!want) {
            for (var i = 0; i < have.length; i++) { have[i].locked = false; have[i].remove(); }
        }
        return { result: { item: payload.item, on: want },
            feedback: o.label + (want ? " on (a guide layer: shows in the viewer, never renders)" : " off") };
    }
});

AT.viewItemState = function (opts, key) {
    var it = AT.VIEW_ITEMS[key];
    if (!opts || !it || !it.option) return null;
    try { var v = opts[it.option]; return typeof v === "boolean" ? v : null; } catch (e) { return null; }
};

AT.register("view.toggle", {
    label: "Grid & Guides",
    mutating: false, // viewer display settings are never in After Effects' undo history
    needs: "comp",
    run: function (payload) {
        var it = AT.VIEW_ITEMS[payload.item];
        if (!it) AT.fail("bad-payload", "Unknown grid/guide option: " + payload.item);
        var opts = AT.viewOptions();
        var now = AT.viewItemState(opts, payload.item);
        if (now !== null) {
            var want = payload.on === undefined ? !now : !!payload.on;
            if (!AT.setViewOption(it.option, want)) AT.fail("no-viewer", "After Effects didn't change " + it.name + ". Click the Composition viewer once, then try again.");
            return { result: { item: payload.item, on: want }, feedback: it.name + (want ? " on" : " off") };
        }
        var id = 0;
        for (var m = 0; m < it.menus.length && !id; m++) id = app.findMenuCommandId(it.menus[m]);
        if (!id) AT.fail("manual", it.manual ? it.name + ": " + it.manual : "This version of After Effects has no View > " + it.menus[0] + " command.");
        try { if (app.activeViewer) app.activeViewer.setActive(); } catch (e) {}
        app.executeCommand(id);
        return { result: { item: payload.item, on: null }, feedback: "Toggled View > " + it.name };
    }
});

// Undo for the panel's Undo buttons and Ctrl/Cmd+Z: runs Edit > Undo only
// when the top of After Effects' undo list is still the toolkit's own step,
// so it can never undo something else by mistake.
AT.register("app.undo", {
    label: "Undo",
    mutating: false,
    needs: "project",
    run: function (payload) {
        var name = String(payload.name || "");
        var id = name ? app.findMenuCommandId("Undo " + name) : 0;
        if (!id) AT.fail("manual", "That's no longer the last step in Edit > Undo. Use Edit > Undo in After Effects.");
        app.executeCommand(id);
        return { result: { undone: name }, feedback: "Undid " + name.replace("Animator Toolkit: ", "") };
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
        if (!AT.setViewOption("fastPreview", types[payload.mode])) AT.fail("no-viewer", "After Effects didn't change Fast Previews. Click the Composition viewer once, then try again.");
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
        // Frames (how the panel counts time); seconds still accepted.
        var fd = c.frameDuration;
        var secs = typeof payload.frames === "number" ? AT.frames(c, payload.frames) : typeof payload.seconds === "number" ? payload.seconds : 3;
        // Start on the playhead's frame (never past the last frame).
        var start = Math.round(Math.min(c.time, c.duration - fd) / fd) * fd;
        if (start < 0) start = 0;
        var dur = Math.max(fd, Math.min(secs, c.duration - start));
        // After Effects checks start + duration against the comp length on
        // EVERY write, so shrink the work area to one frame first, then move
        // its start, then give it its length. (Setting the start first fails
        // whenever the old work area is long, e.g. the whole comp.)
        c.workAreaDuration = fd;
        c.workAreaStart = start;
        c.workAreaDuration = dur;
        var frames = Math.round(dur / fd);
        return { result: { start: start, duration: dur, frames: frames },
            feedback: "Work area: " + frames + " frames from the playhead (frame " + Math.round(start / fd) + ")" +
                (frames < Math.round(secs / fd) ? ", shortened to fit the comp" : "") };
    }
});

// One-click setups. "fast": Half resolution + Adaptive fast previews + Draft
// 3D, for animating. "final": Full + Off + Draft 3D off, for checking.
AT.register("preview.mode", {
    label: "Preview Setup",
    mutating: true, // resolution + Draft 3D undo together (Fast Previews is a viewer setting)
    needs: "comp",
    run: function (payload, ctx) {
        var fast = payload.mode !== "final";
        var c = ctx.comp;
        // Each part is applied on its own and reported back, so the panel
        // can tick exactly what took.
        var applied = { resolution: null, fastPreview: null, draft3d: null };
        try { c.resolutionFactor = fast ? [2, 2] : [1, 1]; applied.resolution = c.resolutionFactor[0]; } catch (e1) {}
        try { if (c.draft3d !== undefined) { c.draft3d = fast; applied.draft3d = !!c.draft3d; } } catch (e2) {}
        var types = AT.fastPreviewTypes();
        if (types && AT.setViewOption("fastPreview", fast ? types.adaptive : types.off)) applied.fastPreview = fast ? "adaptive" : "off";
        if (applied.resolution === null) AT.fail("unsupported", "After Effects didn't change the resolution. Click the Composition viewer once, then try again.");
        var missing = [];
        if (applied.fastPreview === null) missing.push("Fast Previews");
        if (c.draft3d !== undefined && applied.draft3d !== fast) missing.push("Draft 3D");
        var name = fast ? "Animate Fast" : "Final Check";
        return { result: { mode: fast ? "fast" : "final", applied: applied },
            feedback: name + " set: " + (fast ? "Half resolution" : "Full resolution") +
                (applied.fastPreview ? ", Fast Previews " + (fast ? "Adaptive" : "Off") : "") +
                (applied.draft3d !== null ? ", Draft 3D " + (applied.draft3d ? "on" : "off") : "") +
                (missing.length ? ". Click the Composition viewer, then press again to set " + missing.join(" and ") + "." : "") };
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
        if (!n) AT.fail("unsupported-layer", "Continuous Rasterize applies to Illustrator/vector art and pre-comp layers (text and shapes already stay sharp).");
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
        var def = { phase: payload.phase === "out" ? "out" : "in", durationFrames: payload.durationFrames || 15, durationSeconds: payload.durationSeconds, easing: "smooth",
            title: payload.phase === "out" ? "Audio Fade Out" : "Audio Fade In", timing: payload.timing };
        for (var i = 0; i < layers.length; i++) {
            var win = AT.presetWindow(layers[i], ctx.comp, def);
            AT.animateProperty(AT.audioLevels(layers[i]), win, def, function () { return [-48, -48]; });
            AT.addMarker(layers[i], win.start, win.duration, def.title);
        }
        return { result: {}, feedback: def.title + " on " + AT.plural(layers.length, "layer") };
    }
});

}($["com.aanders.animatortoolkit"]));
