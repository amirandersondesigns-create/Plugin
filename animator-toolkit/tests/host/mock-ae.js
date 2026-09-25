// A small, deliberately strict mock of the After Effects scripting DOM —
// enough of Property / PropertyGroup / layers / CompItem to execute the
// host command modules in Node. It throws where After Effects throws (e.g.
// setValue on a keyframed property, a temporal-ease array of the wrong
// length) so tests catch the same mistakes AE would.
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const KeyframeInterpolationType = { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 };
const AutoOrientType = { NO_AUTO_ORIENT: 4212, CAMERA_OR_POINT_OF_INTEREST: 4214, ALONG_PATH: 4213 };

class KeyframeEase {
    constructor(speed, influence) {
        if (influence < 0.1 || influence > 100) throw new Error("influence out of range: " + influence);
        this.speed = speed;
        this.influence = influence;
    }
}

class MarkerValue {
    constructor(comment) {
        this.comment = comment || "";
        this.duration = 0;
    }
}

const EPS = 1e-6;
const clone = (v) => (Array.isArray(v) ? v.slice() : v);

class PropertyBase {
    constructor(name, matchName) {
        this.name = name;
        this.matchName = matchName || name;
        this.parentGroup = null;
    }
    get propertyIndex() {
        return this.parentGroup ? this.parentGroup.children.indexOf(this) + 1 : 0;
    }
    get propertyDepth() {
        let d = 0;
        let p = this.parentGroup;
        while (p) { d++; p = p.parentGroup; }
        return d;
    }
    propertyGroup(n) {
        let p = this;
        for (let i = 0; i < (n || 1); i++) p = p.parentGroup;
        return p;
    }
    remove() {
        const kids = this.parentGroup.children;
        kids.splice(kids.indexOf(this), 1);
    }
}

class Property extends PropertyBase {
    // opts: { value, dims (ease array length), spatial }
    constructor(name, matchName, opts) {
        super(name, matchName);
        this.value = clone(opts.value);
        this.easeDims = opts.dims || 1;
        this.isSpatial = !!opts.spatial;
        this.canVaryOverTime = opts.canVaryOverTime !== false;
        this.canSetExpression = true;
        this.expression = "";
        this.expressionEnabled = false;
        this.dimensionsSeparated = false;
        this.keys = [];
        this.selectedKeys = [];
    }
    get numKeys() { return this.keys.length; }
    setValue(v) {
        if (this.keys.length) throw new Error("setValue on a property with keyframes (" + this.name + ")");
        this.value = clone(v);
    }
    newKey(t, v) {
        const ease = () => Array.from({ length: this.easeDims }, () => new KeyframeEase(0, 16.666666667));
        const zero = Array.isArray(v) ? v.map(() => 0) : [0];
        return {
            time: t, value: clone(v),
            inType: KeyframeInterpolationType.LINEAR, outType: KeyframeInterpolationType.LINEAR,
            inEase: ease(), outEase: ease(), inTan: zero.slice(), outTan: zero.slice(),
            continuous: false, autoBezier: false, spatialAutoBezier: true, spatialContinuous: true
        };
    }
    setValueAtTime(t, v) {
        if (!this.canVaryOverTime) throw new Error("cannot keyframe " + this.name);
        const existing = this.keys.find((k) => Math.abs(k.time - t) < EPS);
        if (existing) { existing.value = clone(v); return; }
        this.keys.push(this.newKey(t, v));
        this.keys.sort((a, b) => a.time - b.time);
    }
    key(i) {
        if (i < 1 || i > this.keys.length) throw new Error("key index out of range: " + i);
        return this.keys[i - 1];
    }
    setValueAtKey(i, v) { this.key(i).value = clone(v); }
    keyValue(i) { return clone(this.key(i).value); }
    keyTime(i) { return this.key(i).time; }
    removeKey(i) { this.key(i); this.keys.splice(i - 1, 1); }
    nearestKeyIndex(t) {
        let best = 1, bd = Infinity;
        this.keys.forEach((k, i) => { const d = Math.abs(k.time - t); if (d < bd) { bd = d; best = i + 1; } });
        return best;
    }
    valueAtTime(t) {
        if (!this.keys.length) return clone(this.value);
        const ks = this.keys;
        if (t <= ks[0].time) return clone(ks[0].value);
        if (t >= ks[ks.length - 1].time) return clone(ks[ks.length - 1].value);
        for (let i = 0; i < ks.length - 1; i++) {
            const a = ks[i], b = ks[i + 1];
            if (t >= a.time && t <= b.time) {
                if (a.outType === KeyframeInterpolationType.HOLD) return clone(a.value);
                const f = (t - a.time) / (b.time - a.time);
                if (Array.isArray(a.value)) return a.value.map((x, j) => x + (b.value[j] - x) * f);
                if (typeof a.value === "number") return a.value + (b.value - a.value) * f;
                return clone(a.value);
            }
        }
    }
    keyInInterpolationType(i) { return this.key(i).inType; }
    keyOutInterpolationType(i) { return this.key(i).outType; }
    setInterpolationTypeAtKey(i, inT, outT) {
        const k = this.key(i);
        k.inType = inT;
        k.outType = outT === undefined ? inT : outT;
    }
    keyInTemporalEase(i) { return this.key(i).inEase.slice(); }
    keyOutTemporalEase(i) { return this.key(i).outEase.slice(); }
    setTemporalEaseAtKey(i, inE, outE) {
        if (inE.length !== this.easeDims || (outE || inE).length !== this.easeDims) {
            throw new Error("temporal ease array length must be " + this.easeDims + " for " + this.name);
        }
        const k = this.key(i);
        k.inEase = inE.slice();
        k.outEase = (outE || inE).slice();
    }
    setTemporalContinuousAtKey(i, v) { this.key(i).continuous = v; }
    setTemporalAutoBezierAtKey(i, v) { this.key(i).autoBezier = v; }
    requireSpatial() { if (!this.isSpatial) throw new Error(this.name + " is not spatial"); }
    keyInSpatialTangent(i) { this.requireSpatial(); return this.key(i).inTan.slice(); }
    keyOutSpatialTangent(i) { this.requireSpatial(); return this.key(i).outTan.slice(); }
    setSpatialTangentsAtKey(i, a, b) { this.requireSpatial(); this.key(i).inTan = a.slice(); this.key(i).outTan = (b || a).slice(); }
    setSpatialContinuousAtKey(i, v) { this.requireSpatial(); this.key(i).spatialContinuous = v; }
    setSpatialAutoBezierAtKey(i, v) { this.requireSpatial(); this.key(i).spatialAutoBezier = v; }
}

