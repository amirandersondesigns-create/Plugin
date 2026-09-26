"use strict";
// Panel logic tests: content integrity, search, storage, bridge escaping,
// and a contract test that pushes every catalog tool and preset through the
// real host command modules (on the mock AE DOM).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { createHost, CompItem, ShapeLayer, TextLayer, AVLayer, CameraLayer } = require("../host/mock-ae");

const CLIENT = path.join(__dirname, "..", "..", "client", "js");

function loadPanel(files, extra) {
    const mem = {};
    const window = Object.assign({
        localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } },
        navigator: { platform: "MacIntel" }
    }, extra || {});
    window.window = window;
    const ctx = vm.createContext(Object.assign(window, { console, JSON, Math, Date, Promise, setTimeout, decodeURI, require }));
    for (const f of files) vm.runInContext(fs.readFileSync(path.join(CLIENT, f), "utf8"), ctx, { filename: f });
    return ctx;
}

const CONTENT = ["content/actions.js", "content/motions.js", "content/lessons.js", "content/shortcuts.js"];
const plain = (v) => JSON.parse(JSON.stringify(v));

test("catalog ids are unique and every reference resolves", () => {
    const w = loadPanel(CONTENT);
    const c = w.AT.content;
    const all = [].concat(c.actions, c.presets, c.lessons, c.shortcuts);
    const ids = new Set();
    all.forEach((i) => { assert.ok(!ids.has(i.id), "duplicate id " + i.id); ids.add(i.id); });
    c.lessons.forEach((l) => l.tryIt.concat(l.shortcuts).forEach((r) => assert.ok(ids.has(r), l.id + " -> " + r)));
    c.essentials.forEach((e) => assert.ok(ids.has(e)));
});

test("Bounce is offered under More effects in both Animate and Text", () => {
    const w = loadPanel(CONTENT);
    const bounce = w.AT.content.presets.filter((p) => p.motionId === "bounce");
    assert.equal(bounce.length, 2);
    bounce.forEach((p) => {
        assert.equal(p.tier, "more");
        assert.deepEqual(plain(p.groups), ["graphic", "text"]);
    });
    assert.deepEqual(plain(bounce.map((b) => b.title)), ["Bounce In", "Bounce Out"]);
});

test("every panel tool maps to a registered host command", () => {
    const w = loadPanel(CONTENT);
    const h = createHost();
    w.AT.content.actions.forEach((a) => assert.ok(h.AT.commands[a.command], a.id + " -> " + a.command));
});

test("every preset (in and out) applies cleanly on the host, stacked on one layer", () => {
    const w = loadPanel(CONTENT);
    for (const group of ["graphic", "text", "threed", "mask"]) {
        const h = createHost();
        const comp = new CompItem();
        h.app.project.activeItem = comp;
        const layer = comp.add(group === "text" ? TextLayer : ShapeLayer, "L", { inPoint: 0, outPoint: 8, position: [960, 540] });
        layer.selected = true;
        const presets = w.AT.content.presets.filter((p) => p.groups.includes(group));
        for (const p of presets) {
            const payload = Object.assign(plain(p.def), { timing: "layer", durationFrames: p.duration });
            const r = h.call("preset.apply", payload);
            assert.equal(r.ok, true, p.id + ": " + JSON.stringify(r.error));
        }
        // After stacking every entrance and exit, the layer still rests at its
        // original transform in the middle of its life.
        const T = (k) => layer.property("ADBE Transform Group").property(k).valueAtTime(4);
        // 3D presets make the layer 3D (Position gains z = 0); compare X/Y.
        assert.deepEqual(plain(T("ADBE Position").slice(0, 2).map(Math.round)), [960, 540]);
        assert.deepEqual(plain(T("ADBE Scale").map(Math.round)), [100, 100, 100]);
        assert.equal(Math.round(T("ADBE Opacity")), 100);
        assert.equal(Math.round(T("ADBE Rotate Z")), 0);
        assert.ok(layer.property("ADBE Marker").numKeys >= 2);
    }
});

