"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHost, CompItem, AVLayer, TextLayer, ShapeLayer, KeyframeInterpolationType: KIT } = require("./mock-ae");

function setup(opts) {
    const h = createHost();
    const comp = new CompItem(opts);
    h.app.project.activeItem = comp;
    return Object.assign(h, { comp });
}
const T = (layer, key) => layer.property("ADBE Transform Group").property(key);
const close = (a, b, eps = 1e-6) => {
    if (Array.isArray(a)) a.forEach((x, i) => assert.ok(Math.abs(x - b[i]) < eps, `${a} != ${b}`));
    else assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
};
// Where a layer-space point lands in parent space (the math AE uses).
function toParent(layer, p, t = 0) {
    const a = T(layer, "ADBE Anchor Point").valueAtTime(t);
    const pos = T(layer, "ADBE Position").valueAtTime(t);
    const s = T(layer, "ADBE Scale").valueAtTime(t);
    const th = (T(layer, "ADBE Rotate Z").valueAtTime(t) * Math.PI) / 180;
    const x = ((p[0] - a[0]) * s[0]) / 100, y = ((p[1] - a[1]) * s[1]) / 100;
    return [pos[0] + Math.cos(th) * x - Math.sin(th) * y, pos[1] + Math.sin(th) * x + Math.cos(th) * y];
}

// ---- protocol ----------------------------------------------------------------

test("JSON encoder/decoder round-trips unicode and rejects junk", () => {
    const { AT, context } = setup();
    const J = context.AT.JSON;
    const v = { s: "Tom's \"quote\" — ✓\n", n: [1, -2.5, 3e2], b: true, z: null };
    assert.deepEqual(JSON.parse(J.stringify(v)), v);
    assert.deepEqual(JSON.parse(JSON.stringify(J.parse(JSON.stringify(v)))), v);
    assert.throws(() => J.parse("{a:1}"));
    assert.throws(() => J.parse("alert(1)"));
    assert.ok(AT);
});

test("dispatcher reports missing comp, unknown command and version mismatch", () => {
    const h = createHost();
    assert.equal(h.call("anchor.set", {}).error.code, "no-comp");
    h.app.project.activeItem = new CompItem();
    assert.equal(h.call("nope.nothing").error.code, "unknown-command");
    assert.equal(h.call("system.ping", {}, 99).error.code, "version-mismatch");
    assert.equal(h.call("anchor.set", {}).error.code, "no-selection");
    assert.equal(h.call("system.ping").ok, true);
});

test("a failing mutating command still closes its single undo group", () => {
    const h = setup();
    const l = h.comp.add(AVLayer, "cam-ish");
    l.selected = true;
    l.locked = true;
    const r = h.call("anchor.set", { position: "center" });
    assert.equal(r.ok, false);
    assert.equal(h.undo.open, 0);
    assert.equal(h.undo.groups.length, 1);
});

// ---- anchor ------------------------------------------------------------------

test("anchor moves without moving a rotated, scaled layer", () => {
    const h = setup();
    const l = h.comp.add(ShapeLayer, "Box", {
        rect: { left: -50, top: -20, width: 200, height: 80 }, anchor: [0, 0], position: [960, 540], scale: [150, 80, 100], rotation: 30
    });
    l.selected = true;
    const corners = [[-50, -20], [150, 60]];
    const before = corners.map((c) => toParent(l, c));
    const r = h.call("anchor.set", { position: "bottom-right" });
    assert.equal(r.ok, true, JSON.stringify(r));
    close(T(l, "ADBE Anchor Point").value, [150, 60]);
    corners.forEach((c, i) => close(toParent(l, c), before[i]));
    assert.equal(h.undo.groups.length, 1);
});

test("anchor offsets every Position keyframe when Position is animated", () => {
    const h = setup();
    const l = h.comp.add(AVLayer, "Img", { rect: { left: 0, top: 0, width: 400, height: 200 }, anchor: [200, 100], position: [0, 0] });
    const pos = T(l, "ADBE Position");
    pos.setValueAtTime(0, [100, 100]);
    pos.setValueAtTime(1, [900, 500]);
    l.selected = true;
    const before = [0, 1].map((t) => toParent(l, [0, 0], t));
    assert.equal(h.call("anchor.set", { position: "top-left" }).ok, true);
    [0, 1].forEach((t, i) => close(toParent(l, [0, 0], t), before[i]));
    assert.equal(pos.numKeys, 2);
});