class PropertyGroup extends PropertyBase {
    constructor(name, matchName, factory) {
        super(name, matchName);
        this.children = [];
        this.factory = factory || null;
    }
    add(child) {
        child.parentGroup = this;
        this.children.push(child);
        return child;
    }
    get numProperties() { return this.children.length; }
    property(key) {
        if (typeof key === "number") return this.children[key - 1] || null;
        return this.children.find((c) => c.matchName === key || c.name === key) || null;
    }
    canAddProperty(mn) { return !!(this.factory && this.factory(mn, true)); }
    addProperty(mn) {
        const made = this.factory && this.factory(mn, false);
        if (!made) throw new Error("can't add " + mn + " to " + this.name);
        return this.add(made);
    }
}

// --- effects & text animator factories ------------------------------------

function effect(mn) {
    const defs = {
        "ADBE Gaussian Blur 2": ["Gaussian Blur", [["Blurriness", "ADBE Gaussian Blur 2-0001", 0]]],
        "ADBE Linear Wipe": ["Linear Wipe", [["Transition Completion", "ADBE Linear Wipe-0001", 0],
            ["Wipe Angle", "ADBE Linear Wipe-0002", 90], ["Feather", "ADBE Linear Wipe-0003", 0]]]
    };
    const d = defs[mn];
    if (!d) return null;
    const g = new PropertyGroup(d[0], mn);
    d[1].forEach(([n, m, v]) => g.add(new Property(n, m, { value: v })));
    return g;
}

function animatorPropFactory(mn, probe) {
    const defs = {
        "ADBE Text Opacity": ["Opacity", 100, 1],
        "ADBE Text Position 3D": ["Position", [0, 0, 0], 3],
        "ADBE Text Tracking Amount": ["Tracking Amount", 0, 1],
        "ADBE Text Blur": ["Blur", [0, 0], 2]
    };
    const d = defs[mn];
    if (!d) return null;
    if (probe) return true;
    return new Property(d[0], mn, { value: d[1], dims: d[2] });
}

function selectorFactory(mn, probe) {
    if (mn !== "ADBE Text Selector") return null;
    if (probe) return true;
    const g = new PropertyGroup("Range Selector 1", mn);
    g.add(new Property("Start", "ADBE Text Percent Start", { value: 0 }));
    g.add(new Property("End", "ADBE Text Percent End", { value: 100 }));
    g.add(new Property("Offset", "ADBE Text Percent Offset", { value: 0 }));
    const adv = g.add(new PropertyGroup("Advanced", "ADBE Text Range Advanced"));
    adv.add(new Property("Based On", "ADBE Text Range Type2", { value: 1, canVaryOverTime: false }));
    return g;
}

