(function () {
    "use strict";

    var csInterface = new CSInterface();

    // ---------------------------------------------------------------
    // Host bridge
    // ---------------------------------------------------------------
    function callHost(fnName, paramsObj) {
        return new Promise(function (resolve) {
            var script = paramsObj !== undefined
                ? fnName + "(" + JSON.stringify(JSON.stringify(paramsObj)) + ")"
                : fnName + "()";
            csInterface.evalScript(script, function (result) {
                if (!result || result === "EvalScript error.") {
                    resolve({ ok: false, error: "After Effects didn't answer — close and reopen the panel (Window → Extensions)." });
                    return;
                }
                try { resolve(JSON.parse(result)); }
                catch (e) { resolve({ ok: false, error: "Bad response: " + result }); }
            });
        });
    }

    // ---------------------------------------------------------------
    // DOM shortcuts
    // ---------------------------------------------------------------
    function $(id) { return document.getElementById(id); }

    var el = {
        btnHelp: $("btnHelp"),
        stepper: $("stepper"),
        scroll: $("scroll"),

        rootModePill: $("rootModePill"),
        projName: $("projName"),
        unsavedBox: $("unsavedBox"),
        btnSaveAs: $("btnSaveAs"),
        rootBox: $("rootBox"),
        rootPathBox: $("rootPathBox"),
        rootCrumbs: $("rootCrumbs"),
        rootReason: $("rootReason"),
        nameField: $("nameField"),
        txtProjectName: $("txtProjectName"),
        btnChooseRoot: $("btnChooseRoot"),
        btnResetRoot: $("btnResetRoot"),

        btnAnalyze: $("btnAnalyze"),
        btnOrganize: $("btnOrganize"),
        organizeLabel: $("organizeLabel"),
        btnAdvancedToggle: $("btnAdvancedToggle"),
        optionsSummary: $("optionsSummary"),
        advancedPanel: $("advancedPanel"),
        cbFonts: $("cbFonts"),
        cbSkipUnused: $("cbSkipUnused"),
        cbTidy: $("cbTidy"),
        cbRenderQueue: $("cbRenderQueue"),
        cbReport: $("cbReport"),
        templatePath: $("templatePath"),
        btnChooseTemplate: $("btnChooseTemplate"),
        btnClearTemplate: $("btnClearTemplate"),
        txtNotes: $("txtNotes"),
        btnEditRules: $("btnEditRules"),

        coach: $("coach"),
        coachIcon: $("coachIcon"),
        statusText: $("statusText"),

        statCollect: $("statCollect"),
        statInPlace: $("statInPlace"),
        statMissing: $("statMissing"),
        statSize: $("statSize"),
        tileMissing: $("tileMissing"),

        progressBox: $("progressBox"),
        progressFill: $("progressFill"),
        progressText: $("progressText"),
        progressPct: $("progressPct"),
        progressSub: $("progressSub"),
        btnCancel: $("btnCancel"),

        resultBox: $("resultBox"),
        resultTitle: $("resultTitle"),
        resultSub: $("resultSub"),
        resultBody: $("resultBody"),
        btnOpenFolder: $("btnOpenFolder"),
        btnOpenReport: $("btnOpenReport"),

        planTitle: $("planTitle"),
        planHint: $("planHint"),
        btnToggleAll: $("btnToggleAll"),
        emptyState: $("emptyState"),
        emptyText: $("emptyText"),
        planList: $("planList"),

        toast: $("toast")
    };

    var EMPTY_HTML = el.emptyText.innerHTML;

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------
    var state = {
        project: null,        // { open, saved, name, path, folder, defaultName }
        rootOverride: "",     // folder picked with "Change…"
        nameEdited: false,    // user typed a folder name
        analysis: null,       // last csAnalyze result
        busy: false,
        cancel: false,
        confirmMissing: false,
        collapsed: {},        // dest -> true
        selectedKey: null,
        result: null,
        templatePath: ""
    };

    // Per-machine preferences (switch states, template folder).
    var PREFS_KEY = "motionProjectOrganizer.prefs";
    function loadPrefs() {
        try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
    }
    function savePrefs() {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify({
                fonts: el.cbFonts.checked, skipUnused: el.cbSkipUnused.checked, tidy: el.cbTidy.checked,
                renderQueue: el.cbRenderQueue.checked, report: el.cbReport.checked,
                template: state.templatePath || "", optionsOpen: el.advancedPanel.classList.contains("open")
            }));
        } catch (e) {}
    }

    // ---------------------------------------------------------------
    // Formatting / motion helpers
    // ---------------------------------------------------------------
    var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function fmtBytes(b) {
        b = b || 0;
        if (b < 1024) return Math.round(b) + " B";
        var u = ["KB", "MB", "GB", "TB"], i = -1;
        do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
        return (b >= 100 ? Math.round(b) : Math.round(b * 10) / 10) + " " + u[i];
    }
    function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
    function icon(name, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : '') + '><use href="#i-' + name + '"/></svg>'; }

    // Restart a CSS animation class on an element.
    function replay(node, cls) {
        node.classList.remove(cls);
        void node.offsetWidth;
        node.classList.add(cls);
    }

    // Numbers count up to their new value instead of snapping.
    function countTo(node, to, fmt) {
        fmt = fmt || function (v) { return String(Math.round(v)); };
        var from = parseFloat(node.getAttribute("data-val") || "0") || 0;
        node.setAttribute("data-val", String(to));
        if (REDUCED || from === to) { node.textContent = fmt(to); return; }
        var t0 = null, dur = 650;
        function frame(t) {
            if (t0 === null) t0 = t;
            var k = Math.min(1, (t - t0) / dur);
            var e = 1 - Math.pow(1 - k, 3);
            node.textContent = fmt(from + (to - from) * e);
            if (k < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        replay(node.parentNode, "bump");
    }

    var toastTimer = null;
    function toast(msg) {
        el.toast.textContent = msg;
        el.toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.toast.classList.remove("show"); }, 1800);
    }

    // ---------------------------------------------------------------
    // Coach bar — what's happening and what to do next
    // ---------------------------------------------------------------
    var COACH_ICON = { hint: "bulb", scanning: "gear", success: "check", warning: "alert", error: "alert" };

    function setStatus(msg, kind) {
        kind = kind || "hint";
        if (el.statusText.textContent !== msg) {
            el.statusText.textContent = msg;
            replay(el.statusText, "swap");
        }
        el.statusText.title = msg;
        el.coach.className = "coach " + kind;
        el.coachIcon.innerHTML = icon(COACH_ICON[kind] || "bulb");
    }

    // ---------------------------------------------------------------
    // Stepper + "next action" guide
    // ---------------------------------------------------------------
    function currentStep() {
        var p = state.project;
        if (!p || !p.open || !p.saved) return 1;
        if (!state.analysis) return 2;
        if (!state.result) return 3;
        return 4; // all done
    }

    function renderStepper() {
        var step = currentStep();
        var steps = el.stepper.querySelectorAll(".step");
        var rails = el.stepper.querySelectorAll(".rail");
        for (var i = 0; i < steps.length; i++) {
            var n = i + 1;
            steps[i].classList.toggle("done", n < step);
            steps[i].classList.toggle("active", n === step);
        }
        for (var r = 0; r < rails.length; r++) rails[r].classList.toggle("done", r + 2 <= step);

        // The button you should press next gently breathes.
        el.btnAnalyze.classList.toggle("guide", step === 2 && !state.busy);
        el.btnOrganize.classList.toggle("guide", step === 3 && !state.busy && !state.confirmMissing);
        el.btnOrganize.classList.toggle("danger-confirm", state.confirmMissing);
    }

    function setBusy(busy) {
        state.busy = busy;
        [el.btnAnalyze, el.btnOrganize, el.btnChooseRoot, el.btnResetRoot, el.btnSaveAs,
         el.btnChooseTemplate, el.btnClearTemplate, el.txtProjectName].forEach(function (b) { b.disabled = busy; });
        if (!busy) el.btnOrganize.disabled = !canOrganize();
        renderStepper();
    }

    function canOrganize() {
        var a = state.analysis;
        return !!(a && a.ok && state.project && state.project.saved);
    }

    // ---------------------------------------------------------------
    // Stats
    // ---------------------------------------------------------------
    function renderStats(stats) {
        stats = stats || {};
        var missing = stats.missing || 0;
        countTo(el.statCollect, (stats.copy || 0) + (stats.reuse || 0));
        countTo(el.statInPlace, stats.inplace || 0);
        countTo(el.statMissing, missing);
        countTo(el.statSize, stats.bytes || 0, fmtBytes);
        var was = el.tileMissing.classList.contains("active");
        el.tileMissing.classList.toggle("active", missing > 0);
        if (missing > 0 && !was) setTimeout(function () { replay(el.tileMissing, "shake"); }, 350);
    }

    // ---------------------------------------------------------------
    // Project section
    // ---------------------------------------------------------------
    function renderProject() {
        var p = state.project;
        if (!p || !p.open) {
            el.projName.textContent = "No project open";
            el.unsavedBox.classList.remove("open");
            el.rootBox.style.display = "none";
            renderStepper();
            return;
        }
        el.projName.textContent = p.name;
        el.projName.title = p.path || "";
        el.unsavedBox.classList.toggle("open", !p.saved);
        el.rootBox.style.display = p.saved ? "" : "none";
        el.btnSaveAs.classList.toggle("guide", !p.saved);
        if (!state.nameEdited) el.txtProjectName.value = p.defaultName || "";
        renderStepper();
    }

    // Path as breadcrumbs: … › Desktop › NBA_Finals_Open
    function renderCrumbs(path) {
        var parts = String(path).split(/[\\\/]+/).filter(function (s) { return s; });
        var show = parts.slice(-3);
        var html = parts.length > 3 ? '<span class="crumb">…</span><span class="crumb-sep">›</span>' : "";
        show.forEach(function (seg, i) {
            var last = i === show.length - 1;
            html += '<span class="crumb' + (last ? " last" : "") + '" style="animation-delay:' + (i * 60) + 'ms">' + escapeHtml(seg) + '</span>';
            if (!last) html += '<span class="crumb-sep">›</span>';
        });
        el.rootCrumbs.innerHTML = html || "—";
    }

    var MODE_PILL = { "new": "New folder", existing: "Existing", chosen: "Chosen" };

    function renderRoot(root) {
        if (!root) {
            el.rootCrumbs.textContent = "—";
            el.rootReason.textContent = "";
            el.rootModePill.className = "pill";
            return;
        }
        var changed = el.rootPathBox.title !== root.path;
        renderCrumbs(root.path);
        el.rootPathBox.title = root.path;
        if (changed) replay(el.rootPathBox, "flash");

        var reason = root.reason;
        if (root.aepDestRel) reason += " Project saves to " + root.aepDestRel + ".";
        el.rootReason.textContent = reason;

        el.rootModePill.textContent = MODE_PILL[root.mode] || "";
        el.rootModePill.className = "pill show " + root.mode;

        // Folder name only matters when we're making a new folder next to the .aep.
        el.nameField.style.visibility = (!state.rootOverride && (root.mode === "new" || state.nameEdited)) ? "" : "hidden";
        el.btnResetRoot.style.display = state.rootOverride ? "" : "none";
    }

    function refreshProject() {
        return callHost("csGetInfo").then(function (res) {
            if (!res.ok) { setStatus(res.error || "Couldn't reach After Effects.", "error"); return; }
            var prev = state.project ? state.project.path : undefined;
            state.project = res.project;
            if (res.version) $("appByline").textContent = "v" + res.version;
            if (prev !== undefined && prev !== (res.project && res.project.path)) {
                // Different project (or first save) — start over.
                state.rootOverride = "";
                state.nameEdited = false;
                state.result = null;
                hideResult();
                clearPlan();
                setStatus("Project changed — click Analyze to check the new one.", "hint");
            }
            renderProject();
        });
    }

    el.btnSaveAs.addEventListener("click", function () {
        setBusy(true);
        callHost("csSaveProjectAs").then(function (res) {
            setBusy(false);
            if (res.ok) { state.project = res.project; renderProject(); if (res.project.saved) analyze(); }
            else setStatus(res.error || "Save cancelled.", "warning");
        });
    });

    el.btnChooseRoot.addEventListener("click", function () {
        var start = state.analysis && state.analysis.root ? state.analysis.root.path : (state.project && state.project.folder);
        callHost("csChooseFolder", { prompt: "Choose the project folder", startPath: start || "" }).then(function (res) {
            if (res.ok && res.path) { state.rootOverride = res.path; analyze(); }
        });
    });

    el.btnResetRoot.addEventListener("click", function () {
        state.rootOverride = "";
        analyze();
    });

    el.txtProjectName.addEventListener("change", function () {
        state.nameEdited = true;
        analyze();
    });

    // ---------------------------------------------------------------
    // Options
    // ---------------------------------------------------------------
    function setOptionsOpen(open) {
        el.advancedPanel.classList.toggle("open", open);
        el.btnAdvancedToggle.classList.toggle("open", open);
    }
    el.btnAdvancedToggle.addEventListener("click", function () {
        setOptionsOpen(!el.advancedPanel.classList.contains("open"));
        savePrefs();
    });

    function renderOptionsSummary() {
        var on = [];
        if (el.cbFonts.checked) on.push("Fonts");
        if (el.cbSkipUnused.checked) on.push("Skip unused");
        if (el.cbTidy.checked) on.push("Sort bins");
        if (el.cbRenderQueue.checked) on.push("Render Queue");
        if (el.cbReport.checked) on.push("Report");
        if (state.templatePath) on.push("Template");
        el.optionsSummary.textContent = on.join(" · ");
    }

    [el.cbFonts, el.cbSkipUnused].forEach(function (cb) {
        cb.addEventListener("change", function () { savePrefs(); renderOptionsSummary(); if (state.analysis) analyze(); });
    });
    [el.cbTidy, el.cbRenderQueue, el.cbReport].forEach(function (cb) {
        cb.addEventListener("change", function () { savePrefs(); renderOptionsSummary(); });
    });

    function renderTemplate() {
        var t = state.templatePath;
        el.templatePath.textContent = t ? "‎" + t + "‎" : "None — built-in folder list";
        el.templatePath.title = t || "";
        el.templatePath.classList.toggle("none", !t);
        el.btnClearTemplate.style.display = t ? "" : "none";
        renderOptionsSummary();
    }

    el.btnChooseTemplate.addEventListener("click", function () {
        callHost("csChooseFolder", { prompt: "Choose your project template folder", startPath: state.templatePath || "" }).then(function (res) {
            if (res.ok && res.path) { state.templatePath = res.path; renderTemplate(); savePrefs(); toast("Starter template set"); }
        });
    });
    el.btnClearTemplate.addEventListener("click", function () { state.templatePath = ""; renderTemplate(); savePrefs(); });

    el.btnEditRules.addEventListener("click", function () {
        callHost("csOpenConfig").then(function (res) {
            if (res.ok) setStatus("Opened your folder rules (Documents/MotionProjectOrganizer/organizer-config.json) — edit, save, then click Analyze again.", "hint");
            else setStatus(res.error || "Couldn't open the rules file.", "error");
        });
    });

    function gatherParams() {
        return {
            rootPath: state.rootOverride,
            projectName: el.txtProjectName.value,
            collectFonts: el.cbFonts.checked,
            skipUnused: el.cbSkipUnused.checked,
            tidyPanel: el.cbTidy.checked,
            pointRenderQueue: el.cbRenderQueue.checked,
            writeReport: el.cbReport.checked,
            templatePath: state.templatePath || "",
            notes: el.txtNotes.value
        };
    }

    // ---------------------------------------------------------------
    // Analyze
    // ---------------------------------------------------------------
    function resetOrganizeButton() {
        state.confirmMissing = false;
        el.organizeLabel.textContent = "Organize & Save";
    }

    function clearPlan() {
        resetOrganizeButton();
        state.analysis = null;
        state.selectedKey = null;
        el.planList.innerHTML = "";
        el.emptyText.innerHTML = EMPTY_HTML;
        el.emptyState.style.display = "";
        el.planHint.style.display = "none";
        el.btnToggleAll.style.display = "none";
        el.planTitle.textContent = "Plan";
        renderStats(null);
        renderRoot(null);
        el.btnOrganize.disabled = true;
        renderStepper();
    }

    function analyze() {
        if (state.busy) return;
        hideResult();
        state.result = null;
        setBusy(true);
        setStatus("Reading the project and checking every linked file…", "scanning");
        refreshProject().then(function () {
            if (!state.project || !state.project.open) { setBusy(false); setStatus("Open an After Effects project to get started.", "warning"); return; }
            if (!state.project.saved) {
                setBusy(false); clearPlan();
                setStatus("Step 1: save the project where the job lives — the organizer builds the folders around it.", "hint");
                return;
            }
            return callHost("csAnalyze", gatherParams()).then(function (res) {
                if (!res.ok) {
                    setBusy(false);
                    clearPlan();
                    setStatus(res.error || "Analyze failed.", res.code === "UNSAVED" ? "warning" : "error");
                    return;
                }
                state.analysis = res;
                resetOrganizeButton();
                renderRoot(res.root);
                renderStats(res.stats);
                renderPlan();
                setBusy(false);
                summarizeAnalysis();
            });
        });
    }

    function summarizeAnalysis() {
        var s = state.analysis.stats;
        var collect = s.copy + s.reuse;
        if (state.analysis.configWarning) { setStatus(state.analysis.configWarning, "warning"); return; }
        if (s.missing > 0) {
            setStatus(plural(s.missing, "file") + " can't be found (red, at the top). Relink in AE before handing off — " +
                      collect + " other file" + (collect === 1 ? " is" : "s are") + " ready to collect.", "error");
        } else if (collect === 0 && s.sources > 0) {
            setStatus("Everything is already inside the project folder. Click Organize & Save to re-save and refresh the report.", "success");
        } else if (s.sources === 0) {
            setStatus("No linked files in this project. Organize & Save will build the folders and save the project.", "hint");
        } else {
            setStatus("Looks good — nothing missing. Next: click Organize & Save to collect " + plural(collect, "file") +
                      " (" + fmtBytes(s.bytes) + ").", "hint");
        }
    }

    el.btnAnalyze.addEventListener("click", analyze);

    // ---------------------------------------------------------------
    // Plan list — grouped by destination folder
    // ---------------------------------------------------------------
    var STATUS_LABEL = { copy: "Copy", reuse: "Relink", inplace: "In place", missing: "Missing", unused: "Skip",
                         adobe: "Adobe", system: "System", shared: "Copy" };

    // One colour per top-level folder, loosely following each app's brand.
    var FOLDER_COLOR = {   // the Toolkit's muted group hues
        "AE": "#8a8fd0", "AI": "#c9974a", "PS": "#6fa8da", "AUDIO": "#6a9955", "C4D": "#5fa8a0",
        "FOOTAGE": "#c4849a", "SOURCE IMAGES": "#c9b458", "DATA": "#5fa8a0", "REFERENCE": "#9a9a9a",
        "ESP_EarthStudioPro": "#6a9955", "DELIVERABLES": "#8a8fd0", "FONTS": "#d8d8d8"
    };
    function folderColor(dest) { return FOLDER_COLOR[String(dest).split("/")[0]] || "#6fa8da"; }

    var rowIndex = 0;
    function stagger(node) {
        node.style.animationDelay = REDUCED ? "0ms" : Math.min(rowIndex++ * 22, 700) + "ms";
    }

    function renderPlan() {
        var a = state.analysis;
        rowIndex = 0;
        el.planList.innerHTML = "";
        el.emptyState.style.display = "none";
        el.planHint.style.display = "";
        el.btnToggleAll.style.display = "";

        var groups = {}, order = [];
        function group(key) {
            if (!groups[key]) { groups[key] = { key: key, rows: [], bytes: 0 }; order.push(key); }
            return groups[key];
        }

        a.sources.forEach(function (s, i) {
            var g = group(s.status === "missing" ? "__missing" : s.dest);
            g.rows.push({ key: "s" + i, src: s });
            if (s.status === "copy") g.bytes += s.bytes;
        });

        // Missing first, then in the config's folder order, then alphabetical.
        var folderIndex = {};
        (a.folders || []).forEach(function (f, i) { folderIndex[f] = i; });
        function rank(k) {
            if (k === "__missing") return -1;
            var top = k.split("/")[0];
            var idx = folderIndex[k] !== undefined ? folderIndex[k] : folderIndex[top];
            return idx !== undefined ? idx + 0.5 : 1000;
        }
        order.sort(function (x, y) { return rank(x) - rank(y) || (x < y ? -1 : x > y ? 1 : 0); });

        var total = 0;
        order.forEach(function (k) { total += groups[k].rows.length; el.planList.appendChild(renderGroup(groups[k])); });
        if (a.fonts && a.fonts.length) el.planList.appendChild(renderFontGroup(a.fonts));

        el.planTitle.textContent = "Plan · " + plural(total, "file");
        if (!total && !(a.fonts && a.fonts.length)) {
            el.emptyState.style.display = "";
            el.emptyText.innerHTML = "No linked files in this project. <b>Organize &amp; Save</b> will create the folder structure and save the project into <code>" +
                escapeHtml(a.root.aepDestRel || "AE/") + "</code>.";
            el.planHint.style.display = "none";
            el.btnToggleAll.style.display = "none";
        }
        updateToggleAllLabel();
    }

    function makeGroup(key, headHtml, rows, extraClass) {
        var wrap = document.createElement("div");
        wrap.className = "group" + (extraClass ? " " + extraClass : "") + (state.collapsed[key] ? " collapsed" : "");

        var head = document.createElement("div");
        head.className = "group-head";
        head.innerHTML = icon("caret", "caret") + headHtml;
        stagger(head);

        var body = document.createElement("div");
        body.className = "group-body";
        rows.forEach(function (r) { body.appendChild(r); });

        head.addEventListener("click", function () {
            body.style.maxHeight = body.scrollHeight + "px";
            void body.offsetWidth;
            state.collapsed[key] = !state.collapsed[key];
            wrap.classList.toggle("collapsed", state.collapsed[key]);
            updateToggleAllLabel();
        });
        wrap.appendChild(head);
        wrap.appendChild(body);
        // Measure after insertion so the collapse animation has a height to work from.
        setTimeout(function () { body.style.maxHeight = body.scrollHeight + "px"; }, 0);
        return wrap;
    }

    function renderGroup(g) {
        var isMissing = g.key === "__missing";
        var parts = g.key.split("/");
        var label = isMissing
            ? "Missing — relink before handoff"
            : escapeHtml(parts[0]) + (parts.length > 1 ? '<span class="sub"> / ' + escapeHtml(parts.slice(1).join(" / ")) + "</span>" : "");
        var headHtml =
            '<span style="--fc:' + (isMissing ? "var(--error)" : folderColor(g.key)) + ';display:flex">' +
                icon(isMissing ? "alert" : "folder", "folder-ico") + '</span>' +
            '<span class="folder-name">' + label + '</span>' +
            (g.bytes ? '<span class="meta">' + fmtBytes(g.bytes) + '</span>' : '') +
            '<span class="count-chip">' + g.rows.length + '</span>';
        return makeGroup(g.key, headHtml, g.rows.map(renderFileRow), isMissing ? "missing" : "");
    }

    function renderFileRow(r) {
        var s = r.src;
        var row = document.createElement("div");
        row.className = "file-row" + (state.selectedKey === r.key ? " selected" : "");
        stagger(row);

        var sub;
        if (s.status === "missing") sub = "Was: " + s.srcPath;
        else if (s.status === "inplace") sub = "Already at " + (s.destRel || s.srcPath);
        else if (s.status === "reuse") sub = "Same file already at " + s.destRel;
        else if (s.status === "unused") sub = "Not used in any comp · " + s.srcPath;
        else sub = "From " + s.srcPath;

        var extra = [];
        if (s.itemCount > 1) extra.push(s.itemCount + " items");
        if (s.layeredCount) extra.push("layered");

        row.title = s.status === "copy" && s.destRel ? "→ " + s.destRel + "\n" + s.srcPath : s.srcPath;
        row.innerHTML =
            '<span class="badge ' + s.status + '">' + (STATUS_LABEL[s.status] || s.status) + '</span>' +
            '<div class="file-main">' +
                '<div class="file-name">' + escapeHtml(s.name) + (extra.length ? ' <span class="extra">· ' + escapeHtml(extra.join(" · ")) + '</span>' : '') + '</div>' +
                '<div class="file-sub">‎' + escapeHtml(sub) + '‎</div>' +
            '</div>' +
            '<span class="file-size">' + (s.bytes ? fmtBytes(s.bytes) : "") + '</span>';

        row.addEventListener("click", function () {
            state.selectedKey = r.key;
            Array.prototype.forEach.call(el.planList.querySelectorAll(".file-row.selected"), function (n) { n.classList.remove("selected"); });
            row.classList.add("selected");
            callHost("csRevealItems", { ids: s.ids }).then(function (res) {
                if (res.ok) toast("Selected " + plural(res.selected, "item") + " in the Project panel");
            });
        });
        return row;
    }

    var FONT_NOTE = {
        copy: "Will be copied", shared: "Same file as another style", inplace: "Already in FONTS",
        adobe: "Adobe Fonts — activate in Creative Cloud", system: "System font — not copied",
        missing: "Not installed / location unknown"
    };

    function renderFontGroup(fonts) {
        var bytes = 0;
        fonts.forEach(function (f) { if (f.status === "copy") bytes += f.bytes; });
        var rows = fonts.map(function (f) {
            var st = f.status === "shared" ? "copy" : f.status;
            var row = document.createElement("div");
            row.className = "file-row";
            row.style.cursor = "default";
            row.title = f.location || "";
            stagger(row);
            row.innerHTML =
                '<span class="badge ' + st + '">' + (STATUS_LABEL[f.status] || f.status) + '</span>' +
                '<div class="file-main"><div class="file-name">' + escapeHtml(f.name) + '</div>' +
                '<div class="file-sub" style="direction:ltr">' + escapeHtml(FONT_NOTE[f.status] || "") + '</div></div>' +
                '<span class="file-size">' + (f.status === "copy" && f.bytes ? fmtBytes(f.bytes) : "") + '</span>';
            return row;
        });
        var headHtml =
            '<span style="--fc:' + FOLDER_COLOR.FONTS + ';display:flex">' + icon("font", "folder-ico") + '</span>' +
            '<span class="folder-name">FONTS</span>' +
            (bytes ? '<span class="meta">' + fmtBytes(bytes) + '</span>' : '') +
            '<span class="count-chip">' + fonts.length + '</span>';
        return makeGroup("__fonts", headHtml, rows, "");
    }

    function allCollapsed() {
        var groups = el.planList.querySelectorAll(".group");
        if (!groups.length) return false;
        for (var i = 0; i < groups.length; i++) if (!groups[i].classList.contains("collapsed")) return false;
        return true;
    }
    function updateToggleAllLabel() { el.btnToggleAll.textContent = allCollapsed() ? "Expand all" : "Collapse all"; }

    el.btnToggleAll.addEventListener("click", function () {
        var collapse = !allCollapsed();
        Array.prototype.forEach.call(el.planList.querySelectorAll(".group"), function (g) {
            var body = g.querySelector(".group-body");
            body.style.maxHeight = body.scrollHeight + "px";
            g.classList.toggle("collapsed", collapse);
        });
        Object.keys(state.collapsed).forEach(function (k) { delete state.collapsed[k]; });
        if (collapse) {
            (state.analysis ? state.analysis.sources : []).forEach(function (s) { state.collapsed[s.status === "missing" ? "__missing" : s.dest] = true; });
            state.collapsed.__fonts = true;
        }
        updateToggleAllLabel();
    });

    // ---------------------------------------------------------------
    // Organize: prepare → copy in batches (with progress) → finish
    // ---------------------------------------------------------------
    function showProgress(on) { el.progressBox.classList.toggle("open", on); }
    function setProgress(frac, text, sub) {
        var pct = Math.max(0, Math.min(100, frac * 100));
        el.progressFill.style.width = pct.toFixed(1) + "%";
        el.progressPct.textContent = Math.floor(pct) + "%";
        if (text !== undefined) el.progressText.textContent = text;
        el.progressSub.textContent = sub || "";
    }

    function organize() {
        if (state.busy || !canOrganize()) return;
        var s = state.analysis.stats;
        // Missing files: ask once, inline (native dialogs are unreliable in CEP panels).
        if (s.missing > 0 && !state.confirmMissing) {
            state.confirmMissing = true;
            el.organizeLabel.textContent = "Organize anyway";
            renderStepper();
            replay(el.tileMissing, "shake");
            setStatus(plural(s.missing, "missing file") + " can't be collected. Relink in AE first — or click Organize anyway " +
                      "and they'll be listed in the report.", "error");
            return;
        }
        resetOrganizeButton();
        hideResult();
        setBusy(true);
        state.cancel = false;
        el.btnCancel.disabled = false;
        showProgress(true);
        setProgress(0, "Building folders…");
        setStatus("Organizing — keep After Effects open. You can cancel until the copy finishes.", "scanning");
        el.scroll.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });

        callHost("csPrepare", gatherParams()).then(function (res) {
            if (!res.ok) return stop(res.error || "Couldn't prepare the project folder.", "error");
            if (res.files === 0) { setProgress(1, "Nothing to copy"); return finish(); }
            setProgress(0, "Copying " + plural(res.files, "file"), fmtBytes(res.bytes) + " total");
            copyLoop();
        });
    }

    function copyLoop() {
        if (state.cancel) {
            callHost("csCancel");
            return stop("Cancelled. Files already copied were left in place; the project wasn't changed.", "warning");
        }
        callHost("csCopyNext").then(function (res) {
            if (!res.ok) return stop(res.error || "Copy failed.", "error");
            var frac = res.bytesTotal ? res.bytesDone / res.bytesTotal : res.done / Math.max(1, res.files);
            setProgress(frac, res.current ? res.current : "Copying…",
                        res.done + " of " + res.files + " files · " + fmtBytes(res.bytesDone) + " of " + fmtBytes(res.bytesTotal));
            if (res.finished) finish();
            else setTimeout(copyLoop, 0);
        });
    }

    function finish() {
        el.btnCancel.disabled = true;
        setProgress(1, "Relinking and saving…", "Almost there");
        callHost("csFinish").then(function (res) {
            showProgress(false);
            if (!res.ok) { setBusy(false); setStatus(res.error || "Organize failed.", "error"); return; }
            // The project now lives at savedAs — record it so it isn't mistaken for a project switch.
            if (state.project) state.project.path = res.savedAs;
            state.nameEdited = false;
            state.rootOverride = "";
            // Re-analyze quietly so the plan shows the new, organized state, then show the result.
            callHost("csAnalyze", gatherParams()).then(function (a) {
                if (a.ok) { state.analysis = a; renderRoot(a.root); renderStats(a.stats); renderPlan(); }
                state.result = res;
                setBusy(false);
                showResult(res);
            });
        });
    }

    function stop(msg, kind) {
        showProgress(false);
        setBusy(false);
        setStatus(msg, kind);
    }

    el.btnOrganize.addEventListener("click", organize);
    el.btnCancel.addEventListener("click", function () {
        state.cancel = true;
        el.btnCancel.disabled = true;
        el.progressText.textContent = "Cancelling…";
    });

    // ---------------------------------------------------------------
    // Result
    // ---------------------------------------------------------------
    function showResult(r) {
        var problems = r.errors.length + r.missing + r.placeholders;
        var kind = r.errors.length ? "error" : (problems || r.warnings.length ? "warning" : "");
        el.resultTitle.textContent = problems ? "Organized — a few things to check" : "Organized — ready to hand off";
        el.resultSub.textContent = "Saved as " + r.savedRel;

        var lines = [];
        lines.push(plural(r.copied, "file") + " collected (" + r.bytesLabel + "), " + plural(r.relinked, "item") + " relinked.");
        if (r.tidied) lines.push(plural(r.tidied, "loose item") + " sorted into Project-panel bins.");
        if (r.rqPointed) lines.push(plural(r.rqPointed, "render output") + " pointed to DELIVERABLES.");
        if (r.missing) lines.push('<span class="err">' + plural(r.missing, "missing file") + " — listed in the report.</span>");
        if (r.placeholders) lines.push('<span class="chk">' + plural(r.placeholders, "placeholder") + " in the project.</span>");
        r.errors.forEach(function (e) { lines.push('<span class="err">' + escapeHtml(e) + "</span>"); });
        r.warnings.forEach(function (w) { lines.push('<span class="chk">' + escapeHtml(w) + "</span>"); });
        el.resultBody.innerHTML = lines.map(function (l, i) {
            return '<div class="line" style="animation-delay:' + (REDUCED ? 0 : 500 + i * 90) + 'ms">' + l + '</div>';
        }).join("");
        el.btnOpenReport.style.display = r.reportPath ? "" : "none";

        el.resultBox.className = "result" + (kind ? " " + kind : "");
        void el.resultBox.offsetWidth;
        el.resultBox.classList.add("open");
        el.btnOpenFolder.classList.add("guide");
        renderStepper();
        el.scroll.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });

        setStatus(problems ? "Done. Check the notes in the result card before you hand off."
                           : "Done — everything is inside the project folder. Open it to hand off.",
                  problems ? "warning" : "success");
    }

    function hideResult() {
        el.resultBox.classList.remove("open");
        el.btnOpenFolder.classList.remove("guide");
    }

    el.btnOpenFolder.addEventListener("click", function () {
        if (state.result) callHost("csOpenPath", { path: state.result.rootPath });
        el.btnOpenFolder.classList.remove("guide");
    });
    el.btnOpenReport.addEventListener("click", function () {
        if (state.result && state.result.reportPath) callHost("csOpenPath", { path: state.result.reportPath });
    });

    // ---------------------------------------------------------------
    // Help overlay
    // ---------------------------------------------------------------
    function openOverlay(id) { $(id).classList.add("open"); }
    function closeOverlay(id) { $(id).classList.remove("open"); }
    Array.prototype.forEach.call(document.querySelectorAll("[data-close]"), function (b) {
        b.addEventListener("click", function () { closeOverlay(b.getAttribute("data-close")); });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".overlay"), function (o) {
        o.addEventListener("click", function (e) { if (e.target === o) o.classList.remove("open"); });
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") Array.prototype.forEach.call(document.querySelectorAll(".overlay.open"), function (o) { o.classList.remove("open"); });
    });
    el.btnHelp.addEventListener("click", function () { openOverlay("helpOverlay"); });

    // ---------------------------------------------------------------
    // Welcome walkthrough — same pattern as the Animator Toolkit's
    // onboarding: shown once on first open, replayable from Help.
    // ---------------------------------------------------------------
    var ONBOARD_KEY = "motionProjectOrganizer.onboarded";
    var onboard = {
        root: $("onboard"),
        slides: document.querySelectorAll(".onboard-slide"),
        dots: document.querySelectorAll("#onboardDots span"),
        next: $("onboardNext"),
        back: $("onboardBack"),
        step: 0
    };
    var NEXT_LABEL = ["Get started", "Next", "Start organizing"];

    function showSlide(i) {
        onboard.step = i;
        for (var k = 0; k < onboard.slides.length; k++) {
            // Re-adding the class restarts each slide's animation from the top.
            onboard.slides[k].classList.remove("on");
            onboard.dots[k].classList.toggle("on", k === i);
        }
        void onboard.slides[i].offsetWidth;
        onboard.slides[i].classList.add("on");
        onboard.next.textContent = NEXT_LABEL[i];
        onboard.back.style.display = i === 0 ? "none" : "";
    }

    function openWelcome() {
        closeOverlay("helpOverlay");
        showSlide(0);
        onboard.root.classList.add("open");
    }

    function closeWelcome() {
        onboard.root.classList.remove("open");
        try { localStorage.setItem(ONBOARD_KEY, "1"); } catch (e) {}
    }

    function seenWelcome() {
        try { return localStorage.getItem(ONBOARD_KEY) === "1"; } catch (e) { return false; }
    }

    onboard.next.addEventListener("click", function () {
        if (onboard.step < onboard.slides.length - 1) showSlide(onboard.step + 1);
        else closeWelcome();
    });
    onboard.back.addEventListener("click", function () { if (onboard.step > 0) showSlide(onboard.step - 1); });
    $("onboardSkip").addEventListener("click", closeWelcome);
    Array.prototype.forEach.call(onboard.dots, function (d, i) { d.addEventListener("click", function () { showSlide(i); }); });
    document.addEventListener("keydown", function (e) {
        if (!onboard.root.classList.contains("open")) return;
        if (e.key === "Escape") closeWelcome();
        else if (e.key === "ArrowRight") onboard.next.click();
        else if (e.key === "ArrowLeft") onboard.back.click();
    });
    $("btnReplayWelcome").addEventListener("click", openWelcome);

    // ---------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------
    function init() {
        var prefs = loadPrefs();
        if (prefs.fonts !== undefined) el.cbFonts.checked = !!prefs.fonts;
        if (prefs.skipUnused !== undefined) el.cbSkipUnused.checked = !!prefs.skipUnused;
        if (prefs.tidy !== undefined) el.cbTidy.checked = !!prefs.tidy;
        if (prefs.renderQueue !== undefined) el.cbRenderQueue.checked = !!prefs.renderQueue;
        if (prefs.report !== undefined) el.cbReport.checked = !!prefs.report;
        state.templatePath = prefs.template || "";
        setOptionsOpen(!!prefs.optionsOpen);
        renderTemplate();
        renderStats(null);
        el.planHint.style.display = "none";
        el.btnToggleAll.style.display = "none";
        renderStepper();
        if (!seenWelcome()) openWelcome();

        // Tell the host where this extension lives (for config/organizer-config.json),
        // rather than relying on $.fileName, which varies between CEP versions.
        var extPath = csInterface.getSystemPath("extension");
        var ready = extPath ? callHost("csSetExtensionRoot", { path: extPath }) : Promise.resolve();

        ready.then(refreshProject).then(function () {
            if (state.project && state.project.saved) analyze();
            else if (state.project && state.project.open) setStatus("Step 1: save the project where the job lives — the organizer builds the folders around it.", "hint");
            else if (state.project) setStatus("Open an After Effects project to get started.", "warning");
        });

        // Coming back to the panel after switching/saving projects in AE: pick up the change.
        window.addEventListener("focus", function () { if (!state.busy) refreshProject(); });
    }

    init();
})();
