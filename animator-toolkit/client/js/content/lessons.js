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
