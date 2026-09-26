"use strict";
// End-to-end check of the real CEP code path, without After Effects:
//
//   real panel (Chromium) -> CSInterface -> window.__adobe_cep__.evalScript
//   -> mock host: host/index.jsx, $["com.aanders.animatortoolkit"].boot(<root>)
//      loading modules with $.evalFile -> dispatch -> mock AE DOM
//
// The shared ExtendScript engine is made hostile the way a real After
// Effects can be: other tools' globals named AT/ATJSON, an enumerable
// Array.prototype polyfill, an engine that fails the first eval at startup,
// and the host namespace being wiped mid-session.
//
// The extension is copied to a path containing spaces (like
// ~/Library/Application Support/...) and getSystemPath returns a file://
// URL, exactly like CEP. Then the UI is clicked and the mock project is
// inspected. Run: node tests/e2e/cep-e2e.js  (needs Playwright + Chromium)
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

let chromium;
try {
    ({ chromium } = require("playwright"));
} catch (e) {
    ({ chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright")));
}
const { createHost, CompItem, TextLayer, ShapeLayer, AVLayer } = require("../host/mock-ae");

// E2E_SRC=<folder> runs the same checks against another build of the extension.
const SRC = process.env.E2E_SRC || path.join(__dirname, "..", "..");
const base = fs.mkdtempSync(path.join(os.tmpdir(), "at-e2e-"));
const EXT = path.join(base, "Application Support", "Adobe", "CEP", "extensions", "com.aanders.animatortoolkit");
fs.mkdirSync(EXT, { recursive: true });
for (const d of ["CSXS", "client", "host"]) fs.cpSync(path.join(SRC, d), path.join(EXT, d), { recursive: true });

const host = createHost({
    boot: "cep",
    hostDir: path.join(EXT, "host"), // evaluate the installed copy, like CEP
    // E2E_FRIENDLY=1: ideal conditions (no failed first eval, no foreign globals).
    failFirstEvals: process.env.E2E_FRIENDLY ? 0 : 1,
    scriptPathBoot: !!process.env.E2E_FRIENDLY,
    // E2E_DROP=1: every function-return reply comes back empty.
    dropReturns: !!process.env.E2E_DROP,
    beforeLoad(ctx) {
        if (process.env.E2E_FRIENDLY) return;
        // Another extension's globals and a sloppy polyfill, in the SAME engine.
        require("vm").runInContext(
            'var AT = "some other tool"; var ATJSON = null; function AT_boot() { return "wrong tool"; }' +
            'Array.prototype.contains = function (x) { for (var i = 0; i < this.length; i++) if (this[i] === x) return true; return false; };',
            ctx);
    }
});
const comp = new CompItem({ name: "Lower Third" });
host.app.project.activeItem = comp;
const shape = comp.add(ShapeLayer, "Logo Bug", { inPoint: 0, outPoint: 8, position: [960, 540], rect: { left: -50, top: -50, width: 100, height: 100 } });
const text = comp.add(TextLayer, "Headline", { inPoint: 0, outPoint: 8, position: [960, 800], rect: { left: -200, top: -40, width: 400, height: 50 } });
shape.selected = true;
const T = (l, k) => l.property("ADBE Transform Group").property(k);

const results = [];
const toasts = [];
function check(name, ok, detail) {
    results.push({ name, ok: !!ok });
    console.log((ok ? "PASS " : "FAIL ") + name + (ok || detail === undefined ? "" : "  -> " + JSON.stringify(detail)));
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const scripts = [];
    await page.exposeFunction("__cepEval", (script) => { scripts.push(script); return host.evalScript(script); });
    await page.addInitScript(() => {
        document.addEventListener("DOMContentLoaded", () => {
            const t = window.AT.toast;
            window.AT.toast = function (msg, kind, item) { try { window.__toastSeen(kind || "info", String(msg)); } catch (e) {} return t.apply(this, arguments); };
        });
    });
    await page.addInitScript(({ ext }) => {
        window.__adobe_cep__ = {
            evalScript(script, cb) { window.__cepEval(script).then(cb); },
            getSystemPath(type) { return type === "extension" ? "file://" + encodeURI(ext) : "file:///tmp/userdata"; },
            getHostEnvironment() { return "{}"; }
        };
        window.__opened = [];
        window.cep = { util: { openURLInDefaultBrowser(u) { window.__opened.push(u); } } };
    }, { ext: EXT });

    const toast = async () => (await page.textContent("#toast")) || "";
    // Every toast the panel shows, so we can prove no success shows an error.
    await page.exposeFunction("__toastSeen", (kind, text) => { toasts.push({ kind, text }); });
    const waitToast = async (re) => {
        await page.waitForFunction((src) => new RegExp(src).test(document.querySelector("#toast").textContent), re.source, { timeout: 4000 }).catch(() => {});
        return toast();
    };

    await page.goto("file://" + encodeURI(path.join(EXT, "client", "index.html")));
    // The first eval fails (engine not ready); the panel retries on its own.
    await page.waitForFunction(() => window.AT && AT.bridge.status().booted, null, { timeout: 8000 }).catch(() => {});

    // Boot: host modules loaded through AT_boot with the decoded path.
    check("host booted (after a failed first eval) from a path with spaces", host.ns && host.ns.ready === true,
        scripts.filter((s) => s.indexOf(".boot(") >= 0));
    if (process.env.E2E_FRIENDLY) {
        // ScriptPath already loaded the 12 modules; the panel must not load them again.
        check("host modules loaded once at startup (no double load)", host.context.$.evalCount === host.ns.MODULES.length, [host.context.$.evalCount, host.ns.MODULES.length]);
    }
    if (!process.env.E2E_FRIENDLY) check("other tools' globals untouched", host.context.AT === "some other tool" && host.context.ATJSON === null);
    check("no persistent error banner once connected", !(await page.$("#host-banner")));
    check("no preview banner inside the host", !(await page.$(".preview-banner")));

    // Onboarding.
    await page.click("text=Get started");
    await page.click("text=Start working");

    await page.waitForFunction(() => /Layer selected/.test((document.querySelector(".suggest-title") || {}).textContent || ""), null, { timeout: 5000 }).catch(() => {});
    check("Home reflects the live selection", /Layer selected/.test(await page.textContent(".suggest-title")), await page.textContent(".suggest-title"));
    check("no connection chip in the header", !(await page.$("#context")));

    // Animate > More effects > Bounce In, then Exit > Bounce Out.
    await page.click(".tab[data-view=animate]");
    await page.click(".preset:has-text('Bounce In')");
    check("Bounce In feedback", /Bounce In added to 1 layer/.test(await waitToast(/Bounce In/)), await toast());
    await page.click(".seg-phase .seg-btn:has-text('Exit')");
    await page.click(".preset:has-text('Bounce Out')");
    check("Bounce Out feedback", /Bounce Out added to 1 layer/.test(await waitToast(/Bounce Out/)), await toast());
    const sc = T(shape, "ADBE Scale");
    const v = (t) => sc.valueAtTime(t).map(Math.round);
    check("Bounce In + Out stack: 0 at In, 100 mid, 0 at Out",
        JSON.stringify([v(0), v(4), v(8)]) === JSON.stringify([[0, 0, 100], [100, 100, 100], [0, 0, 100]]), [v(0), v(4), v(8)]);
    const markers = shape.property("ADBE Marker").keys.map((k) => k.value.comment);
    check("one timeline marker per preset", JSON.stringify(markers) === JSON.stringify(["Bounce In", "Bounce Out"]), markers);

    // Entrance again + stacked Fade In on the same layer.
    await page.click(".seg-phase .seg-btn:has-text('Entrance')");
    await page.click(".preset:has-text('Fade In')");
    await waitToast(/Fade In/);
    const markers2 = shape.property("ADBE Marker").keys.map((k) => k.value.comment);
    check("stacked Fade In merges into the In-point marker", markers2[0] === "Bounce In + Fade In", markers2);
    check("Fade In keyed opacity 0 -> 100", Math.round(T(shape, "ADBE Opacity").valueAtTime(0)) === 0 && Math.round(T(shape, "ADBE Opacity").valueAtTime(4)) === 100);

    // Anchor grid on an animated-scale layer: refused with guidance, nothing moves.
    await page.click(".anchor-dot[aria-label='Anchor Bottom Center']");
    const refusal = await waitToast(/Anchor not moved/);
    check("anchor refuses on a Bounce-animated layer and says what to do", /Set the anchor first/.test(refusal), refusal);
    check("refused anchor left the layer untouched", JSON.stringify(T(shape, "ADBE Anchor Point").value) === JSON.stringify([0, 0]));

    // Anchor grid on a static layer: moves, layer stays put visually.
    shape.selected = false;
    text.selected = true;
    await page.click(".anchor-dot[aria-label='Anchor Bottom Center']");
    await waitToast(/Anchor moved/);
    check("anchor moved to bottom center", JSON.stringify(T(text, "ADBE Anchor Point").value) === JSON.stringify([0, 10]), T(text, "ADBE Anchor Point").value);
    check("layer did not move (position compensated)", JSON.stringify(T(text, "ADBE Position").value) === JSON.stringify([960, 810]), T(text, "ADBE Position").value);
    text.selected = false;
    shape.selected = true;

    // Easing on selected keyframes.
    const op = T(shape, "ADBE Opacity");
    op.selectedKeys = [1, 2];
    comp.selectedProperties = [op];
    await page.click(".tab[data-view=easing]");
    await page.click(".ease-btn:has-text('Easy Ease In')");
    const fb = await waitToast(/Easy Ease In/);
    check("Easy Ease In applied to selected keys", /Easy Ease In applied to 2 keyframes/.test(fb) && Math.round(op.keys[1].inEase[0].influence) === 33, fb);
    await page.click("text=Apply to selected keys");
    check("slider ease applied", /Ease In 60% . Out 30%/.test(await waitToast(/Ease In 60/)), await toast());
    comp.selectedProperties = [];

    // Text tab: Type On on the text layer.
    shape.selected = false;
    text.selected = true;
    await page.click(".tab[data-view=text]");
    await page.click(".preset:has-text('Type On')");
    await waitToast(/Type On/);
    const anims = text.property("ADBE Text Properties").property("ADBE Text Animators").children.map((a) => a.name);
    check("Type On built a named Text Animator", anims.includes("AT Type On"), anims);

    // Error path: nothing selected -> friendly message, no crash.
    text.selected = false;
    await page.click(".preset:has-text('Fade In')");
    check("no selection gives a helpful message", /Select one or more layers/.test(await waitToast(/Select/)), await toast());

    // Search runs a tool.
    shape.selected = true;
    await page.fill("#search", "center anchor");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    check("search result runs the tool", /Anchor/.test(await waitToast(/Anchor/)), await toast());

    // Namespace wiped mid-session (e.g. another tool reset the engine):
    // the next click must reload the host scripts and still work.
    delete host.context.$["com.aanders.animatortoolkit"];
    await page.fill("#search", "");
    await page.keyboard.press("Escape");
    await page.click(".tab[data-view=animate]");
    await page.click(".key-btn:has-text('Position')");
    const t1 = await waitToast(/EvalScript|Position/);
    await page.click(".key-btn:has-text('Position')");
    const t2 = await waitToast(/keyframe added/);
    check("recovers after the host namespace is wiped", /keyframe added/.test(t2) && host.ns && host.ns.ready === true, [t1, t2]);

    // Learn > About no longer has a connection test or Pro mode.
    await page.click(".tab[data-view=learn]");
    check("no Test connection, no Pro mode, no Guides", !(await page.$("text=Test connection")) && !(await page.$("#mode")) && !(await page.$(".seg-btn:has-text('Guides')")));

    // ---- 0.2 features, clicked through the real UI ----
    const bar = comp.add(ShapeLayer, "Bar", { inPoint: 0, outPoint: 8, position: [960, 900], rect: { left: 0, top: 0, width: 600, height: 80 } });
    const bar2 = comp.add(ShapeLayer, "Bar 2", { inPoint: 0, outPoint: 8, position: [960, 980], rect: { left: 0, top: 0, width: 600, height: 80 } });
    comp.layerList.forEach((l) => { l.selected = false; });
    bar.selected = bar2.selected = true;
    await page.click(".tab[data-view=animate]");
    check("Delete Keys button removed", !(await page.$(".key-row-edit :text('Delete')")));
    check("no seconds switch (frames only)", !(await page.$(".stagger .seg-btn:has-text('seconds')")) && !(await page.$(".duration .seg-btn:has-text('seconds')")));
    // Slider: dragging (keyboard on the range) updates the frames box and hint.
    await page.focus(".stagger .slider-input");
    await page.keyboard.press("End");
    check("stagger slider drives the frames box", (await page.inputValue(".stagger .num-input")) === "30" && /1 s/.test(await page.textContent(".stagger .duration-hint")), await page.inputValue(".stagger .num-input"));
    await page.fill(".stagger .num-input", "15");
    await page.press(".stagger .num-input", "Tab");
    check("stagger shows the seconds equivalent", /0\.5 s/.test(await page.textContent(".stagger .duration-hint")), await page.textContent(".stagger .duration-hint"));
    await page.click(".stagger .btn-primary");
    check("stagger by 15 frames", /staggered by 15 frames/.test(await waitToast(/staggered/)) && Math.abs(bar2.inPoint - bar.inPoint - 0.5) < 1e-6, await toast());

    bar2.selected = false;
    await page.click(".tab[data-view=mask]");
    await page.click(".preset:has-text('Mask Wipe Right')");
    await waitToast(/Mask Wipe/);
    const masks = bar.property("ADBE Mask Parade");
    check("Mask tab: wipe reveal built a real mask", masks.numProperties === 1 && masks.property(1).property("ADBE Mask Shape").numKeys === 2, masks.numProperties);

    await page.click(".tab[data-view=threed]");
    await page.click(".preset:has-text('Flip In')");
    await waitToast(/Flip In/);
    check("3D tab: Flip In made the layer 3D and keyed Y Rotation", bar.threeDLayer === true && T(bar, "ADBE Rotate Y").numKeys === 2);

    const op2 = T(bar, "ADBE Opacity");
    op2.selectedKeys = [1, 2];
    comp.selectedProperties = [op2];
    await page.click(".tab[data-view=easing]");
    await page.click(".ease-btn:has-text('Bounce')");
    check("Easing: physics Bounce added settle keys", /Bounce added/.test(await waitToast(/Bounce/)) && op2.numKeys > 2, await toast());
    await page.click(".ease-btn:has-text('Smooth Stop')");
    check("Easing: curve preset applied", /Ease In 85% . Out 0%/.test(await waitToast(/Ease In 85/)), await toast());
    comp.selectedProperties = [];

    await page.click(".tab[data-view=preview]");
    await page.waitForSelector(".option", { timeout: 4000 }).catch(() => {});
    await page.click(".option:has-text('Half')");
    await waitToast(/Half/);
    check("Preview: resolution set to Half", comp.resolutionFactor[0] === 2, comp.resolutionFactor);
    await page.click(".option:has-text('16 bpc')");
    await waitToast(/16 bpc/);
    check("Preview: color depth 16 bpc", host.app.project.bitsPerChannel === 16);
    const vo = comp.add(AVLayer, "VO", { audio: true, inPoint: 0, outPoint: 8 });
    comp.layerList.forEach((l) => { l.selected = false; });
    vo.selected = true;
    await page.click(".setup:has-text('Animate Fast')");
    check("Preview: one-click Animate Fast", /Animate fast/.test(await waitToast(/Animate fast/)) && comp.resolutionFactor[0] === 2 && comp.draft3d === true, await toast());
    await page.click(".tab[data-view=audio]");
    await page.click(".tool:has-text('Audio Fade In')");
    check("Audio: fade in keyed levels", /Audio Fade In/.test(await waitToast(/Audio Fade/)) && vo.property("ADBE Audio Group").property("ADBE Audio Levels").numKeys === 2, await toast());

    vo.selected = false;
    await page.click(".tab[data-view=camera]");
    await page.click(".tool:has-text('Orbit Left')");
    check("Camera: orbit without a camera explains what to do", /Create Camera first/.test(await waitToast(/camera/i)), await toast());
    await page.click(".card .btn-primary:has-text('Create Camera')");
    await waitToast(/camera created/);
    await page.click(".tool:has-text('Orbit Left')");
    check("Camera: orbit rig created", /Orbit/.test(await waitToast(/Orbit/)) && comp.layerList.some((l) => l.name === "AT Camera Orbit"), await toast());

    await page.click(".tab[data-view=learn]");
    check("Learn: quick-fix lessons listed", /My mask path disappeared/.test(await page.textContent(".learn-body")));
    await page.click(".seg-tabs .seg-btn:has-text('Shortcuts')");
    const scText = await page.textContent(".learn-body");
    check("brand logo loads", await page.$eval(".brand-logo", (i) => i.complete && i.naturalWidth > 0) && /Amir Anderson Animator Toolkit/.test(await page.textContent(".brand-name")));
    await page.click(".linkedin");
    check("LinkedIn opens in the browser", (await page.evaluate(() => window.__opened)).includes("https://www.linkedin.com/in/amiranderson"));
    check("Learn: preview, render and guide shortcuts", /Preview with cache settings/.test(scText) && /Add to Render Queue/.test(scText) && /Show\/hide guides/.test(scText), null);
    await page.click(".seg-tabs .seg-btn:has-text('Lessons')");

    // Preset duration in frames: 45 frames (1.5 s at 30 fps) on a Fade In.
    const dl = comp.add(ShapeLayer, "Dur", { inPoint: 0, outPoint: 8, position: [960, 540] });
    comp.layerList.forEach((l) => { l.selected = false; });
    dl.selected = true;
    await page.click(".tab[data-view=animate]");
    await page.fill(".motion-controls .duration .num-input", "45");
    await page.press(".motion-controls .duration .num-input", "Tab");
    await page.click(".seg-phase .seg-btn:has-text('Entrance')");
    await page.click(".preset:has-text('Fade In')");
    await waitToast(/Fade In/);
    const dop = T(dl, "ADBE Opacity");
    check("Duration in frames drives presets", dop.numKeys === 2 && Math.abs(dop.keys[1].time - dop.keys[0].time - 1.5) < 1e-6, dop.keys.map((k) => k.time));

    // Quick actions include Rasterize.
    await page.click(".tab[data-view=home]");
    await page.click(".quick-grid .icon-tool:has-text('Rasterize')");
    check("Quick actions: Rasterize", /Continuous Rasterize on/.test(await waitToast(/Rasterize/)) && dl.collapseTransformation === true, await toast());

    // Grab Still from Quick actions: pop-up with the real image and its path.
    await page.click(".tab[data-view=home]");
    await page.click(".quick-grid .icon-tool:has-text('Grab Still')");
    await page.waitForSelector(".sheet .still-img", { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => { const i = document.querySelector(".sheet .still-img"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 5000 }).catch(() => {});
    const stillOk = await page.evaluate(() => { const i = document.querySelector(".sheet .still-img"); return !!(i && i.naturalWidth > 0); });
    const stillPath = (await page.textContent(".sheet .still-path").catch(() => "")) || "";
    check("Quick Grab Still opens a pop-up showing the still", stillOk && /Animator Toolkit Stills/.test(stillPath), stillPath);
    await page.click(".sheet .btn-primary:has-text('Open folder')");
    await page.waitForTimeout(300);
    check("pop-up 'Open folder' reveals the stills folder", /Animator Toolkit Stills/.test(host.app.revealed || ""), host.app.revealed);
    await page.click(".sheet .btn:has-text('Capture settings')");
    await page.waitForTimeout(300);
    check("Capture tab lists the quick-action still", /Lower Third_f/.test(await page.textContent(".capture-list")), await page.textContent(".capture-list"));
    await page.click(".btn-hero:has-text('Grab Still')");
    await page.waitForSelector(".sheet .still-img", { timeout: 5000 }).catch(() => {});
    check("Capture tab Grab Still shows the same pop-up", !!(await page.$(".sheet .still-name")) && comp.savedFrames === 2, comp.savedFrames);
    await page.click(".sheet-close");

    // Favorites persist a click and run from the Favorites tab.
    await page.fill("#search", "");
    await page.keyboard.press("Escape");
    await page.click(".tab[data-view=camera]");
    await page.click(".move .fav-btn >> nth=0", { force: true });
    await page.click(".tab[data-view=favorites]");
    check("favorite card rendered", (await page.$$(".fav-card")).length === 1);

    // Preview: Auto resolution matches the viewer zoom (50% -> Half); the
    // Preview panel settings (Skip, Frame Rate, Cache...) are listed.
    await page.click(".tab[data-view=preview]");
    await page.waitForSelector(".option:has-text('Auto')");
    await page.click(".option:has-text('Auto')");
    check("Auto resolution matches 50% zoom (Half)", /Auto: Half/.test(await waitToast(/Auto:/)) && comp.resolutionFactor[0] === 2, await toast());
    const pp = await page.textContent(".pp-table");
    check("Preview panel settings listed (Skip, Frame Rate, Cache)", /Skip/.test(pp) && /Frame Rate/.test(pp) && /Cache Before Playback/.test(pp), null);

    // Home: quick actions can be removed, added back and reset.
    await page.click(".tab[data-view=home]");
    const nQuick = (await page.$$(".quick-tile")).length;
    await page.click(".quick-edit");
    await page.click(".quick-tile:has-text('Marker')");
    check("quick action removed", (await page.$$(".quick-tile")).length === nQuick - 1 && !(await page.$(".quick-tile:has-text('Marker')")));
    await page.click(".quick-add");
    await page.fill(".picker-search", "bounce in");
    await page.click(".picker-row:has-text('Bounce In') >> nth=0");
    await page.click(".sheet-close");
    await page.click(".quick-edit");
    check("quick action added from the picker", !!(await page.$(".quick-tile:has-text('Bounce In')")) && !(await page.$(".quick-tile.editing")));
    await page.click(".tab[data-view=animate]");
    await page.click(".tab[data-view=home]");
    check("quick actions remembered", !!(await page.$(".quick-tile:has-text('Bounce In')")) && !(await page.$(".quick-tile:has-text('Marker')")));
    await page.click(".quick-edit");
    await page.click(".quick-reset");
    await page.click(".quick-edit");
    check("quick actions reset to defaults", (await page.$$(".quick-tile")).length === nQuick && !!(await page.$(".quick-tile:has-text('Marker')")));

    // Essential skills: collapse, hide, and bring back from Learn > About.
    await page.click(".sec-essentials .collapse-btn");
    check("essential skills collapse", await page.$eval(".sec-essentials .essential-row", (e) => e.offsetParent === null));
    await page.click(".sec-essentials .collapse-btn");
    await page.click(".essentials-hide");
    check("essential skills hidden from Home", !(await page.$(".sec-essentials")));
    await page.click(".tab[data-view=learn]");
    await page.click(".about .toggle:has-text('Show 5 essential skills')");
    await page.click(".tab[data-view=home]");
    check("essential skills restored from Learn > About", !!(await page.$(".sec-essentials .essential")));

    check("undo groups all closed", host.undo.open === 0, host.undo.open);
    // 3 presets, 1 refused anchor, 1 anchor, 2 easing, Type On, search anchor = 9,
    // plus 1-2 Position keys after the namespace wipe: 1 if that first click hit
    // the wiped host, 2 if background polling had already reconnected. The
    // no-selection click fails before opening a group.
    // 0.2 clicks: stagger, mask wipe, flip, bounce, curve, 16 bpc, audio fade,
    // create camera, orbit = 9 more (resolution is a viewer setting, not an undo step).
    const keyGroups = host.undo.groups.filter((g) => /Add Keyframes/.test(g)).length;
    check("every mutating click was exactly one undo group",
        host.undo.groups.length - keyGroups === 22 && keyGroups >= 1 && keyGroups <= 2, host.undo.groups);
    if (process.env.E2E_DROP) {
        const fallbacks = scripts.filter((x) => /\.lastResponse$/.test(x)).length;
        check("empty replies recovered from the stored reply (" + fallbacks + " times)", fallbacks > 20, fallbacks);
    }
    // Only the deliberate failures may show error toasts.
    const expected = /Anchor not moved|Select one or more layers|Create Camera first|couldn't run the command/;
    const bad = toasts.filter((t) => t.kind === "error" && !expected.test(t.text));
    check("toast recorder saw the run (" + toasts.length + " toasts, " + toasts.filter((t) => t.kind === "error").length + " expected errors)", toasts.length > 20);
    check("no error toasts on successful clicks (no 'empty reply')", bad.length === 0, bad);
    check("no page errors", errors.length === 0, errors);

    await browser.close();
    const failed = results.filter((r) => !r.ok).length;
    console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
    fs.rmSync(base, { recursive: true, force: true });
    process.exit(failed ? 1 : 0);
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
