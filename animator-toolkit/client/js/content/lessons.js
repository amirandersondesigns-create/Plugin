/*
 * Micro-lessons: 30 seconds to 2 minutes each. `tryIt` links lessons to
 * the tools that practise them; `illo` picks a small illustration
 * (js/ui/illustrations.js).
 */
(function (AT) {
    "use strict";

    var L = [
        { id: "lesson.anchor", title: "Anchor Points", level: "essential", seconds: 60, illo: "anchor",
          body: [
              "Every layer has an anchor point — the crosshair it scales and rotates around. By default it's in the center of footage and at the origin of text and shapes.",
              "Want a bar to grow from its left edge? Move its anchor to the left first. Want a pendulum? Put the anchor at the top.",
              "Moving the anchor normally drags the layer with it. The anchor grid here (like the Pan Behind tool, Y) moves the anchor but keeps the artwork exactly where it is."
          ],
          tryIt: ["anchor.bottom-center", "anchor.center"], shortcuts: ["sc.anchor", "sc.pan-behind"] },
        { id: "lesson.keyframes", title: "Keyframes", level: "essential", seconds: 60, illo: "keyframes",
          body: [
              "A keyframe stores a value at a moment in time. After Effects fills in every frame between two keyframes — that's the animation.",
              "Click the stopwatch next to a property to start recording. From then on, changing the value at a new time adds a keyframe.",
              "Keep it simple: most moves need only two keyframes, a start and an end. Timing comes from their distance apart."
          ],
          tryIt: ["keys.position", "keys.all"], shortcuts: ["sc.position", "sc.u", "sc.next-key"] },
        { id: "lesson.easing", title: "Easing", level: "essential", seconds: 90, illo: "easing",
          body: [
              "Linear motion moves at one constant speed, which looks robotic. Easing changes the speed over the move: slow near a keyframe, faster in between.",
              "In After Effects, Easy Ease In affects motion arriving INTO a keyframe; Easy Ease Out affects motion leaving it. Designers used to CSS often expect the opposite — watch the curve preview.",
              "Influence controls how long the slowdown lasts. 33% is subtle; 75%+ is a dramatic glide."
          ],
          tryIt: ["ease.both", "ease.in", "ease.out"], shortcuts: ["sc.f9", "sc.graph"] },
        { id: "lesson.parenting", title: "Parenting", level: "essential", seconds: 60, illo: "parenting",
          body: [
              "Parenting links a child layer to a parent. Move, scale or rotate the parent and the child follows — but the child can still animate on its own.",
              "Use a null as the parent to move a whole lower third, or to rotate a group of planets around a sun.",
              "Parent with the pick whip (the spiral icon in the Parent column), or use Null + Parent here."
          ],
          tryIt: ["layers.nullParent"], shortcuts: ["sc.parent"] },
        { id: "lesson.precomp", title: "Pre-composing", level: "essential", seconds: 60, illo: "precomp",
          body: [
              "Pre-composing moves layers into their own composition, which then appears as a single layer — like a Smart Object in Photoshop.",
              "Use it to animate a group as one thing, to apply one effect to many layers, or to keep a busy timeline readable.",
              "Double-click a pre-comp layer to open it. Changes inside update everywhere it's used."
          ],
          tryIt: ["layers.precompose"], shortcuts: ["sc.precompose"] },
        { id: "lesson.layers", title: "Layers & Compositions", level: "basics", seconds: 45, illo: "layers",
          body: [
              "A composition is a timeline with a frame size, frame rate and duration. Layers stack top-to-bottom like in Photoshop.",
              "Each layer also has a span in time: its bar in the timeline. Where a layer starts and ends is its In and Out point."
          ],
          tryIt: [], shortcuts: ["sc.new-comp", "sc.trim-in"] },
        { id: "lesson.timeline", title: "The Timeline", level: "basics", seconds: 45, illo: "keyframes",
          body: [
              "The blue playhead (current time indicator) shows the frame you're looking at. Drag it, or use Page Up/Down to step one frame.",
              "Press Space to preview, or 0 on the number pad for a full RAM preview. B and N set the preview work area."
          ],
          tryIt: [], shortcuts: ["sc.space", "sc.home", "sc.next-frame"] },
        { id: "lesson.graph", title: "The Graph Editor", level: "basics", seconds: 90, illo: "easing",
          body: [
              "The Graph Editor (Shift+F3) shows how a value or its speed changes over time. Flat = still, steep = fast.",
              "The speed graph makes easing visible: an eased move starts and ends at zero speed, like a hill.",
              "Drag the yellow handles to shape the curve by hand once presets aren't enough."
          ],
          tryIt: ["ease.strong"], shortcuts: ["sc.graph"] },
        { id: "lesson.masks", title: "Masks & Track Mattes", level: "basics", seconds: 75, illo: "matte",
          body: [
              "A mask is a path drawn on a layer that hides everything outside it. Draw one with the Pen (G) or a shape tool (Q) with the layer selected.",
              "A track matte uses one layer's alpha or brightness to show another. Put the matte directly above and set the Track Matte menu — it's how most text reveals behind a bar are made."
          ],
          tryIt: ["motion.wipe.in"], shortcuts: ["sc.pen", "sc.shape"] },
        { id: "lesson.nulls", title: "Null Objects", level: "basics", seconds: 45, illo: "parenting",
          body: [
              "A null is an invisible layer with a transform. It never renders; it's a handle for moving other layers through parenting."
          ],
          tryIt: ["layers.null", "layers.nullParent"], shortcuts: [] },
        { id: "lesson.cameras", title: "Cameras", level: "basics", seconds: 90, illo: "camera",
          body: [
              "A camera only sees 3D layers (the cube switch). Move the camera instead of the artwork to get real parallax.",
              "Push/pull (dolly) moves toward or away. Truck moves sideways, pedestal up and down. A pan or tilt rotates the camera instead.",
              "One-node cameras just point where they face; two-node cameras always look at a point of interest."
          ],
          tryIt: ["camera.create", "camera.push"], shortcuts: ["sc.camera-tool"] },
        { id: "lesson.motion-blur", title: "Motion Blur", level: "basics", seconds: 30, illo: "blur",
          body: [
              "Motion blur smears fast-moving layers like a real camera shutter would. It needs two switches: on the layer, and the comp's master switch at the top of the timeline."
          ],
          tryIt: ["layers.motionBlur"], shortcuts: [] },
        { id: "lesson.frame-rate", title: "Frame Rate & Timing", level: "principles", seconds: 60, illo: "timing",
          body: [
              "US broadcast runs at 29.97 fps. Six frames is 1/5 of a second — a quick hit; 15 frames is a relaxed half-second move; 30 frames is a slow, deliberate one.",
              "Match text on-screen time to reading speed: a rule of thumb is a second for every three to four words, plus a second."
          ],
          tryIt: [], shortcuts: [] },
        { id: "lesson.spacing", title: "Timing & Spacing", level: "principles", seconds: 60, illo: "timing",
          body: [
              "Timing is how long a move takes. Spacing is how far it travels each frame. Easing is really spacing: close together (slow) near keyframes, far apart (fast) in between.",
              "Turn on the motion path in the comp viewer — the dots show spacing for Position."
          ],
          tryIt: ["ease.both"], shortcuts: [] },
        { id: "lesson.overshoot", title: "Overshoot & Settle", level: "principles", seconds: 45, illo: "bounce",
          body: [
              "Real objects have momentum: they go slightly past where they're going, then settle back. A little overshoot makes motion feel physical.",
              "Pop and Bounce presets add that overshoot for you — look at the extra keyframes they create."
          ],
          tryIt: ["motion.pop.in", "motion.bounce.in"], shortcuts: [] },
        { id: "lesson.anticipation", title: "Anticipation & Follow-through", level: "principles", seconds: 45, illo: "bounce",
          body: [
              "Anticipation is a small move the opposite way before the main action — a crouch before a jump. Follow-through is parts that keep moving after the main body stops.",
              "Staggering related elements by a few frames is the simplest follow-through there is."
          ],
          tryIt: ["layers.stagger"], shortcuts: [] }
    ];

    // ---- Stuck? Quick fixes, and production know-how ----
    L.push(
        { id: "lesson.mask-visibility", title: "My mask path disappeared", level: "fixes", seconds: 30, illo: "mask",
          body: [
              "The mask is still there; only its outline is hidden. Two switches hide paths:",
              "1. The 'Toggle Mask and Shape Path Visibility' button at the bottom of the Composition viewer (it looks like a pen-drawn shape). Click it once.",
              "2. View > Show Layer Controls (Ctrl/Cmd+Shift+H). This also hides anchor points and handles when it's off.",
              "Also: the layer must be selected to see its paths. Press M with it selected to find the Mask Path property."
          ],
          tryIt: [], shortcuts: ["sc.layer-controls", "sc.mask"] },
        { id: "lesson.nothing-visible", title: "Nothing shows in my viewer", level: "fixes", seconds: 60, illo: "layers",
          body: [
              "Work down this list and you'll find it:",
              "Is the playhead inside the layer's bar? Layers only exist between their In and Out points. Press I to jump to the layer's start.",
              "Is the eye switch on, and is another layer soloed? Solo hides everything else.",
              "Opacity at 0, Scale at 0, or Position off-screen? Select the layer and press U to see what's animated.",
              "Is it a 3D layer behind the camera, or is the camera looking away? Press C and orbit, or switch the viewer to Front view.",
              "Is it a Guide layer, Shy layer (hidden from the timeline), or cut off by a mask or track matte?",
              "Caps Lock on (red bar)? The viewer is frozen. Resolution very low? Press Ctrl/Cmd+J for Full."
          ],
          tryIt: [], shortcuts: ["sc.in-out", "sc.u", "sc.caps", "sc.res-full"] },
        { id: "lesson.find-anything", title: "Finding anything in After Effects", level: "fixes", seconds: 45, illo: "welcome",
          body: [
              "Timeline: Ctrl/Cmd+F searches layers and properties by name. Type 'scale' to see every Scale.",
              "Effects: the Effects & Presets panel (Ctrl/Cmd+5) has a search field; double-click a result to apply it.",
              "Menus and help: the search box at the top right of After Effects searches Adobe's help.",
              "Missing panel? It's under the Window menu. Panels all over the place? Window > Workspace > Reset."
          ],
          tryIt: [], shortcuts: ["sc.find", "sc.effects-panel", "sc.workspace", "sc.window-menu"] },
        { id: "lesson.guides", title: "Guides, rulers & safe areas", level: "fixes", seconds: 45, illo: "lowerthird",
          body: [
              "Rulers (Ctrl/Cmd+R) let you drag guides out onto the viewer. Show/hide guides with Ctrl/Cmd+; and turn on snapping with Ctrl/Cmd+Shift+;.",
              "Press ' (apostrophe) for title/action safe. Broadcast text belongs inside the inner title-safe box.",
              "Guides don't render. They're only for you."
          ],
          tryIt: ["align.center"], shortcuts: ["sc.rulers", "sc.guides", "sc.snap-guides", "sc.safe"] },
        { id: "lesson.get-around", title: "Getting around fast", level: "fixes", seconds: 45, illo: "timing",
          body: [
              "~ (tilde) maximizes whatever panel is under the mouse. Great for the timeline.",
              "Viewer: , and . zoom, Shift+/ fits the comp. Timeline: X scrolls to the selected layer, I and O jump to its ends.",
              "J and K jump between keyframes; Page Up/Down steps a frame; Home and End go to the comp's ends."
          ],
          tryIt: [], shortcuts: ["sc.maximize", "sc.fit", "sc.scroll-layer", "sc.next-key"] },
        { id: "lesson.preview-speed", title: "Previewing at full speed", level: "production", seconds: 90, illo: "preview",
          body: [
              "Real-time preview is about rendering fewer pixels. Resolution/Down Sample Factor (under the viewer): Half renders 1/4 of the pixels, Quarter 1/16. Timing is unchanged, so animate at Half or Quarter and check at Full.",
              "'Auto' picks a lower resolution when you zoom the viewer out. 'Custom' lets you set any factor.",
              "Preview panel: turn on 'Cache Before Playback' so it plays smoothly once cached (the green bar). 'Skip' 1 renders every other frame for a fast rough look. Set Resolution to Auto and Frame Rate to Auto.",
              "Keep the work area short (B and N), use Draft 3D for 3D scenes, and switch off motion blur and depth of field while animating.",
              "8 bpc is the fastest color depth. Only raise it when gradients band.",
              "Stale or stuttering previews? Edit > Purge > All Memory & Disk Cache."
          ],
          tryIt: ["preview.res.2", "preview.workArea.3", "preview.draft3d"], shortcuts: ["sc.res-half", "sc.preview-num0", "sc.work-area", "sc.caps"] },
        { id: "lesson.rasterize", title: "Continuous Rasterize", level: "production", seconds: 45, illo: "matte",
          body: [
              "Vector layers (shapes, Illustrator art, solids) are drawn at 100% and then scaled, so blowing them up looks soft.",
              "Continuous Rasterize (the sun switch in the timeline) redraws them at every size so they stay sharp. On a pre-comp the same switch is Collapse Transformations: it passes 3D and blending modes through the pre-comp.",
              "It can slow previews, so turn it on where you need it."
          ],
          tryIt: ["layers.rasterize"], shortcuts: [] },
        { id: "lesson.bpc", title: "Color depth: 8, 16, 32 bpc", level: "production", seconds: 45, illo: "blur",
          body: [
              "Bits per channel set how many shades each color can have. Click the '8 bpc' label at the bottom of the Project panel to change it.",
              "8 bpc: fastest, standard for broadcast graphics. 16 bpc: smooth gradients, about twice as slow; use it when gradients band. 32 bpc: float, for HDR light and glows; much slower."
          ],
          tryIt: ["project.bpc.8", "project.bpc.16"], shortcuts: [] },
        { id: "lesson.audio", title: "Audio levels for TV, web & ads", level: "production", seconds: 60, illo: "audio",
          body: [
              "Watch the Audio panel's meter while previewing. Peaks must never hit 0 dB (red). Keep dialogue peaking around -12 to -6 dB, and music under voice-over around -18 to -24.",
              "Delivery specs measure average loudness (LUFS/LKFS) with a loudness meter in your editor or Audition: US broadcast and commercials (ATSC A/85, CALM Act) -24 LKFS; European broadcast (EBU R128) -23 LUFS; YouTube and streaming about -14 LUFS; podcasts about -16 LUFS. Keep true peaks under -1 to -2 dB.",
              "Always follow your network's own spec sheet when you have one."
          ],
          tryIt: ["audio.bed", "audio.fadeIn"], shortcuts: ["sc.preview-audio"] },
        { id: "lesson.3d", title: "Easy 3D: layers, renderer, extrusion", level: "production", seconds: 75, illo: "cube",
          body: [
              "Any layer becomes 3D with its cube switch: it gets Z Position and X/Y Rotation, and cameras can see it.",
              "Parallax comes from depth: spread layers in Z, then move the camera. Near layers pass faster than far ones.",
              "Real extruded 3D text needs a renderer that makes geometry: Composition Settings > 3D Renderer > Advanced 3D (or Cinema 4D). Classic 3D is faster and supports every effect.",
              "The anchor point is the hinge for flips and door swings: set it first."
          ],
          tryIt: ["threed.make", "threed.depthSpread", "camera.orbit-left"], shortcuts: ["sc.camera-tool", "sc.comp-settings"] }
    );

    L.forEach(function (l) {
        l.type = "lesson";
        l.view = "learn";
        l.summary = l.body[0];
        l.keywords = (l.title + " " + l.level + " lesson learn understand").toLowerCase();
    });

    AT.content = AT.content || {};
    AT.content.lessons = L;
    AT.content.essentials = ["lesson.anchor", "lesson.keyframes", "lesson.easing", "lesson.parenting", "lesson.precomp"];
})(window.AT = window.AT || {});
