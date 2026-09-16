// ============================================================================
// AUTO REFRAME — ExtendScript engine (CEP host)
// After Effects 2024+
//
// Automatic aspect-ratio reframing (16:9 <-> 9:16 <-> 4:5 <-> 1:1) driven by
// a controller-null rig, built to the rules in docs/auto-reframe-spec.md
// (section 17): never bakes expressions, never edits shared solids/precomps
// (duplicates them instead), and produces a usable layout in one click with
// zero required manual setup.
//
// This file contains no UI. It is the ExtendScript back end that the CEP
// HTML panel (client/index.html + client/js/main.js) talks to through
// CSInterface.evalScript(). Every function the panel calls is prefixed
// "cs" and returns a JSON string.
// ============================================================================

var APP_NAME = "Auto Reframe";
var VERSION = "0.1";
var AUTHOR = "Amir Anderson";

var CONTROLLER_NAME = "REFRAME_CONTROLLER";
var ROLE_MARKER_PREFIX = "REFRAME_ROLE:";
var META_TAG = "AUTOREFRAME_META_V1:";
var MAX_PRECOMP_RECURSION_DEPTH = 8;

// ==================== FORMAT PRESETS ====================
var FORMAT_PRESETS = {
    "16x9":  { key: "16x9",  label: "16:9  Landscape",     width: 1920, height: 1080, aspectClass: "landscape" },
    "9x16":  { key: "9x16",  label: "9:16  Vertical",      width: 1080, height: 1920, aspectClass: "vertical" },
    "4x5":   { key: "4x5",   label: "4:5   Portrait",      width: 1080, height: 1350, aspectClass: "portrait" },
    "1x1":   { key: "1x1",   label: "1:1   Square",        width: 1080, height: 1080, aspectClass: "square" }
};

// ==================== ELEMENT ROLES ====================
var ELEMENT_ROLES = ["background", "headline", "lower-third", "bug", "ots", "foreground", "unassigned"];

