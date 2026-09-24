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
          summary: "Characters fade in from blurry one by one.", why: "A gentler, more premium type-on." }
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
            view: m.groups[0] === "text" ? "text" : "animate",
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