test("anchor handles separated Position dimensions", () => {
    const h = setup();
    const l = h.comp.add(AVLayer, "Sep", { rect: { left: 0, top: 0, width: 100, height: 100 }, anchor: [50, 50] });
    T(l, "ADBE Position").dimensionsSeparated = true;
    T(l, "ADBE Position_0").value = 500;
    T(l, "ADBE Position_1").value = 300;
    l.selected = true;
    assert.equal(h.call("anchor.set", { position: "top-left" }).ok, true);
    assert.equal(T(l, "ADBE Position_0").value, 450);
    assert.equal(T(l, "ADBE Position_1").value, 250);
});

test("anchor refuses (with a reason) when Scale is animated", () => {
    const h = setup();
    const l = h.comp.add(AVLayer, "Anim");
    T(l, "ADBE Scale").setValueAtTime(0, [0, 0, 100]);
    l.selected = true;
    const r = h.call("anchor.set", { position: "center" });
    assert.equal(r.ok, false);
    assert.match(r.error.message, /animated/);
    close(T(l, "ADBE Anchor Point").value, [0, 0]);
});

// ---- easing ------------------------------------------------------------------

function keyedOpacity(h) {
    const l = h.comp.add(AVLayer, "K");
    const o = T(l, "ADBE Opacity");
    o.setValueAtTime(0, 0);
    o.setValueAtTime(1, 100);
    o.selectedKeys = [1, 2];
    h.comp.selectedProperties = [o];
    return o;
}

test("Easy Ease In only changes the incoming side", () => {
    const h = setup();
    const o = keyedOpacity(h);
    assert.equal(h.call("easing.apply", { mode: "in" }).ok, true);
    assert.equal(o.keys[1].inType, KIT.BEZIER);
    assert.equal(o.keys[1].outType, KIT.LINEAR);
    close(o.keys[1].inEase[0].influence, 33.33);
    assert.equal(o.keys[1].inEase[0].speed, 0);
});

test("slider easing sets independent in/out influence; 0 means linear", () => {
    const h = setup();
    const o = keyedOpacity(h);
    const r = h.call("easing.apply", { mode: "custom", influenceIn: 80, influenceOut: 0 });
    assert.equal(r.ok, true);
    assert.equal(o.keys[0].outType, KIT.LINEAR);
    close(o.keys[1].inEase[0].influence, 80);
});

test("easing uses the right ease-array length for 3D Scale", () => {
    const h = setup();
    const l = h.comp.add(AVLayer, "S");
    const s = T(l, "ADBE Scale");
    s.setValueAtTime(0, [0, 0, 100]);
    s.setValueAtTime(1, [100, 100, 100]);
    s.selectedKeys = [1, 2];
    h.comp.selectedProperties = [s];
    assert.equal(h.call("easing.apply", { mode: "both" }).ok, true);
    assert.equal(s.keys[0].outEase.length, 3);
});

test("easing without selected keyframes explains what to do", () => {
    const h = setup();
    const r = h.call("easing.apply", { mode: "both" });
    assert.equal(r.error.code, "no-keyframes");
});

test("easing.read returns a curve for the selected pair", () => {
    const h = setup();
    keyedOpacity(h);
    h.call("easing.apply", { mode: "both", influence: 60 });
    const r = h.call("easing.read");
    close(r.result.curve.x1, 0.6);
    close(r.result.curve.y1, 0);
    close(r.result.curve.x2, 0.4);
    close(r.result.curve.y2, 1);
});

// ---- presets: stacking -----------------------------------------------------------

function layerForPresets(h, Cls = ShapeLayer) {
    const l = h.comp.add(Cls, "Logo", { inPoint: 1, outPoint: 6, position: [960, 540] });
    l.selected = true;
    return l;
}
const bounceIn = { title: "Bounce In", kind: "scale", shape: "bounce", phase: "in", durationFrames: 24 };
const bounceOut = { title: "Bounce Out", kind: "scale", shape: "bounce", phase: "out", durationFrames: 24 };

test("Bounce In and Bounce Out stack on one layer without fighting", () => {
    const h = setup();
    const l = layerForPresets(h);
    const s = T(l, "ADBE Scale");
    assert.equal(h.call("preset.apply", bounceIn).ok, true);
    assert.equal(h.call("preset.apply", bounceOut).ok, true);
    close(s.valueAtTime(1), [0, 0, 100]);       // starts invisible at In point
    close(s.valueAtTime(3.5), [100, 100, 100]); // rests at full size
    close(s.valueAtTime(6), [0, 0, 100]);       // leaves at Out point
    assert.ok(s.keys.some((k) => k.value[0] > 100), "bounce overshoots");
    assert.equal(s.keys[0].time, 1);
    close(s.keys[s.keys.length - 1].time, 6);
});