test("search finds tools, lessons and shortcuts; stems ease/easing", () => {
    const w = loadPanel(CONTENT.concat(["core/catalog.js", "core/search.js"]));
    w.AT.catalog.build();
    w.AT.search.build(w.AT.catalog.all(), []);
    const ids = (q) => w.AT.search.query(q, 50).map((r) => r.item.id);
    const ease = ids("ease");
    assert.ok(ease.includes("ease.both"));
    assert.ok(ease.includes("lesson.easing"));
    assert.ok(ease.includes("sc.f9"));
    assert.ok(ids("easing").includes("ease.in"));
    const anchor = ids("anchor");
    assert.ok(anchor.includes("anchor.center") && anchor.includes("lesson.anchor") && anchor.includes("sc.anchor"));
    assert.match(ids("bounce")[0], /^(motion\.bounce|ease\.physics\.bounce)/);
    assert.ok(ids("bounce").includes("motion.bounce.in"));
    assert.ok(ids("mask path").includes("lesson.mask-visibility"));
    assert.deepEqual(plain(ids("zzzz")), []);
});

test("search surfaces favorites by their custom name", () => {
    const w = loadPanel(CONTENT.concat(["core/catalog.js", "core/search.js"]));
    w.AT.catalog.build();
    w.AT.search.build(w.AT.catalog.all(), [{ targetId: "motion.slide-fade.in", label: "Headline entrance" }]);
    const r = w.AT.search.query("headline entrance");
    assert.equal(r[0].item.id, "motion.slide-fade.in");
    assert.ok(r[0].favorite);
});

test("bridge serializes requests as one inert string literal", () => {
    const w = loadPanel(["lib/CSInterface.js", "core/bridge.js"]);
    const nasty = 'x"); app.quit(); ("\u2028\u2029\\';
    const lit = w.AT.bridge._literal(JSON.stringify({ payload: { name: nasty } }));
    assert.ok(!/[\u2028\u2029]/.test(lit));
    // Evaluating the literal yields the original JSON, never code.
    const back = vm.runInNewContext(lit);
    assert.equal(JSON.parse(back).payload.name, nasty);
    // And the host's own parser reads it identically.
    const h = createHost();
    assert.equal(h.context.AT.JSON.parse(back).payload.name, nasty);
});

test("store persists to disk atomically and survives a corrupt file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "at-store-"));
    const w = loadPanel(["lib/CSInterface.js", "core/bridge.js", "core/store.js"]);
    assert.equal(w.AT.store.init({ dir }), "file");
    w.AT.store.update("favorites", (f) => { f.items.push({ targetId: "ease.both", label: "E" }); });
    const saved = JSON.parse(fs.readFileSync(path.join(dir, "favorites.json"), "utf8"));
    assert.equal(saved.schema, 1);
    assert.equal(saved.data.items[0].targetId, "ease.both");
    assert.ok(!fs.existsSync(path.join(dir, "favorites.json.tmp")));

    fs.writeFileSync(path.join(dir, "settings.json"), "{ not json");
    const w2 = loadPanel(["lib/CSInterface.js", "core/bridge.js", "core/store.js"]);
    w2.AT.store.init({ dir });
    assert.equal(w2.AT.store.get("settings").mode, "beginner");
    assert.equal(w2.AT.store.get("favorites").items.length, 1);
    assert.ok(fs.readdirSync(dir).some((f) => f.startsWith("settings.corrupt-")));
});

test("store falls back to localStorage outside After Effects", () => {
    const w = loadPanel(["lib/CSInterface.js", "core/bridge.js", "core/store.js"], { require: undefined });
    assert.equal(w.AT.store.init(), "local");
    w.AT.store.update("settings", (s) => { s.mode = "pro"; });
    assert.equal(w.AT.store.get("settings").mode, "pro");
});
