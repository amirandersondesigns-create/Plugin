"use strict";
// Guards the CEP manifest against the mistakes that make After Effects skip
// the panel without any message (visible only in ~/Library/Logs/CSXS/CEP12-AEFT.log).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const xml = fs.readFileSync(path.join(ROOT, "CSXS", "manifest.xml"), "utf8");
const rootTag = xml.match(/<ExtensionManifest\b[^>]*>/)[0];
const attr = (tag, name) => (tag.match(new RegExp("\\s" + name + '="([^"]*)"')) || [])[1];

test("root element has no default namespace (else CEP reads Version as '')", () => {
    // AE 2026 logged: Unsupported Manifest version '' ... when the root
    // declared xmlns="http://ns.adobe.com/extension/1.0".
    assert.doesNotMatch(rootTag, /\sxmlns\s*=/);
    assert.equal(xml.charCodeAt(0), "<".charCodeAt(0), "no BOM or leading whitespace");
});

test("manifest version, bundle id and versions are set and consistent", () => {
    assert.match(attr(rootTag, "Version"), /^\d+\.\d+$/);
    const id = attr(rootTag, "ExtensionBundleId");
    assert.equal(id, "com.cnn.animatortoolkit");
    const pkg = require(path.join(ROOT, "package.json"));
    assert.equal(attr(rootTag, "ExtensionBundleVersion"), pkg.version);
    const ext = xml.match(/<ExtensionList>\s*<Extension\b[^>]*>/)[0];
    assert.equal(attr(ext, "Version"), pkg.version);
    assert.ok(xml.includes('<Extension Id="' + attr(ext, "Id") + '">'), "DispatchInfo extension id matches ExtensionList");
    assert.ok(fs.readFileSync(path.join(ROOT, ".debug"), "utf8").includes(attr(ext, "Id")));
    assert.ok(fs.readFileSync(path.join(ROOT, "install", "install-mac.command"), "utf8").includes(id));
    assert.ok(fs.readFileSync(path.join(ROOT, "client", "js", "views", "learn.js"), "utf8").includes('VERSION = "' + pkg.version + '"'));
});

test("targets After Effects and every referenced file exists", () => {
    assert.match(xml, /<Host Name="AEFT" Version="\[\d+\.\d+,\d+\.\d+\]"\s*\/>/);
    for (const m of xml.matchAll(/>\.\/([^<]+)</g)) {
        assert.ok(fs.existsSync(path.join(ROOT, m[1])), "missing " + m[1]);
    }
    // Node is needed for on-disk settings/favorites.
    assert.match(xml, /--enable-nodejs/);
    assert.match(xml, /--mixed-context/);
});

// Rules from Adobe's ExtensionManifest XSD that CEP enforces when parsing.
const MANIFESTS = {
    "Animator Toolkit": xml,
    "Motion Spell Checker": fs.readFileSync(path.join(ROOT, "..", "CSXS", "manifest.xml"), "utf8")
};
for (const [name, m] of Object.entries(MANIFESTS)) {
    test(name + ": schema rules (no default xmlns, Geometry order, icon types)", () => {
        assert.doesNotMatch(m.match(/<ExtensionManifest\b[^>]*>/)[0], /\sxmlns\s*=/);
        const geo = m.match(/<Geometry>([\s\S]*?)<\/Geometry>/)[1];
        const order = ["ScreenPercentage", "Size", "MaxSize", "MinSize"].filter((t) => geo.includes("<" + t + ">"));
        const seen = [...geo.matchAll(/<(ScreenPercentage|Size|MaxSize|MinSize)>/g)].map((x) => x[1]);
        assert.deepEqual(seen, order, "Geometry children must be in XSD order");
        for (const t of m.matchAll(/<Icon Type="([^"]+)"/g)) {
            assert.ok(["Normal", "Disabled", "RollOver", "DarkNormal", "DarkRollOver"].includes(t[1]), "invalid icon type " + t[1]);
        }
    });
}
