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
                if (!result) { resolve({ ok: false, error: "No response from After Effects." }); return; }
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
        projName: $("projName"),
        unsavedBox: $("unsavedBox"),
        btnSaveAs: $("btnSaveAs"),
        rootBox: $("rootBox"),
        rootPath: $("rootPath"),
        rootReason: $("rootReason"),
        nameField: $("nameField"),
        txtProjectName: $("txtProjectName"),
        btnChooseRoot: $("btnChooseRoot"),
        btnResetRoot: $("btnResetRoot"),

        btnAdvancedToggle: $("btnAdvancedToggle"),
        advancedPanel: $("advancedPanel"),
        btnAnalyze: $("btnAnalyze"),
        btnOrganize: $("btnOrganize"),
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

        statusDot: $("statusDot"),
        statusText: $("statusText"),
        statCollect: $("statCollect"),
        statInPlace: $("statInPlace"),
        statMissing: $("statMissing"),
        statSize: $("statSize"),

        progressBox: $("progressBox"),
        progressFill: $("progressFill"),
        progressText: $("progressText"),
        btnCancel: $("btnCancel"),

        planTitle: $("planTitle"),
        planHint: $("planHint"),
        emptyState: $("emptyState"),
        planList: $("planList"),

        resultBox: $("resultBox"),
        resultTitle: $("resultTitle"),
        resultBody: $("resultBody"),
        btnOpenFolder: $("btnOpenFolder"),
        btnOpenReport: $("btnOpenReport")
    };

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------
    var state = {
        project: null,        // { saved, name, path, folder, defaultName }
        rootOverride: "",     // folder picked with "Change…"
        nameEdited: false,    // user typed a folder name
        analysis: null,       // last csAnalyze result
        busy: false,
        cancel: false,
        collapsed: {},        // dest -> true
        selectedKey: null,
        result: null
    };

    // Per-machine preferences (checkbox states, template folder).
    var PREFS_KEY = "motionProjectOrganizer.prefs";
    function loadPrefs() {
        try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
    }
    function savePrefs() {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify({
                fonts: el.cbFonts.checked, skipUnused: el.cbSkipUnused.checked, tidy: el.cbTidy.checked,
                renderQueue: el.cbRenderQueue.checked, report: el.cbReport.checked,
                template: state.templatePath || ""
            }));
        } catch (e) {}
    }

    // ---------------------------------------------------------------
    // Formatting
    // ---------------------------------------------------------------
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function fmtBytes(b) {
        b = b || 0;
        if (b < 1024) return b + " B";
        var u = ["KB", "MB", "GB", "TB"], i = -1;
        do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
        return (b >= 100 ? Math.round(b) : Math.round(b * 10) / 10) + " " + u[i];
    }
    function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

    // ---------------------------------------------------------------
    // Status
    // ---------------------------------------------------------------
    function setStatus(msg, kind) {
        el.statusText.textContent = msg;
        el.statusText.title = msg;
        el.statusText.className = "status-text" + (kind ? " " + kind : "");
        el.statusDot.className = "status-dot" + (kind ? " " + kind : "");
    }

    function renderStats(stats) {
        stats = stats || {};
        el.statCollect.textContent = (stats.copy || 0) + (stats.reuse || 0);
        el.statInPlace.textContent = stats.inplace || 0;
        el.statMissing.textContent = stats.missing || 0;
        el.statSize.textContent = fmtBytes(stats.bytes || 0);
        el.statMissing.parentNode.classList.toggle("active", (stats.missing || 0) > 0);
    }

    function setBusy(busy) {
        state.busy = busy;
        [el.btnAnalyze, el.btnOrganize, el.btnChooseRoot, el.btnResetRoot, el.btnSaveAs,
         el.btnChooseTemplate, el.btnClearTemplate, el.txtProjectName].forEach(function (b) { b.disabled = busy; });
        if (!busy) el.btnOrganize.disabled = !canOrganize();
    }

    function canOrganize() {
        var a = state.analysis;
        return !!(a && a.ok && state.project && state.project.saved);
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
            return;
        }
        el.projName.textContent = p.name;
        el.projName.title = p.path || "";
        el.unsavedBox.classList.toggle("open", !p.saved);
        el.rootBox.style.display = p.saved ? "" : "none";
        if (!state.nameEdited) el.txtProjectName.value = p.defaultName || "";
    }

    function renderRoot(root) {
        if (!root) {
            el.rootPath.textContent = "—";
            el.rootReason.textContent = "";
            return;
        }
        // Leading LRM keeps RTL-ellipsis (which shows the end of long paths) from reordering slashes.
        el.rootPath.textContent = "‎" + root.path + "‎";
        el.rootPath.title = root.path;
        var reason = root.reason;
        if (root.aepDestRel) reason += " Project saves to " + root.aepDestRel + ".";
        el.rootReason.textContent = reason;
        el.rootReason.className = "root-reason" + (root.mode === "new" ? " new" : "");
        // Folder name only matters when we're making a new folder next to the .aep.
        el.nameField.style.visibility = (!state.rootOverride && (root.mode === "new" || state.nameEdited)) ? "" : "hidden";
        el.btnResetRoot.style.display = state.rootOverride ? "" : "none";
    }

    function refreshProject() {
        return callHost("csGetInfo").then(function (res) {
            if (!res.ok) { setStatus(res.error || "Couldn't reach After Effects.", "error"); return; }
            var prev = state.project && state.project.path;
            state.project = res.project;
            if (res.version) el.btnHelp.title = "v" + res.version;
            if (prev !== undefined && prev !== (res.project && res.project.path)) {
                // Different project (or first save) — start over.
                state.rootOverride = "";
                state.nameEdited = false;
                clearPlan("Project changed — click Analyze.");
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
    el.btnAdvancedToggle.addEventListener("click", function () {
        var open = el.advancedPanel.classList.toggle("open");
        el.btnAdvancedToggle.querySelector(".caret").innerHTML = open ? "&#9662;" : "&#9656;";
    });

    [el.cbFonts, el.cbSkipUnused].forEach(function (cb) {
        cb.addEventListener("change", function () { savePrefs(); if (state.analysis) analyze(); });
    });
    [el.cbTidy, el.cbRenderQueue, el.cbReport].forEach(function (cb) { cb.addEventListener("change", savePrefs); });

    function renderTemplate() {
        var t = state.templatePath;
        el.templatePath.textContent = t ? "‎" + t + "‎" : "None — built-in folder list";
        el.templatePath.title = t || "";
        el.templatePath.classList.toggle("none", !t);
        el.btnClearTemplate.style.display = t ? "" : "none";
    }

    el.btnChooseTemplate.addEventListener("click", function () {
        callHost("csChooseFolder", { prompt: "Choose your project template folder", startPath: state.templatePath || "" }).then(function (res) {
            if (res.ok && res.path) { state.templatePath = res.path; renderTemplate(); savePrefs(); }
        });
    });
    el.btnClearTemplate.addEventListener("click", function () { state.templatePath = ""; renderTemplate(); savePrefs(); });

    el.btnEditRules.addEventListener("click", function () {
        callHost("csOpenConfig").then(function (res) {
            setStatus(res.ok ? "Opened folder rules — save the file, then click Analyze." : (res.error || "Couldn't open the rules file."), res.ok ? null : "error");
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
        el.btnOrganize.textContent = "Organize & Save";
    }

    function clearPlan(msg) {
        resetOrganizeButton();
        state.analysis = null;
        state.selectedKey = null;
        el.planList.innerHTML = "";
        el.emptyState.style.display = "block";
        el.planHint.style.display = "none";
        el.planTitle.textContent = "Plan";
        renderStats(null);
        renderRoot(null);
        el.btnOrganize.disabled = true;
        if (msg) setStatus(msg, null);
    }

    function analyze() {
        if (state.busy) return;
        hideResult();
        setBusy(true);
        setStatus("Reading project…", "scanning");
        refreshProject().then(function () {
            if (!state.project || !state.project.open) { setBusy(false); setStatus("Open an After Effects project first.", "warning"); return; }
            if (!state.project.saved) { setBusy(false); clearPlan(); setStatus("Save the project first — the organizer builds around where it's saved.", "warning"); return; }
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
            setStatus(plural(s.missing, "file") + " missing — relink in AE before handoff (shown in red). " +
                      collect + " ready to collect.", "error");
        } else if (collect === 0 && s.sources > 0) {
            setStatus("Everything is already inside the project folder. Organize will just save and write the report.", "success");
        } else if (s.sources === 0) {
            setStatus("No footage files in this project. Organize will build the folders and save the project.", "success");
        } else {
            setStatus("Ready — " + plural(collect, "file") + " to collect (" + fmtBytes(s.bytes) + "). Nothing is missing.", "success");
        }
    }

    el.btnAnalyze.addEventListener("click", analyze);

    // ---------------------------------------------------------------
    // Plan list — grouped by destination folder
    // ---------------------------------------------------------------
    var STATUS_LABEL = { copy: "Copy", reuse: "Relink", inplace: "In place", missing: "Missing", unused: "Skip",
                         adobe: "Adobe", system: "System", shared: "Copy" };

    function renderPlan() {
        var a = state.analysis;
        el.planList.innerHTML = "";
        el.emptyState.style.display = "none";
        el.planHint.style.display = "";

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

        // Sort: missing first, then in the config's folder order, then alphabetical.
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

        if (a.fonts && a.fonts.length) {
            el.planList.appendChild(renderFontGroup(a.fonts));
        }

        el.planTitle.textContent = "Plan · " + plural(total, "file");
        if (!total && !(a.fonts && a.fonts.length)) {
            el.emptyState.style.display = "block";
            el.emptyState.innerHTML = "No linked files in this project. <b>Organize &amp; Save</b> will create the folder structure and save the project into <code>" +
                escapeHtml(a.root.aepDestRel || "AE/") + "</code>.";
            el.planHint.style.display = "none";
        }
    }

    function renderGroup(g) {
        var isMissing = g.key === "__missing";
        var wrap = document.createElement("div");
        wrap.className = "group" + (isMissing ? " missing" : "") + (state.collapsed[g.key] ? " collapsed" : "");

        var head = document.createElement("div");
        head.className = "group-head";
        var label = isMissing ? "Missing — relink before handoff" : g.key.replace(/\//g, " / ");
        var meta = plural(g.rows.length, "file") + (g.bytes ? " · " + fmtBytes(g.bytes) : "");
        head.innerHTML =
            '<span class="caret">' + (state.collapsed[g.key] ? "&#9656;" : "&#9662;") + '</span>' +
            '<span class="folder-name"><span class="icon">' + (isMissing ? "!" : "&#9633;") + '</span>' + escapeHtml(label) + '</span>' +
            '<span class="meta">' + meta + '</span>';
        head.addEventListener("click", function () {
            state.collapsed[g.key] = !state.collapsed[g.key];
            wrap.classList.toggle("collapsed");
            head.querySelector(".caret").innerHTML = state.collapsed[g.key] ? "&#9656;" : "&#9662;";
        });
        wrap.appendChild(head);

        var body = document.createElement("div");
        body.className = "group-body";
        g.rows.forEach(function (r) { body.appendChild(renderFileRow(r)); });
        wrap.appendChild(body);
        return wrap;
    }

    function renderFileRow(r) {
        var s = r.src;
        var row = document.createElement("div");
        row.className = "file-row" + (state.selectedKey === r.key ? " selected" : "");

        var sub;
        if (s.status === "missing") sub = "Was: " + s.srcPath;
        else if (s.status === "inplace") sub = "Already at " + (s.destRel || s.srcPath);
        else if (s.status === "reuse") sub = "Same file already at " + s.destRel;
        else if (s.status === "unused") sub = "Not used in any comp · " + s.srcPath;
        else sub = "From " + s.srcPath;

        var extra = [];
        if (s.itemCount > 1) extra.push(s.itemCount + " items");
        if (s.layeredCount) extra.push("layered");
        var title = s.status === "copy" && s.destRel ? "→ " + s.destRel + "\n" + s.srcPath : s.srcPath;

        row.title = title;
        row.innerHTML =
            '<span class="badge ' + s.status + '">' + (STATUS_LABEL[s.status] || s.status) + '</span>' +
            '<div class="file-main">' +
                '<div class="file-name">' + escapeHtml(s.name) + (extra.length ? ' <span class="file-size">· ' + escapeHtml(extra.join(" · ")) + '</span>' : '') + '</div>' +
                '<div class="file-sub">‎' + escapeHtml(sub) + '‎</div>' +
            '</div>' +
            '<span class="file-size">' + (s.bytes ? fmtBytes(s.bytes) : "") + '</span>';

        row.addEventListener("click", function () {
            state.selectedKey = r.key;
            Array.prototype.forEach.call(el.planList.querySelectorAll(".file-row.selected"), function (n) { n.classList.remove("selected"); });
            row.classList.add("selected");
            callHost("csRevealItems", { ids: s.ids }).then(function (res) {
                if (res.ok) setStatus("Selected " + plural(res.selected, "item") + " in the Project panel.", null);
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
        var g = { key: "__fonts" };
        var wrap = document.createElement("div");
        wrap.className = "group" + (state.collapsed[g.key] ? " collapsed" : "");
        var head = document.createElement("div");
        head.className = "group-head";
        head.innerHTML =
            '<span class="caret">' + (state.collapsed[g.key] ? "&#9656;" : "&#9662;") + '</span>' +
            '<span class="folder-name"><span class="icon">&#9633;</span>FONTS</span>' +
            '<span class="meta">' + plural(fonts.length, "font") + (bytes ? " · " + fmtBytes(bytes) : "") + '</span>';
        head.addEventListener("click", function () {
            state.collapsed[g.key] = !state.collapsed[g.key];
            wrap.classList.toggle("collapsed");
            head.querySelector(".caret").innerHTML = state.collapsed[g.key] ? "&#9656;" : "&#9662;";
        });
        wrap.appendChild(head);
        var body = document.createElement("div");
        body.className = "group-body";
        fonts.forEach(function (f) {
            var st = f.status === "shared" ? "copy" : f.status;
            var row = document.createElement("div");
            row.className = "file-row";
            row.style.cursor = "default";
            row.title = f.location || "";
            row.innerHTML =
                '<span class="badge ' + st + '">' + (STATUS_LABEL[f.status] || f.status) + '</span>' +
                '<div class="file-main"><div class="file-name">' + escapeHtml(f.name) + '</div>' +
                '<div class="file-sub" style="direction:ltr">' + escapeHtml(FONT_NOTE[f.status] || "") + '</div></div>' +
                '<span class="file-size">' + (f.status === "copy" && f.bytes ? fmtBytes(f.bytes) : "") + '</span>';
            body.appendChild(row);
        });
        wrap.appendChild(body);
        return wrap;
    }

    // ---------------------------------------------------------------
    // Organize: prepare → copy in batches (with progress) → finish
    // ---------------------------------------------------------------
    function showProgress(on) { el.progressBox.classList.toggle("open", on); }
    function setProgress(frac, text) {
        el.progressFill.style.width = Math.max(0, Math.min(100, frac * 100)).toFixed(1) + "%";
        el.progressText.textContent = text;
    }

    function organize() {
        if (state.busy || !canOrganize()) return;
        var s = state.analysis.stats;
        // Missing files: ask once, inline (native dialogs are unreliable in CEP panels).
        if (s.missing > 0 && !state.confirmMissing) {
            state.confirmMissing = true;
            el.btnOrganize.textContent = "Organize anyway";
            setStatus(plural(s.missing, "missing file") + " can't be collected — relink in AE first, or click Organize anyway " +
                      "(they'll be listed in the report).", "error");
            return;
        }
        resetOrganizeButton();
        hideResult();
        setBusy(true);
        state.cancel = false;
        el.btnCancel.disabled = false;
        showProgress(true);
        setProgress(0, "Building folders…");
        setStatus("Organizing — don't close After Effects.", "scanning");

        callHost("csPrepare", gatherParams()).then(function (res) {
            if (!res.ok) return stop(res.error || "Couldn't prepare the project folder.", "error");
            if (res.files === 0) { setProgress(1, "Nothing to copy."); return finish(); }
            setProgress(0, "Copying " + plural(res.files, "file") + " (" + fmtBytes(res.bytes) + ")…");
            copyLoop();
        });
    }

    function copyLoop() {
        if (state.cancel) {
            callHost("csCancel");
            return stop("Cancelled. Files already copied were left in place; the project was not changed.", "warning");
        }
        callHost("csCopyNext").then(function (res) {
            if (!res.ok) return stop(res.error || "Copy failed.", "error");
            var frac = res.bytesTotal ? res.bytesDone / res.bytesTotal : res.done / Math.max(1, res.files);
            setProgress(frac, res.done + " / " + res.files + " · " + fmtBytes(res.bytesDone) + " of " + fmtBytes(res.bytesTotal) +
                        (res.current ? " · " + res.current : ""));
            if (res.finished) finish();
            else setTimeout(copyLoop, 0);
        });
    }

    function finish() {
        el.btnCancel.disabled = true;
        setProgress(1, "Relinking and saving…");
        callHost("csFinish").then(function (res) {
            showProgress(false);
            setBusy(false);
            if (!res.ok) { setStatus(res.error || "Organize failed.", "error"); return; }
            state.result = res;
            showResult(res);
            // Re-analyze quietly so the plan reflects the new, organized state.
            // The project now lives at savedAs — record that so it isn't seen as a project switch.
            if (state.project) state.project.path = res.savedAs;
            state.nameEdited = false;
            state.rootOverride = "";
            refreshProject().then(function () {
                callHost("csAnalyze", gatherParams()).then(function (a) {
                    if (a.ok) { state.analysis = a; renderRoot(a.root); renderStats(a.stats); renderPlan(); el.btnOrganize.disabled = !canOrganize(); }
                });
            });
        });
    }

    function stop(msg, kind) {
        showProgress(false);
        setBusy(false);
        setStatus(msg, kind);
    }

    el.btnOrganize.addEventListener("click", organize);
    el.btnCancel.addEventListener("click", function () { state.cancel = true; el.btnCancel.disabled = true; setProgress(0, "Cancelling…"); });

    // ---------------------------------------------------------------
    // Result
    // ---------------------------------------------------------------
    function showResult(r) {
        var problems = r.errors.length + r.missing + r.placeholders;
        el.resultTitle.textContent = problems ? "Organized — with items to check" : "Organized — ready to hand off";
        el.resultTitle.className = "result-title" + (r.errors.length ? " error" : (problems || r.warnings.length ? " warning" : ""));

        var lines = [];
        lines.push(plural(r.copied, "file") + " collected (" + r.bytesLabel + "), " + plural(r.relinked, "item") + " relinked.");
        lines.push("Saved as <code>" + escapeHtml(r.savedRel) + "</code>.");
        if (r.tidied) lines.push(plural(r.tidied, "loose item") + " sorted into Project-panel bins.");
        if (r.rqPointed) lines.push(plural(r.rqPointed, "render output") + " pointed to DELIVERABLES.");
        if (r.missing) lines.push('<span class="err">' + plural(r.missing, "missing file") + " — listed in the report.</span>");
        if (r.placeholders) lines.push('<span class="chk">' + plural(r.placeholders, "placeholder") + " in the project.</span>");
        r.errors.forEach(function (e) { lines.push('<span class="err">' + escapeHtml(e) + "</span>"); });
        r.warnings.forEach(function (w) { lines.push('<span class="chk">' + escapeHtml(w) + "</span>"); });
        el.resultBody.innerHTML = lines.join("<br />");
        el.btnOpenReport.style.display = r.reportPath ? "" : "none";
        el.resultBox.classList.add("open");

        setStatus(problems ? "Done — see the notes below before handing off." : "Done — everything is inside the project folder.",
                  problems ? "warning" : "success");
    }

    function hideResult() { el.resultBox.classList.remove("open"); }

    el.btnOpenFolder.addEventListener("click", function () {
        if (state.result) callHost("csOpenPath", { path: state.result.rootPath });
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
    el.btnHelp.addEventListener("click", function () { openOverlay("helpOverlay"); });

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
        renderTemplate();
        renderStats(null);
        el.planHint.style.display = "none";

        refreshProject().then(function () {
            if (state.project && state.project.saved) analyze();
            else if (state.project && state.project.open) setStatus("Save the project first — the organizer builds around where it's saved.", "warning");
        });

        // Coming back to the panel after switching/saving projects in AE: pick up the change.
        window.addEventListener("focus", function () { if (!state.busy) refreshProject(); });
    }

    init();
})();
