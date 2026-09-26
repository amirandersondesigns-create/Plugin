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
    add({ id: "keys.reverse", title: "Reverse Keys", icon: "reverse", view: "animate", command: "keyframes.reverse",
        summary: "Plays the selected keyframes backwards in time.",
        why: "Build an entrance, copy it to the end of the layer and reverse it to get a matching exit. Easing flips with it.",
        keywords: "reverse time flip mirror keyframes" });
    add({ id: "layers.stagger", title: "Stagger", icon: "stagger", view: "animate", command: "layers.stagger",
        summary: "Offsets selected layers one after another (frames or seconds), in the order you selected them.",
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

    // Curve presets: independent In/Out influence (see the Easing sliders).
    // curve = the value-graph bezier the panel draws.
    function curveOf(inf, outf) {
        return [outf > 0 ? outf / 100 : 1 / 3, outf > 0 ? 0 : 1 / 3, inf > 0 ? 1 - inf / 100 : 2 / 3, inf > 0 ? 1 : 2 / 3];
    }
    [["sine", "Sine", 33, 33, "Gentle, even ease. The safe default for UI-like motion."],
     ["quad", "Quad", 50, 50, "A little more pronounced than Sine. Good for most moves."],
     ["cubic", "Cubic", 70, 70, "Confident: quick in the middle, soft at both ends."],
     ["expo", "Expo", 90, 90, "Dramatic: almost still at the ends, very fast in the middle."],
     ["stop", "Smooth Stop", 85, 0, "Starts at full speed, glides to a stop. Perfect for entrances."],
     ["start", "Smooth Start", 0, 85, "Starts gently, leaves at full speed. Perfect for exits."],
     ["snap", "Snap", 95, 10, "Fast then locks into place. Punchy broadcast feel."],
     ["glide", "Glide", 60, 25, "Relaxed arrival with a light push-off. Calm, premium."]].forEach(function (c) {
        add({ id: "ease.curve." + c[0], title: c[1], icon: "ease", view: "easing", command: "easing.apply",
            payload: { mode: "custom", influenceIn: c[2], influenceOut: c[3] }, curve: curveOf(c[2], c[3]), tier: "curve",
            summary: c[1] + " (In " + c[2] + "% / Out " + c[3] + "%) on the selected keyframes.", why: c[4],
            keywords: "ease easing curve " + c[1].toLowerCase() + " " + c[0] });
    });
    // Physics: extra keyframes for a landing a plain ease can't make.
    [["overshoot", "Overshoot", [[0, 0], [0.6, 1.12], [1, 1]], "Goes a little past the target, then settles back. Adds weight and snap."],
     ["bounce", "Bounce", [[0, 0], [0.4, 1.16], [0.6, 0.92], [0.78, 1.04], [0.9, 0.99], [1, 1]], "Rebounds a few times before settling, like a ball."],
     ["elastic", "Elastic", [[0, 0], [0.3, 1.25], [0.45, 0.85], [0.6, 1.1], [0.73, 0.95], [0.86, 1.03], [1, 1]], "Springy wobble around the target. Playful; use sparingly."]].forEach(function (c) {
        add({ id: "ease.physics." + c[0], title: c[1], icon: "motion", view: "easing", command: "easing.physics", payload: { shape: c[0] },
            points: c[2], tier: "physics",
            summary: "Adds " + c[1].toLowerCase() + " keyframes between each pair of selected keyframes.", why: c[3],
            keywords: "ease easing physics spring " + c[0] });
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

    add({ id: "layers.rasterize", title: "Continuous Rasterize", icon: "sparkle", view: "animate", command: "layers.rasterize",
        summary: "Toggles Continuous Rasterize (shape/Illustrator/solids) or Collapse Transformations (pre-comps).",
        why: "Vector art scaled above 100% looks soft unless this switch (the sun icon in the timeline) is on. On pre-comps it passes 3D and blending through. It can slow previews, so use it where you need it.",
        keywords: "continuous rasterize collapse transformations sharp blurry vector illustrator scale switch" });

    // ---- masks ----
    add({ id: "mask.rect", title: "Rectangle Mask", icon: "mask", view: "mask", command: "mask.add", payload: { shape: "rect" },
        summary: "Adds a rectangle mask the size of the layer.", why: "A mask hides everything outside its path. Start from the layer's own bounds, then drag points or animate the path.",
        keywords: "mask rectangle add new path" });
    add({ id: "mask.ellipse", title: "Ellipse Mask", icon: "mask", view: "mask", command: "mask.add", payload: { shape: "ellipse" },
        summary: "Adds an ellipse mask fitted to the layer.", why: "Vignettes, spotlights and circular reveals.", keywords: "mask ellipse circle oval add" });
    add({ id: "mask.invert", title: "Invert Masks", icon: "reverse", view: "mask", command: "mask.invert",
        summary: "Flips every mask on the selected layers (show outside instead of inside).", why: "Same as the Inverted checkbox next to each mask.", keywords: "mask invert inverse flip" });
    add({ id: "mask.feather", title: "Feather Masks", icon: "blur", view: "mask", command: "mask.feather",
        summary: "Softens the edges of every mask on the selected layers.", why: "Feather blurs the mask edge. Soft edges read as light; hard edges read as graphic.", keywords: "mask feather soft edge blur" });

    // ---- 3D ----
    add({ id: "threed.make", title: "Make 3D", icon: "cube", view: "threed", command: "threed.make", payload: { on: true },
        summary: "Turns on the 3D switch (the cube) for selected layers.", why: "3D layers get X/Y rotation, a Z position, and are seen by cameras and lights.", keywords: "3d switch cube make layer" });
    add({ id: "threed.make2d", title: "Make 2D", icon: "layers", view: "threed", command: "threed.make", payload: { on: false },
        summary: "Turns the 3D switch off.", why: "Back to flat: cameras ignore 2D layers.", keywords: "2d flat switch" });
    add({ id: "threed.depthSpread", title: "Spread in Depth", icon: "dist-v", view: "threed", command: "threed.depthSpread",
        summary: "Places selected layers one behind another in Z (first selected in front).", why: "Layers at different depths move at different speeds when the camera moves: that's parallax, the core of a 3D look.", keywords: "3d depth z spread parallax distribute" });
    add({ id: "threed.renderer.extrude", title: "Extrude Renderer", icon: "cube", view: "threed", command: "threed.renderer", payload: { kind: "extrude" },
        summary: "Switches the comp to a 3D renderer that can extrude (Advanced 3D / Cinema 4D).", why: "Classic 3D can't make real depth. Extrusion needs Composition Settings > 3D Renderer set to Advanced 3D or Cinema 4D.", keywords: "3d renderer advanced cinema 4d extrude" });
    add({ id: "threed.renderer.classic", title: "Classic Renderer", icon: "cube", view: "threed", command: "threed.renderer", payload: { kind: "classic" },
        summary: "Switches the comp back to the Classic 3D renderer.", why: "Classic 3D is fastest and supports every effect; use it when you don't need extrusion.", keywords: "3d renderer classic" });
    add({ id: "text.extrude", title: "Extrude", icon: "cube", view: "threed", command: "text.extrude",
        summary: "Gives selected text/shape layers real 3D depth.", why: "Extruded type catches light and shows its sides as the camera moves. Needs the extrusion renderer.", keywords: "3d text extrude depth bevel geometry" });

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
    add({ id: "camera.dof.on", title: "Depth of Field On", icon: "camera", view: "camera", command: "camera.dof", payload: { on: true },
        summary: "Turns on depth of field for the camera.", why: "Blurs things nearer or farther than the focus distance, like a real lens. Pair with Focus on Layer.", keywords: "camera depth of field dof blur focus bokeh" });
    add({ id: "camera.dof.off", title: "Depth of Field Off", icon: "camera", view: "camera", command: "camera.dof", payload: { on: false },
        summary: "Turns depth of field off.", why: "DOF looks great but renders slower; switch it off while animating.", keywords: "camera depth of field off" });
    add({ id: "camera.focus", title: "Focus on Layer", icon: "sparkle", view: "camera", command: "camera.focusSelected",
        summary: "Sets focus distance to the selected layer (and turns DOF on).", why: "Keeps the subject sharp while the background falls off.", keywords: "camera focus distance layer sharp dof" });
    add({ id: "camera.shake", title: "Add Shake", icon: "bolt", view: "camera", command: "camera.shake",
        summary: "Adds a handheld shake (a wiggle expression on Position).", why: "A little shake makes a 3D move feel filmed. It's an expression, so change the numbers any time.", keywords: "camera shake handheld wiggle expression" });
    add({ id: "camera.shake.remove", title: "Remove Shake", icon: "close", view: "camera", command: "camera.shake", payload: { remove: true },
        summary: "Removes the toolkit's camera shake.", why: "Gets the locked-off camera back.", keywords: "camera shake remove" });
    add({ id: "camera.orbit-left", title: "Orbit Left", icon: "reverse", view: "camera", command: "camera.orbit", payload: { direction: "left" },
        summary: "Circles the camera around the comp centre (rotates an 'AT Camera Orbit' null).", why: "Orbiting shows the sides of 3D layers. It's done by parenting the camera to a null and rotating the null.", keywords: "camera orbit rotate around circle rig null" });
    add({ id: "camera.orbit-right", title: "Orbit Right", icon: "reverse", view: "camera", command: "camera.orbit", payload: { direction: "right" },
        summary: "Circles the camera the other way.", why: "Orbiting shows the sides of 3D layers. It's done by parenting the camera to a null and rotating the null.", keywords: "camera orbit rotate around circle rig null" });
    add({ id: "camera.lens-in", title: "Lens Zoom In", icon: "cam-push", view: "camera", command: "camera.lensZoom", payload: { percent: 30 },
        summary: "Animates the lens (Zoom) tighter, without moving the camera.", why: "A lens zoom flattens and magnifies; a dolly (Push In) travels and changes perspective. Knowing the difference is basic camera language.", keywords: "camera lens zoom focal length in" });
    add({ id: "camera.lens-out", title: "Lens Zoom Out", icon: "cam-pull", view: "camera", command: "camera.lensZoom", payload: { percent: -25 },
        summary: "Animates the lens wider.", why: "Widening reveals more of the scene without moving the camera.", keywords: "camera lens zoom wide out" });
    add({ id: "camera.select", title: "Select Camera", icon: "camera", view: "camera", command: "camera.select",
        summary: "Selects the comp's active camera layer.", why: "Handy when the camera is buried under dozens of layers.",
        keywords: "camera select find active" });

    // ---- preview & render speed ----
    [[1, "Full"], [2, "Half"], [3, "Third"], [4, "Quarter"]].forEach(function (r) {
        add({ id: "preview.res." + r[0], title: r[1] + " Resolution", icon: "grid", view: "preview", command: "preview.resolution", payload: { factor: r[0] },
            summary: "Sets the comp's Resolution/Down Sample Factor to " + r[1] + ".",
            why: r[0] === 1 ? "Every pixel is rendered: use for final checks." : "Renders 1 in " + (r[0] * r[0]) + " pixels, so previews play far sooner. Timing is identical; only detail drops.",
            keywords: "preview resolution down sample downsample factor " + r[1].toLowerCase() + " speed" });
    });
    [["off", "Off (Final Quality)", "Always full quality. Use for final checks."],
     ["adaptive", "Adaptive Resolution", "Drops resolution only while you drag or scrub, then sharpens. The best everyday setting."],
     ["draft", "Draft", "Fast 3D preview: simplified lights, shadows and depth of field."],
     ["fastDraft", "Fast Draft", "Draft plus lower resolution while interacting. For heavy 3D scenes."],
     ["wireframe", "Wireframe", "Layers drawn as outlines while you interact. Instant, for blocking out motion."]].forEach(function (f) {
        add({ id: "preview.fast." + f[0], title: f[1], icon: "bolt", view: "preview", command: "preview.fast", payload: { mode: f[0] },
            summary: "Fast Previews: " + f[1] + ".", why: f[2],
            keywords: "fast previews adaptive draft wireframe viewer speed " + f[0] });
    });
    [8, 16, 32].forEach(function (b) {
        add({ id: "project.bpc." + b, title: b + " bpc", icon: "sparkle", view: "preview", command: "project.bpc", payload: { bits: b },
            summary: "Project color depth: " + b + " bits per channel.",
            why: b === 8 ? "Fastest. Standard for broadcast graphics; fine unless gradients band." : b === 16 ? "Smoother gradients, about twice as slow. Use when you see banding." : "Float/HDR light and glows. Much slower; only when you need it.",
            keywords: "color depth bpc bits per channel 8 16 32 banding " + b });
    });
    add({ id: "preview.draft3d", title: "Draft 3D", icon: "cube", view: "preview", command: "preview.draft3d",
        summary: "Toggles Draft 3D: fast 3D previews without lights/shadows/DOF detail.", why: "3D is the slowest thing to preview. Draft 3D keeps the timing while you animate.", keywords: "draft 3d fast preview" });
    add({ id: "preview.workArea.3", title: "Work Area 3s", icon: "clock", view: "preview", command: "preview.workArea", payload: { seconds: 3 },
        summary: "Sets the work area to 3 seconds from the playhead.", why: "Previews only render the work area. A short range around what you're animating plays back almost instantly.", keywords: "work area preview range b n" });
    add({ id: "preview.workArea.6", title: "Work Area 6s", icon: "clock", view: "preview", command: "preview.workArea", payload: { seconds: 6 },
        summary: "Sets the work area to 6 seconds from the playhead.", why: "Previews only render the work area.", keywords: "work area preview range" });
    add({ id: "preview.purge", title: "Purge Cache", icon: "trash", view: "preview", command: "preview.purge",
        summary: "Clears RAM and disk preview cache.", why: "When previews stutter or show stale frames, purging frees memory. Edit > Purge > All Memory & Disk Cache.", keywords: "purge cache memory ram disk clear" });

    // ---- audio ----
    add({ id: "audio.minus3", title: "-3 dB", icon: "down", view: "preview", command: "audio.levels", payload: { delta: -3 },
        summary: "Lowers selected audio layers by 3 dB.", why: "-6 dB sounds about half as loud. Small moves are usually enough.", keywords: "audio level volume lower quieter db" });
    add({ id: "audio.plus3", title: "+3 dB", icon: "up", view: "preview", command: "audio.levels", payload: { delta: 3 },
        summary: "Raises selected audio layers by 3 dB.", why: "Watch the meter: peaks must never reach 0 dB.", keywords: "audio level volume louder db" });
    add({ id: "audio.bed", title: "Bed -12 dB", icon: "down", view: "preview", command: "audio.levels", payload: { db: -12 },
        summary: "Sets selected audio to -12 dB (Audio Levels).", why: "A common starting point for music under voice-over; then adjust by ear.", keywords: "audio music bed under voice over 12 db" });
    add({ id: "audio.reset", title: "Reset 0 dB", icon: "reverse", view: "preview", command: "audio.levels", payload: { reset: true },
        summary: "Resets Audio Levels to 0 dB (the file's own level).", why: "0 dB here means unchanged, not 'maximum'.", keywords: "audio reset level 0 db" });
    add({ id: "audio.fadeIn", title: "Audio Fade In", icon: "up", view: "preview", command: "audio.fade", payload: { phase: "in" },
        summary: "Fades audio up at the layer's start.", why: "Hard audio cuts click. A few frames of fade hides the edit.", keywords: "audio fade in" });
    add({ id: "audio.fadeOut", title: "Audio Fade Out", icon: "down", view: "preview", command: "audio.fade", payload: { phase: "out" },
        summary: "Fades audio down at the layer's end.", why: "Hard audio cuts click. A few frames of fade hides the edit.", keywords: "audio fade out" });

    // ---- capture -----------------------------------------------------------
    add({ id: "still.capture", title: "Grab Still", icon: "capture", view: "capture", command: "still.capture",
        summary: "Saves the current frame of the active comp as a PNG.",
        why: "Quick approval grabs and reference frames without touching the Render Queue.",
        keywords: "still capture frame png screenshot grab export image" });

    AT.content = AT.content || {};
    AT.content.actions = A;
})(window.AT = window.AT || {});
