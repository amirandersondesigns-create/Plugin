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
            '<path class="i-acc-line i-dash" d="M10 19h140"/><text class="i-cap" x="140" y="16">-6 dB</text>',
        cube:
            '<g class="ill-spin3d"><path class="i-fill" d="M80 10 112 26v34L80 76 48 60V26z"/><path class="i-dim i-fill" d="M80 42 112 26v34L80 76z"/><path class="i-acc-line" d="M48 26 80 42 112 26M80 42v34"/></g>',
        mask:
            '<rect class="i-fill i-dim" x="20" y="16" width="120" height="48" rx="3"/>' +
            '<rect class="i-fill ill-wipe" x="20" y="16" width="120" height="48" rx="3" style="opacity:1"/>' +
            '<rect class="i-acc-line i-dash" x="20" y="16" width="120" height="48" rx="3" fill="none"/>',
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
