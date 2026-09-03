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
        btnVerifyDict: $("btnVerifyDict"),
        btnHelp: $("btnHelp"),

        ddlScope: $("ddlScope"),
        ddlFilter: $("ddlFilter"),
        btnClear: $("btnClear"),
        btnScan: $("btnScan"),

        btnAdvancedToggle: $("btnAdvancedToggle"),
        advancedPanel: $("advancedPanel"),

        cbIgnoreHidden: $("cbIgnoreHidden"),
        cbIgnoreLocked: $("cbIgnoreLocked"),
        cbSelectedOnly: $("cbSelectedOnly"),
        cbIgnoreCaps: $("cbIgnoreCaps"),
        cbSkipNumbers: $("cbSkipNumbers"),
        cbSmartMatch: $("cbSmartMatch"),

        statusDot: $("statusDot"),
        statusText: $("statusText"),
        statComps: $("statComps"),
        statWords: $("statWords"),
        statErrors: $("statErrors"),

        wordsTitle: $("wordsTitle"),
        emptyState: $("emptyState"),
        wordsList: $("wordsList"),

        locationsTitle: $("locationsTitle"),
        locationsList: $("locationsList"),
        btnReveal: $("btnReveal"),

        suggestionsTitle: $("suggestionsTitle"),
        suggestInput: $("suggestInput"),
        suggestList: $("suggestList"),
        btnReplace: $("btnReplace"),
        btnUndo: $("btnUndo"),
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

    // ---------------------------------------------------------------
    // Advanced options — collapsed by default (progressive disclosure)
    // ---------------------------------------------------------------
    el.btnAdvancedToggle.addEventListener("click", function () {
        var open = el.advancedPanel.classList.toggle("open");
        el.btnAdvancedToggle.querySelector(".caret").innerHTML = open ? "&#9662;" : "&#9656;";
    });

    el.ddlFilter.addEventListener("change", function () {
        renderWordsList();
        clearDetail();
    });

    // ---------------------------------------------------------------
    // Scan
    // ---------------------------------------------------------------
    function gatherScanParams() {
        return {
            scope: el.ddlScope.value,
            filter: el.ddlFilter.value,
            ignoreHidden: el.cbIgnoreHidden.checked,
            ignoreLocked: el.cbIgnoreLocked.checked,
            selectedOnly: el.cbSelectedOnly.checked,
            ignoreAllCaps: el.cbIgnoreCaps.checked,
            skipNumbers: el.cbSkipNumbers.checked,
            smartMatching: el.cbSmartMatch.checked
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

            var scopeLabel = res.scope === "project" ? "project" : (res.scope === "selected" ? "selected layers" : "active comp");
            if (res.compsScanned === 0) {
                setStatus("Nothing to scan — " + (res.scope === "selected" ? "select some layers first" : "no compositions found"), "warning");
            } else if (state.words.length === 0) {
                setStatus("Clean — " + res.stats.words + " words across " + res.compsScanned + " comp(s), no issues.", "success");
            } else {
                setStatus("Found " + state.words.length + " issue(s) in " + scopeLabel + " (" + res.stats.words + " words scanned).", "error");
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
            row.dataset.index = String(i);
            row.addEventListener("dblclick", function () { revealSelected(); });
            row.addEventListener("click", function () {
                Array.prototype.forEach.call(el.locationsList.children, function (c) { c.classList.remove("selected"); });
                row.classList.add("selected");
            });
            el.locationsList.appendChild(row);
        });

        el.suggestionsTitle.textContent = w.suggestions.length > 0 ? "Suggestion (" + w.suggestions.length + " found)" : "Suggestion";
        el.suggestList.innerHTML = "";
        w.suggestions.forEach(function (s) {
            var o = document.createElement("option");
            o.value = s;
            el.suggestList.appendChild(o);
        });
        el.suggestInput.value = w.suggestions.length > 0 ? w.suggestions[0] : "";
        el.suggestInput.placeholder = w.suggestions.length > 0 ? "" : "No suggestions — type a replacement";
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
        el.suggestionsTitle.textContent = "Suggestion";
        el.suggestList.innerHTML = "";
        el.suggestInput.value = "";
        el.suggestInput.placeholder = "No suggestions";
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
        var newWord = el.suggestInput.value.replace(/^\s+|\s+$/g, "");
        if (!newWord) { setStatus("Type or pick a replacement first.", "warning"); return; }
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

    el.btnReveal.addEventListener("click", function () { revealSelected(); });
    function revealSelected() {
        if (!state.selectedLower) { setStatus("Select a misspelled word first.", "warning"); return; }
        var selectedRow = el.locationsList.querySelector(".row-item.selected");
        var index = selectedRow ? parseInt(selectedRow.dataset.index, 10) : 0;
        callHost("csReveal", { lower: state.selectedLower, index: index }).then(function (res) {
            if (!res.ok) setStatus(res.error || "Could not reveal location.", "error");
        });
    }

    el.btnUndo.addEventListener("click", function () {
        callHost("csUndo").then(function (res) {
            if (res.ok) setStatus("Undid last change.", null);
            else setStatus(res.error || "Nothing to undo.", "warning");
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
    [el.dictOverlay, el.helpOverlay].forEach(function (ov) {
        ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("open"); });
    });

    el.btnVerifyDict.addEventListener("click", function () {
        el.dictOverlayBody.textContent = "Checking…";
        openOverlay("dictOverlay");
        callHost("csVerifyDictionaries").then(function (res) {
            if (!res.ok) { el.dictOverlayBody.textContent = res.error || "Could not verify dictionaries."; return; }
            renderDictOverlay(res.result);
        });
    });

    function renderDictOverlay(r) {
        var html = "";
        html += '<div class="dict-summary">' +
            '<span><span class="num">' + r.loaded + '</span> loaded</span>' +
            '<span><span class="num">' + r.missing + '</span> missing</span>' +
            '<span><span class="num">' + r.error + '</span> errors</span>' +
            '</div>';
        html += '<p style="color:var(--muted);font-size:10.5px;margin-bottom:10px;">Folder: ' + escapeHtml(r.dictionaryPath) +
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

    // ---------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------
    function init() {
        callHost("csGetInfo").then(function (res) {
            if (res.ok) {
                $("appTitle").textContent = res.appName;
                $("appByline").textContent = "by " + res.author + " · v" + res.version;
                if (!res.hasProject) setStatus("Open an After Effects project to get started.", "warning");
            }
        });
        renderStats(null);
        renderWordsList();
        clearDetail();
    }

    init();
})();
