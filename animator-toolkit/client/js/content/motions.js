/*
 * Motion presets — declarative definitions consumed by the host's
 * preset.apply (host/commands/presets.jsx). Each motion has an In and an
 * Out variant; their ids ("motion.bounce.in") are what favorites store.
 *
 *   groups   which tabs show it: "graphic" (Animate) and/or "text"
 *   tier     "essential" or "more" (the "More effects" section)
 *   def      host definition (without phase); `steps` = several at once
 *   preview  CSS animation used for the thumbnail (css/previews.css)
 */
(function (AT) {
    "use strict";

    var M = [
        { id: "fade", title: "Fade", groups: ["graphic", "text"], tier: "essential", preview: "fade", duration: 12,
          def: { kind: "fade" },
          summary: "Opacity from 0 to 100%.", why: "The most neutral transition. Pair it with a small move so it doesn't feel flat." },
        { id: "slide-up", titleIn: "Slide Up", title: "Slide Up", titleOut: "Slide Out Up", groups: ["graphic", "text"], tier: "essential", preview: "slide-up", duration: 15,
          def: { kind: "slide", direction: "up", distance: 80 },
          summary: "Moves up 80px into its resting position.", why: "Upward motion reads as positive and energetic — the default headline entrance." },
        { id: "slide-down", titleIn: "Slide Down", title: "Slide Down", titleOut: "Slide Out Down", groups: ["graphic"], tier: "essential", preview: "slide-down", duration: 15,
          def: { kind: "slide", direction: "down", distance: 80 },
          summary: "Moves down 80px into place.", why: "Feels like something settling or being lowered in." },
        { id: "slide-left", titleIn: "Slide Left", title: "Slide Left", titleOut: "Slide Out Left", groups: ["graphic"], tier: "essential", preview: "slide-left", duration: 15,
          def: { kind: "slide", direction: "left", distance: 120 },
          summary: "Moves leftward 120px into place.", why: "Right-to-left entrances feel like arriving; great for lower-third bars." },
        { id: "slide-right", titleIn: "Slide Right", title: "Slide Right", titleOut: "Slide Out Right", groups: ["graphic"], tier: "essential", preview: "slide-right", duration: 15,
          def: { kind: "slide", direction: "right", distance: 120 },
          summary: "Moves rightward 120px into place.", why: "Follows reading direction — natural for text and data." },
        { id: "scale", title: "Scale", groups: ["graphic", "text"], tier: "essential", preview: "scale", duration: 12,
          def: { kind: "scale", from: 0 },
          summary: "Grows from 0% to full size around the anchor point.", why: "Set the anchor first — scale always grows from it." },
        { id: "slide-fade", titleIn: "Slide Up + Fade", title: "Slide Up + Fade", titleOut: "Slide Out + Fade", groups: ["graphic", "text"], tier: "essential", preview: "slide-fade", duration: 15,
          def: { steps: [{ kind: "fade" }, { kind: "slide", direction: "up", distance: 40 }] },
          summary: "Fade and a short upward move together.", why: "The workhorse broadcast entrance: calm, legible, quick." },
        { id: "tracking", title: "Tracking", groups: ["text"], tier: "essential", preview: "tracking", duration: 20, requires: "text",
          def: { kind: "text-tracking", amount: 40 },
          summary: "Letters start spread apart and close up to the final tracking.", why: "Elegant for titles. Adds a Text Animator you can twirl open and tweak." },
        { id: "blur", title: "Blur", groups: ["graphic", "text"], tier: "essential", preview: "blur", duration: 12,
          def: { kind: "blur", amount: 40 },
          summary: "From blurry to sharp with a Gaussian Blur effect.", why: "Feels like a lens focusing. Combine with Fade for a soft reveal." },

        { id: "pop", title: "Pop", groups: ["graphic", "text"], tier: "more", preview: "pop", duration: 12,
          def: { kind: "scale", from: 0, shape: "pop" },
          summary: "Scales up past full size (112%) then settles.", why: "The overshoot gives weight and snap — icons, badges, bugs." },
        { id: "bounce", title: "Bounce", groups: ["graphic", "text"], tier: "more", preview: "bounce", duration: 24,
          def: { kind: "scale", from: 0, shape: "bounce" },
          summary: "Scales in with a springy overshoot that settles in a few wobbles.", why: "Playful and physical. Use sparingly in news — once per screen is plenty." },
        { id: "drop", titleIn: "Drop In", titleOut: "Drop Out", title: "Drop Bounce", groups: ["graphic", "text"], tier: "more", preview: "drop", duration: 24,
          def: { kind: "slide", shape: "drop", direction: "down", distance: 160 },
          summary: "Falls into place from above and bounces on its resting position.", why: "Shows gravity and weight — the object 'lands'." },
        { id: "spin", title: "Spin", groups: ["graphic"], tier: "more", preview: "spin", duration: 15,
          def: { steps: [{ kind: "rotate", angle: 90 }, { kind: "scale", from: 0 }] },
          summary: "Rotates 90° while scaling in.", why: "Energetic accent for icons and logos." },
        { id: "wipe", title: "Wipe", groups: ["graphic"], tier: "more", preview: "wipe", duration: 15,
          def: { kind: "wipe", direction: "right", feather: 0 },
          summary: "Reveals left to right with a Linear Wipe effect.", why: "A clean reveal for bars, lines and shapes without moving them." },
        { id: "type-on", titleIn: "Type On", title: "Type On", titleOut: "Type Off", groups: ["text"], tier: "more", preview: "typeon", duration: 30, requires: "text",
          def: { kind: "text-reveal", basedOn: "characters" },
          summary: "Characters appear one at a time.", why: "Uses a Range Selector — the core of After Effects text animation. Twirl it open to learn how it works." },
        { id: "word-reveal", titleIn: "Word Reveal", title: "Word Reveal", titleOut: "Word Hide", groups: ["text"], tier: "more", preview: "words", duration: 24, requires: "text",
          def: { kind: "text-reveal", basedOn: "words", offsetY: 30 },
          summary: "Words rise and appear one after another.", why: "Word-by-word pacing matches how people read a headline." },
        { id: "line-reveal", titleIn: "Line Reveal", title: "Line Reveal", titleOut: "Line Hide", groups: ["text"], tier: "more", preview: "lines", duration: 20, requires: "text",
          def: { kind: "text-reveal", basedOn: "lines", offsetY: 40 },
          summary: "Each line of a paragraph rises in turn.", why: "For multi-line quotes and bullet lists." },
        { id: "blur-chars", titleIn: "Soft Letters", title: "Soft Letters", titleOut: "Soft Letters Out", groups: ["text"], tier: "more", preview: "typeon", duration: 24, requires: "text",
          def: { kind: "text-reveal", basedOn: "characters", blur: 20 },
          summary: "Characters fade in from blurry one by one.", why: "A gentler, more premium type-on." },
        // ---- more essentials ----
        { id: "zoom", title: "Zoom", groups: ["graphic", "text"], tier: "essential", preview: "zoom", duration: 15,
          def: { steps: [{ kind: "fade" }, { kind: "scale", from: 140 }] },
          summary: "Settles down from 140% while fading in.", why: "Feels like the element lands on screen. Big, confident, still clean." },
        { id: "soft-scale", title: "Soft Scale", groups: ["graphic", "text"], tier: "essential", preview: "soft-scale", duration: 12,
          def: { steps: [{ kind: "fade" }, { kind: "scale", from: 85 }] },
          summary: "A small scale-up from 85% with a fade.", why: "Subtle and elegant; the go-to for secondary information." },
        { id: "grow-x", titleIn: "Grow Across", titleOut: "Shrink Across", title: "Grow Across", groups: ["graphic"], tier: "essential", preview: "grow-x", duration: 15,
          def: { kind: "scale", axis: "x", from: 0 },
          summary: "Stretches in horizontally from the anchor point.", why: "The classic lower-third bar build. Put the anchor on the left edge first." },
        { id: "grow-y", titleIn: "Grow Up", titleOut: "Shrink Down", title: "Grow Up", groups: ["graphic"], tier: "essential", preview: "grow-y", duration: 15,
          def: { kind: "scale", axis: "y", from: 0 },
          summary: "Stretches in vertically from the anchor point.", why: "Bars in a chart, dividers, rules. Anchor at the bottom to grow upward." },
        { id: "slide-left-fade", titleIn: "Slide Left + Fade", titleOut: "Slide Out Left + Fade", title: "Slide Left + Fade", groups: ["graphic", "text"], tier: "essential", preview: "slide-left-fade", duration: 15,
          def: { steps: [{ kind: "fade" }, { kind: "slide", direction: "left", distance: 60 }] },
          summary: "Fade with a short move from the right.", why: "A calm sideways entrance for names and captions." },
        { id: "rise-letters", titleIn: "Rise Letters", titleOut: "Sink Letters", title: "Rise Letters", groups: ["text"], tier: "essential", preview: "words", duration: 20, requires: "text",
          def: { kind: "text-reveal", basedOn: "characters", offsetY: 40 },
          summary: "Letters rise into place one after another.", why: "A friendly, readable cascade. Built with a Text Animator you can edit." },
        { id: "blur-words", titleIn: "Blur Words", titleOut: "Blur Words Out", title: "Blur Words", groups: ["text"], tier: "essential", preview: "words", duration: 20, requires: "text",
          def: { kind: "text-reveal", basedOn: "words", blur: 25 },
          summary: "Each word sharpens into view in turn.", why: "Soft and cinematic; keeps long headlines readable." },

        // ---- more effects ----
        { id: "elastic", title: "Elastic", groups: ["graphic", "text"], tier: "more", preview: "elastic", duration: 30,
          def: { kind: "scale", from: 0, shape: "elastic" },
          summary: "Springs in with a wobbly, rubbery settle.", why: "Big personality. Great for icons and stickers; too much for serious news." },
        { id: "swing", title: "Swing", groups: ["graphic"], tier: "more", preview: "swing", duration: 24,
          def: { steps: [{ kind: "rotate", angle: 25, shape: "elastic" }, { kind: "fade" }] },
          summary: "Swings into place like a hanging sign.", why: "Put the anchor at the top edge so it swings from there." },
        { id: "whip", titleIn: "Whip In", titleOut: "Whip Out", title: "Whip", groups: ["graphic", "text"], tier: "more", preview: "whip", duration: 10,
          def: { steps: [{ kind: "slide", direction: "left", distance: 400, easing: "strong" }, { kind: "blur", amount: 30 }] },
          summary: "A fast, blurred whip from the side.", why: "Energetic transitions and quick info reveals. Motion blur sells it." },
        { id: "anticipate", titleIn: "Anticipate Up", titleOut: "Anticipate Out", title: "Anticipate", groups: ["graphic", "text"], tier: "more", preview: "anticipate", duration: 18,
          def: { kind: "slide", direction: "up", distance: 80, shape: "anticipate" },
          summary: "Dips back first, then shoots up into place.", why: "Anticipation, a classic animation principle, makes a move feel intentional." },
        { id: "stretch", titleIn: "Stretch In", titleOut: "Stretch Out", title: "Stretch", groups: ["graphic"], tier: "more", preview: "stretch", duration: 24,
          def: { kind: "scale", axis: "x", from: 0, shape: "elastic" },
          summary: "Stretches across with a springy overshoot.", why: "Rubber-band energy for bars and underlines." },
        { id: "wipe-down", titleIn: "Wipe Down", titleOut: "Wipe Up Out", title: "Wipe Down", groups: ["graphic"], tier: "more", preview: "wipe-down", duration: 15,
          def: { kind: "wipe", direction: "down" },
          summary: "Reveals top to bottom with a Linear Wipe.", why: "Curtain-style reveal for panels and images." },
        { id: "pop-letters", titleIn: "Pop Letters", titleOut: "Pop Letters Out", title: "Pop Letters", groups: ["text"], tier: "more", preview: "typeon", duration: 24, requires: "text",
          def: { kind: "text-reveal", basedOn: "characters", scale: 0 },
          summary: "Each letter scales up from nothing, one after another.", why: "Bouncy and fun for short words and numbers." },
        { id: "spin-letters", titleIn: "Spin Letters", titleOut: "Spin Letters Out", title: "Spin Letters", groups: ["text"], tier: "more", preview: "typeon", duration: 24, requires: "text",
          def: { kind: "text-reveal", basedOn: "characters", scale: 0, rotation: 90 },
          summary: "Letters spin and grow into place.", why: "A flourish for titles. Uses Rotation and Scale on one Text Animator." },
        { id: "random-letters", titleIn: "Random Letters", titleOut: "Random Letters Out", title: "Random Letters", groups: ["text"], tier: "more", preview: "typeon", duration: 24, requires: "text",
          def: { kind: "text-reveal", basedOn: "characters", random: true },
          summary: "Letters appear in random order.", why: "Techy, data-like texture. Randomize Order is a Range Selector option." },

        // ---- easy 3D (3D tab) ----
        { id: "flip", titleIn: "Flip In", titleOut: "Flip Out", title: "Flip", groups: ["threed"], tier: "essential", preview: "flip", duration: 18,
          def: { steps: [{ kind: "rotate3d", axis: "y", angle: 90 }, { kind: "fade" }] },
          summary: "Turns in around its vertical axis (Y Rotation).", why: "Makes the layer 3D automatically. The anchor point is the hinge." },
        { id: "tumble", titleIn: "Tumble In", titleOut: "Tumble Out", title: "Tumble", groups: ["threed"], tier: "essential", preview: "tumble", duration: 18,
          def: { steps: [{ kind: "rotate3d", axis: "x", angle: 90 }, { kind: "fade" }] },
          summary: "Tips forward into place (X Rotation).", why: "Like a card falling flat onto the screen." },
        { id: "door", titleIn: "Door Swing", titleOut: "Door Close", title: "Door Swing", groups: ["threed"], tier: "essential", preview: "door", duration: 24,
          def: { kind: "rotate3d", axis: "y", angle: 110, easing: "strong" },
          summary: "Swings open like a door on its hinge.", why: "Set the anchor to the left or right edge first (Animate tab) so it hinges there." },
        { id: "from-depth", titleIn: "Fly From Depth", titleOut: "Fly Into Depth", title: "Fly From Depth", groups: ["threed"], tier: "essential", preview: "depth", duration: 20,
          def: { steps: [{ kind: "depth", distance: 1200 }, { kind: "fade" }] },
          summary: "Travels toward the viewer from far back in Z.", why: "Real 3D travel: with a camera and other layers it creates parallax." },
        { id: "card-flip", titleIn: "Card Flip", titleOut: "Card Flip Out", title: "Card Flip", groups: ["threed"], tier: "more", preview: "flip", duration: 24,
          def: { kind: "rotate3d", axis: "y", angle: 180, shape: "pop" },
          summary: "A full half-turn with a little overshoot.", why: "Reveal-style flip. Pairs well with two layers back to back." },
        { id: "bounce-3d", titleIn: "Bounce From Depth", titleOut: "Bounce Into Depth", title: "Bounce From Depth", groups: ["threed"], tier: "more", preview: "depth", duration: 30,
          def: { kind: "depth", distance: 900, shape: "bounce" },
          summary: "Pops out of the depth and bounces into place.", why: "Playful 3D entrance for logos and stickers." },

        // ---- mask reveals (Mask tab) ----
        { id: "mask-wipe-right", titleIn: "Mask Wipe Right", titleOut: "Mask Wipe Out Right", title: "Mask Wipe Right", groups: ["mask"], tier: "essential", preview: "mask-right", duration: 15,
          def: { kind: "mask-wipe", direction: "right" },
          summary: "A rectangle mask reveals left to right.", why: "A true mask (not an effect): open the layer's Masks group to see and tweak the animated path." },
        { id: "mask-wipe-left", titleIn: "Mask Wipe Left", titleOut: "Mask Wipe Out Left", title: "Mask Wipe Left", groups: ["mask"], tier: "essential", preview: "mask-left", duration: 15,
          def: { kind: "mask-wipe", direction: "left" },
          summary: "A rectangle mask reveals right to left.", why: "Mirror of Wipe Right; handy for right-aligned graphics." },
        { id: "mask-wipe-up", titleIn: "Mask Wipe Up", titleOut: "Mask Wipe Out Up", title: "Mask Wipe Up", groups: ["mask"], tier: "essential", preview: "mask-up", duration: 15,
          def: { kind: "mask-wipe", direction: "up" },
          summary: "Reveals from the bottom edge upward.", why: "Text rising out of a bar: mask the text layer and wipe it up." },
        { id: "mask-wipe-down", titleIn: "Mask Wipe Down", titleOut: "Mask Wipe Out Down", title: "Mask Wipe Down", groups: ["mask"], tier: "essential", preview: "mask-down", duration: 15,
          def: { kind: "mask-wipe", direction: "down" },
          summary: "Reveals from the top edge downward.", why: "A curtain reveal for panels and photos." },
        { id: "mask-soft", titleIn: "Soft Mask Wipe", titleOut: "Soft Mask Wipe Out", title: "Soft Mask Wipe", groups: ["mask"], tier: "essential", preview: "mask-right", duration: 20,
          def: { kind: "mask-wipe", direction: "right", feather: 80 },
          summary: "A feathered mask wipe with a soft leading edge.", why: "Feather turns a hard wipe into a light-like sweep." },
        { id: "mask-iris", titleIn: "Iris Open", titleOut: "Iris Close", title: "Iris", groups: ["mask"], tier: "more", preview: "iris", duration: 18,
          def: { kind: "mask-iris" },
          summary: "A circular mask opens from the centre.", why: "Animated with Mask Expansion, so the circle keeps its shape." },
        { id: "mask-iris-pop", titleIn: "Iris Pop", titleOut: "Iris Pop Out", title: "Iris Pop", groups: ["mask"], tier: "more", preview: "iris", duration: 18,
          def: { kind: "mask-iris", shape: "pop" },
          summary: "Iris with a small overshoot.", why: "Adds snap to photo and avatar reveals." },
        { id: "mask-split-h", titleIn: "Split Open", titleOut: "Split Close", title: "Split Open", groups: ["mask"], tier: "more", preview: "split-h", duration: 15,
          def: { kind: "mask-split", direction: "horizontal" },
          summary: "Opens from a vertical centre line out to both sides.", why: "Symmetrical reveal for centred titles." },
        { id: "mask-split-v", titleIn: "Split Open Vertical", titleOut: "Split Close Vertical", title: "Split Open Vertical", groups: ["mask"], tier: "more", preview: "split-v", duration: 15,
          def: { kind: "mask-split", direction: "vertical" },
          summary: "Opens from a horizontal centre line up and down.", why: "Letterbox-style opening for full screens." }
    ];

    function variant(m, phase) {
        var title = phase === "in"
            ? (m.titleIn || m.title + " In")
            : (m.titleOut || m.title + " Out");
        var def;
        if (m.def.steps) {
            def = { title: title, steps: m.def.steps.map(function (s) {
                var d = JSON.parse(JSON.stringify(s));
                d.phase = phase;
                d.title = title;
                if (m.requires) d.requires = m.requires;
                return d;
            }) };
        } else {
            def = JSON.parse(JSON.stringify(m.def));
            def.phase = phase;
            def.title = title;
            if (m.requires) def.requires = m.requires;
        }
        return {
            type: "preset",
            id: "motion." + m.id + "." + phase,
            motionId: m.id,
            phase: phase,
            title: title,
            icon: "motion",
            groups: m.groups,
            tier: m.tier,
            preview: m.preview,
            duration: m.duration,
            requires: m.requires || null,
            def: def,
            view: { text: "text", threed: "threed", mask: "mask" }[m.groups[0]] || "animate",
            summary: (phase === "in" ? "Entrance: " : "Exit: ") + m.summary.charAt(0).toLowerCase() + m.summary.slice(1),
            why: m.why,
            keywords: [m.title, title, m.id, phase === "in" ? "entrance in reveal" : "exit out leave", m.groups.join(" "), m.def.kind || "", m.def.shape || ""].join(" ").toLowerCase()
        };
    }

    var presets = [];
    M.forEach(function (m) {
        presets.push(variant(m, "in"));
        presets.push(variant(m, "out"));
    });

    AT.content = AT.content || {};
    AT.content.motions = M;
    AT.content.presets = presets;
})(window.AT = window.AT || {});