// Layout heuristic: for each role, per target aspect class, where its
// bounding box should land (percent of target frame) and how much of the
// safe frame it may occupy. Values are fractions (0-1).
// anchorH/V describe which part of the role's own bounding box is pinned
// to (xPct, yPct): "center" | "start" | "end" on each axis.
var ROLE_LAYOUT = {
    "background": {
        "landscape": { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center", cover: true },
        "vertical":  { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center", cover: true },
        "portrait":  { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center", cover: true },
        "square":    { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center", cover: true }
    },
    "headline": {
        "landscape": { xPct: 0.5, yPct: 0.12, maxW: 0.86, maxH: 0.28, anchorH: "center", anchorV: "start" },
        "vertical":  { xPct: 0.5, yPct: 0.14, maxW: 0.88, maxH: 0.18, anchorH: "center", anchorV: "start" },
        "portrait":  { xPct: 0.5, yPct: 0.10, maxW: 0.88, maxH: 0.20, anchorH: "center", anchorV: "start" },
        "square":    { xPct: 0.5, yPct: 0.10, maxW: 0.88, maxH: 0.22, anchorH: "center", anchorV: "start" }
    },
    "lower-third": {
        "landscape": { xPct: 0.06, yPct: 0.82, maxW: 0.6, maxH: 0.14, anchorH: "start", anchorV: "center" },
        "vertical":  { xPct: 0.5, yPct: 0.72, maxW: 0.9, maxH: 0.12, anchorH: "center", anchorV: "center" },
        "portrait":  { xPct: 0.5, yPct: 0.78, maxW: 0.9, maxH: 0.12, anchorH: "center", anchorV: "center" },
        "square":    { xPct: 0.5, yPct: 0.80, maxW: 0.9, maxH: 0.12, anchorH: "center", anchorV: "center" }
    },
    "bug": {
        "landscape": { xPct: 0.94, yPct: 0.08, maxW: 0.14, maxH: 0.10, anchorH: "end", anchorV: "start" },
        "vertical":  { xPct: 0.9,  yPct: 0.05, maxW: 0.18, maxH: 0.08, anchorH: "end", anchorV: "start" },
        "portrait":  { xPct: 0.9,  yPct: 0.05, maxW: 0.18, maxH: 0.08, anchorH: "end", anchorV: "start" },
        "square":    { xPct: 0.9,  yPct: 0.06, maxW: 0.16, maxH: 0.08, anchorH: "end", anchorV: "start" }
    },
    "ots": {
        "landscape": { xPct: 0.72, yPct: 0.5, maxW: 0.5, maxH: 0.7, anchorH: "center", anchorV: "center" },
        "vertical":  { xPct: 0.5,  yPct: 0.42, maxW: 0.86, maxH: 0.4, anchorH: "center", anchorV: "center" },
        "portrait":  { xPct: 0.5,  yPct: 0.42, maxW: 0.86, maxH: 0.4, anchorH: "center", anchorV: "center" },
        "square":    { xPct: 0.5,  yPct: 0.42, maxW: 0.8, maxH: 0.4, anchorH: "center", anchorV: "center" }
    },
    "foreground": {
        "landscape": { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center" },
        "vertical":  { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center" },
        "portrait":  { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center" },
        "square":    { xPct: 0.5, yPct: 0.5, maxW: 1.0, maxH: 1.0, anchorH: "center", anchorV: "center" }
    }
};

// Safe-zone guide margins per aspect class: [outer action-safe %, inner title-safe %]
var SAFE_ZONE_MARGINS = {
    "landscape": { action: 0.05, title: 0.10 },
    "vertical":  { action: 0.06, title: 0.20 }, // extra bottom-heavy margin for platform UI (captions/buttons)
    "portrait":  { action: 0.06, title: 0.14 },
    "square":    { action: 0.06, title: 0.10 }
};

// Effects whose parameters are absolute-pixel and do not auto-scale with
// layer/controller scaling. Used by the audit (Section 7) and the
// "quality warnings" differentiator (17.8).
var PIXEL_BASED_EFFECTS = [
    "ADBE Box Blur2", "ADBE Gaussian Blur 2", "ADBE Camera Lens Blur",
    "ADBE Drop Shadow", "ADBE Radial Blur", "CC RepeTile", "ADBE Glow",
    "ADBE MBar Amount", "ADBE Bevel Alpha"
];

// ==================== UTILITY ====================
function logMessage(msg) {
    try { if (typeof $.writeln === "function") { $.writeln("[Auto Reframe] " + msg); } } catch (e) {}
}

function safeName(name) {
    return String(name || "").replace(/[\/\\:*?"<>|]/g, "_");
}

function aspectClassFor(width, height) {
    var r = width / height;
    if (Math.abs(r - (16 / 9)) < 0.05) return "landscape";
    if (Math.abs(r - (9 / 16)) < 0.05) return "vertical";
    if (Math.abs(r - (4 / 5)) < 0.05) return "portrait";
    if (Math.abs(r - 1) < 0.05) return "square";
    return r >= 1 ? "landscape" : "vertical";
}

function findItemByName(name) {
    if (!app.project) return null;
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it.name === name) return it;
    }
    return null;
}

function uniqueCompName(base) {
    var name = base, n = 2;
    while (findItemByName(name)) { name = base + " " + n; n++; }
    return name;
}

// ==================== LAYER ROLE TAGGING (via layer markers) ====================
// Layers have no free-form "comment" field in the AE object model, so role
// assignments are stored as a layer marker at time 0 whose comment is
// "REFRAME_ROLE:<role>". This persists in the project file and survives
// comp.duplicate().
function getLayerMarkerProp(layer) {
    try { return layer.property("ADBE Marker"); } catch (e) { return null; }
}

function getLayerRole(layer) {
    var mp = getLayerMarkerProp(layer);
    if (!mp || mp.numKeys <= 0) return "unassigned";
    for (var k = 1; k <= mp.numKeys; k++) {
        try {
            var mv = mp.keyValue(k);
            if (mv && mv.comment && mv.comment.indexOf(ROLE_MARKER_PREFIX) === 0) {
                var role = mv.comment.substring(ROLE_MARKER_PREFIX.length);
                return role || "unassigned";
            }
        } catch (e) {}
    }
    return "unassigned";
}

function setLayerRole(layer, role) {
    var mp = getLayerMarkerProp(layer);
    if (!mp) return false;
    var wasLocked = false;
    try { wasLocked = layer.locked; if (wasLocked) layer.locked = false; } catch (e) {}
    try {
        var existingKey = -1;
        for (var k = 1; k <= mp.numKeys; k++) {
            try {
                var mv = mp.keyValue(k);
                if (mv && mv.comment && mv.comment.indexOf(ROLE_MARKER_PREFIX) === 0) { existingKey = k; break; }
            } catch (e) {}
        }
        if (role === "unassigned") {
            if (existingKey > 0) mp.removeKey(existingKey);
        } else {
            var newMarker = new MarkerValue(ROLE_MARKER_PREFIX + role);
            var t = existingKey > 0 ? mp.keyTime(existingKey) : 0;
            if (existingKey > 0) mp.removeKey(existingKey);
            mp.setValueAtTime(t, newMarker);
        }
        return true;
    } catch (e) {
        logMessage("setLayerRole failed: " + e.toString());
        return false;
    } finally {
        try { if (wasLocked) layer.locked = true; } catch (e2) {}
    }
}

// ==================== COMP METADATA (Section 8 persistence) ====================
// CompItem inherits Item.comment, a free-text field we use to store a JSON
// blob of per-controller slider/point values so Resync can reapply a
// designer's manual nudges after regenerating a comp.
function readCompMeta(comp) {
    try {
        var c = comp.comment || "";
        var idx = c.indexOf(META_TAG);
        if (idx < 0) return null;
        var json = c.substring(idx + META_TAG.length);
        return JSON.parse(json);
    } catch (e) { return null; }
}

function writeCompMeta(comp, meta) {
    try { comp.comment = META_TAG + JSON.stringify(meta); } catch (e) { logMessage("writeCompMeta failed: " + e.toString()); }
}

function readControllerValues(nullLayer) {
    var out = { offsetX: 0, offsetY: 0, scaleAdjust: 100 };
    try {
        var fx = nullLayer.property("ADBE Effect Parade");
        var offsetProp = fx.property("Offset Position");
        var scaleProp = fx.property("Scale Adjust %");
        if (offsetProp) { var pt = offsetProp.property("Point").value; out.offsetX = pt[0]; out.offsetY = pt[1]; }
        if (scaleProp) { out.scaleAdjust = scaleProp.property("Slider").value; }
    } catch (e) {}
    return out;
}

function applyControllerValues(nullLayer, vals) {
    if (!vals) return;
    try {
        var fx = nullLayer.property("ADBE Effect Parade");
        var offsetProp = fx.property("Offset Position");
        var scaleProp = fx.property("Scale Adjust %");
        if (offsetProp && typeof vals.offsetX === "number") offsetProp.property("Point").setValue([vals.offsetX, vals.offsetY]);
        if (scaleProp && typeof vals.scaleAdjust === "number") scaleProp.property("Slider").setValue(vals.scaleAdjust);
    } catch (e) { logMessage("applyControllerValues failed: " + e.toString()); }
}

// ==================== CONTROLLER-NULL RIG (spec 5.3 / 17.5) ====================
// Builds a null with "Offset Position" (Point Control) and "Scale Adjust %"
// (Slider Control) effects, and a self-referencing expression on its own
// Position/Scale so a designer's manual nudge survives regeneration without
// ever touching — let alone baking — anything on the actual content layers.
function buildControllerNull(comp, name, makeThreeD) {
    var nullLayer = comp.layers.addNull();
    nullLayer.name = name;
    nullLayer.moveToBeginning();
    if (makeThreeD) { try { nullLayer.threeDLayer = true; } catch (e) {} }

    var fx = nullLayer.property("ADBE Effect Parade");
    var offsetProp = fx.addProperty("ADBE Point Control");
    offsetProp.name = "Offset Position";
    try { offsetProp.property("Point").setValue([0, 0]); } catch (e) {}

    var scaleProp = fx.addProperty("ADBE Slider Control");
    scaleProp.name = "Scale Adjust %";
    try { scaleProp.property("Slider").setValue(100); } catch (e) {}

    return nullLayer;
}

// Attaches the self-referencing Position/Scale expressions. Must run
// AFTER the caller has set the null's base Anchor/Position/Scale via
// setValue() — ExtendScript's setValue() does not reliably update the
// underlying static value once expressionEnabled is already true, so
// attaching the expression first left every generated controller
// frozen at its layer defaults (100% scale, untouched position)
// regardless of what buildRig computed.
function attachPositionExpression(nullLayer) {
    try {
        nullLayer.property("ADBE Transform Group").property("ADBE Position").expression =
            "var o = effect(\"Offset Position\")(\"Point\");\ntransform.position + o;";
    } catch (e) { logMessage("position expression failed: " + e.toString()); }
}

function attachScaleExpression(nullLayer) {
    try {
        nullLayer.property("ADBE Transform Group").property("ADBE Scale").expression =
            "var s = effect(\"Scale Adjust %\")(\"Slider\") / 100;\ntransform.scale * s;";
    } catch (e) { logMessage("scale expression failed: " + e.toString()); }
}

function withUnlocked(layer, fn) {
    var wasLocked = false;
    try { wasLocked = layer.locked; if (wasLocked) layer.locked = false; } catch (e) {}
    try { fn(); }
    finally { try { if (wasLocked) layer.locked = true; } catch (e2) {} }
}

function reparent(layer, parentLayer) {
    withUnlocked(layer, function () {
        try { layer.parent = parentLayer; } catch (e) { logMessage("reparent failed for " + layer.name + ": " + e.toString()); }
    });
}

// ==================== SOLIDS & PRECOMPS: duplicate, never edit shared (17.3) ====================
function isFullFrameSolid(layer, srcW, srcH) {
    try {
        if (!(layer instanceof AVLayer)) return false;
        var src = layer.source;
        if (!src || !(src.mainSource instanceof SolidSource)) return false;
        return Math.round(src.width) === Math.round(srcW) && Math.round(src.height) === Math.round(srcH);
    } catch (e) { return false; }
}

function replaceFullFrameSolid(layer, targetW, targetH, presetKey) {
    try {
        var src = layer.source;
        var color = src.mainSource.color;
        var duration = (layer.containingComp && layer.containingComp.duration) || 10;
        var newSolid = app.project.items.addSolid(color, safeName(src.name) + "_" + presetKey, targetW, targetH, src.pixelAspect || 1, duration);
        withUnlocked(layer, function () { layer.replaceSource(newSolid, false); });
        return newSolid;
    } catch (e) { logMessage("replaceFullFrameSolid failed: " + e.toString()); return null; }
}

function isPrecompLayer(layer) {
    try { return (layer instanceof AVLayer) && layer.source && (layer.source instanceof CompItem); } catch (e) { return false; }
}

// Duplicates a nested precomp at most once per (source item, preset), so a
// precomp reused several times in one comp shares a single per-format copy.
function getOrDuplicatePrecomp(sourceItem, presetKey, dupCache) {
    var cacheKey = sourceItem.id + "|" + presetKey;
    if (dupCache[cacheKey]) return dupCache[cacheKey];
    var dup = sourceItem.duplicate();
    dup.name = uniqueCompName(safeName(sourceItem.name) + "_" + presetKey);
    dupCache[cacheKey] = dup;
    return dup;
}

// ==================== ROLE GROUPING & LAYOUT MATH ====================
function collectTopLayers(comp) {
    var out = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        try { if (layer.parent) continue; } catch (e) {}
        out.push(layer);
    }
    return out;
}

function groupLayersByRole(layers) {
    var groups = {};
    for (var i = 0; i < layers.length; i++) {
        var role = getLayerRole(layers[i]);
        if (!groups[role]) groups[role] = [];
        groups[role].push(layers[i]);
    }
    return groups;
}

// Bounding box of a single layer in comp space, via sourceRectAtTime —
// the actual AE API for a layer's rendered extent, rather than guessing
// from layer.source.width/height (which doesn't exist at all on shape
// or text layers, the most common case, and was silently falling back
// to a fixed 100x100 guess). This is still an approximation (it ignores
// rotation) but reflects real content size for every layer type AVLayer
// covers, which is good enough to drive placement math for a one-click
// starting layout.
function approximateLayerBounds(layer) {
    try {
        var t = layer.containingComp.time;
        var pos = layer.property("ADBE Transform Group").property("ADBE Position").value;
        var anchor = layer.property("ADBE Transform Group").property("ADBE Anchor Point").value;
        var scale = layer.property("ADBE Transform Group").property("ADBE Scale").value;
        var sx = Math.abs(scale[0]) / 100, sy = Math.abs(scale[1]) / 100;
        var rect = layer.sourceRectAtTime(t, false);
        var rectCenterX = rect.left + rect.width / 2;
        var rectCenterY = rect.top + rect.height / 2;
        var centerX = pos[0] + (rectCenterX - anchor[0]) * sx;
        var centerY = pos[1] + (rectCenterY - anchor[1]) * sy;
        var w = rect.width * sx, h = rect.height * sy;
        return {
            left: centerX - w / 2, right: centerX + w / 2,
            top: centerY - h / 2, bottom: centerY + h / 2,
            centerX: centerX, centerY: centerY, width: w, height: h
        };
    } catch (e) {
        // Layer types sourceRectAtTime can't handle (camera, light, audio-only)
        try {
            var pos2 = layer.property("ADBE Transform Group").property("ADBE Position").value;
            return { left: pos2[0], right: pos2[0], top: pos2[1], bottom: pos2[1], centerX: pos2[0], centerY: pos2[1], width: 0, height: 0 };
        } catch (e2) {
            return { left: 0, right: 0, top: 0, bottom: 0, centerX: 0, centerY: 0, width: 0, height: 0 };
        }
    }
}

function groupBounds(layers) {
    if (layers.length === 0) return null;
    var b = null;
    for (var i = 0; i < layers.length; i++) {
        var lb = approximateLayerBounds(layers[i]);
        if (!b) { b = lb; continue; }
        b.left = Math.min(b.left, lb.left);
        b.right = Math.max(b.right, lb.right);
        b.top = Math.min(b.top, lb.top);
        b.bottom = Math.max(b.bottom, lb.bottom);
    }
    b.centerX = (b.left + b.right) / 2;
    b.centerY = (b.top + b.bottom) / 2;
    b.width = b.right - b.left;
    b.height = b.bottom - b.top;
    return b;
}

// ==================== CORE RIG BUILDER (shared by top-level comps & recursed precomps) ====================
// Builds REFRAME_CONTROLLER (+ per-role sub-controllers in Smart Stack mode)
// inside `comp`, reparents its own top-level layers under the right
// controller, and computes placement. `sourceW/sourceH` are the frame the
// content was authored for; `targetW/targetH` are comp's own (possibly just
// set) dimensions.
function buildRig(comp, sourceW, sourceH, targetW, targetH, mode, presetKey, savedMeta) {
    var topLayers = collectTopLayers(comp);
    var hasThreeD = false;
    for (var i = 0; i < topLayers.length; i++) {
        try { if (topLayers[i].threeDLayer || topLayers[i] instanceof CameraLayer) { hasThreeD = true; break; } } catch (e) {}
    }

    var mainController = buildControllerNull(comp, CONTROLLER_NAME, hasThreeD);
    var aspectClass = aspectClassFor(targetW, targetH);
    var meta = { version: 1, presetKey: presetKey, mode: mode, mainController: null, roleControllers: {} };

    if (mode === "stack") {
        // Identity pass-through, anchored at the target frame's center so
        // the manual "Scale Adjust %" / "Offset Position" nudge on this
        // top controller scales/moves the whole comp around its middle —
        // not its top-left corner. Placement math for each role happens
        // below, in target-comp coordinates, so at the defaults (0,0 / 100%)
        // this contributes nothing.
        var frameCenter = [targetW / 2, targetH / 2];
        mainController.property("ADBE Transform Group").property("ADBE Anchor Point").setValue(frameCenter);
        mainController.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
        // Position's expression is self-contained (hardcoded frameCenter,
        // not a self-reference to the pre-expression value) so it's safe
        // to attach immediately rather than needing the setValue-first
        // ordering attachPositionExpression()/attachScaleExpression() rely on.
        mainController.property("ADBE Transform Group").property("ADBE Position").expression =
            "var o = effect(\"Offset Position\")(\"Point\");\n[" + frameCenter[0] + "," + frameCenter[1] + "] + o;";
        attachScaleExpression(mainController);

        var groups = groupLayersByRole(topLayers);
        for (var role in groups) {
            if (!groups.hasOwnProperty(role)) continue;
            var layers = groups[role];
            if (layers.length === 0) continue;
            var roleKey = role === "unassigned" ? "foreground" : role;
            var layout = (ROLE_LAYOUT[roleKey] && ROLE_LAYOUT[roleKey][aspectClass]) || ROLE_LAYOUT["foreground"][aspectClass];
            var bounds = groupBounds(layers);

            var subName = (role === "unassigned" ? "CONTENT" : role.toUpperCase().replace(/-/g, "_")) + "_CONTROLLER";
            var sub = buildControllerNull(comp, subName, hasThreeD);
            reparent(sub, mainController);

            var scale;
            if (layout.cover) {
                scale = Math.max(targetW / Math.max(1, bounds.width), targetH / Math.max(1, bounds.height));
            } else {
                var maxW = layout.maxW * targetW, maxH = layout.maxH * targetH;
                scale = Math.min(maxW / Math.max(1, bounds.width), maxH / Math.max(1, bounds.height));
                scale = Math.min(scale, 4); // never blow raster content up absurdly by default
            }

            var targetX = layout.xPct * targetW;
            var targetY = layout.yPct * targetH;
            var halfW = (bounds.width * scale) / 2, halfH = (bounds.height * scale) / 2;
            if (layout.anchorH === "start") targetX += halfW;
            else if (layout.anchorH === "end") targetX -= halfW;
            if (layout.anchorV === "start") targetY += halfH;
            else if (layout.anchorV === "end") targetY -= halfH;

            sub.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([bounds.centerX, bounds.centerY]);
            sub.property("ADBE Transform Group").property("ADBE Position").setValue([targetX, targetY]);
            sub.property("ADBE Transform Group").property("ADBE Scale").setValue([scale * 100, scale * 100]);
            attachPositionExpression(sub);
            attachScaleExpression(sub);

            for (var li = 0; li < layers.length; li++) reparent(layers[li], sub);

            var savedSub = savedMeta && savedMeta.roleControllers ? savedMeta.roleControllers[subName] : null;
            if (savedSub) applyControllerValues(sub, savedSub);
            meta.roleControllers[subName] = readControllerValues(sub);
        }
    } else {
        // Fit All: uniform contain-scale, everything reparented straight to
        // the one controller. No recursion into precomps needed — they
        // scale as a unit along with everything else.
        //
        // Pivot on the comp's actual CONTENT bounding box, not the raw
        // source frame dimensions — a graphic that doesn't fill the
        // original frame edge-to-edge (margin around a bar graph, etc.)
        // would otherwise get centered on the old frame's geometric
        // middle instead of its own, and scaled down as if the empty
        // margin were part of what needs to fit, leaving it looking
        // small and off-center in the new format.
        var contentBounds = groupBounds(topLayers);
        var pivotX = contentBounds ? contentBounds.centerX : sourceW / 2;
        var pivotY = contentBounds ? contentBounds.centerY : sourceH / 2;
        var fitW = contentBounds && contentBounds.width > 0 ? contentBounds.width : sourceW;
        var fitH = contentBounds && contentBounds.height > 0 ? contentBounds.height : sourceH;
        var containScale = Math.min(targetW / fitW, targetH / fitH);
        containScale = Math.min(containScale, 3); // guard against extreme upscale of small/isolated content
        mainController.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([pivotX, pivotY]);
        mainController.property("ADBE Transform Group").property("ADBE Position").setValue([targetW / 2, targetH / 2]);
        mainController.property("ADBE Transform Group").property("ADBE Scale").setValue([containScale * 100, containScale * 100]);
        attachPositionExpression(mainController);
        attachScaleExpression(mainController);
        for (var fi = 0; fi < topLayers.length; fi++) reparent(topLayers[fi], mainController);
    }

    var savedMain = savedMeta ? savedMeta.mainController : null;
    if (savedMain) applyControllerValues(mainController, savedMain);
    meta.mainController = readControllerValues(mainController);
    return meta;
}

// ==================== SAFE-ZONE GUIDES (17.8) ====================
// Adds a guide-layer (AVLayer.guideLayer = true => never renders) shape
// layer with action-safe/title-safe outline rectangles for the comp's
// target aspect class.
function addSafeZoneGuides(comp) {
    var aspectClass = aspectClassFor(comp.width, comp.height);
    var margins = SAFE_ZONE_MARGINS[aspectClass];
    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = "SAFE_ZONES (guide)";
    shapeLayer.guideLayer = true;
    shapeLayer.moveToBeginning();

    function addRect(marginPct, colorRGB, label) {
        var w = comp.width * (1 - marginPct * 2);
        var h = comp.height * (1 - marginPct * 2);
        var group = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        group.name = label;
        var rectPath = group.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        rectPath.property("ADBE Vector Rect Size").setValue([w, h]);
        var stroke = group.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(colorRGB);
        stroke.property("ADBE Vector Stroke Width").setValue(2);
        group.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([comp.width / 2, comp.height / 2]);
    }

    addRect(margins.action, [1, 0.35, 0.2], "Action Safe");
    addRect(margins.title, [1, 0.85, 0.2], "Title / UI Safe");
    return shapeLayer;
}

// ==================== LIVE TEXT LINK (17.8) ====================
// Points each duplicated text layer's Source Text at the master comp's
// corresponding layer via a live expression, so broadcast copy edits flow
// through automatically. This is exactly the kind of expression the 17.2
// rule protects — it's generated by us, stays live, and is never baked.
function applyLiveTextLink(newComp, masterCompName) {
    var linked = 0;
    for (var i = 1; i <= newComp.numLayers; i++) {
        var layer = newComp.layer(i);
        try {
            if (!(layer instanceof TextLayer)) continue;
            var srcTextProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
            var expr =
                "try {\n" +
                "  comp(\"" + masterCompName.replace(/"/g, '\\"') + "\").layer(\"" + layer.name.replace(/"/g, '\\"') + "\").text.sourceText;\n" +
                "} catch (err) { value; }";
            srcTextProp.expression = expr;
            linked++;
        } catch (e) {}
    }
    return linked;
}

// ==================== RECURSIVE PRECOMP REFRAME (17.4 Smart Stack) ====================
function reframePrecompRecursive(precompItem, presetKey, targetW, targetH, mode, depth, dupCache) {
    if (depth > MAX_PRECOMP_RECURSION_DEPTH) return;
    var srcW = precompItem.width, srcH = precompItem.height;
    // Nested precomps keep their own native frame size (they're an element
    // inside a parent comp, not an output format) — we run the same rig
    // logic treating that native frame as both source and target so any
    // role-tagged layers inside still get repositioned/rescaled on their
    // own terms, and everything else is simply available for the manual
    // "Offset/Scale Adjust" nudge via its own controller.
    buildRig(precompItem, srcW, srcH, srcW, srcH, mode, presetKey, null);

    for (var i = 1; i <= precompItem.numLayers; i++) {
        var layer = precompItem.layer(i);
        if (isPrecompLayer(layer) && layer.source.id !== precompItem.id) {
            var dup = getOrDuplicatePrecomp(layer.source, presetKey, dupCache);
            withUnlocked(layer, function (l, d) { return function () { l.replaceSource(d, false); }; }(layer, dup));
            reframePrecompRecursive(dup, presetKey, targetW, targetH, mode, depth + 1, dupCache);
        }
    }
}

// ==================== MAIN REFRAME OPERATION ====================
function reframeComp(sourceComp, presetKey, options, dupCache) {
    var preset = FORMAT_PRESETS[presetKey];
    if (!preset) return { ok: false, error: "Unknown preset: " + presetKey };

    var baseName = safeName(sourceComp.name);
    var newName = uniqueCompName(baseName + "_" + preset.key);
    var existing = null;
    if (options.resync) {
        // Resync: look for a previously generated comp for this exact
        // source+preset so we can carry its saved controller adjustments
        // forward, per 17.5. We match by our own metadata, not by name,
        // since the designer may have renamed the comp.
        for (var i = 1; i <= app.project.numItems; i++) {
            var it = app.project.item(i);
            if (!(it instanceof CompItem)) continue;
            var m = readCompMeta(it);
            if (m && m.sourceCompId === sourceComp.id && m.presetKey === presetKey) { existing = it; break; }
        }
    }
    var savedMeta = existing ? readCompMeta(existing) : null;
    if (existing) { newName = existing.name; existing.remove(); }

    var newComp = sourceComp.duplicate();
    newComp.name = newName;
    newComp.width = preset.width;
    newComp.height = preset.height;

    var srcW = sourceComp.width, srcH = sourceComp.height;

    // Full-frame solids: duplicate the source, never touch the shared one.
    for (var li = 1; li <= newComp.numLayers; li++) {
        var layer = newComp.layer(li);
        if (isFullFrameSolid(layer, srcW, srcH)) replaceFullFrameSolid(layer, preset.width, preset.height, preset.key);
    }

    // Precomps: Fit All leaves them intact; Smart Stack + recursePrecomps
    // duplicates and recurses into them per 17.3/17.4.
    if (options.mode === "stack" && options.recursePrecomps) {
        for (var pi = 1; pi <= newComp.numLayers; pi++) {
            var player = newComp.layer(pi);
            if (isPrecompLayer(player)) {
                var dup = getOrDuplicatePrecomp(player.source, preset.key, dupCache);
                withUnlocked(player, function (l, d) { return function () { l.replaceSource(d, false); }; }(player, dup));
                reframePrecompRecursive(dup, preset.key, preset.width, preset.height, options.mode, 1, dupCache);
            }
        }
    }

    var meta = buildRig(newComp, srcW, srcH, preset.width, preset.height, options.mode, preset.key, savedMeta);
    meta.sourceCompId = sourceComp.id;
    meta.sourceCompName = sourceComp.name;
    meta.presetKey = preset.key;
    meta.presetLabel = preset.label;
    meta.mode = options.mode;
    meta.createdAt = new Date().getTime();

    var linkedText = 0;
    if (options.liveTextLink) linkedText = applyLiveTextLink(newComp, sourceComp.name);
    meta.liveTextLinkedLayers = linkedText;

    if (options.safeZoneGuides) addSafeZoneGuides(newComp);

    writeCompMeta(newComp, meta);

    return { ok: true, comp: newComp, presetKey: preset.key, presetLabel: preset.label, meta: meta };
}

// ==================== AUDIT (Section 7) ====================
function auditComp(comp) {
    var findings = [];
    var srcW = comp.width, srcH = comp.height;

    function walk(c, pathPrefix, depth, seenIds) {
        if (depth > MAX_PRECOMP_RECURSION_DEPTH) return;
        for (var i = 1; i <= c.numLayers; i++) {
            var layer = c.layer(i);
            var label = pathPrefix + layer.name;

            try {
                if (layer.locked) findings.push({ type: "locked-layer", severity: "info", layer: label, detail: "Locked — will be unlocked/relocked automatically to reparent under the controller rig." });
            } catch (e) {}

            var hasExpr = false;
            (function scanForExpr(prop) {
                if (!prop) return;
                try { if (prop.expressionEnabled && prop.expression) hasExpr = true; } catch (e) {}
                if (prop.numProperties) {
                    for (var p = 1; p <= prop.numProperties; p++) {
                        try { scanForExpr(prop.property(p)); } catch (e2) {}
                    }
                }
            })(layer);
            if (hasExpr) findings.push({ type: "expression", severity: "info", layer: label, detail: "Has live expression(s) — left untouched and editable, never baked (rule 17.2)." });

            try {
                var fx = layer.property("ADBE Effect Parade");
                if (fx) {
                    for (var e = 1; e <= fx.numProperties; e++) {
                        var eff = fx.property(e);
                        var mn = eff.matchName;
                        for (var pe = 0; pe < PIXEL_BASED_EFFECTS.length; pe++) {
                            if (PIXEL_BASED_EFFECTS[pe] === mn) {
                                findings.push({ type: "pixel-effect", severity: "warning", layer: label, detail: "\"" + eff.name + "\" uses absolute-pixel parameters that won't auto-scale with reframing — check it visually per format." });
                            }
                        }
                    }
                }
            } catch (e3) {}

            try {
                if (layer instanceof AVLayer && layer.source && !(layer.source instanceof CompItem) && !(layer.source.mainSource instanceof SolidSource)) {
                    var scale = layer.property("ADBE Transform Group").property("ADBE Scale").value;
                    var effScale = Math.max(Math.abs(scale[0]), Math.abs(scale[1])) / 100;
                    if (effScale > 1.15 && layer.source.width > 0) {
                        findings.push({ type: "upscaled-raster", severity: "warning", layer: label, detail: "Scaled to " + Math.round(effScale * 100) + "% of its native resolution — may look soft once reframed formats scale it further." });
                    }
                }
            } catch (e4) {}

            if (isPrecompLayer(layer)) {
                var srcItem = layer.source;
                if (!seenIds[srcItem.id]) {
                    seenIds[srcItem.id] = true;
                    walk(srcItem, label + " / ", depth + 1, seenIds);
                }
            }
        }
    }

    walk(comp, "", 1, {});
    return findings;
}

// ==================== RENDER QUEUE (17.8) ====================
function queueRender(compIds, namingTemplate) {
    var queued = [];
    for (var i = 0; i < compIds.length; i++) {
        var item = null;
        for (var p = 1; p <= app.project.numItems; p++) {
            var it = app.project.item(p);
            if (it instanceof CompItem && it.id === compIds[i]) { item = it; break; }
        }
        if (!item) continue;
        try {
            var rqItem = app.project.renderQueue.items.add(item);
            var meta = readCompMeta(item) || {};
            var preset = meta.presetLabel || "";
            var fileNameBase = String(namingTemplate || "{comp}")
                .replace(/\{comp\}/g, safeName(item.name))
                .replace(/\{preset\}/g, safeName(preset))
                .replace(/\{width\}/g, item.width)
                .replace(/\{height\}/g, item.height);
            var om = rqItem.outputModule(1);
            var outFolder = app.project.file ? app.project.file.parent : Folder.desktop;
            om.file = new File(outFolder.fsName + "/" + fileNameBase + ".mov");
            queued.push({ compId: item.id, compName: item.name, outputPath: om.file.fsName });
        } catch (e) { logMessage("queueRender failed for comp id " + compIds[i] + ": " + e.toString()); }
    }
    return queued;
}

// ============================================================================
// CEP-FACING API
// ============================================================================

function csGetInfo() {
    return JSON.stringify({
        ok: true, appName: APP_NAME, version: VERSION, author: AUTHOR,
        hasProject: !!app.project
    });
}

function getActiveComp() {
    var active = app.project ? app.project.activeItem : null;
    return (active instanceof CompItem) ? active : null;
}

function csGetActiveCompInfo() {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ ok: false, error: "No active composition. Open a comp in the timeline." });
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var isTop = false;
            try { isTop = !layer.parent; } catch (e) {}
            if (!isTop) continue;
            var is3d = false, isCam = false;
            try { is3d = layer.threeDLayer; } catch (e) {}
            try { isCam = layer instanceof CameraLayer; } catch (e) {}
            layers.push({
                index: layer.index, name: layer.name, role: getLayerRole(layer),
                locked: !!layer.locked, isPrecomp: isPrecompLayer(layer),
                isThreeD: !!is3d, isCamera: !!isCam
            });
        }
        var meta = readCompMeta(comp);
        return JSON.stringify({
            ok: true,
            comp: { id: comp.id, name: comp.name, width: comp.width, height: comp.height, aspectClass: aspectClassFor(comp.width, comp.height) },
            layers: layers,
            alreadyGenerated: !!meta,
            roles: ELEMENT_ROLES
        });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csAssignRoles(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ ok: false, error: "No active composition." });
        app.beginUndoGroup("Auto Reframe: Assign Element Roles");
        var applied = 0;
        for (var i = 0; i < p.assignments.length; i++) {
            var a = p.assignments[i];
            if (a.layerIndex < 1 || a.layerIndex > comp.numLayers) continue;
            var layer = comp.layer(a.layerIndex);
            if (setLayerRole(layer, a.role)) applied++;
        }
        app.endUndoGroup();
        return JSON.stringify({ ok: true, applied: applied });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csAudit() {
    try {
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ ok: false, error: "No active composition." });
        var findings = auditComp(comp);
        return JSON.stringify({ ok: true, findings: findings, count: findings.length });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csReframe(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        var comp = getActiveComp();
        if (!comp) return JSON.stringify({ ok: false, error: "No active composition." });
        if (!p.presets || p.presets.length === 0) return JSON.stringify({ ok: false, error: "Pick at least one format." });

        var options = {
            mode: p.mode === "stack" ? "stack" : "fit",
            recursePrecomps: !!p.recursePrecomps,
            safeZoneGuides: !!p.safeZoneGuides,
            liveTextLink: !!p.liveTextLink,
            resync: !!p.resync
        };

        app.beginUndoGroup("Auto Reframe: " + comp.name);
        var results = [];
        var errors = [];
        var dupCache = {};
        for (var i = 0; i < p.presets.length; i++) {
            var presetKey = p.presets[i];
            try {
                var r = reframeComp(comp, presetKey, options, dupCache);
                if (r.ok) results.push({ presetKey: r.presetKey, presetLabel: r.presetLabel, compId: r.comp.id, compName: r.comp.name });
                else errors.push({ presetKey: presetKey, error: r.error });
            } catch (e) {
                errors.push({ presetKey: presetKey, error: e.toString() });
            }
        }
        app.endUndoGroup();

        return JSON.stringify({ ok: true, results: results, errors: errors });
    } catch (e) {
        try { app.endUndoGroup(); } catch (e2) {}
        return JSON.stringify({ ok: false, error: e.toString() });
    }
}

function csQueueRender(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        var queued = queueRender(p.compIds || [], p.namingTemplate || "{comp}");
        return JSON.stringify({ ok: true, queued: queued });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}
