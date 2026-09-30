// ============================================================================
// MOTION PROJECT ORGANIZER — ExtendScript engine (CEP host)
// After Effects 2022+
//
// This file contains no UI. It is the ExtendScript "back end" that the CEP
// HTML panel (client/index.html + client/js/main.js) talks to through
// CSInterface.evalScript(). Every function the panel calls is prefixed
// "cs" and returns a JSON string.
//
// What it does, in order:
//   1. ANALYZE  — reads every footage item in the open project, works out
//                 where the project folder lives on disk, and decides which
//                 subfolder (AE, AI, AUDIO, C4D, FOOTAGE, PS, SOURCE IMAGES…)
//                 each file belongs in. Nothing is changed.
//   2. PREPARE  — builds the folder structure and a list of file copies.
//   3. COPY     — copies files in small time-boxed batches so the panel can
//                 show progress. Originals are never moved or deleted.
//   4. FINISH   — relinks every footage item to its copy (keeping names,
//                 interpretation and layered PSD/AI layers intact), saves
//                 the project into the AE folder, writes a handoff report.
// ============================================================================

var APP_NAME = "Motion Project Organizer";
var VERSION = "1.2";
var AUTHOR = "Amir Anderson";

// ==================== JSON (guard for older ExtendScript engines) ==========
if (typeof JSON !== "object") { JSON = {}; }
(function () {
    function esc(s) {
        return '"' + String(s).replace(/[\\"\u0000-\u001f]/g, function (c) {
            var m = { '"': '\\"', "\\": "\\\\", "\b": "\\b", "\f": "\\f", "\n": "\\n", "\r": "\\r", "\t": "\\t" };
            return m[c] || ("\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4));
        }) + '"';
    }
    if (typeof JSON.stringify !== "function") {
        JSON.stringify = function str(v) {
            if (v === null || v === undefined) return "null";
            var t = typeof v;
            if (t === "number") return isFinite(v) ? String(v) : "null";
            if (t === "boolean") return String(v);
            if (t === "string") return esc(v);
            if (v instanceof Array) {
                var a = [];
                for (var i = 0; i < v.length; i++) a.push(str(v[i]));
                return "[" + a.join(",") + "]";
            }
            var o = [];
            for (var k in v) {
                if (!v.hasOwnProperty(k) || typeof v[k] === "function" || v[k] === undefined) continue;
                o.push(esc(k) + ":" + str(v[k]));
            }
            return "{" + o.join(",") + "}";
        };
    }
    if (typeof JSON.parse !== "function") {
        JSON.parse = function (s) { return eval("(" + s + ")"); };
    }
})();

// ==================== DEFAULT CONFIG =======================================
// Mirrors z_PROJECT_TEMPLATE. Studios can override any of this by editing
// config/organizer-config.json next to the extension (same shape) — the
// panel's "Edit folder rules" link opens it.
//
// Rules are checked top to bottom; the first rule that matches a file wins.
//   ext   — list of file extensions (lowercase, no dot)
//   kinds — any of: still, sequence, video, audio, other
//   path  — case-insensitive regex tested against the file's full path
//   name  — case-insensitive regex tested against the file name only
// A rule matches when every field it specifies matches.
var DEFAULT_CONFIG = {
    // Same layout and naming style as z_PROJECT_TEMPLATE. Everything below
    // the template's own folders is marked "added".
    folders: [
        "AE", "AE/ARCHIVE",                                   // added: old .aep versions
        "AI",
        "AUDIO", "AUDIO/SFX", "AUDIO/VO",                     // added: sound effects, voiceover
        "C4D", "C4D/MODELS", "C4D/RENDER",                    // added: MODELS (.fbx .obj …)
        "DATA",                                               // added: stats / scores CSV & JSON
        "DELIVERABLES", "DELIVERABLES/APS", "DELIVERABLES/AUDIO for ENCO",
        "DELIVERABLES/BILLBOARDS", "DELIVERABLES/EDIT", "DELIVERABLES/LOGOS",
        "DELIVERABLES/ONE SHEET", "DELIVERABLES/REVIEW",      // added: review / approval renders
        "DELIVERABLES/SCENIC", "DELIVERABLES/SOCIAL",         // added: 9x16, 1x1, 4x5 cut-downs
        "DELIVERABLES/STILLS", "DELIVERABLES/THUMBNAILS",     // added: web / social thumbnails
        "ESP_EarthStudioPro",
        "FOOTAGE", "FOOTAGE/STOCK",                           // added: licensed stock / agency video
        "PS",
        "REFERENCE",                                          // added: refs, mockups, style frames
        "SOURCE IMAGES", "SOURCE IMAGES/HEADSHOTS",           // added: player / talent headshots
        "SOURCE IMAGES/LOGOS", "SOURCE IMAGES/STOCK"          // added: team logos, stock stills
    ],
    projectFolder: "AE",
    fontsFolder: "FONTS",
    proxiesFolder: "FOOTAGE/_PROXIES",
    renderOutputFolder: "DELIVERABLES/EDIT",
    fallbackFolder: "FOOTAGE/MISC",
    reportName: "_HANDOFF_REPORT.txt",
    rules: [
        { label: "Google Earth Studio", dest: "ESP_EarthStudioPro",
          kinds: ["still", "sequence", "video"],
          path: "earth ?studio|google ?earth|[\\\\/]esp[_ \\\\/]" },
        { label: "3D render pass", dest: "C4D/RENDER", kinds: ["sequence"],
          path: "c4d|cinema ?4d|redshift|octane|arnold" },
        { label: "EXR render", dest: "C4D/RENDER", ext: ["exr", "sxr"] },
        { label: "Cinema 4D scene", dest: "C4D", ext: ["c4d"] },
        { label: "3D model", dest: "C4D/MODELS", ext: ["abc", "fbx", "obj", "glb", "gltf", "usd", "usdz", "usdc"] },
        { label: "Data", dest: "DATA", ext: ["csv", "tsv", "json", "mgjson"] },
        { label: "Voiceover", dest: "AUDIO/VO", kinds: ["audio"],
          name: "(^|[^a-z])(vo|voice ?over|narration|narr|announcer)([^a-z]|$)" },
        { label: "Sound effect", dest: "AUDIO/SFX", kinds: ["audio"],
          name: "sfx|whoosh|swoosh|impact|riser|swish|transition|crowd ?(noise|cheer)" },
        { label: "Audio", dest: "AUDIO", ext: ["wav", "mp3", "aif", "aiff", "aifc", "m4a", "aac", "ogg", "flac", "bwf"] },
        { label: "Stock video", dest: "FOOTAGE/STOCK", kinds: ["video", "sequence"],
          path: "getty|shutterstock|pond5|istock|adobestock|storyblocks|videoblocks|artgrid|envato|reuters|apimages" },
        { label: "Stock image", dest: "SOURCE IMAGES/STOCK", ext: ["png", "jpg", "jpeg", "jpe", "tif", "tiff", "webp", "heic"],
          path: "getty|shutterstock|pond5|istock|adobestock|storyblocks|alamy|envato|reuters|apimages" },
        { label: "Photoshop", dest: "PS", ext: ["psd", "psb"] },
        { label: "Illustrator / vector", dest: "AI", ext: ["ai", "eps", "svg"] },
        { label: "Reference", dest: "REFERENCE", kinds: ["still", "video"],
          name: "(^|[^a-z])(ref|reference|mockup|mock_up|sketch|storyboard|styleframe|style ?frame)([^a-z]|$)" },
        { label: "Headshot", dest: "SOURCE IMAGES/HEADSHOTS", kinds: ["still"],
          name: "headshot|head_shot|head shot|mugshot|portrait" },
        { label: "Logo", dest: "SOURCE IMAGES/LOGOS", ext: ["png", "jpg", "jpeg", "jpe", "tif", "tiff", "webp", "gif"],
          kinds: ["still"], path: "logo|wordmark|crest|badge|emblem" },
        { label: "Image sequence", dest: "FOOTAGE", kinds: ["sequence"] },
        { label: "Video", dest: "FOOTAGE", kinds: ["video"] },
        { label: "PNG", dest: "SOURCE IMAGES/PNG", ext: ["png"] },
        { label: "JPEG", dest: "SOURCE IMAGES/JPG", ext: ["jpg", "jpeg", "jpe"] },
        { label: "PDF", dest: "SOURCE IMAGES/PDF", ext: ["pdf"] },
        { label: "TIFF", dest: "SOURCE IMAGES/TIFF", ext: ["tif", "tiff"] },
        { label: "Other image", dest: "SOURCE IMAGES/OTHER", kinds: ["still"] }
    ]
};

var AUDIO_EXT = toSet(["wav", "mp3", "aif", "aiff", "aifc", "m4a", "aac", "ogg", "flac", "bwf", "wma"]);
var VIDEO_EXT = toSet(["mov", "mp4", "m4v", "mxf", "avi", "mts", "m2ts", "mpg", "mpeg", "mkv", "webm",
                       "r3d", "braw", "ari", "wmv", "flv", "3gp", "dv", "gif"]);
var IMAGE_EXT = toSet(["png", "jpg", "jpeg", "jpe", "tif", "tiff", "tga", "bmp", "exr", "sxr", "dpx", "cin",
                       "hdr", "psd", "psb", "sgi", "iff", "webp", "heic", "heif", "crw", "cr2", "nef", "dng"]);
var LAYERED_EXT = toSet(["psd", "psb", "ai", "eps", "pdf"]);
var TEMPLATE_SKIP = toSet([".ds_store", "thumbs.db", "desktop.ini", "adobe after effects auto-save"]);

// Session state shared between csPrepare / csCopyNext / csFinish.
var ORG = null;

// ==================== SMALL HELPERS ========================================
function toSet(arr) { var o = {}; for (var i = 0; i < arr.length; i++) o[arr[i]] = true; return o; }
function inArr(arr, v) { if (!arr) return false; for (var i = 0; i < arr.length; i++) if (arr[i] === v) return true; return false; }
// AE can return a fresh wrapper object for the same item, so compare by id.
function hasItem(arr, item) { for (var i = 0; i < arr.length; i++) if (arr[i].id === item.id) return true; return false; }
function isRootFolder(folder) { return folder.id === app.project.rootFolder.id; }
function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
function decodedName(f) { return File.decode(f.name); }
function extOf(name) { var m = String(name).match(/\.([^.\/\\]+)$/); return m ? m[1].toLowerCase() : ""; }
function stripExt(name) { return String(name).replace(/\.[^.\/\\]+$/, ""); }
function joinPath(a, b) { return String(a).replace(/[\\\/]+$/, "") + "/" + b; }
function normPath(p) { return String(p).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase(); }
function isInside(childPath, rootPath) {
    var c = normPath(childPath), r = normPath(rootPath) + "/";
    return c.indexOf(r) === 0;
}
function relPath(childPath, rootPath) {
    var c = String(childPath).replace(/\\/g, "/"), r = String(rootPath).replace(/\\/g, "/").replace(/\/+$/, "") + "/";
    return normPath(c).indexOf(normPath(r)) === 0 ? c.substring(r.length) : c;
}
function sanitizeName(s) {
    s = trim(String(s || "")).replace(/[\\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ");
    return s.replace(/^\.+/, "") || "Project";
}
function fileSize(f) { try { return f.exists ? Math.max(0, f.length) : 0; } catch (e) { return 0; } }
function nowStamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function fmtBytes(b) {
    if (b < 1024) return b + " B";
    var u = ["KB", "MB", "GB", "TB"], i = -1;
    do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
    return (b >= 100 ? Math.round(b) : Math.round(b * 10) / 10) + " " + u[i];
}

function ensureFolder(path) {
    var f = new Folder(path);
    if (f.exists) return true;
    if (f.parent && !f.parent.exists) ensureFolder(f.parent.fsName);
    return f.create();
}

function allItems() {
    var out = [], p = app.project;
    for (var i = 1; i <= p.numItems; i++) out.push(p.item(i));
    return out;
}

function itemById(id) {
    try { if (app.project.itemByID) return app.project.itemByID(id); } catch (e) {}
    var p = app.project;
    for (var i = 1; i <= p.numItems; i++) if (p.item(i).id === id) return p.item(i);
    return null;
}

// The panel tells us where the extension lives (csSetExtensionRoot); $.fileName
// is only a fallback because it isn't reliable across CEP versions.
var EXTENSION_ROOT = "";
function extensionRoot() {
    if (EXTENSION_ROOT) { var f = new Folder(EXTENSION_ROOT); if (f.exists) return f; }
    try { return new File($.fileName).parent.parent; } catch (e) { return null; }
}

function readText(f) {
    f.encoding = "UTF-8";
    if (!f.open("r")) return null;
    var s = f.read(); f.close();
    return s;
}

function writeText(f, s) {
    f.encoding = "UTF-8";
    f.lineFeed = ($.os.indexOf("Windows") !== -1) ? "Windows" : "Unix";
    if (!f.open("w")) return false;
    f.write(s); f.close();
    return true;
}

// Built-in rules ship inside the extension. Never edit that copy: a signed
// (.zxp) install is signature-checked every time AE loads it, so changing a
// file inside it stops the panel loading. Your editable copy lives in
// Documents/MotionProjectOrganizer/ and wins when present.
function configFile() {
    var root = extensionRoot();
    return root ? new File(joinPath(root.fsName, "config/organizer-config.json")) : null;
}

function userConfigFile() {
    return new File(joinPath(Folder.myDocuments.fsName, "MotionProjectOrganizer/organizer-config.json"));
}

function activeConfigFile() {
    var u = userConfigFile();
    if (u.exists) return u;
    var f = configFile();
    return (f && f.exists) ? f : null;
}

function loadConfig() {
    var cfg = {}, k;
    for (k in DEFAULT_CONFIG) cfg[k] = DEFAULT_CONFIG[k];
    try {
        var f = activeConfigFile();
        if (f) {
            var user = JSON.parse(readText(f));
            for (k in user) if (user.hasOwnProperty(k) && k.charAt(0) !== "_") cfg[k] = user[k];
        }
    } catch (e) { cfg._configError = "Could not read organizer-config.json (" + e.message + ") — using built-in defaults."; }
    return cfg;
}

// ==================== PROJECT FOLDER (ROOT) ================================
// Where is "the project folder"? In priority order:
//   1. A folder the user picked in the panel.
//   2. The .aep is saved inside an "AE" folder → its parent is the root
//      (this is how z_PROJECT_TEMPLATE is laid out).
//   3. The .aep's folder already contains two or more of the template
//      folders → that folder is the root.
//   4. Otherwise a new folder named after the project is created next to
//      the .aep, so we never scatter folders across someone's Desktop.
function countTemplateFolders(folder, cfg) {
    var n = 0;
    for (var i = 0; i < cfg.folders.length; i++) {
        if (cfg.folders[i].indexOf("/") !== -1) continue;
        if (new Folder(joinPath(folder.fsName, cfg.folders[i])).exists) n++;
    }
    return n;
}

function defaultProjectName() {
    var f = app.project.file;
    if (!f) return "Project";
    // "20231219_AC360_Map_v03.aep" → "20231219_AC360_Map"
    return sanitizeName(stripExt(decodedName(f)).replace(/[_\-\s]*v\d+$/i, ""));
}

function resolveRoot(p, cfg) {
    var aep = app.project.file;
    var aepFolder = aep.parent;
    var projName = sanitizeName(p.projectName || defaultProjectName());
    var root, mode, reason;

    if (p.rootPath) {
        root = new Folder(p.rootPath);
        mode = "chosen";
        reason = "Using the folder you chose.";
    } else if (decodedName(aepFolder).toUpperCase() === String(cfg.projectFolder).toUpperCase() && aepFolder.parent) {
        root = aepFolder.parent;
        mode = "existing";
        reason = "Project is saved inside an " + cfg.projectFolder + " folder — organizing around it.";
    } else if (countTemplateFolders(aepFolder, cfg) >= 2) {
        root = aepFolder;
        mode = "existing";
        reason = "This folder already has the project structure — filling it in.";
    } else {
        root = new Folder(joinPath(aepFolder.fsName, projName));
        mode = root.exists ? "existing" : "new";
        reason = root.exists
            ? "A folder with this name already exists next to your project — it will be filled in."
            : "A new project folder will be created next to your saved project.";
    }

    var aepDir = joinPath(root.fsName, cfg.projectFolder);
    var aepDest = new File(joinPath(aepDir, decodedName(aep)));
    var sameFile = normPath(aepDest.fsName) === normPath(aep.fsName);
    if (!sameFile && aepDest.exists) {
        var base = stripExt(decodedName(aep)), ext = "." + extOf(decodedName(aep)), n = 2;
        while (aepDest.exists) { aepDest = new File(joinPath(aepDir, base + "_" + n + ext)); n++; }
    }

    return {
        folder: root,
        path: root.fsName,
        exists: root.exists,
        mode: mode,
        reason: reason,
        projectName: projName,
        aepDest: aepDest.fsName,
        aepDestRel: relPath(aepDest.fsName, root.fsName),
        aepAlreadyInPlace: sameFile
    };
}

// ==================== CLASSIFICATION =======================================
function kindOf(item, ext) {
    if (AUDIO_EXT[ext]) return "audio";
    if (VIDEO_EXT[ext]) return "video";
    var still = false;
    try { still = item.mainSource.isStill; } catch (e) {}
    if (still) return "still";
    if (IMAGE_EXT[ext]) return "sequence";
    try {
        if (item.hasVideo) return "video";
        if (item.hasAudio) return "audio";
    } catch (e2) {}
    return "other";
}

function classify(cfg, path, ext, kind) {
    for (var i = 0; i < cfg.rules.length; i++) {
        var r = cfg.rules[i];
        if (r.ext && !inArr(r.ext, ext)) continue;
        if (r.kinds && !inArr(r.kinds, kind)) continue;
        if (r.path) {
            var re;
            try { re = new RegExp(r.path, "i"); } catch (e) { continue; }
            if (!re.test(String(path).replace(/\\/g, "/"))) continue;
        }
        if (r.name) {
            var rn;
            try { rn = new RegExp(r.name, "i"); } catch (e2) { continue; }
            if (!rn.test(String(path).replace(/\\/g, "/").replace(/^.*\//, ""))) continue;
        }
        return { dest: r.dest, label: r.label || r.dest };
    }
    return { dest: cfg.fallbackFolder, label: "Other" };
}

// Image sequences: find every frame that belongs with the first one.
function sequenceFrames(first) {
    var nm = decodedName(first);
    var m = nm.match(/^(.*?)(\d+)(\.[^.]+)$/);
    if (!m || !first.parent || !first.parent.exists) return { frames: first.exists ? [first] : [], name: stripExt(nm) };
    var prefix = m[1], ext = m[3].toLowerCase();
    var files = first.parent.getFiles(function (f) {
        if (!(f instanceof File)) return false;
        var mm = decodedName(f).match(/^(.*?)(\d+)(\.[^.]+)$/);
        return !!mm && mm[1] === prefix && mm[3].toLowerCase() === ext;
    });
    files.sort(function (a, b) { var x = decodedName(a), y = decodedName(b); return x < y ? -1 : (x > y ? 1 : 0); });
    var seqName = prefix.replace(/[\s_\-.]+$/, "");
    if (!seqName) seqName = decodedName(first.parent);
    return { frames: files, name: sanitizeName(seqName) };
}

function isLayeredItem(item, ext) {
    // AE names layers imported from a layered PSD/AI "LayerName/file.psd".
    return !!LAYERED_EXT[ext] && String(item.name).indexOf("/") > 0;
}

// ==================== ANALYSIS =============================================
// Builds the full plan. Pure read — the project and disk are not touched.
function buildPlan(p) {
    var proj = app.project;
    var cfg = loadConfig();
    var root = resolveRoot(p, cfg);
    var sources = [], byKey = {};
    var placeholders = [];
    var items = allItems();

    function addRef(item, file, role) {
        var fsPath = file.fsName;
        var name = decodedName(file);
        var ext = extOf(name);
        var kind = role === "proxy"
            ? (IMAGE_EXT[ext] && !(item.proxySource && item.proxySource.isStill) ? "sequence" : kindOf(item, ext))
            : kindOf(item, ext);
        var key = normPath(fsPath);
        var src = byKey[key];
        if (!src) {
            var missing = !file.exists || (role === "main" && item.footageMissing);
            var cls = role === "proxy" ? { dest: cfg.proxiesFolder, label: "Proxy" } : classify(cfg, fsPath, ext, kind);
            src = {
                key: key, name: name, ext: ext, kind: kind, srcPath: fsPath,
                dest: cls.dest, rule: cls.label,
                status: missing ? "missing" : (isInside(fsPath, root.path) ? "inplace" : "copy"),
                bytes: 0, frames: 1, refs: [], used: false
            };
            if (kind === "sequence" && !missing) {
                var seq = sequenceFrames(file);
                src.seqName = seq.name;
                src.framePaths = [];
                for (var i = 0; i < seq.frames.length; i++) { src.framePaths.push(seq.frames[i].fsName); src.bytes += fileSize(seq.frames[i]); }
                src.frames = seq.frames.length;
                src.name = seq.name + " [" + seq.frames.length + " frames]";
            } else if (!missing) {
                src.bytes = fileSize(file);
            }
            byKey[key] = src;
            sources.push(src);
        }
        var used = false;
        try { used = item.usedIn.length > 0; } catch (e) {}
        if (used || role === "proxy") src.used = true;
        src.refs.push({ id: item.id, itemName: item.name, role: role, layered: role === "main" && isLayeredItem(item, src.ext) });
    }

    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!(it instanceof FootageItem)) continue;
        var ms = it.mainSource;
        if (ms instanceof PlaceholderSource) { placeholders.push(it.name); continue; }
        if (ms instanceof FileSource && ms.file) addRef(it, ms.file, "main");
    }
    // Proxies second, so a file used as both keeps its main destination.
    for (var j = 0; j < items.length; j++) {
        var pi = items[j];
        if (!(pi instanceof FootageItem)) continue;
        try {
            if (pi.proxySource && pi.proxySource instanceof FileSource && pi.proxySource.file) addRef(pi, pi.proxySource.file, "proxy");
        } catch (e) {}
    }

    // Unused footage (only when asked to skip it).
    if (p.skipUnused) {
        for (var u = 0; u < sources.length; u++) {
            if (!sources[u].used && sources[u].status === "copy") sources[u].status = "unused";
        }
    }

    planDestinations(sources, root);

    var fonts = p.collectFonts ? analyzeFonts(root, cfg) : null;

    var stats = { items: 0, sources: sources.length, copy: 0, reuse: 0, inplace: 0, missing: 0, unused: 0,
                  placeholders: placeholders.length, bytes: 0 };
    for (var s = 0; s < sources.length; s++) {
        stats.items += sources[s].refs.length;
        stats[sources[s].status]++;
        if (sources[s].status === "copy") stats.bytes += sources[s].bytes;
    }
    if (fonts) stats.bytes += fonts.bytes;

    return { cfg: cfg, root: root, sources: sources, placeholders: placeholders, fonts: fonts, stats: stats };
}

// Decide the exact file name each copy gets, avoiding clashes with files
// already on disk and with other files headed to the same folder.
function planDestinations(sources, root) {
    var reserved = {};
    for (var i = 0; i < sources.length; i++) {
        var s = sources[i];
        if (s.status !== "copy") continue;
        var dir = joinPath(root.path, s.dest);

        if (s.kind === "sequence") {
            var base = s.seqName, name = base, n = 2;
            while (true) {
                var target = new Folder(joinPath(dir, name));
                var key = normPath(target.fsName);
                if (!reserved[key]) {
                    if (!target.exists) break;
                    if (sequenceMatches(target, s)) { s.status = "reuse"; break; }
                }
                name = base + "_" + n; n++;
            }
            reserved[normPath(joinPath(dir, name))] = true;
            s.destDir = joinPath(dir, name);
            s.destPath = joinPath(s.destDir, decodedName(new File(s.framePaths[0])));
        } else {
            var b = stripExt(s.name), e = s.ext ? "." + s.ext : "", nm = s.name, k = 2;
            while (true) {
                var t = new File(joinPath(dir, nm));
                var tk = normPath(t.fsName);
                if (!reserved[tk]) {
                    if (!t.exists) break;
                    if (fileSize(t) === s.bytes) { s.status = "reuse"; break; }
                }
                nm = b + "_" + k + e; k++;
            }
            reserved[normPath(joinPath(dir, nm))] = true;
            s.destDir = dir;
            s.destPath = joinPath(dir, nm);
        }
        s.destRel = relPath(s.destPath, root.path);
    }
}

function sequenceMatches(folder, s) {
    if (!s.framePaths || !s.framePaths.length) return false;
    for (var i = 0; i < s.framePaths.length; i++) {
        var src = new File(s.framePaths[i]);
        var dst = new File(joinPath(folder.fsName, decodedName(src)));
        if (!dst.exists || fileSize(dst) !== fileSize(src)) return false;
    }
    return true;
}

// ==================== FONTS ================================================
function analyzeFonts(root, cfg) {
    var found = {}, list = [];
    function add(ps, display, loc) {
        if (!ps || found[ps]) return;
        found[ps] = true;
        var entry = { postScript: ps, name: display || ps, location: loc || "", status: "missing", bytes: 0 };
        var lp = String(loc || "").replace(/\\/g, "/");
        if (!loc) entry.status = "missing";
        else if (/coresync|livetype/i.test(lp)) entry.status = "adobe";
        else if (/^\/System\/Library\//.test(lp)) entry.status = "system";
        else {
            var f = new File(loc);
            if (!f.exists) entry.status = "missing";
            else if (isInside(f.fsName, root.path)) entry.status = "inplace";
            else { entry.status = "copy"; entry.bytes = fileSize(f); }
        }
        list.push(entry);
    }

    var usedFonts;
    try { usedFonts = app.project.usedFonts; } catch (e) { usedFonts = undefined; }

    if (usedFonts && typeof usedFonts.length === "number") {
        for (var i = 0; i < usedFonts.length; i++) {
            try {
                var ft = usedFonts[i].font;
                add(ft.postScriptName, trim((ft.familyName || "") + " " + (ft.styleName || "")), ft.location);
            } catch (e1) {}
        }
    } else {
        // Older AE: read every text layer's current Source Text.
        var items = allItems();
        for (var c = 0; c < items.length; c++) {
            if (!(items[c] instanceof CompItem)) continue;
            for (var l = 1; l <= items[c].numLayers; l++) {
                var lyr = items[c].layer(l);
                if (!(lyr instanceof TextLayer)) continue;
                try {
                    var td = lyr.property("ADBE Text Properties").property("ADBE Text Document").value;
                    var loc = "";
                    try { loc = td.fontLocation; } catch (e2) {}
                    add(td.font, trim((td.fontFamily || "") + " " + (td.fontStyle || "")), loc);
                } catch (e3) {}
            }
        }
    }

    // Plan font copies (a font file may hold several styles — copy it once).
    var dir = joinPath(root.path, cfg.fontsFolder), seen = {}, bytes = 0;
    for (var j = 0; j < list.length; j++) {
        var en = list[j];
        if (en.status !== "copy") continue;
        var k = normPath(en.location);
        if (seen[k]) { en.status = "shared"; continue; }
        seen[k] = true;
        var fn = decodedName(new File(en.location));
        var dst = new File(joinPath(dir, fn));
        if (dst.exists && fileSize(dst) === en.bytes) { en.status = "inplace"; continue; }
        en.destPath = dst.fsName;
        bytes += en.bytes;
    }
    return { list: list, bytes: bytes };
}

// ==================== PANEL-FACING PLAN ====================================
function planForPanel(plan) {
    var out = [];
    for (var i = 0; i < plan.sources.length; i++) {
        var s = plan.sources[i];
        var layered = 0;
        for (var r = 0; r < s.refs.length; r++) if (s.refs[r].layered) layered++;
        var ids = [];
        for (var q = 0; q < s.refs.length; q++) ids.push(s.refs[q].id);
        out.push({
            name: s.name, kind: s.kind, rule: s.rule, status: s.status, dest: s.dest,
            srcPath: s.srcPath, destRel: s.destRel || (s.status === "inplace" ? relPath(s.srcPath, plan.root.path) : ""),
            bytes: s.bytes, frames: s.frames, itemCount: s.refs.length, layeredCount: layered, ids: ids
        });
    }
    return out;
}

function projectInfo() {
    var p = app.project;
    if (!p) return { open: false };
    return {
        open: true,
        saved: !!p.file,
        name: p.file ? decodedName(p.file) : "Untitled Project",
        path: p.file ? p.file.fsName : "",
        folder: p.file ? p.file.parent.fsName : "",
        defaultName: defaultProjectName(),
        numItems: p.numItems
    };
}

// ==================== COPY JOBS ============================================
function buildJobs(plan, p) {
    var jobs = [];
    for (var i = 0; i < plan.sources.length; i++) {
        var s = plan.sources[i];
        if (s.status !== "copy") continue;
        if (s.kind === "sequence") {
            for (var f = 0; f < s.framePaths.length; f++) {
                var src = new File(s.framePaths[f]);
                jobs.push({ src: src.fsName, dst: joinPath(s.destDir, decodedName(src)), bytes: fileSize(src), source: i });
            }
        } else {
            jobs.push({ src: s.srcPath, dst: s.destPath, bytes: s.bytes, source: i });
            if (s.ext === "c4d") addC4DTextures(s, jobs, i);
        }
    }
    if (plan.fonts) {
        for (var j = 0; j < plan.fonts.list.length; j++) {
            var en = plan.fonts.list[j];
            if (en.status === "copy" && en.destPath) jobs.push({ src: en.location, dst: en.destPath, bytes: en.bytes, source: -1 });
        }
    }
    if (p.templatePath) addTemplateJobs(new Folder(p.templatePath), plan.root.folder, jobs);
    return jobs;
}

// Cinema 4D scenes look for textures in a "tex" folder beside the .c4d.
function addC4DTextures(s, jobs, idx) {
    var tex = new Folder(joinPath(new File(s.srcPath).parent.fsName, "tex"));
    if (!tex.exists) return;
    var destTex = joinPath(new File(s.destPath).parent.fsName, "tex");
    (function walk(folder, dest) {
        var kids = folder.getFiles();
        for (var i = 0; i < kids.length; i++) {
            var n = decodedName(kids[i]);
            if (TEMPLATE_SKIP[n.toLowerCase()]) continue;
            if (kids[i] instanceof Folder) walk(kids[i], joinPath(dest, n));
            else {
                var d = new File(joinPath(dest, n));
                if (!d.exists) jobs.push({ src: kids[i].fsName, dst: d.fsName, bytes: fileSize(kids[i]), source: -1 });
            }
        }
    })(tex, destTex);
}

// Optional starter template (e.g. z_PROJECT_TEMPLATE): copy anything it has
// that the project folder doesn't — never overwrites.
function addTemplateJobs(tpl, root, jobs) {
    if (!tpl.exists) return;
    (function walk(folder, dest) {
        var kids = folder.getFiles();
        for (var i = 0; i < kids.length; i++) {
            var n = decodedName(kids[i]);
            if (TEMPLATE_SKIP[n.toLowerCase()]) continue;
            if (kids[i] instanceof Folder) {
                ensureFolder(joinPath(dest, n));
                walk(kids[i], joinPath(dest, n));
            } else {
                var d = new File(joinPath(dest, n));
                if (!d.exists) jobs.push({ src: kids[i].fsName, dst: d.fsName, bytes: fileSize(kids[i]), source: -1 });
            }
        }
    })(tpl, root.fsName);
}

// ==================== RELINKING ============================================
var INTERP_KEYS = ["alphaMode", "invertAlpha", "premulColor", "conformFrameRate", "fieldSeparationType",
                   "highQualityFieldSeparation", "removePulldown", "loop"];

function snapshotItem(item) {
    var s = { name: item.name, label: item.label, comment: item.comment, pixelAspect: item.pixelAspect, src: {} };
    for (var i = 0; i < INTERP_KEYS.length; i++) {
        try { s.src[INTERP_KEYS[i]] = item.mainSource[INTERP_KEYS[i]]; } catch (e) {}
    }
    return s;
}

function restoreItem(item, s) {
    function set(obj, k, v) { try { if (v !== undefined && obj[k] !== v) obj[k] = v; } catch (e) {} }
    set(item, "name", s.name);
    set(item, "label", s.label);
    set(item, "comment", s.comment);
    set(item, "pixelAspect", s.pixelAspect);
    var ms = item.mainSource;
    set(ms, "alphaMode", s.src.alphaMode);
    if (s.src.alphaMode === AlphaMode.PREMULTIPLIED) set(ms, "premulColor", s.src.premulColor);
    set(ms, "invertAlpha", s.src.invertAlpha);
    if (!ms.isStill) set(ms, "conformFrameRate", s.src.conformFrameRate);
    set(ms, "fieldSeparationType", s.src.fieldSeparationType);
    if (s.src.fieldSeparationType !== FieldSeparationType.OFF) {
        set(ms, "highQualityFieldSeparation", s.src.highQualityFieldSeparation);
        set(ms, "removePulldown", s.src.removePulldown);
    }
    set(ms, "loop", s.src.loop);
}

function relinkSource(s, log) {
    var newFile = new File(s.destPath);
    if (!newFile.exists) { log.errors.push("Copy not found, left linked to original: " + s.srcPath); return; }

    var layered = [];
    for (var i = 0; i < s.refs.length; i++) {
        var ref = s.refs[i];
        var item = itemById(ref.id);
        if (!item) continue;
        try {
            if (ref.role === "proxy") {
                var useProxy = item.useProxy;
                if (s.kind === "sequence") item.setProxyWithSequence(newFile, false);
                else item.setProxy(newFile);
                item.useProxy = useProxy;
            } else if (ref.layered) {
                layered.push(item);
            } else {
                var snap = snapshotItem(item);
                if (s.kind === "sequence") item.replaceWithSequence(newFile, false);
                else item.replace(newFile);
                restoreItem(item, snap);
            }
            log.relinked++;
        } catch (e) {
            log.errors.push("Could not relink \"" + ref.itemName + "\": " + e.message);
        }
    }
    if (layered.length) relinkLayered(layered, newFile, log);
}

// Layers imported from a layered PSD/AI can't use item.replace() — AE would
// swap each one for the flattened file. Instead the copied file is imported
// as a comp, each new layer footage is matched to the old one by layer name
// and size, every comp layer using the old footage is swapped over with
// replaceSource(), and the temporary import is cleaned away.
function relinkLayered(oldItems, newFile, log) {
    var pending = oldItems.slice(0);
    var modes = [ImportAsType.COMP, ImportAsType.COMP_CROPPED_LAYERS];

    for (var m = 0; m < modes.length && pending.length; m++) {
        var io;
        try { io = new ImportOptions(newFile); if (!io.canImportAs(modes[m])) continue; io.importAs = modes[m]; }
        catch (e) { continue; }

        var imported;
        try { imported = app.project.importFile(io); } catch (e2) { continue; }
        if (!(imported instanceof CompItem)) { try { imported.remove(); } catch (e3) {} continue; }

        var comps = [], feet = [], folders = [];
        collectImported(imported, comps, feet, folders);
        var usedNew = {};

        var still = [];
        for (var i = 0; i < pending.length; i++) {
            var old = pending[i];
            var layerPart = old.name.substring(0, old.name.lastIndexOf("/"));
            var match = null;
            for (var j = 0; j < feet.length; j++) {
                var f = feet[j];
                if (usedNew[f.id]) continue;
                var fPart = f.name.substring(0, f.name.lastIndexOf("/"));
                if (fPart === layerPart && f.width === old.width && f.height === old.height) { match = f; break; }
            }
            if (!match) { still.push(old); continue; }
            usedNew[match.id] = true;
            swapFootage(old, match);
        }
        pending = still;

        for (var c = 0; c < comps.length; c++) { try { comps[c].remove(); } catch (e4) {} }
        for (var k = 0; k < feet.length; k++) {
            if (usedNew[feet[k].id]) continue;
            try { if (feet[k].usedIn.length === 0) feet[k].remove(); } catch (e5) {}
        }
        for (var d = 0; d < folders.length; d++) { try { if (folders[d].numItems === 0) folders[d].remove(); } catch (e6) {} }
    }

    // Anything left couldn't be matched layer-for-layer: relink it the plain
    // way so nothing is left pointing outside the project folder, but flag it.
    for (var p = 0; p < pending.length; p++) {
        try {
            var snap = snapshotItem(pending[p]);
            pending[p].replace(newFile);
            restoreItem(pending[p], snap);
            log.warnings.push("\"" + snap.name + "\" was relinked as the flattened file — check it.");
        } catch (e7) {
            log.errors.push("Could not relink layer \"" + pending[p].name + "\": " + e7.message);
        }
    }
}

function collectImported(comp, comps, feet, folders) {
    comps.push(comp);
    for (var i = 1; i <= comp.numLayers; i++) {
        var src = comp.layer(i).source;
        if (!src) continue;
        if (src instanceof CompItem) { if (!hasItem(comps, src)) collectImported(src, comps, feet, folders); }
        else if (src instanceof FootageItem && !hasItem(feet, src)) {
            feet.push(src);
            if (!isRootFolder(src.parentFolder) && !hasItem(folders, src.parentFolder)) folders.push(src.parentFolder);
        }
    }
}

function swapFootage(oldItem, newItem) {
    restoreItem(newItem, snapshotItem(oldItem));
    newItem.parentFolder = oldItem.parentFolder;
    var comps = oldItem.usedIn;
    for (var c = 0; c < comps.length; c++) {
        for (var l = 1; l <= comps[c].numLayers; l++) {
            var lyr = comps[c].layer(l);
            if (lyr.source && lyr.source.id === oldItem.id) lyr.replaceSource(newItem, false);
        }
    }
    oldItem.remove();
}

// ==================== PROJECT-PANEL TIDY / RENDER QUEUE ====================
function tidyProjectPanel(plan) {
    var root = app.project.rootFolder, bins = {}, moved = 0;
    function bin(name) {
        if (bins[name]) return bins[name];
        for (var i = 1; i <= root.numItems; i++) {
            var it = root.item(i);
            if (it instanceof FolderItem && it.name === name) { bins[name] = it; return it; }
        }
        bins[name] = app.project.items.addFolder(name);
        return bins[name];
    }
    for (var s = 0; s < plan.sources.length; s++) {
        var src = plan.sources[s];
        var top = String(src.dest).split("/")[0];
        for (var r = 0; r < src.refs.length; r++) {
            if (src.refs[r].role !== "main") continue;
            var item = itemById(src.refs[r].id);
            if (item && isRootFolder(item.parentFolder)) { item.parentFolder = bin(top); moved++; }
        }
    }
    return moved;
}

function pointRenderQueue(plan) {
    var rq = app.project.renderQueue, dir = joinPath(plan.root.path, plan.cfg.renderOutputFolder), n = 0;
    for (var i = 1; i <= rq.numItems; i++) {
        var it = rq.item(i);
        if (it.status !== RQItemStatus.QUEUED && it.status !== RQItemStatus.UNQUEUED) continue;
        for (var o = 1; o <= it.numOutputModules; o++) {
            try {
                var om = it.outputModule(o);
                if (!om.file) continue;
                om.file = new File(joinPath(dir, decodedName(om.file)));
                n++;
            } catch (e) {}
        }
    }
    return n;
}

// ==================== HANDOFF REPORT =======================================
function writeReport(plan, log, p) {
    var L = [], s, i;
    var who = $.getenv("USER") || $.getenv("USERNAME") || "";
    L.push("PROJECT HANDOFF REPORT");
    L.push("======================");
    L.push("Project:     " + decodedName(app.project.file));
    L.push("Saved at:    " + relPath(app.project.file.fsName, plan.root.path));
    L.push("Organized:   " + nowStamp() + (who ? "  by " + who : ""));
    L.push("App:         After Effects " + app.version);
    L.push("Tool:        " + APP_NAME + " v" + VERSION);
    L.push("");
    L.push("To open: keep this whole folder together and open the .aep inside " + plan.cfg.projectFolder + "/.");
    L.push("");

    var missing = [], groups = {}, order = [];
    for (i = 0; i < plan.sources.length; i++) {
        s = plan.sources[i];
        if (s.status === "missing") { missing.push(s); continue; }
        if (!groups[s.dest]) { groups[s.dest] = []; order.push(s.dest); }
        groups[s.dest].push(s);
    }

    L.push("NEEDS ATTENTION");
    L.push("---------------");
    if (!missing.length && !log.errors.length && !log.warnings.length && !plan.placeholders.length) L.push("Nothing — every linked file is inside this folder.");
    for (i = 0; i < missing.length; i++) L.push("MISSING   " + missing[i].srcPath + "  (used by " + missing[i].refs.length + " item(s))");
    for (i = 0; i < plan.placeholders.length; i++) L.push("PLACEHOLDER  " + plan.placeholders[i]);
    for (i = 0; i < log.errors.length; i++) L.push("ERROR     " + log.errors[i]);
    for (i = 0; i < log.warnings.length; i++) L.push("CHECK     " + log.warnings[i]);
    L.push("");

    L.push("FILES BY FOLDER");
    L.push("---------------");
    order.sort();
    for (var g = 0; g < order.length; g++) {
        var list = groups[order[g]];
        L.push(order[g] + "/");
        for (i = 0; i < list.length; i++) {
            s = list[i];
            var where = s.status === "inplace" ? relPath(s.srcPath, plan.root.path)
                      : (s.destRel || s.srcPath);
            var tag = { copy: "collected", reuse: "already there", inplace: "in place", unused: "SKIPPED (unused)" }[s.status] || s.status;
            L.push("    " + where + "   [" + tag + (s.status === "copy" || s.status === "reuse" ? " from " + s.srcPath : "") + "]");
        }
    }
    L.push("");

    if (plan.fonts) {
        L.push("FONTS");
        L.push("-----");
        if (!plan.fonts.list.length) L.push("No fonts used.");
        for (i = 0; i < plan.fonts.list.length; i++) {
            var f = plan.fonts.list[i];
            var note = {
                copy: "copied to " + plan.cfg.fontsFolder + "/", shared: "copied (same file as another style)",
                inplace: "already in " + plan.cfg.fontsFolder + "/", adobe: "Adobe Fonts — activate it in Creative Cloud",
                system: "system font", missing: "NOT INSTALLED / location unknown"
            }[f.status] || f.status;
            L.push("    " + f.name + " (" + f.postScript + ") — " + note);
        }
        L.push("    Check font licences before sending fonts outside your organization.");
        L.push("");
    }

    if (p.notes) { L.push("NOTES"); L.push("-----"); L.push(p.notes); L.push(""); }

    var rf = new File(joinPath(plan.root.path, plan.cfg.reportName));
    writeText(rf, L.join("\n"));
    return rf.fsName;
}

// ============================================================================
// CEP-FACING API — every function below is called from client/js/main.js via
// CSInterface.evalScript() and returns a JSON string.
// ============================================================================

function ok(o) { o.ok = true; return JSON.stringify(o); }
function fail(e, extra) {
    var o = extra || {};
    o.ok = false;
    o.error = (e && e.message) ? e.message + (e.line ? " (line " + e.line + ")" : "") : String(e);
    return JSON.stringify(o);
}
function parseParams(s) { try { return s ? JSON.parse(s) : {}; } catch (e) { return {}; } }

function csSetExtensionRoot(json) {
    try {
        var p = parseParams(json);
        if (p.path) EXTENSION_ROOT = p.path;
        return ok({ path: EXTENSION_ROOT });
    } catch (e) { return fail(e); }
}

function csGetInfo() {
    try { return ok({ appName: APP_NAME, version: VERSION, author: AUTHOR, project: projectInfo() }); }
    catch (e) { return fail(e); }
}

function csSaveProjectAs() {
    try {
        app.project.saveWithDialog();
        return ok({ project: projectInfo() });
    } catch (e) { return fail(e); }
}

function csChooseFolder(json) {
    try {
        var p = parseParams(json);
        var start = p.startPath ? new Folder(p.startPath) : null;
        var f = (start && start.exists) ? start.selectDlg(p.prompt || "Choose a folder") : Folder.selectDialog(p.prompt || "Choose a folder");
        return ok({ path: f ? f.fsName : "" });
    } catch (e) { return fail(e); }
}

function csAnalyze(json) {
    try {
        var p = parseParams(json);
        if (!app.project) return fail("No project is open.", { code: "NOPROJECT" });
        if (!app.project.file) return fail("Save the project first so the organizer knows where it lives.", { code: "UNSAVED", project: projectInfo() });
        var plan = buildPlan(p);
        return ok({
            project: projectInfo(),
            root: { path: plan.root.path, exists: plan.root.exists, mode: plan.root.mode, reason: plan.root.reason,
                    projectName: plan.root.projectName, aepDestRel: plan.root.aepDestRel, aepAlreadyInPlace: plan.root.aepAlreadyInPlace },
            folders: plan.cfg.folders,
            sources: planForPanel(plan),
            placeholders: plan.placeholders,
            fonts: plan.fonts ? plan.fonts.list : null,
            stats: plan.stats,
            configWarning: plan.cfg._configError || ""
        });
    } catch (e) { return fail(e); }
}

function csPrepare(json) {
    try {
        var p = parseParams(json);
        if (!app.project || !app.project.file) return fail("Save the project first.");
        var plan = buildPlan(p);
        if (!ensureFolder(plan.root.path)) return fail("Couldn't create the project folder at " + plan.root.path + " — check you have write access.");
        for (var i = 0; i < plan.cfg.folders.length; i++) ensureFolder(joinPath(plan.root.path, plan.cfg.folders[i]));
        var jobs = buildJobs(plan, p);
        var total = 0;
        for (var j = 0; j < jobs.length; j++) total += jobs[j].bytes;
        ORG = { params: p, plan: plan, jobs: jobs, index: 0, bytesDone: 0, bytesTotal: total, failedSources: {}, errors: [] };
        return ok({ files: jobs.length, bytes: total });
    } catch (e) { return fail(e); }
}

// Copies files for ~0.4s, then hands control back so the panel can redraw.
function csCopyNext() {
    try {
        if (!ORG) return fail("Nothing to copy — run Organize again.");
        var t0 = new Date().getTime(), current = "";
        while (ORG.index < ORG.jobs.length && (new Date().getTime() - t0) < 400) {
            var job = ORG.jobs[ORG.index++];
            current = decodedName(new File(job.dst));
            var dst = new File(job.dst);
            ensureFolder(dst.parent.fsName);
            var okCopy = false;
            try { okCopy = new File(job.src).copy(dst); } catch (e) {}
            if (okCopy) ORG.bytesDone += job.bytes;
            else {
                ORG.errors.push("Copy failed: " + job.src);
                if (job.source >= 0) ORG.failedSources[job.source] = true;
            }
        }
        return ok({ done: ORG.index, files: ORG.jobs.length, bytesDone: ORG.bytesDone, bytesTotal: ORG.bytesTotal,
                    current: current, finished: ORG.index >= ORG.jobs.length });
    } catch (e) { return fail(e); }
}

function csCancel() {
    ORG = null;
    return ok({});
}

function csFinish() {
    try {
        if (!ORG) return fail("Nothing to finish — run Organize again.");
        var plan = ORG.plan, p = ORG.params;
        var log = { relinked: 0, errors: ORG.errors.slice(0), warnings: [], tidied: 0, rqPointed: 0 };

        app.beginUndoGroup("Organize Project");
        try {
            for (var i = 0; i < plan.sources.length; i++) {
                var s = plan.sources[i];
                if (s.status !== "copy" && s.status !== "reuse") continue;
                if (ORG.failedSources[i]) { log.errors.push("Left linked to original (copy failed): " + s.srcPath); continue; }
                relinkSource(s, log);
            }
            if (p.tidyPanel) log.tidied = tidyProjectPanel(plan);
            if (p.pointRenderQueue) log.rqPointed = pointRenderQueue(plan);
        } finally {
            app.endUndoGroup();
        }

        // Save into <root>/AE/.
        var dest = new File(plan.root.aepDest);
        ensureFolder(dest.parent.fsName);
        if (plan.root.aepAlreadyInPlace) app.project.save();
        else app.project.save(dest);

        var reportPath = p.writeReport ? writeReport(plan, log, p) : "";

        var missing = 0, copied = 0;
        for (var m = 0; m < plan.sources.length; m++) {
            if (plan.sources[m].status === "missing") missing++;
            if (plan.sources[m].status === "copy" && !ORG.failedSources[m]) copied++;
        }
        var result = {
            rootPath: plan.root.path,
            savedAs: app.project.file.fsName,
            savedRel: relPath(app.project.file.fsName, plan.root.path),
            reportPath: reportPath,
            copied: copied,
            filesCopied: ORG.jobs.length - ORG.errors.length,
            bytes: ORG.bytesDone,
            relinked: log.relinked,
            missing: missing,
            placeholders: plan.placeholders.length,
            tidied: log.tidied,
            rqPointed: log.rqPointed,
            errors: log.errors,
            warnings: log.warnings,
            bytesLabel: fmtBytes(ORG.bytesDone)
        };
        ORG = null;
        return ok(result);
    } catch (e) {
        ORG = null;
        return fail(e);
    }
}

function csRevealItems(json) {
    try {
        var p = parseParams(json), want = toSet(p.ids || []), n = 0;
        var items = allItems();
        for (var i = 0; i < items.length; i++) {
            var sel = !!want[items[i].id];
            if (items[i].selected !== sel) items[i].selected = sel;
            if (sel) n++;
        }
        return ok({ selected: n });
    } catch (e) { return fail(e); }
}

function csOpenPath(json) {
    try {
        var p = parseParams(json);
        var f = new Folder(p.path);
        if (!f.exists) f = new File(p.path);
        if (!f.exists) return fail("Not found: " + p.path);
        f.execute();
        return ok({});
    } catch (e) { return fail(e); }
}

function csOpenConfig() {
    try {
        // Open (creating on first use) the user's own copy — never the one
        // inside the extension, which would break a signed install.
        var u = userConfigFile();
        if (!u.exists) {
            ensureFolder(u.parent.fsName);
            var shipped = configFile();
            var okCopy = false;
            if (shipped && shipped.exists) { try { okCopy = shipped.copy(u); } catch (e1) {} }
            if (!okCopy) {
                var copy = {}; for (var k in DEFAULT_CONFIG) copy[k] = DEFAULT_CONFIG[k];
                writeText(u, JSON.stringify(copy));
            }
        }
        u.execute();
        return ok({ path: u.fsName });
    } catch (e) { return fail(e); }
}
