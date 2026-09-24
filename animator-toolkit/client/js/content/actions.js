/*
 * Tool catalog. Every button in the panel, every search result and every
 * favorite that runs something points at one of these entries by id, so a
 * tool is defined exactly once.
 *
 *   id        stable id (favorites store it — never rename)
 *   command   host command (host/commands/*.jsx)
 *   payload   fixed payload for that command
 *   view      the tab that hosts the tool (for search "go to")
 *   summary   what it does (one line)
 *   why       why / when you'd use it — shown in Beginner mode and in ⓘ
 */
(function (AT) {
    "use strict";

    var A = [];
    function add(o) { o.type = "action"; A.push(o); }

    // ---- anchor ------------------------------------------------------------
    var grid = [
        ["top-left", "Top Left"], ["top-center", "Top Center"], ["top-right", "Top Right"],
        ["middle-left", "Middle Left"], ["center", "Center"], ["middle-right", "Middle Right"],
        ["bottom-left", "Bottom Left"], ["bottom-center", "Bottom Center"], ["bottom-right", "Bottom Right"]
    ];
    grid.forEach(function (g) {
        add({
            id: "anchor." + g[0], title: "Anchor " + g[1], icon: "anchor", view: "animate",
            command: "anchor.set", payload: { position: g[0] },
            summary: "Moves the anchor point to the " + g[1].toLowerCase() + " of the layer without moving the layer.",
            why: "The anchor point is the pivot for Scale and Rotation. Put it where the object should grow or turn from — bottom center for a lower-third bar that grows upward, left for a line that draws on.",
            keywords: "anchor pivot origin pan behind " + g[1].toLowerCase()
        });
    });

    // ---- keyframes ---------------------------------------------------------
    [["position", "Position", "P"], ["scale", "Scale", "S"], ["rotation", "Rotation", "R"],
     ["opacity", "Opacity", "T"], ["anchor", "Anchor Point", "A"], ["all", "All Transform", "⇧"]].forEach(function (k) {
        add({
            id: "keys." + k[0], title: "Key " + k[1], short: k[2], icon: "key", view: "animate",
            command: "keyframes.add", payload: { property: k[0] },
            summary: "Adds a " + k[1] + " keyframe at the playhead on selected layers.",
            why: "A keyframe records a value at a moment in time. Two keyframes with different values = animation. The shortcut in After Effects is Alt/Option+Shift+" + (k[2] === "⇧" ? "P/S/R/T" : k[2]) + ".",
            keywords: "keyframe add record " + k[1].toLowerCase()
        });
    });
    add({ id: "keys.delete", title: "Delete Keys", icon: "trash", view: "animate", command: "keyframes.delete",
        summary: "Deletes the selected keyframes.", why: "Same as pressing Delete with keyframes selected, but it won't delete a layer by accident.",
        keywords: "remove delete keyframes clear" });
    add({ id: "keys.reverse", title: "Reverse Keys", icon: "reverse", view: "animate", command: "keyframes.reverse",
        summary: "Plays the selected keyframes backwards in time.",
        why: "Build an entrance, copy it to the end of the layer and reverse it to get a matching exit. Easing flips with it.",
        keywords: "reverse time flip mirror keyframes" });
    add({ id: "layers.stagger", title: "Stagger", icon: "stagger", view: "animate", command: "layers.stagger", payload: { frames: 3 },
        summary: "Offsets selected layers by 3 frames each, in the order you selected them.",
        why: "Staggering (cascading) lets several elements share one animation but arrive one after another — the eye reads them in order.",
        keywords: "stagger cascade offset sequence layers delay" });

    // ---- easing ------------------------------------------------------------
    add({ id: "ease.linear", title: "Linear", icon: "linear", view: "easing", command: "easing.apply", payload: { mode: "linear" }, curve: [0.33, 0.33, 0.67, 0.67],
        summary: "Constant speed — no acceleration.", why: "Mechanical and even. Good for continuous motion (a ticker, a rotating globe), stiff for things that start and stop.",
        keywords: "linear constant speed ease none" });
    add({ id: "ease.both", title: "Easy Ease", icon: "ease", view: "easing", command: "easing.apply", payload: { mode: "both" }, curve: [0.33, 0, 0.67, 1],
        summary: "Slows into and out of the selected keyframes (F9).", why: "Real objects speed up and slow down. Easy Ease is the quickest way to make any move feel natural.",
        keywords: "easy ease f9 smooth in out both" });
    add({ id: "ease.in", title: "Easy Ease In", icon: "ease-in", view: "easing", command: "easing.apply", payload: { mode: "in" }, curve: [0.33, 0.33, 0.67, 1],
        summary: "Slows the motion as it arrives at the selected keyframe (Shift+F9).",
        why: "In After Effects, “In” means the side of the keyframe the motion comes IN from. Use it on the last keyframe of an entrance so the object lands softly.",
        keywords: "ease in shift f9 arrive land decelerate slow" });
    add({ id: "ease.out", title: "Easy Ease Out", icon: "ease-out", view: "easing", command: "easing.apply", payload: { mode: "out" }, curve: [0.33, 0, 0.67, 0.67],
        summary: "Eases the motion as it leaves the selected keyframe (Ctrl/Cmd+Shift+F9).",
        why: "“Out” is the side the motion goes OUT from. Use it on the first keyframe of an exit so the object gathers speed as it leaves.",
        keywords: "ease out leave depart accelerate" });
    add({ id: "ease.hold", title: "Hold", icon: "hold", view: "easing", command: "easing.apply", payload: { mode: "hold" }, curve: null,
        summary: "Freezes the value until the next keyframe, then jumps.", why: "For instant changes — a number that flips, a color that cuts — with no in-between frames.",
        keywords: "hold freeze step jump toggle hold keyframe" });
    [["gentle", "Gentle", 33], ["smooth", "Smooth", 50], ["strong", "Strong", 75], ["extreme", "Extreme", 90]].forEach(function (s) {
        add({ id: "ease." + s[0], title: s[1] + " Ease", icon: "ease", view: "easing", command: "easing.apply", payload: { mode: "both", influence: s[2] },
            curve: [s[2] / 100, 0, 1 - s[2] / 100, 1], pro: s[0] === "extreme",
            summary: "Easy Ease with " + s[2] + "% influence on both sides.",
            why: "Influence is how long the slowdown lasts. Higher = a longer, more dramatic glide into place.",
            keywords: "ease influence strength " + s[1].toLowerCase() });
    });

    // ---- align -------------------------------------------------------------
    [["left", "Align Left"], ["hcenter", "Center Horizontally"], ["right", "Align Right"],
     ["top", "Align Top"], ["vcenter", "Center Vertically"], ["bottom", "Align Bottom"], ["center", "Center in Comp"]].forEach(function (a) {
        add({ id: "align." + a[0], title: a[1], icon: "align-" + a[0], view: "animate", command: "layers.align", payload: { edge: a[0] },
            summary: a[1] + " — lines up the layer's visible edges with the comp.",
            why: "Same as the Align panel (Window > Align) with “Align Layers to: Composition”. Keyframes move with the layer, so animation is preserved.",
            keywords: "align center position snap layout comp " + a[1].toLowerCase() });
    });
    add({ id: "distribute.h", title: "Distribute Horizontally", icon: "dist-h", view: "animate", command: "layers.distribute", payload: { axis: "h" },
        summary: "Evenly spaces 3+ layers left to right.", why: "Even spacing reads as intentional. Keeps rows of icons or bullet points tidy.",
        keywords: "distribute space even horizontal" });
    add({ id: "distribute.v", title: "Distribute Vertically", icon: "dist-v", view: "animate", command: "layers.distribute", payload: { axis: "v" },
        summary: "Evenly spaces 3+ layers top to bottom.", why: "Even spacing reads as intentional. Keeps stacked lines tidy.",
        keywords: "distribute space even vertical" });

    // ---- layers ------------------------------------------------------------
    add({ id: "layers.nullParent", title: "Null + Parent", icon: "null", view: "animate", command: "layers.nullParent",
        summary: "Creates a null at the selection's center and parents the layers to it.",
        why: "Parenting lets one controller move a whole group. Animate the null and everything follows — the pro way to move a lower third as one unit.",
        keywords: "null parent controller group rig" });
    add({ id: "layers.null", title: "New Null", icon: "null", view: "animate", command: "layers.null",
        summary: "Adds an empty null layer.", why: "Nulls are invisible handles for parenting and expressions.", keywords: "null object create" });
    add({ id: "layers.precompose", title: "Pre-compose", icon: "precomp", view: "animate", command: "layers.precompose",
        summary: "Moves the selected layers into their own composition (Ctrl/Cmd+Shift+C).",
        why: "A pre-comp is a group you can animate as one layer — like a smart object in Photoshop.",
        keywords: "precompose precomp nest group comp smart object" });
    add({ id: "layers.marker", title: "Marker", icon: "marker", view: "animate", command: "layers.marker",
        summary: "Adds a marker at the playhead (on selected layers, or the comp).",
        why: "Markers are timeline notes — mark a beat, a VO cue or where a hit should land.",
        keywords: "marker note cue beat timeline" });
    add({ id: "layers.motionBlur", title: "Motion Blur", icon: "blur", view: "animate", command: "layers.motionBlur",
        summary: "Toggles motion blur on selected layers and turns on the comp switch.",
        why: "Real cameras blur fast motion. A touch of motion blur makes animation look filmed instead of computer-perfect.",
        keywords: "motion blur switch smooth fast" });

    // ---- text --------------------------------------------------------------
    add({ id: "text.create", title: "New Text", icon: "text", view: "text", command: "text.create", payload: { text: "Headline" },
        summary: "Adds a centered text layer with its anchor at the middle.",
        why: "Starting with a centered anchor means scale and rotation presets pivot from the middle of the words.",
        keywords: "text create type headline title new" });

    // ---- camera ------------------------------------------------------------
    add({ id: "camera.create", title: "Create Camera", icon: "camera", view: "camera", command: "camera.create", payload: { lens: "50mm", oneNode: true, make3D: true },
        summary: "Adds a 50mm one-node camera and makes the selected layers 3D.",
        why: "Cameras only see 3D layers. A one-node camera has no point of interest, so moves are easy to predict.",
        keywords: "camera create 3d lens" });
    [["push", "Push In", "Dolly toward the subject — builds focus and tension."],
     ["pull", "Pull Out", "Dolly away — reveals context or ends a scene."],
     ["truck-left", "Truck Left", "Slides the camera sideways. Often called a “pan”, but a true pan rotates the camera."],
     ["truck-right", "Truck Right", "Slides the camera sideways. Often called a “pan”, but a true pan rotates the camera."],
     ["pedestal-up", "Pedestal Up", "Raises the camera. Often called a “tilt”, but a true tilt rotates the camera."],
     ["pedestal-down", "Pedestal Down", "Lowers the camera. Often called a “tilt”, but a true tilt rotates the camera."]].forEach(function (m) {
        add({ id: "camera." + m[0], title: m[1], icon: "cam-" + m[0], view: "camera", command: "camera.move", payload: { move: m[0] },
            summary: m[1] + " from the playhead, eased.", why: m[2],
            keywords: "camera move " + m[1].toLowerCase() + " dolly pan tilt truck" });
    });
    add({ id: "camera.select", title: "Select Camera", icon: "camera", view: "camera", command: "camera.select",
        summary: "Selects the comp's active camera layer.", why: "Handy when the camera is buried under dozens of layers.",
        keywords: "camera select find active" });

    // ---- capture -----------------------------------------------------------
    add({ id: "still.capture", title: "Grab Still", icon: "capture", view: "capture", command: "still.capture",
        summary: "Saves the current frame of the active comp as a PNG.",
        why: "Quick approval grabs and reference frames without touching the Render Queue.",
        keywords: "still capture frame png screenshot grab export image" });

    AT.content = AT.content || {};
    AT.content.actions = A;
})(window.AT = window.AT || {});