function animatorFactory(mn, probe) {
    if (mn !== "ADBE Text Animator") return null;
    if (probe) return true;
    const a = new PropertyGroup("Animator 1", mn);
    a.add(new PropertyGroup("Range Selectors", "ADBE Text Selectors", selectorFactory));
    a.add(new PropertyGroup("Properties", "ADBE Text Animator Properties", animatorPropFactory));
    return a;
}

// --- layers ------------------------------------------------------------------

class Layer extends PropertyGroup {
    constructor(comp, name, opts) {
        super(name, "ADBE AV Layer");
        opts = opts || {};
        this.comp = comp;
        this.inPoint = opts.inPoint || 0;
        this.outPoint = opts.outPoint || comp.duration;
        this.startTime = 0;
        this.locked = false;
        this.selected = false;
        this.parent = null;
        this.motionBlur = false;
        this.nullLayer = false;
        this.adjustmentLayer = false;
        this.source = null;
        this.label = 0;
        this._threeD = false;
        this.rect = opts.rect || { left: 0, top: 0, width: 100, height: 100 };
        const t = this.add(new PropertyGroup("Transform", "ADBE Transform Group"));
        t.add(new Property("Anchor Point", "ADBE Anchor Point", { value: opts.anchor || [0, 0], dims: 1, spatial: true }));
        const pos = t.add(new Property("Position", "ADBE Position", { value: opts.position || [0, 0], dims: 1, spatial: true }));
        this.positionProp = pos;
        t.add(new Property("X Position", "ADBE Position_0", { value: 0 }));
        t.add(new Property("Y Position", "ADBE Position_1", { value: 0 }));
        t.add(new Property("Z Position", "ADBE Position_2", { value: 0 }));
        t.add(new Property("Scale", "ADBE Scale", { value: opts.scale || [100, 100, 100], dims: 3 }));
        t.add(new Property("Orientation", "ADBE Orientation", { value: [0, 0, 0], spatial: true }));
        t.add(new Property("X Rotation", "ADBE Rotate X", { value: 0 }));
        t.add(new Property("Y Rotation", "ADBE Rotate Y", { value: 0 }));
        t.add(new Property("Rotation", "ADBE Rotate Z", { value: opts.rotation || 0 }));
        t.add(new Property("Opacity", "ADBE Opacity", { value: 100 }));
        this.add(new PropertyGroup("Effects", "ADBE Effect Parade", (mn, probe) => (probe ? !!effect(mn) : effect(mn))));
        this.add(new Property("Marker", "ADBE Marker", { value: null }));
    }
    get threeDLayer() { return this._threeD; }
    set threeDLayer(v) {
        this._threeD = v;
        const a = this.property("ADBE Transform Group").property("ADBE Anchor Point");
        const p = this.positionProp;
        [a, p].forEach((prop) => {
            if (v && prop.value.length === 2) prop.value = prop.value.concat(0);
            if (!v && prop.value.length === 3) prop.value = prop.value.slice(0, 2);
        });
    }
    get index() { return this.comp.layerList.indexOf(this) + 1; }
    sourceRectAtTime() { return Object.assign({}, this.rect); }
    moveBefore(other) {
        const list = this.comp.layerList;
        list.splice(list.indexOf(this), 1);
        list.splice(list.indexOf(other), 0, this);
    }
}
class AVLayer extends Layer {}
class TextLayer extends AVLayer {
    constructor(comp, name, opts) {
        super(comp, name, opts);
        const text = this.add(new PropertyGroup("Text", "ADBE Text Properties"));
        text.add(new Property("Source Text", "ADBE Text Document", { value: { text: name }, canVaryOverTime: true }));
        text.add(new PropertyGroup("Animators", "ADBE Text Animators", animatorFactory));
    }
}
class ShapeLayer extends AVLayer {}
class CameraLayer extends Layer {
    constructor(comp, name, opts) {
        super(comp, name, opts);
        this.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
        this.threeDLayer = true;
        const o = this.add(new PropertyGroup("Camera Options", "ADBE Camera Options Group"));
        o.add(new Property("Zoom", "ADBE Camera Zoom", { value: 1000 }));
    }
}
class LightLayer extends Layer {}

