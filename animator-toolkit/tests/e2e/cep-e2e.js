"use strict";
// End-to-end check of the real CEP code path, without After Effects:
//
//   real panel (Chromium) -> CSInterface -> window.__adobe_cep__.evalScript
//   -> mock host: host/index.jsx, AT_boot(<extension root>) loading modules
//      with $.evalFile -> AT.dispatch -> mock AE DOM
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
const { createHost, CompItem, TextLayer, ShapeLayer } = require("../host/mock-ae");

const SRC = path.join(__dirname, "..", "..");
const base = fs.mkdtempSync(path.join(os.tmpdir(), "at-e2e-"));
const EXT = path.join(base, "Application Support", "Adobe", "CEP", "extensions", "com.cnn.animatortoolkit");
fs.mkdirSync(EXT, { recursive: true });
for (const d of ["CSXS", "client", "host"]) fs.cpSync(path.join(SRC, d), path.join(EXT, d), { recursive: true });

const host = createHost({ boot: "cep" });
const comp = new CompItem({ name: "Lower Third" });
host.app.project.activeItem = comp;
const shape = comp.add(ShapeLayer, "Logo Bug", { inPoint: 0, outPoint: 8, position: [960, 540], rect: { left: -50, top: -50, width: 100, height: 100 } });
const text = comp.add(TextLayer, "Headline", { inPoint: 0, outPoint: 8, position: [960, 800], rect: { left: -200, top: -40, width: 400, height: 50 } });
shape.selected = true;
const T = (l, k) => l.property("ADBE Transform Group").property(k);

const results = [];
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
    await page.addInitScript(({ ext }) => {
        window.__adobe_cep__ = {
            evalScript(script, cb) { window.__cepEval(script).then(cb); },
            getSystemPath(type) { return type === "extension" ? "file://" + encodeURI(ext) : "file:///tmp/userdata"; },
            getHostEnvironment() { return "{}"; }
        };
    }, { ext: EXT });

    const toast = async () => (await page.textContent("#toast")) || "";
    const waitToast = async (re) => {
        await page.waitForFunction((src) => new RegExp(src).test(document.querySelector("#toast").textContent), re.source, { timeout: 4000 }).catch(() => {});
        return toast();
    };

    await page.goto("file://" + encodeURI(path.join(EXT, "client", "index.html")));
    await page.waitForTimeout(600);

    // Boot: host modules loaded through AT_boot with the decoded path.
    check("AT_boot loaded host modules from a path with spaces", host.context.AT && host.context.AT.ready === true,
        scripts.find((s) => s.indexOf("AT_boot") >= 0));
    check("no preview banner inside the host", !(await page.$(".preview-banner")));

    // Onboarding.
    await page.click("text=Get started");
    await page.click("text=New to After Effects");
    await page.click("text=Start working");

    await page.waitForFunction(() => /Logo Bug/.test(document.querySelector("#context").textContent), null, { timeout: 4000 }).catch(() => {});
    check("context chip shows the selected layer", /Logo Bug/.test(await page.textContent("#context")), await page.textContent("#context"));

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

    // Favorites persist a click and run from the Favorites tab.
    await page.fill("#search", "");
    await page.keyboard.press("Escape");
    await page.click(".tab[data-view=camera]");
    await page.click(".move .fav-btn >> nth=0", { force: true });
    await page.click(".tab[data-view=favorites]");
    check("favorite card rendered", (await page.$$(".fav-card")).length === 1);

    check("undo groups all closed", host.undo.open === 0, host.undo.open);
    // 3 presets, 1 refused anchor, 1 anchor, 2 easing, Type On, search anchor = 9.
    // The no-selection click fails before opening a group.
    check("every mutating click was exactly one undo group", host.undo.groups.length === 9, host.undo.groups);
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