test("Bounce Out applied first, then Bounce In, still works", () => {
    const h = setup();
    const l = layerForPresets(h);
    const s = T(l, "ADBE Scale");
    h.call("preset.apply", bounceOut);
    h.call("preset.apply", bounceIn);
    close(s.valueAtTime(1), [0, 0, 100]);
    close(s.valueAtTime(3.5), [100, 100, 100]);
    close(s.valueAtTime(6), [0, 0, 100]);
});

test("re-applying a preset replaces its keys instead of piling up", () => {
    const h = setup();
    const l = layerForPresets(h);
    const s = T(l, "ADBE Scale");
    h.call("preset.apply", bounceIn);
    const n = s.numKeys;
    h.call("preset.apply", bounceIn);
    assert.equal(s.numKeys, n);
    close(s.valueAtTime(3.5), [100, 100, 100]);
});

test("Fade + Slide + Blur in and out coexist on one layer, sharing one blur effect", () => {
    const h = setup();
    const l = layerForPresets(h);
    h.call("preset.apply", { title: "Slide Up + Fade", steps: [
        { title: "Fade In", kind: "fade", phase: "in" },
        { title: "Slide Up", kind: "slide", direction: "up", distance: 100, phase: "in" }
    ] });
    h.call("preset.apply", { title: "Blur In", kind: "blur", phase: "in" });
    h.call("preset.apply", { title: "Blur Out", kind: "blur", phase: "out" });
    const fx = l.property("ADBE Effect Parade");
    assert.equal(fx.numProperties, 1);
    const blur = fx.property(1).property("ADBE Gaussian Blur 2-0001");
    close(blur.valueAtTime(1), 40);
    close(blur.valueAtTime(3.5), 0);
    close(blur.valueAtTime(6), 40);
    close(T(l, "ADBE Position").valueAtTime(1), [960, 640]);
    close(T(l, "ADBE Position").valueAtTime(3), [960, 540]);
    close(T(l, "ADBE Opacity").valueAtTime(1), 0);
    assert.equal(h.undo.groups.length, 3);
});

test("presets drop a labelled marker spanning the animation; same-frame presets merge", () => {
    const h = setup();
    const l = layerForPresets(h);
    h.call("preset.apply", { title: "Fade In", kind: "fade", phase: "in", durationFrames: 15 });
    h.call("preset.apply", { title: "Slide Up", kind: "slide", direction: "up", phase: "in", durationFrames: 20 });
    h.call("preset.apply", bounceOut);
    const m = l.property("ADBE Marker");
    assert.equal(m.numKeys, 2);
    assert.equal(m.keys[0].value.comment, "Fade In + Slide Up");
    close(m.keys[0].value.duration, 20 / 30);
    assert.equal(m.keys[1].value.comment, "Bounce Out");
    close(m.keys[1].time, 6 - 24 / 30);
});

test("drop bounce lands exactly on the rest position and never overshoots it", () => {
    const h = setup();
    const l = layerForPresets(h);
    h.call("preset.apply", { title: "Drop In", kind: "slide", shape: "drop", direction: "down", distance: 200, phase: "in" });
    const p = T(l, "ADBE Position");
    p.keys.forEach((k) => assert.ok(k.value[1] <= 540 + 1e-9));
    close(p.keys[p.keys.length - 1].value, [960, 540]);
    p.keys.forEach((k) => { assert.equal(k.spatialAutoBezier, false); close(k.inTan, [0, 0]); });
});

test("playhead timing starts the preset at the current time", () => {
    const h = setup();
    const l = layerForPresets(h);
    h.comp.time = 2;
    h.call("preset.apply", { title: "Fade In", kind: "fade", phase: "in", timing: "playhead", durationFrames: 30 });
    const o = T(l, "ADBE Opacity");
    assert.equal(o.keys[0].time, 2);
    close(o.keys[1].time, 3);
});

test("text-only presets skip non-text layers with a reason", () => {
    const h = setup();
    layerForPresets(h);
    const r = h.call("preset.apply", { title: "Type On", kind: "text-reveal", requires: "text", phase: "in" });
    assert.equal(r.ok, false);
    assert.match(r.error.message, /text/);
});

