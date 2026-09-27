// Copyright (c) 2026 Amir Anderson. All rights reserved. Unauthorized copying,
// recreation or distribution is prohibited. See LICENSE.txt.
// ============================================================================
// Animator Toolkit - still capture (EXPERIMENTAL)
//
// Uses CompItem.saveFrameToPng(), which After Effects ships but does not
// document. It renders the active comp at the current time through the
// active camera. Good for approval grabs and reference frames; for a
// deliverable still use the Render Queue. It never touches the Render
// Queue, so it can't accidentally render other queued items.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.defaultStillFolder = function () {
    return Folder.desktop.fsName + "/Animator Toolkit Stills";
};

AT.safeFileName = function (s) {
    return String(s).replace(/[\\\/:*?"<>|]+/g, "-").replace(/^\s+|\s+$/g, "") || "Still";
};

AT.timecodeTag = function (comp) {
    var frame = Math.round(comp.time / comp.frameDuration);
    var s = String(frame);
    while (s.length < 5) s = "0" + s;
    return "f" + s;
};

AT.register("still.capture", {
    label: "Capture Still",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var comp = ctx.comp;
        if (typeof comp.saveFrameToPng !== "function") {
            AT.fail("unsupported", "This version of After Effects can't save frames from scripts. Use Composition > Save Frame As instead.");
        }
        var folder = new Folder(payload.folder || AT.defaultStillFolder());
        if (!folder.exists && !folder.create()) AT.fail("io", "Couldn't create the folder " + folder.fsName + ".");

        // Size: Full, Half, Third or Quarter. Save Frame renders at the comp's
        // resolution, so set it for the grab and put it straight back.
        var scale = payload.scale === 2 || payload.scale === 3 || payload.scale === 4 ? payload.scale : 1;
        var SIZE = { 1: "", 2: "_half", 3: "_third", 4: "_quarter" };
        var base = AT.safeFileName(payload.fileName || comp.name) + "_" + AT.timecodeTag(comp) + SIZE[scale];
        var file = new File(folder.fsName + "/" + base + ".png");
        var n = 2;
        while (file.exists) {
            file = new File(folder.fsName + "/" + base + "_" + n + ".png");
            n++;
        }

        var oldRes = comp.resolutionFactor;
        if (scale !== 1) comp.resolutionFactor = [scale, scale];
        comp.saveFrameToPng(comp.time, file);
        // saveFrameToPng can return before the file is flushed; wait for it
        // before importing so the import doesn't fail on a missing file.
        var waited = 0;
        while (!file.exists && waited < 10000) {
            $.sleep(100);
            waited += 100;
        }
        if (scale !== 1) comp.resolutionFactor = oldRes;
        if (!file.exists) AT.fail("io", "After Effects didn't write the still. Try Composition > Save Frame As.");

        var w = Math.ceil(comp.width / scale), h = Math.ceil(comp.height / scale);
        var feedback = "Still saved (" + w + "x" + h + "): " + file.displayName;
        if (payload.importToProject) {
            app.project.importFile(new ImportOptions(file));
            feedback += " - imported";
        }
        return { result: { path: file.fsName, folder: folder.fsName, width: w, height: h, scale: scale }, feedback: feedback };
    }
});

AT.register("still.chooseFolder", {
    needs: "none",
    run: function (payload) {
        var start = new Folder(payload.folder || AT.defaultStillFolder());
        var picked = (start.exists ? start : Folder.desktop).selectDlg("Choose where stills are saved");
        return { result: { folder: picked ? picked.fsName : null } };
    }
});

AT.register("still.reveal", {
    needs: "none",
    run: function (payload) {
        var folder = new Folder(payload.folder || AT.defaultStillFolder());
        if (!folder.exists) folder.create();
        folder.execute();
        return { result: {}, feedback: "Opened " + folder.displayName };
    }
});

}($["com.aanders.animatortoolkit"]));