class CompItem {
    constructor(opts) {
        opts = opts || {};
        this.name = opts.name || "Comp 1";
        this.width = opts.width || 1920;
        this.height = opts.height || 1080;
        this.frameRate = opts.frameRate || 30;
        this.frameDuration = 1 / this.frameRate;
        this.duration = opts.duration || 10;
        this.time = 0;
        this.motionBlur = false;
        this.layerList = [];
        this.selectedProperties = [];
        this.markerProperty = new Property("Marker", "ADBE Marker", { value: null });
        const comp = this;
        this.layers = {
            addNull() { const l = new AVLayer(comp, "Null 1"); l.nullLayer = true; comp.layerList.unshift(l); return l; },
            addText(txt) { const l = new TextLayer(comp, txt); comp.layerList.unshift(l); return l; },
            addCamera(name, c) {
                const l = new CameraLayer(comp, name, { position: [c[0], c[1], -1000], anchor: [c[0], c[1], 0] });
                comp.layerList.unshift(l);
                return l;
            },
            precompose(indices, name) { comp.precomposed = { indices, name }; return new CompItem({ name }); },
            add(src) { const l = new AVLayer(comp, src.name || "Footage"); comp.layerList.unshift(l); return l; }
        };
    }
    layer(i) { return this.layerList[i - 1]; }
    get selectedLayers() { return this.layerList.filter((l) => l.selected); }
    get activeCamera() { return this.layerList.find((l) => l instanceof CameraLayer) || null; }
    add(LayerClass, name, opts) {
        const l = new LayerClass(this, name, opts);
        this.layerList.push(l);
        return l;
    }
}

// opts.boot === "cep": don't preload modules. Instead evaluate host/index.jsx
// the way CEP does and let the panel call AT_boot(<extension root>), which
// loads modules through a filesystem-backed $.evalFile. Used by the
// end-to-end panel test to exercise the real loader and path handling.
function createHost(opts) {
    opts = opts || {};
    const undo = { open: 0, groups: [] };
    const app = {
        version: "26.0 (mock)",
        project: { activeItem: null, importFile: (o) => ({ name: "still" }) },
        beginUndoGroup(name) { undo.open++; undo.groups.push(name); },
        endUndoGroup() { undo.open--; }
    };
    const context = {
        app, KeyframeEase, KeyframeInterpolationType, AutoOrientType, MarkerValue,
        CompItem, AVLayer, TextLayer, ShapeLayer, CameraLayer, LightLayer, Property, PropertyGroup,
        SolidSource: function () {},
        ParagraphJustification: { CENTER_JUSTIFY: 7415 },
        Folder: function (p) { this.fsName = p; this.exists = true; },
        File: function (p) { this.fsName = p; this.exists = false; },
        ImportOptions: function () {},
        $: { sleep() {}, fileName: "" },
        Math, String, Object, Array, Error, isFinite, parseInt, Infinity, NaN
    };
    context.Folder.desktop = { fsName: "/Users/mock/Desktop" };
    vm.createContext(context);
    const hostDir = path.join(__dirname, "..", "..", "host");
    if (opts.boot === "cep") {
        context.Folder = function (p) { this.fsName = path.resolve(String(p)); this.exists = fs.existsSync(this.fsName); };
        context.File = function (p) { this.fsName = path.resolve(String(p)); this.exists = fs.existsSync(this.fsName); };
        context.Folder.desktop = { fsName: "/Users/mock/Desktop" };
        context.$.evalFile = function (f) {
            const file = typeof f === "string" ? f : f.fsName;
            return vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
        };
        vm.runInContext(fs.readFileSync(path.join(hostDir, "index.jsx"), "utf8"), context, { filename: "index.jsx" });
        return {
            context, app, undo,
            // What CEP's evalScript does: run a script, hand back String(result).
            evalScript(script) {
                try {
                    const r = vm.runInContext(script, context);
                    return r === undefined ? "undefined" : String(r);
                } catch (e) {
                    return "EvalScript error.";
                }
            }
        };
    }
    const index = fs.readFileSync(path.join(hostDir, "index.jsx"), "utf8");
    const modules = vm.runInContext(index.split("function AT_boot")[0] + "; AT_MODULES", context);
    for (const m of modules) {
        const src = fs.readFileSync(path.join(hostDir, m), "utf8");
        vm.runInContext(src, context, { filename: m });
    }
    let n = 0;
    function call(command, payload, version) {
        const req = JSON.stringify({ version: version || 1, requestId: "t" + ++n, command, payload: payload || {} });
        const out = JSON.parse(context.AT.dispatch(req));
        if (undo.open !== 0) throw new Error("undo group left open after " + command);
        return out;
    }
    return { context, app, undo, call, AT: context.AT };
}

module.exports = { createHost, CompItem, AVLayer, TextLayer, ShapeLayer, CameraLayer, KeyframeInterpolationType };