test("Type On + Type Off + Tracking In build separate named text animators", () => {
    const h = setup();
    const l = layerForPresets(h, TextLayer);
    h.call("preset.apply", { title: "Type On", kind: "text-reveal", requires: "text", phase: "in", durationFrames: 30 });
    h.call("preset.apply", { title: "Type Off", kind: "text-reveal", requires: "text", phase: "out", durationFrames: 30 });
    const r = h.call("preset.apply", { title: "Tracking In", kind: "text-tracking", requires: "text", phase: "in" });
    assert.equal(r.ok, true, JSON.stringify(r));
    const anims = l.property("ADBE Text Properties").property("ADBE Text Animators");
    assert.deepEqual(anims.children.map((a) => a.name), ["AT Type On", "AT Type Off", "AT Tracking In"]);
    const start = anims.property(1).property("ADBE Text Selectors").property(1).property("ADBE Text Percent Start");
    close(start.valueAtTime(1), 0);
    close(start.valueAtTime(2), 100);
    // Re-applying replaces rather than duplicating.
    h.call("preset.apply", { title: "Type On", kind: "text-reveal", requires: "text", phase: "in" });
    assert.equal(anims.numProperties, 3);
});

// ---- layers, keyframes, camera -----------------------------------------------------

test("align left puts the layer's visual edge on the comp edge", () => {
    const h = setup();
    const l = h.comp.add(ShapeLayer, "A", { rect: { left: -50, top: -50, width: 100, height: 100 }, position: [700, 400], scale: [200, 200, 100] });
    l.selected = true;
    assert.equal(h.call("layers.align", { edge: "left" }).ok, true);
    close(T(l, "ADBE Position").value, [100, 400]);
    h.call("layers.align", { edge: "center" });
    close(T(l, "ADBE Position").value, [960, 540]);
});

test("distribute spaces three layers evenly", () => {
    const h = setup();
    const ls = [100, 200, 900].map((x, i) => {
        const l = h.comp.add(ShapeLayer, "L" + i, { rect: { left: -10, top: -10, width: 20, height: 20 }, position: [x, 100] });
        l.selected = true;
        return l;
    });
    assert.equal(h.call("layers.distribute", { axis: "h" }).ok, true);
    close(T(ls[1], "ADBE Position").value, [500, 100]);
});

test("reverse keyframes mirrors times and values", () => {
    const h = setup();
    const o = keyedOpacity(h);
    o.setValueAtTime(0.25, 80);
    o.selectedKeys = [1, 2, 3];
    assert.equal(h.call("keyframes.reverse").ok, true);
    assert.deepEqual(o.keys.map((k) => [k.time, k.value]), [[0, 100], [0.75, 80], [1, 0]]);
});

test("add keyframes keys every transform property", () => {
    const h = setup();
    const l = layerForPresets(h);
    h.comp.time = 0.5;
    const r = h.call("keyframes.add", { property: "all" });
    assert.equal(r.result.keyframes, 5);
    assert.equal(T(l, "ADBE Rotate Z").numKeys, 1);
});

test("camera push dollies toward the point of interest with a marker", () => {
    const h = setup();
    assert.equal(h.call("camera.create", { lens: "50mm", oneNode: false }).ok, true);
    const cam = h.comp.activeCamera;
    const r = h.call("camera.move", { move: "push", distance: 300, durationFrames: 30 });
    assert.equal(r.ok, true, JSON.stringify(r));
    const p = T(cam, "ADBE Position");
    close(p.valueAtTime(1)[2] - p.valueAtTime(0)[2], 300);
    assert.equal(cam.property("ADBE Marker").keys[0].value.comment, "Push In");
});

test("parent to null creates one controller for top-level layers", () => {
    const h = setup();
    const a = h.comp.add(AVLayer, "A", { position: [100, 100] });
    const b = h.comp.add(AVLayer, "B", { position: [300, 300] });
    a.selected = b.selected = true;
    assert.equal(h.call("layers.nullParent").ok, true);
    assert.equal(a.parent, b.parent);
    close(T(a.parent, "ADBE Position").value, [200, 200]);
});

test("context.inspect summarises selection", () => {
    const h = setup();
    const l = h.comp.add(TextLayer, "Title");
    l.selected = true;
    const r = h.call("context.inspect");
    assert.equal(r.result.kinds.text, 1);
    assert.equal(r.result.comp.width, 1920);
});
