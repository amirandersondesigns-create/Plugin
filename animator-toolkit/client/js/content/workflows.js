/*
 * Guided workflows. Steps reference tools, presets and lessons by id —
 * they never implement automation of their own. Step types:
 *   { do: "<tool or preset id>", note }   one-click step
 *   { learn: "<lesson id>", note }         read first
 *   { text }                               manual step, just a checkbox
 */
(function (AT) {
    "use strict";

    var W = [
        { id: "workflow.lower-third", title: "Build a Lower Third", minutes: 5, illo: "lowerthird",
          summary: "Name bar with a background, a clean entrance and a matching exit.",
          steps: [
              { text: "Draw the background bar with the Rectangle tool (Q) and type the name (Ctrl/Cmd+T).", note: "Keep text inside the title-safe area (the inner guide; toggle with the ' key)." },
              { do: "anchor.middle-left", note: "Select the bar: its anchor goes to the left so it can grow from there." },
              { do: "motion.wipe.in", note: "Bar wipes on from the left." },
              { do: "motion.slide-fade.in", note: "Select the text layer — it rises in over the bar." },
              { do: "layers.stagger", note: "Select bar, then text: the text arrives 3 frames after." },
              { do: "motion.fade.out", note: "Select both: a quick shared exit at the end of the layers." },
              { do: "layers.motionBlur" },
              { do: "layers.nullParent", note: "One controller to position the whole lower third." }
          ] },
        { id: "workflow.headline", title: "Animate a Headline", minutes: 3, illo: "headline",
          summary: "Text entrance, easing and exit in under a minute.",
          steps: [
              { do: "text.create" },
              { do: "anchor.center", note: "Scales and pops grow from the middle." },
              { do: "motion.word-reveal.in" },
              { do: "motion.tracking.in", note: "Optional: stacks with the reveal for extra polish." },
              { do: "motion.fade.out" },
              { text: "Press Space to preview. Too slow? Lower the duration slider and re-apply — presets replace themselves." }
          ] },
        { id: "workflow.logo-pop", title: "Logo / Bug Pop-in", minutes: 2, illo: "bounce",
          summary: "A small graphic that lands with weight.",
          steps: [
              { do: "anchor.center" },
              { do: "motion.bounce.in", note: "Or Pop In for something more restrained." },
              { do: "motion.bounce.out", note: "Lands at the end of the layer — it won't fight the entrance." }
          ] },
        { id: "workflow.camera-push", title: "Slow Camera Push", minutes: 3, illo: "camera",
          summary: "Subtle parallax push on a flat graphic or photo layers.",
          steps: [
              { learn: "lesson.cameras" },
              { text: "Select your artwork layers, then create the camera — they become 3D." },
              { do: "camera.create" },
              { text: "Spread layers in depth: give background layers a larger Z Position (press P)." },
              { do: "camera.push", note: "From the playhead. A push of 200–300px over 2–4 seconds reads as calm." },
              { do: "still.capture", note: "Grab a frame for approval." }
          ] },
        { id: "workflow.list", title: "Cascade a List", minutes: 3, illo: "stagger",
          summary: "Bullets or data rows that arrive one after another.",
          steps: [
              { text: "Put each bullet on its own layer." },
              { do: "motion.slide-fade.in", note: "Select all bullets and apply once." },
              { do: "layers.stagger", note: "Selection order = arrival order." }
          ] }
    ];

    W.forEach(function (w) {
        w.type = "workflow";
        w.view = "learn";
        w.keywords = (w.title + " " + w.summary + " workflow guide how to").toLowerCase();
    });

    AT.content = AT.content || {};
    AT.content.workflows = W;
})(window.AT = window.AT || {});
