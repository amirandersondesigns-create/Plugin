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
        btnContact: $("btnContact"),

        ddlScope: $("ddlScope"),
        ddlFilter: $("ddlFilter"),
        btnClear: $("btnClear"),
        btnScan: $("btnScan"),

        btnGearSettings: $("btnGearSettings"),
        settingsOverlay: $("settingsOverlay"),
        btnOpenDictFromSettings: $("btnOpenDictFromSettings"),

        cbIgnoreHidden: $("cbIgnoreHidden"),
        cbIgnoreLocked: $("cbIgnoreLocked"),
        cbShowHighlights: $("cbShowHighlights"),
        cbIgnoreCaps: $("cbIgnoreCaps"),
        cbSkipNumbers: $("cbSkipNumbers"),

        statusDot: $("statusDot"),
        statusText: $("statusText"),
        statComps: $("statComps"),
        statWords: $("statWords"),
        statErrors: $("statErrors"),

        wordsTitle: $("wordsTitle"),
        emptyState: $("emptyState"),
        wordsList: $("wordsList"),
        btnCopyReport: $("btnCopyReport"),

        locationsTitle: $("locationsTitle"),
        locationsList: $("locationsList"),

        suggestionsTitle: $("suggestionsTitle"),
        suggestionsList: $("suggestionsList"),
        btnReplace: $("btnReplace"),
        btnIgnore: $("btnIgnore"),
        btnAddDict: $("btnAddDict"),

        dictOverlay: $("dictOverlay"),
        dictOverlayBody: $("dictOverlayBody"),
        helpOverlay: $("helpOverlay")
    };

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------
    var state = {
        scanned: false,
        words: [],          // [{lower, word, count, locations:[{label,sourceType}], suggestions:[...]}]
        selectedLower: null
    };

    // ---------------------------------------------------------------
    // Status / stats
    // ---------------------------------------------------------------
    function setStatus(msg, kind) {
        el.statusText.textContent = msg;
        el.statusText.className = "status-text" + (kind ? " " + kind : "");
        el.statusDot.className = "status-dot" + (kind ? " " + kind : "");
    }

    function renderStats(stats) {
        stats = stats || { comps: 0, words: 0, errors: 0 };
        el.statComps.textContent = stats.comps || 0;
        el.statWords.textContent = stats.words || 0;
        el.statErrors.textContent = stats.errors || 0;
    }

    el.ddlFilter.addEventListener("change", function () {
        renderWordsList();
        clearDetail();
    });

    // ---------------------------------------------------------------
    // Copy Report — a plain-text QC summary of the last scan (every
    // misspelled word, where it appears, and suggestions), for pasting
    // into an email, Slack, or a compliance sign-off form before air.
    // ---------------------------------------------------------------
    function buildReport() {
        var lines = [];
        lines.push("Motion Spell Checker — Scan Report");
        lines.push("Generated: " + new Date().toLocaleString());
        lines.push("");
        lines.push(state.words.length + " issue(s) found:");
        lines.push("");
        state.words.forEach(function (w, i) {
            lines.push((i + 1) + ". \"" + w.word + "\" (" + w.count + " occurrence" + (w.count === 1 ? "" : "s") + ")");
            (w.locations || []).forEach(function (loc) { lines.push("   - " + loc.label); });
            if (w.suggestions && w.suggestions.length) lines.push("   Suggestions: " + w.suggestions.join(", "));
            lines.push("");
        });
        return lines.join("\n");
    }

    function copyTextFallback(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        return ok;
    }

    el.btnCopyReport.addEventListener("click", function () {
        var text = buildReport();
        var onDone = function () { setStatus("Report copied to clipboard (" + state.words.length + " issue(s)).", "success"); };
        var onFail = function () { setStatus("Could not copy report — clipboard access blocked.", "warning"); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onDone, function () {
                if (copyTextFallback(text)) onDone(); else onFail();
            });
        } else if (copyTextFallback(text)) {
            onDone();
        } else {
            onFail();
        }
    });

    // ---------------------------------------------------------------
    // Scan
    // ---------------------------------------------------------------
    function gatherScanParams() {
        var showHighlights = el.cbShowHighlights.checked;
        return {
            scope: el.ddlScope.value,
            filter: el.ddlFilter.value,
            ignoreHidden: el.cbIgnoreHidden.checked,
            ignoreLocked: el.cbIgnoreLocked.checked,
            selectedOnly: false,
            ignoreAllCaps: el.cbIgnoreCaps.checked,
            skipNumbers: el.cbSkipNumbers.checked,
            smartMatching: true,
            forceHighlightVisibility: showHighlights,
            disableGlobalHighlights: !showHighlights
        };
    }

    function setScanningUI(isScanning) {
        [el.btnScan, el.btnClear].forEach(function (b) { b.disabled = isScanning; });
    }

    function runScan() {
        var params = gatherScanParams();
        setScanningUI(true);
        setStatus("Scanning project…", "scanning");

        callHost("csScan", params).then(function (res) {
            setScanningUI(false);
            if (!res.ok) {
                setStatus(res.error || "Scan failed.", "error");
                return;
            }
            state.scanned = true;
            state.words = res.words || [];
            state.selectedLower = null;
            renderStats(res.stats);
            renderWordsList();
            clearDetail();

            var scopeLabel = res.scope === "project" ? "project" :
                (res.scope === "selected" ? "selected layers" :
                (res.scope === "selectedComps" ? "selected comps" : "active comp"));
            if (res.compsScanned === 0) {
                var noneMsg = res.scope === "selected" ? "select some layers first" :
                    (res.scope === "selectedComps" ? "select comp(s) in the Project panel first" : "no compositions found");
                setStatus("Nothing to scan — " + noneMsg, "warning");
            } else if (state.words.length === 0) {
                setStatus("Clean — " + res.stats.words + " words across " + res.compsScanned + " comp(s), no issues.", "success");
            } else {
                var hlNote = res.highlightCount ? (" · " + res.highlightCount + " layer(s) highlighted in the comp") : "";
                setStatus("Found " + state.words.length + " issue(s) in " + scopeLabel + " (" + res.stats.words + " words scanned)" + hlNote + ".", "error");
            }
            if (res.usingFallbackOnly) {
                setStatus("Using built-in fallback dictionary only (" + res.fallbackWordCount + " words). Add category .txt files to /Dictionary/.", "warning");
            }
        });
    }

    el.btnScan.addEventListener("click", runScan);

    el.btnClear.addEventListener("click", function () {
        state.scanned = false;
        state.words = [];
        state.selectedLower = null;
        renderStats(null);
        renderWordsList();
        clearDetail();
        setStatus("Cleared — ready to scan.", null);
        callHost("csClearHighlights");
    });

    // ---------------------------------------------------------------
    // Settings drawer — layer filters, word matching, and highlight
    // options. The main Scan button already reads whatever scope is
    // selected, so there's no separate "scan now" action in here.
    // ---------------------------------------------------------------
    el.btnGearSettings.addEventListener("click", function () { openOverlay("settingsOverlay"); });

    el.btnOpenDictFromSettings.addEventListener("click", function () {
        closeOverlay("settingsOverlay");
        verifyDictionaries();
    });

    // ---------------------------------------------------------------
    // Words list
    // ---------------------------------------------------------------
    function currentFilterKey() { return el.ddlFilter.value; }

    function wordMatchesFilter(w) {
        var f = currentFilterKey();
        if (f === "all") return true;
        if (f === "name") return w.locations.some(function (l) { return l.sourceType === "layerName" || l.sourceType === "compName"; });
        return w.locations.some(function (l) { return l.sourceType === f; });
    }

    function renderWordsList() {
        var visible = state.words.filter(wordMatchesFilter);
        el.wordsTitle.textContent = visible.length > 0 ? "Misspelled words (" + visible.length + ")" : "Misspelled words";
        el.btnCopyReport.style.display = state.words.length > 0 ? "inline" : "none";

        el.wordsList.innerHTML = "";

        if (!state.scanned) {
            el.emptyState.textContent = "No scan yet — choose a scope and click Scan.";
            el.emptyState.className = "empty-state";
            el.emptyState.style.display = "block";
            el.wordsList.style.display = "none";
            return;
        }
        if (visible.length === 0) {
            el.emptyState.textContent = "No spelling issues found.";
            el.emptyState.className = "empty-state success";
            el.emptyState.style.display = "block";
            el.wordsList.style.display = "none";
            return;
        }

        el.emptyState.style.display = "none";
        el.wordsList.style.display = "block";

        visible.forEach(function (w, i) {
            var row = document.createElement("div");
            row.className = "row-item" + (w.lower === state.selectedLower ? " selected" : "");
            row.innerHTML =
                '<span class="row-index">' + (i + 1) + '</span>' +
                '<span class="row-word">' + escapeHtml(w.word) + '</span>' +
                '<span class="row-count">' + w.count + '</span>';
            row.addEventListener("click", function () { selectWord(w.lower); });
            el.wordsList.appendChild(row);
        });

        if (!state.selectedLower || !visible.some(function (w) { return w.lower === state.selectedLower; })) {
            selectWord(visible[0].lower);
        }
    }

    function findWord(lower) {
        for (var i = 0; i < state.words.length; i++) { if (state.words[i].lower === lower) return state.words[i]; }
        return null;
    }

    function selectWord(lower) {
        state.selectedLower = lower;
        renderWordsList();
        var w = findWord(lower);
        if (!w) { clearDetail(); return; }

        el.locationsTitle.textContent = "Locations (" + w.locations.length + ")";
        el.locationsList.innerHTML = "";
        w.locations.forEach(function (loc, i) {
            var row = document.createElement("div");
            row.className = "row-item location-item" + (i === 0 ? " selected" : "");
            row.innerHTML =
                '<div class="src">' + escapeHtml(sourceLabel(loc.sourceType)) + '</div>' +
                '<div class="label">' + escapeHtml(loc.label) + '</div>';
            row.addEventListener("click", function () {
                Array.prototype.forEach.call(el.locationsList.children, function (c) { c.classList.remove("selected"); });
                row.classList.add("selected");
            });
            el.locationsList.appendChild(row);
        });

        el.suggestionsTitle.textContent = w.suggestions.length > 0 ? "Suggestions (" + w.suggestions.length + ")" : "Suggestions";
        el.suggestionsList.innerHTML = "";
        if (w.suggestions.length === 0) {
            var none = document.createElement("div");
            none.className = "empty-state";
            none.textContent = "No suggestions for this word.";
            el.suggestionsList.appendChild(none);
        } else {
            w.suggestions.forEach(function (s, i) {
                var row = document.createElement("div");
                row.className = "row-item" + (i === 0 ? " selected" : "");
                row.textContent = s;
                row.addEventListener("click", function () {
                    Array.prototype.forEach.call(el.suggestionsList.children, function (c) { c.classList.remove("selected"); });
                    row.classList.add("selected");
                });
                el.suggestionsList.appendChild(row);
            });
        }
    }

    function sourceLabel(t) {
        if (t === "text") return "Text";
        if (t === "expression") return "Expression";
        if (t === "effect") return "Effect";
        if (t === "marker") return "Marker";
        if (t === "layerName") return "Layer name";
        if (t === "compName") return "Comp name";
        return t || "";
    }

    function clearDetail() {
        el.locationsTitle.textContent = "Locations";
        el.locationsList.innerHTML = "";
        el.suggestionsTitle.textContent = "Suggestions";
        el.suggestionsList.innerHTML = "";
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    // ---------------------------------------------------------------
    // Actions: Replace / Ignore / Add to dictionary / Reveal / Undo
    // ---------------------------------------------------------------
    function removeWordFromState(lower) {
        state.words = state.words.filter(function (w) { return w.lower !== lower; });
        if (state.selectedLower === lower) state.selectedLower = null;
        el.statErrors.textContent = state.words.length;
        renderWordsList();
        clearDetail();
    }

    el.btnReplace.addEventListener("click", function () {
        if (!state.selectedLower) { setStatus("Select a misspelled word first.", "warning"); return; }
        var selectedSuggestion = el.suggestionsList.querySelector(".row-item.selected");
        if (!selectedSuggestion) { setStatus("Select a suggestion first.", "warning"); return; }
        var newWord = selectedSuggestion.textContent.replace(/^\s+|\s+$/g, "");
        if (!newWord) { setStatus("Select a suggestion first.", "warning"); return; }
        var w = findWord(state.selectedLower);
        callHost("csReplace", { lower: state.selectedLower, newWord: newWord }).then(function (res) {
            if (res.ok) {
                setStatus("Replaced \"" + res.word + "\" with \"" + res.newWord + "\" (" + res.replaced + " instance(s)).", "success");
                removeWordFromState(w.lower);
            } else {
                setStatus(res.error || ("Could not replace \"" + (w ? w.word : state.selectedLower) + "\"."), "error");
            }
        });
    });

    el.btnIgnore.addEventListener("click", function () {
        if (!state.selectedLower) { setStatus("Select a misspelled word first.", "warning"); return; }
        var lower = state.selectedLower;
        callHost("csIgnore", { lower: lower }).then(function (res) {
            if (res.ok) { setStatus("Ignored \"" + lower + "\" (saved to ignoredWords.txt).", null); removeWordFromState(lower); }
        });
    });

    el.btnAddDict.addEventListener("click", function () {
        if (!state.selectedLower) { setStatus("Select a misspelled word first.", "warning"); return; }
        var lower = state.selectedLower;
        callHost("csAddToDictionary", { lower: lower }).then(function (res) {
            if (res.ok) { setStatus("Added \"" + lower + "\" to custom dictionary.", "success"); removeWordFromState(lower); }
        });
    });

    // ---------------------------------------------------------------
    // Verify Dictionary overlay
    // ---------------------------------------------------------------
    function openOverlay(id) { $(id).classList.add("open"); }
    function closeOverlay(id) { $(id).classList.remove("open"); }

    document.querySelectorAll("[data-close]").forEach(function (btn) {
        btn.addEventListener("click", function () { closeOverlay(btn.getAttribute("data-close")); });
    });
    [el.dictOverlay, el.helpOverlay, el.settingsOverlay].forEach(function (ov) {
        ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("open"); });
    });

    // ---------------------------------------------------------------
    // Keyboard shortcuts
    // ---------------------------------------------------------------
    document.addEventListener("keydown", function (e) {
        var openOverlayEl = document.querySelector(".overlay.open");

        if (e.key === "Escape") {
            if (openOverlayEl) { closeOverlay(openOverlayEl.id); e.preventDefault(); }
            return;
        }

        // Deliberately NOT intercepting Cmd/Ctrl+Z here — After Effects'
        // own native Undo already handles it correctly. Capturing it in the
        // panel and rerouting through our own Undo button would only break
        // the one thing that reliably works right now.

        var tag = (e.target && e.target.tagName) || "";
        var typing = tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA";
        if (e.key === "Enter" && !openOverlayEl && !typing && !el.btnScan.disabled) {
            e.preventDefault();
            el.btnScan.click();
        }
    });

    function verifyDictionaries() {
        el.dictOverlayBody.textContent = "Checking…";
        openOverlay("dictOverlay");
        callHost("csVerifyDictionaries").then(function (res) {
            if (!res.ok) { el.dictOverlayBody.textContent = res.error || "Could not verify dictionaries."; return; }
            renderDictOverlay(res.result);
        });
    }

    function renderDictOverlay(r) {
        var html = "";
        html += '<div class="dict-summary">' +
            '<span><span class="num">' + r.loaded + '</span> loaded</span>' +
            '<span><span class="num">' + r.missing + '</span> missing</span>' +
            '<span><span class="num">' + r.error + '</span> errors</span>' +
            '</div>';
        html += '<p style="color:var(--muted);font-size:10.5px;margin-bottom:10px;">Folder: ' + escapeHtml(r.dictionaryPath) +
            '<br/>Extension root (from CEP): ' + escapeHtml(r.extensionRootPath || "(not set)") +
            '<br/>Raw diag: ' + escapeHtml(r.extensionRootDiag || "") +
            '<br/>Fallback list: ' + r.fallbackWords + ' words &middot; Custom dictionary: ' + r.customWords + ' words &middot; ' +
            'Category files: ' + r.fileWords + ' words / ' + r.fileCorrections + ' corrections</p>';
        r.categories.forEach(function (c) {
            html += '<div class="dict-row"><span class="name">' + escapeHtml(c.name.replace(/_/g, " ")) + '</span>' +
                '<span class="status-badge ' + c.status + '">' + statusText(c) + '</span></div>';
        });
        el.dictOverlayBody.innerHTML = html;
    }

    function statusText(c) {
        if (c.status === "loaded") return c.words + "w / " + c.corrections + "c";
        if (c.status === "missing") return "missing";
        if (c.status === "empty") return "empty";
        return "error";
    }

    el.btnHelp.addEventListener("click", function () { openOverlay("helpOverlay"); });

    el.btnContact.addEventListener("click", function () {
        csInterface.openURLInDefaultBrowser("https://www.linkedin.com/in/amiranderson");
    });

    // ---------------------------------------------------------------
    // Host theme adaptation — matches After Effects' own UI brightness
    // (dark or light) instead of assuming a fixed dark theme.
    // ---------------------------------------------------------------
    function clampByte(v) { return Math.max(0, Math.min(255, Math.round(v))); }

    function shadeColor(c, amt) {
        return "rgb(" + clampByte(c.red + amt) + "," + clampByte(c.green + amt) + "," + clampByte(c.blue + amt) + ")";
    }

    function applyHostTheme() {
        try {
            var env = csInterface.getHostEnvironment();
            var skin = env && env.appSkinInfo;
            var c = skin && skin.panelBackgroundColor && skin.panelBackgroundColor.color;
            if (!c) return;

            var brightness = (c.red * 299 + c.green * 587 + c.blue * 114) / 1000;
            var isDark = brightness < 128;
            var root = document.documentElement.style;

            root.setProperty("--bg", "rgb(" + clampByte(c.red) + "," + clampByte(c.green) + "," + clampByte(c.blue) + ")");
            root.setProperty("--panel", shadeColor(c, isDark ? 8 : -8));
            root.setProperty("--panel-alt", shadeColor(c, isDark ? 14 : -14));
            root.setProperty("--field", shadeColor(c, isDark ? -6 : 10));
            root.setProperty("--border", shadeColor(c, isDark ? 24 : -24));
            root.setProperty("--border-soft", shadeColor(c, isDark ? 16 : -16));
            root.setProperty("--text", isDark ? "#d8d8d8" : "#2a2a2a");
            root.setProperty("--text-strong", isDark ? "#f0f0f0" : "#101010");
            root.setProperty("--muted", isDark ? "#8a8a8a" : "#5a5a5a");
            root.setProperty("--faint", isDark ? "#666666" : "#8a8a8a");
        } catch (e) {}
    }

    // ---------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------
    function init() {
        applyHostTheme();
        csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, applyHostTheme);

        (function sendExtensionRoot() {
            var extRoot = "";
            try { extRoot = csInterface.getSystemPath("extension") || ""; } catch (e1) { extRoot = ""; }

            // getSystemPath can return a file:// URI (URL-encoded) instead of a
            // plain path depending on CEP build — normalize it either way, but
            // fall back to the raw value if decoding fails rather than losing
            // it entirely.
            var resolved = extRoot;
            try {
                if (extRoot && extRoot.indexOf("file://") === 0) {
                    resolved = decodeURI(extRoot.replace(/^file:\/\/localhost/, "file://").substring(7));
                }
            } catch (e2) { resolved = extRoot; }

            // Passed as a plain quoted string, not JSON — ExtendScript's JSON
            // global isn't reliably available on this, the very first
            // evalScript() call of a fresh session.
            try {
                var safePath = (resolved || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                csInterface.evalScript('csSetExtensionRoot("' + safePath + '")');
            } catch (e3) {}
        })();

        callHost("csGetInfo").then(function (res) {
            if (res.ok) {
                $("appTitle").textContent = res.appName;
                $("appByline").textContent = "v" + res.version;
                if (!res.hasProject) setStatus("Open an After Effects project to get started.", "warning");
            }
        });
        renderStats(null);
        renderWordsList();
        clearDetail();
    }

    init();
})();
