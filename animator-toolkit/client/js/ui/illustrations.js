/*
 * Small teaching illustrations (inline SVG, themed through CSS classes:
 * .i-line stroke, .i-fill surfaces, .i-acc accent, .i-mut muted). Several
 * animate gently to demonstrate the idea they explain (css/app.css
 * "illustrations"), and all respect prefers-reduced-motion.
 */
(function (AT) {
    "use strict";

    var S = {
        anchor:
            '<rect class="i-grid" x="8" y="6" width="144" height="66" rx="3"/>' +
            '<g class="ill-rotate" style="transform-origin:52px 58px"><rect class="i-fill" x="28" y="26" width="48" height="32" rx="2"/></g>' +
            '<circle class="i-acc" cx="52" cy="58" r="3.5"/><path class="i-acc-line" d="M52 50v16M44 58h16"/>' +
            '<g class="ill-rotate-c" style="transform-origin:120px 42px"><rect class="i-fill i-dim" x="96" y="26" width="48" height="32" rx="2"/></g>' +
            '<circle class="i-mut" cx="120" cy="42" r="3"/>' +
            '<text class="i-cap" x="52" y="82">bottom</text><text class="i-cap" x="120" y="82">center</text>',
        keyframes:
            '<path class="i-line" d="M10 60h140"/>' +
            '<path class="i-acc-line" d="M34 60 34 20"/>' +
            '<rect class="i-acc" x="29" y="55" width="10" height="10" transform="rotate(45 34 60)"/>' +
            '<rect class="i-acc" x="121" y="55" width="10" height="10" transform="rotate(45 126 60)"/>' +
            '<circle class="i-fill ill-slide" cx="34" cy="30" r="9"/>' +
            '<text class="i-cap" x="34" y="78">0:00</text><text class="i-cap" x="126" y="78">0:15</text>',
        easing:
            '<path class="i-grid" d="M12 70h136M12 70V8"/>' +
            '<path class="i-mut-line" d="M12 70 148 10"/>' +
            '<path class="i-acc-line i-thick" d="M12 70C70 70 90 10 148 10"/>' +
            '<circle class="i-acc" cx="0" cy="0" r="4"><animateMotion dur="2.4s" repeatCount="indefinite" path="M12 70C70 70 90 10 148 10" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="spline" keySplines="0.65 0 0.35 1;0 0 1 1"/></circle>' +
            '<text class="i-cap" x="120" y="44">linear</text><text class="i-cap" x="62" y="34">eased</text>',
        parenting:
            '<rect class="i-fill i-dim" x="16" y="16" width="16" height="16" transform="rotate(45 24 24)"/>' +
            '<text class="i-cap" x="24" y="48">null</text>' +
            '<path class="i-acc-line i-dash" d="M34 24h36M34 24 70 56"/>' +
            '<g class="ill-drift"><rect class="i-fill" x="74" y="12" width="64" height="22" rx="2"/><rect class="i-fill i-dim" x="74" y="44" width="44" height="18" rx="2"/></g>',
        precomp:
            '<rect class="i-fill i-dim" x="10" y="14" width="56" height="10" rx="2"/><rect class="i-fill i-dim" x="10" y="30" width="56" height="10" rx="2"/><rect class="i-fill i-dim" x="10" y="46" width="56" height="10" rx="2"/>' +
            '<path class="i-acc-line" d="M76 35h20M90 29l6 6-6 6"/>' +
            '<rect class="i-fill" x="104" y="26" width="48" height="18" rx="2"/><text class="i-cap" x="128" y="58">1 layer</text>',
        layers:
            '<path class="i-fill i-dim" d="M80 12 140 30 80 48 20 30z"/><path class="i-fill" d="M80 24 140 42 80 60 20 42z"/><path class="i-acc-line" d="M20 54 80 72 140 54"/>',
        matte:
            '<rect class="i-fill i-dim" x="14" y="18" width="132" height="42" rx="2"/>' +
            '<rect class="i-acc ill-wipe" x="14" y="18" width="132" height="42" rx="2"/>' +
            '<text class="i-cap i-big" x="80" y="45">HEADLINE</text>',
        camera:
            '<path class="i-mut-line" d="M40 40 120 14M40 40 120 66"/>' +
            '<rect class="i-fill i-dim" x="112" y="16" width="6" height="48"/><rect class="i-fill" x="96" y="24" width="6" height="32"/>' +
            '<g class="ill-push"><rect class="i-acc" x="18" y="32" width="22" height="16" rx="2"/><path class="i-acc" d="M40 36l8-4v16l-8-4z"/></g>',
        blur:
            '<g class="ill-slide-x"><rect class="i-fill i-dim" x="30" y="28" width="24" height="24" rx="3" opacity=".25"/><rect class="i-fill i-dim" x="42" y="28" width="24" height="24" rx="3" opacity=".45"/><rect class="i-fill" x="54" y="28" width="24" height="24" rx="3"/></g>',
        timing:
            '<path class="i-line" d="M10 60h140"/>' +
            '<g class="i-acc">' + [0, 10, 18, 25, 31, 36, 40, 43].map(function (x, i) { return '<circle cx="' + (18 + x * 2.8) + '" cy="44" r="3.4"/>'; }).join("") + '</g>' +
            '<text class="i-cap" x="80" y="76">far apart = fast · close = slow</text>',
        bounce:
            '<path class="i-line" d="M10 66h140"/>' +
            '<path class="i-mut-line i-dash" d="M20 12C40 12 46 64 60 64S76 40 86 40s12 24 20 24 8-10 14-10 6 10 10 10"/>' +
            '<circle class="i-acc ill-bounce" cx="60" cy="56" r="8"/>',
        lowerthird:
            '<rect class="i-grid" x="6" y="6" width="148" height="72" rx="3"/>' +
            '<rect class="i-acc ill-grow" x="16" y="48" width="92" height="14" rx="1"/>' +
            '<rect class="i-fill ill-rise" x="20" y="36" width="60" height="9" rx="1"/>',
        headline:
            '<rect class="i-grid" x="6" y="6" width="148" height="72" rx="3"/>' +
            '<g class="ill-words"><rect class="i-fill" x="24" y="34" width="34" height="14" rx="1"/><rect class="i-fill" x="62" y="34" width="44" height="14" rx="1"/><rect class="i-fill" x="110" y="34" width="26" height="14" rx="1"/></g>',
        stagger:
            '<g class="ill-cascade"><rect class="i-fill" x="24" y="14" width="100" height="10" rx="1"/><rect class="i-fill" x="24" y="32" width="84" height="10" rx="1"/><rect class="i-fill" x="24" y="50" width="92" height="10" rx="1"/></g>',
        welcome:
            '<path class="i-grid" d="M12 70h136M12 70V8"/>' +
            '<path class="i-acc-line i-thick" d="M12 70C70 70 90 10 148 10"/>' +
            '<circle class="i-acc" cx="0" cy="0" r="5"><animateMotion dur="2.4s" repeatCount="indefinite" path="M12 70C70 70 90 10 148 10" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="spline" keySplines="0.65 0 0.35 1;0 0 1 1"/></circle>' +
            '<rect class="i-fill ill-pop" x="100" y="40" width="30" height="20" rx="3"/>',
        favorites:
            '<path class="i-acc ill-pop" d="M80 12l7 14 15.5 2.2-11.2 11 2.6 15.4L80 47.3l-13.9 7.3 2.6-15.4-11.2-11L73 26z"/>' +
            '<rect class="i-fill i-dim" x="22" y="58" width="30" height="16" rx="3"/><rect class="i-fill i-dim" x="65" y="62" width="30" height="12" rx="3"/><rect class="i-fill i-dim" x="108" y="58" width="30" height="16" rx="3"/>',
        preview:
            '<rect class="i-grid" x="10" y="8" width="64" height="52" rx="3"/>' +
            [0, 1, 2, 3].map(function (r) { return [0, 1, 2, 3].map(function (c) { return '<rect class="i-fill' + ((r + c) % 2 ? ' i-dim' : '') + '" x="' + (14 + c * 14) + '" y="' + (12 + r * 12) + '" width="13" height="11"/>'; }).join(""); }).join("") +
            '<rect class="i-grid" x="86" y="8" width="64" height="52" rx="3"/><rect class="i-fill" x="90" y="12" width="56" height="44" rx="2"/>' +
            '<text class="i-cap" x="42" y="76">Quarter: fast</text><text class="i-cap" x="118" y="76">Full: final</text>',
        audio:
            '<path class="i-line" d="M10 44h140"/>' +
            [18, 30, 46, 22, 58, 40, 26, 50, 34, 20, 44, 28, 16, 38, 24].map(function (hgt, i) { return '<rect class="' + (hgt > 50 ? 'i-acc' : 'i-fill') + ' ill-meter" style="animation-delay:' + (i * 0.07) + 's" x="' + (14 + i * 9) + '" y="' + (44 - hgt / 2) + '" width="5" height="' + hgt + '" rx="2"/>'; }).join("") +
            '<path class="i-acc-line i-dash" d="M10 19h140"/><text class="i-cap" x="138" y="16">-12 dB</text>',
        cube:
            '<g class="ill-spin3d"><path class="i-fill" d="M80 10 112 26v34L80 76 48 60V26z"/><path class="i-dim i-fill" d="M80 42 112 26v34L80 76z"/><path class="i-acc-line" d="M48 26 80 42 112 26M80 42v34"/></g>',
        mask:
            '<rect class="i-fill i-dim" x="20" y="16" width="120" height="48" rx="3"/>' +
            '<rect class="i-fill ill-wipe" x="20" y="16" width="120" height="48" rx="3" style="opacity:1"/>' +
            '<rect class="i-acc-line i-dash" x="20" y="16" width="120" height="48" rx="3" fill="none"/>',
        // Timeline: layer bars with In/Out points and a moving playhead.
        timeline:
            '<path class="i-grid" d="M10 16h140"/>' +
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(function (i) { return '<path class="i-grid" d="M' + (10 + i * 10) + ' 12v4"/>'; }).join("") +
            '<rect class="i-fill" x="18" y="24" width="96" height="10" rx="2"/><rect class="i-fill i-dim" x="46" y="40" width="100" height="10" rx="2"/><rect class="i-fill i-dim" x="10" y="56" width="70" height="10" rx="2"/>' +
            '<g class="ill-slide-x"><path class="i-acc-line i-thick" d="M60 10v62"/><path class="i-acc" d="M55 8h10v5l-5 4-5-4z"/></g>' +
            '<text class="i-cap" x="110" y="80">playhead</text>',
        // Speed graph: an eased move starts and ends at zero speed (a hill), with bezier handles.
        graph:
            '<path class="i-grid" d="M12 70h136M12 70V8"/>' +
            '<path class="i-acc-line i-thick" d="M12 70C60 70 56 14 80 14S100 70 148 70"/>' +
            '<path class="i-line" d="M12 70h30M148 70h-30"/><circle class="i-warn" cx="42" cy="70" r="3"/><circle class="i-warn" cx="118" cy="70" r="3"/>' +
            '<text class="i-cap" x="80" y="80">speed over time</text>',
        // Null: an invisible handle that carries its children.
        "null":
            '<g class="ill-rotate" style="transform-origin:48px 42px">' +
            '<path class="i-acc-line i-dash" d="M48 42h60M48 42 96 66"/>' +
            '<rect class="i-fill" x="104" y="34" width="40" height="16" rx="2"/><rect class="i-fill i-dim" x="92" y="60" width="34" height="14" rx="2"/></g>' +
            '<rect class="i-acc-line" x="40" y="34" width="16" height="16"/><path class="i-acc-line" d="M48 38v8M44 42h8"/>' +
            '<text class="i-cap" x="48" y="66">null (never renders)</text>',
        // Frame rate: frames in one second.
        fps:
            '<rect class="i-grid" x="8" y="22" width="144" height="34" rx="2"/>' +
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<rect class="i-fill' + (i % 2 ? ' i-dim' : '') + '" x="' + (12 + i * 14) + '" y="28" width="12" height="22" rx="1"/>'; }).join("") +
            '<path class="i-mut-line" d="M8 16h144M8 13v6M152 13v6"/>' +
            '<text class="i-cap" x="80" y="12">1 second</text><text class="i-cap" x="80" y="72">about 30 frames (29.97 fps)</text>',
        // Anticipation: a small wind-up the other way, then the action.
        anticipate:
            '<path class="i-line" d="M10 62h140"/>' +
            '<circle class="i-fill i-dim" cx="58" cy="50" r="10"/><circle class="i-fill i-dim" cx="40" cy="52" r="9" style="opacity:.6"/>' +
            '<path class="i-mut-line i-dash" d="M52 40c-6-8-14-8-16 2"/><path class="i-acc-line i-thick" d="M58 34c20-16 50-16 70 4M122 30l6 8-9 2"/>' +
            '<circle class="i-acc" cx="130" cy="50" r="10"/>' +
            '<text class="i-cap" x="40" y="76">wind-up</text><text class="i-cap" x="130" y="76">action</text>',
        // Overshoot: the value goes past its target, then settles.
        overshoot:
            '<path class="i-grid" d="M12 70h136M12 70V8"/>' +
            '<path class="i-mut-line i-dash" d="M12 24h136"/><text class="i-cap" x="140" y="20">target</text>' +
            '<path class="i-acc-line i-thick" d="M12 70C44 70 56 8 78 12S96 30 108 26 124 22 148 24"/>',
        // Nothing visible: empty viewer, layer pushed off-frame, hidden eye.
        empty:
            '<rect class="i-grid" x="10" y="8" width="112" height="66" rx="3"/>' +
            '<rect class="i-mut-line i-dash" x="112" y="30" width="40" height="22" rx="2"/>' +
            '<path class="i-line" d="M46 41c10-12 30-12 40 0-10 12-30 12-40 0z"/><circle class="i-mut" cx="66" cy="41" r="4"/><path class="i-acc-line i-thick" d="M50 27l32 28"/>' +
            '<text class="i-cap" x="66" y="68">check time, eye, opacity</text>',
        // Find: a search over the timeline's properties.
        find:
            '<rect class="i-fill i-dim" x="12" y="12" width="96" height="10" rx="2"/><rect class="i-fill" x="12" y="28" width="96" height="10" rx="2"/><rect class="i-fill i-dim" x="12" y="44" width="96" height="10" rx="2"/><rect class="i-fill i-dim" x="12" y="60" width="96" height="10" rx="2"/>' +
            '<g class="ill-drift"><circle class="i-acc-line i-thick" cx="112" cy="34" r="14"/><path class="i-acc-line i-thick" d="M122 44l14 14"/></g>',
        // Guides: rulers, guide lines and the title/action safe boxes.
        guides:
            '<rect class="i-grid" x="10" y="6" width="140" height="72" rx="2"/>' +
            '<rect class="i-mut-line i-dash" x="17" y="10" width="126" height="64"/><rect class="i-mut-line i-dash" x="24" y="13" width="112" height="58"/>' +
            '<path class="i-acc-line" d="M58 6v72M10 52h140"/>',
        // Getting around: J and K jump the playhead between keyframes.
        navigate:
            '<path class="i-line" d="M10 40h140"/>' +
            [34, 80, 126].map(function (x) { return '<rect class="i-acc" x="' + (x - 5) + '" y="35" width="10" height="10" transform="rotate(45 ' + x + ' 40)"/>'; }).join("") +
            '<g class="ill-jump"><path class="i-acc-line i-thick" d="M34 18v44"/><path class="i-acc" d="M29 14h10v5l-5 4-5-4z"/></g>' +
            '<rect class="i-grid" x="54" y="62" width="18" height="16" rx="3"/><text class="i-cap" x="63" y="74">J</text>' +
            '<rect class="i-grid" x="88" y="62" width="18" height="16" rx="3"/><text class="i-cap" x="97" y="74">K</text>',
        // Continuous Rasterize: blocky when scaled up (off) vs sharp (on).
        rasterize:
            '<circle class="i-fill" cx="47" cy="37" r="21" style="filter:blur(2.2px)"/>' +
            '<circle class="i-fill" cx="115" cy="37" r="21"/>' +
            '<text class="i-cap" x="47" y="76">switch off: soft</text><text class="i-cap" x="115" y="76">on: sharp</text>',
        // Color depth: banded 8 bpc gradient vs smooth higher depth.
        bpc:
            [0, 1, 2, 3, 4, 5].map(function (i) { return '<rect x="' + (12 + i * 22.6) + '" y="12" width="23" height="20" style="fill:var(--brand);opacity:' + (0.15 + i * 0.17).toFixed(2) + '"/>'; }).join("") +
            '<defs><linearGradient id="at-bpc-g"><stop offset="0" style="stop-color:var(--brand);stop-opacity:.15"/><stop offset="1" style="stop-color:var(--brand);stop-opacity:1"/></linearGradient></defs>' +
            '<rect x="12" y="44" width="136" height="20" fill="url(#at-bpc-g)"/>' +
            '<text class="i-cap" x="80" y="40">banding (can happen at 8 bpc)</text><text class="i-cap" x="80" y="76">smooth (16 or 32 bpc)</text>',
        capture:
            '<rect class="i-grid" x="10" y="8" width="140" height="66" rx="3"/>' +
            '<path class="i-acc-line" d="M18 20v-6h8M142 20v-6h-8M18 62v6h8M142 62v6h-8"/>' +
            '<circle class="i-fill" cx="80" cy="41" r="14"/><rect class="i-flash" x="10" y="8" width="140" height="66" rx="3"/>'
    };

    AT.illustration = function (name, cls) {
        var wrap = document.createElement("div");
        wrap.className = "illo" + (cls ? " " + cls : "");
        wrap.setAttribute("aria-hidden", "true");
        wrap.innerHTML = '<svg viewBox="0 0 160 84">' + (S[name] || S.welcome) + "</svg>";
        return wrap;
    };
    AT.illustrationNames = Object.keys(S);
})(window.AT = window.AT || {});
