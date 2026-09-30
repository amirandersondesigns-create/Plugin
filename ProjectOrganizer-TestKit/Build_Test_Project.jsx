// Build_Test_Project.jsx — Motion Project Organizer test kit
// Run from After Effects: File → Scripts → Run Script File… → pick this file.
//
// Creates a deliberately messy "NBA Finals open" project from the files in
// "Scattered Media", with a few traps that Motion Project Organizer should
// handle, then saves it into "Save Here". Nothing outside this kit is touched.
(function () {
    var kit = new File($.fileName).parent;
    var media = new Folder(kit.fsName + "/Scattered Media");
    if (!media.exists) { alert("Can't find the \"Scattered Media\" folder next to this script.\nUnzip the whole kit first."); return; }

    if (!app.newProject()) return; // user cancelled the save prompt

    var log = [], P = app.project;

    function imp(rel, opts) {
        opts = opts || {};
        var f = new File(media.fsName + "/" + rel);
        if (!f.exists) { log.push("Not found: " + rel); return null; }
        try {
            var io = new ImportOptions(f);
            if (opts.seq) io.sequence = true;
            if (opts.comp && io.canImportAs(ImportAsType.COMP)) io.importAs = ImportAsType.COMP;
            return P.importFile(io);
        } catch (e) { log.push("Couldn't import " + rel + " (" + e.message + ")"); return null; }
    }

    function add(comp, item) {
        if (!item) return null;
        try { var l = comp.layers.add(item); l.enabled = false; return l; }
        catch (e) { log.push("Couldn't add " + item.name + " to the comp (" + e.message + ")"); return null; }
    }

    var main = P.items.addComp("MAIN_1080", 1920, 1080, 1, 10, 29.97);

    // --- Footage from all over the place ---
    var clip    = imp("Volumes_Media/game7/game7_highlight.mov");
    var stock   = imp("Downloads/AdobeStock_998877.mov");
    var logo    = imp("Downloads/Lakers_logo.png");
    var head    = imp("Downloads/LeBron_headshot.jpg");
    var getty   = imp("Downloads/GettyImages-1234567.jpg");
    var team1   = imp("Downloads/team_photo.png");
    var team2   = imp("Downloads/Other/team_photo.png");
    var stats   = imp("Downloads/player stats.pdf");
    var mark    = imp("Brand/league_mark.ai");
    var ref     = imp("Refs/opener_styleframe.jpg");
    var vo      = imp("Audio/VO_intro_take2.wav");
    var sfx     = imp("Audio/whoosh_03.wav");
    var music   = imp("Audio/music_bed.mp3");
    var csv     = imp("Data/box_score.csv");
    var json    = imp("Data/standings.json");
    var crowd   = imp("Renders/crowd_seq/crowd_0001.png", { seq: true });
    var trophy  = imp("C4D_renders/trophy_beauty_0001.exr", { seq: true });
    var earth   = imp("Projects/Google Earth Studio/arena_flyin/footage/arena_flyin_000.jpeg", { seq: true });
    var bug     = imp("Design/scorebug.psd", { comp: true });   // layered PSD → comp + layer footage
    var unused  = imp("Downloads/arena_wide.tif");               // imported but never used

    // --- Traps the organizer must preserve ---
    if (logo) { logo.name = "TEAM LOGO (renamed)"; logo.label = 9; }          // custom name + label
    if (crowd) { try { crowd.mainSource.conformFrameRate = 24; } catch (e) {} } // interpretation
    if (unused) unused.comment = "Unused on purpose";

    var list = [clip, stock, logo, head, getty, team1, team2, stats, mark, ref, vo, sfx, music, csv, json, crowd, trophy, earth, bug];
    for (var i = 0; i < list.length; i++) add(main, list[i]);

    try { main.layers.addText("NBA FINALS · GAME 7"); } catch (e) { log.push("Couldn't add text layer"); }

    // --- A missing file: import a temporary copy, then delete it ---
    if (clip) {
        var tmpDir = new Folder(kit.fsName + "/Temp"); tmpDir.create();
        var tmp = new File(tmpDir.fsName + "/missing_bite.mov");
        if (clip.mainSource.file.copy(tmp)) {
            var gone = P.importFile(new ImportOptions(tmp));
            add(main, gone);
            if (!tmp.remove()) log.push("Couldn't delete Temp/missing_bite.mov — delete it by hand to test missing footage.");
        }
    }

    // --- Render queue item (for the "Retarget Render Queue" option) ---
    try {
        var rq = P.renderQueue.items.add(main);
        var outDir = new Folder(kit.fsName + "/Somewhere Else"); outDir.create();
        rq.outputModule(1).file = new File(outDir.fsName + "/MAIN_1080.mov");
    } catch (e) { log.push("Couldn't add render queue item"); }

    main.openInViewer();

    // --- Save somewhere that isn't organized yet ---
    var saveDir = new Folder(kit.fsName + "/Save Here"); saveDir.create();
    P.save(new File(saveDir.fsName + "/NBA_Finals_Open_v03.aep"));

    alert("Test project built and saved to:\n" + P.file.fsName +
          "\n\nNow open Window → Extensions → Motion Project Organizer, click Analyze, then Organize & Save." +
          (log.length ? "\n\nNotes:\n• " + log.join("\n• ") : ""));
})();
