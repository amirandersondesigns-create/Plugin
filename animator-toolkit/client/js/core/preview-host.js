/*
 * Simulated host for previewing the panel in a normal browser. Answers
 * every command with a plausible success so layouts, feedback and flows can
 * be reviewed without After Effects. Nothing here runs inside AE.
 */
(function (AT) {
    "use strict";

    var demoContext = {
        project: true,
        comp: { name: "Lower Third", width: 1920, height: 1080, fps: 29.97, time: 1.2, frame: 36, hasCamera: false },
        layers: [{ name: "Headline", kind: "text", threeD: false }],
        kinds: { text: 1 },
        layerCount: 1,
        selectedKeys: 0
    };

    var feedbacks = {
        "anchor.set": function (p) { return "Anchor moved to " + String(p.position || "center").replace("-", " ") + " on 1 layer"; },
        "easing.apply": function (p) {
            if (p.mode === "custom") return "Ease In " + p.influenceIn + "% - Out " + p.influenceOut + "% applied to 2 keyframes";
            return ({ linear: "Linear", both: "Easy Ease", "in": "Easy Ease In", out: "Easy Ease Out", hold: "Hold" })[p.mode] + " applied to 2 keyframes";
        },
        "preset.apply": function (p) { return (p.title || "Preset") + " added to 1 layer"; },
        "camera.move": function (p) { return p.move + " added to Camera 1"; }
    };

    function handle(req) {
        var result = {};
        var fb = feedbacks[req.command] ? feedbacks[req.command](req.payload) : "Done";
        if (req.command === "context.inspect") result = demoContext;
        if (req.command === "easing.read") result = { property: "Position", layer: "Headline", curve: { x1: 0.15, y1: 0, x2: 0.25, y2: 1 } };
        if (req.command === "camera.read") result = { camera: "Camera 1", position: [960, 540, -2666.7], pointOfInterest: [960, 540, 0], zoom: 2666.7 };
        if (req.command === "still.capture") result = { path: "~/Desktop/Animator Toolkit Stills/Lower Third_f00036.png", folder: "~/Desktop/Animator Toolkit Stills" };
        if (req.command === "preview.read") result = { resolution: 2, bpc: 8, draft3d: false, fastPreview: "adaptive" };
        if (req.command === "still.chooseFolder") result = { folder: "~/Desktop/Stills" };
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve({ ok: true, requestId: req.requestId, result: result, feedback: fb, preview: true });
            }, 120);
        });
    }

    AT.previewHost = { handle: handle, context: demoContext };
})(window.AT = window.AT || {});
