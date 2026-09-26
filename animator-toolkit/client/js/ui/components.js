/*
 * Component kit. Small functions that return DOM nodes; every view is
 * built from these so interaction patterns stay identical across tabs.
 */
(function (AT) {
    "use strict";

    // ---- DOM helper --------------------------------------------------------
    function h(tag, attrs, children) {
        // "tag#id.class.class"
        var parts = tag.split(".");
        var head = parts[0].split("#");
        var el = document.createElement(head[0] || "div");
        if (head[1]) el.id = head[1];
        if (parts.length > 1) el.className = parts.slice(1).join(" ");
        // Attributes are optional: h("div", [children]) / h("span", "text").
        if (Array.isArray(attrs) || attrs instanceof Node || typeof attrs === "string") {
            children = attrs;
            attrs = {};
        }
        attrs = attrs || {};
        Object.keys(attrs).forEach(function (k) {
            var v = attrs[k];
            if (v === null || v === undefined || v === false) return;
            if (k === "on") {
                Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
            } else if (k === "class") {
                el.className += (el.className ? " " : "") + v;
            } else if (k === "style" && typeof v === "object") {
                Object.keys(v).forEach(function (s) { el.style.setProperty(s, v[s]); });
            } else if (k === "text") {
                el.textContent = v;
            } else {
                el.setAttribute(k, v === true ? "" : v);
            }
        });
        append(el, children);
        return el;
    }

    function append(el, children) {
        if (children === null || children === undefined || children === false) return;
        if (Array.isArray(children)) {
            children.forEach(function (c) { append(el, c); });
        } else if (children instanceof Node) {
            el.appendChild(children);
        } else {
            el.appendChild(document.createTextNode(String(children)));
        }
    }

    // Pro mode was removed: explanations are always shown.
    function isBeginner() {
        return true;
    }

    // ---- feedback ------------------------------------------------------------
    var toastTimer = null;
    AT.toast = function (message, kind, item) {
        var region = document.getElementById("toast");
        if (!region) return;
        region.innerHTML = "";
        var t = h("div.toast.toast-" + (kind || "info"), { role: kind === "error" ? "alert" : "status" }, [
            h("span.toast-msg", { text: message })
        ]);
        if (kind === "error" && item && item.why) {
            t.appendChild(h("button.toast-link", { type: "button", text: "What does this tool need?", on: { click: function () { AT.ui.explain(item); } } }));
        }
        region.appendChild(t);
        requestAnimationFrame(function () { t.classList.add("in"); });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            t.classList.remove("in");
            setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 200);
        }, kind === "error" ? 6000 : 2200);
    };

    function pulse(el) {
        el.classList.remove("did-run");
        void el.offsetWidth;
        el.classList.add("did-run");
    }

    // ---- info popover ("Why?") ---------------------------------------------------
    var openPop = null;
    function closePop() {
        if (openPop) {
            openPop.remove();
            openPop = null;
        }
    }
    document.addEventListener("click", function (e) {
        if (openPop && !openPop.contains(e.target) && !e.target.closest(".info-btn")) closePop();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });

    function explain(item, anchorEl) {
        closePop();
        var pop = h("div.popover", { role: "dialog", "aria-label": item.title }, [
            h("div.popover-title", { text: item.title }),
            item.summary ? h("p.popover-what", { text: item.summary }) : null,
            item.why ? h("p.popover-why", [h("strong", { text: "Why: " }), item.why]) : null,
            item.type === "action" || item.type === "preset" ? h("p.popover-meta", { text: needsText(item) }) : null
        ]);
        document.body.appendChild(pop);
        var r = anchorEl ? anchorEl.getBoundingClientRect() : { left: 16, bottom: 80, top: 80 };
        var w = Math.min(280, window.innerWidth - 24);
        pop.style.width = w + "px";
        pop.style.left = Math.max(12, Math.min(r.left - w / 2, window.innerWidth - w - 12)) + "px";
        var top = r.bottom + 6;
        if (top + pop.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - pop.offsetHeight - 6);
        pop.style.top = top + "px";
        requestAnimationFrame(function () { pop.classList.add("in"); });
        openPop = pop;
    }

    function needsText(item) {
        var c = item.command || "preset.apply";
        if (/^easing/.test(c) || c === "keyframes.delete" || c === "keyframes.reverse") return "Needs: keyframes selected in the timeline.";
        if (/^camera\.move|camera\.select/.test(c)) return "Needs: a comp with a camera (or a selected camera layer).";
        if (/^(anchor|preset|keyframes\.add|layers\.(align|distribute|nullParent|precompose|stagger|motionBlur))/.test(c)) return "Needs: one or more layers selected.";
        return "Needs: an open composition.";
    }

    function infoButton(item) {
        return h("button.info-btn", {
            type: "button", title: "What is this?", "aria-label": "About " + item.title,
            on: { click: function (e) { e.stopPropagation(); explain(item, e.currentTarget); } }
        }, AT.icon("info"));
    }

    function favButton(id) {
        var on = AT.favorites.isFavorite(id);
        var b = h("button.fav-btn" + (on ? ".on" : ""), {
            type: "button", title: on ? "Remove from Favorites" : "Add to Favorites",
            "aria-pressed": on ? "true" : "false",
            on: { click: function (e) {
                e.stopPropagation();
                var now = AT.favorites.toggle(id);
                b.classList.toggle("on", now);
                b.setAttribute("aria-pressed", now ? "true" : "false");
                b.title = now ? "Remove from Favorites" : "Add to Favorites";
                pulse(b);
            } }
        }, AT.icon("star"));
        b.dataset.fav = id;
        return b;
    }

    // ---- easing curve graph ------------------------------------------------------
    // bez = [x1, y1, x2, y2] (normalized value graph) or null for Hold.
    function curve(bez, opts) {
        opts = opts || {};
        var W = opts.width || 120, H = opts.height || 72, pad = opts.pad === undefined ? 8 : opts.pad;
        var ns = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);
        svg.setAttribute("class", "curve" + (opts.cls ? " " + opts.cls : ""));
        var gx = function (x) { return pad + x * (W - 2 * pad); };
        var gy = function (y) { return H - pad - y * (H - 2 * pad); };
        function el(name, attrs) {
            var n = document.createElementNS(ns, name);
            Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
            svg.appendChild(n);
            return n;
        }
        el("rect", { x: pad, y: pad, width: W - 2 * pad, height: H - 2 * pad, class: "curve-frame" });
        var d;
        if (opts.points) {
            // Physics shapes: [[time, value], ...] where value may overshoot 1.
            d = opts.points.map(function (p, i) { return (i ? "L" : "M") + gx(p[0]) + " " + gy(p[1] / 1.3); }).join(" ");
        } else if (!bez) {
            d = "M" + gx(0) + " " + gy(0) + " H" + gx(1) + " V" + gy(1);
        } else {
            d = "M" + gx(0) + " " + gy(0) + " C" + gx(bez[0]) + " " + gy(bez[1]) + " " + gx(bez[2]) + " " + gy(bez[3]) + " " + gx(1) + " " + gy(1);
            if (opts.handles) {
                el("line", { x1: gx(0), y1: gy(0), x2: gx(bez[0]), y2: gy(bez[1]), class: "curve-handle" });
                el("line", { x1: gx(1), y1: gy(1), x2: gx(bez[2]), y2: gy(bez[3]), class: "curve-handle" });
                el("circle", { cx: gx(bez[0]), cy: gy(bez[1]), r: 2.5, class: "curve-knob" });
                el("circle", { cx: gx(bez[2]), cy: gy(bez[3]), r: 2.5, class: "curve-knob" });
            }
        }
        el("path", { d: d, class: "curve-line" });
        if (opts.dot) {
            var dot = el("circle", { cx: gx(0), cy: gy(0), r: 3, class: "curve-dot" });
            svg._dot = dot;
            svg._geom = { gx: gx, gy: gy, bez: bez };
        }
        return svg;
    }

    // Cubic-bezier evaluation for animating the ball along the curve.
    function bezierPoint(b, t) {
        var u = 1 - t;
        return {
            x: 3 * u * u * t * b[0] + 3 * u * t * t * b[2] + t * t * t,
            y: 3 * u * u * t * b[1] + 3 * u * t * t * b[3] + t * t * t
        };
    }
    function yForX(b, x) {
        var lo = 0, hi = 1;
        for (var i = 0; i < 24; i++) {
            var mid = (lo + hi) / 2;
            if (bezierPoint(b, mid).x < x) lo = mid; else hi = mid;
        }
        return bezierPoint(b, (lo + hi) / 2).y;
    }

    // ---- motion preview thumbnail ------------------------------------------------
    function preview(name, phase, opts) {
        opts = opts || {};
        var stage = h("div.pv" + (opts.large ? ".pv-lg" : ""), { "aria-hidden": "true" });
        var obj;
        if (name === "tracking" || name === "typeon" || name === "words" || name === "lines") {
            var label = name === "lines" ? ["Breaking", "News"] : ["NEWS"];
            obj = h("div.pv-text.pv-" + name, label.map(function (w, wi) {
                return h("span.pv-line", w.split("").map(function (ch, i) {
                    return h("span.pv-ch", { style: { "--i": String(name === "words" || name === "lines" ? wi : i) }, text: ch });
                }));
            }));
        } else {
            obj = h("div.pv-obj.pv-" + name);
        }
        stage.classList.add("pv-k-" + name);
        stage.appendChild(h("div.pv-floor"));
        stage.appendChild(obj);
        stage.classList.add(phase === "out" ? "pv-out" : "pv-in");
        function play() {
            stage.classList.remove("play");
            void stage.offsetWidth;
            stage.classList.add("play");
        }
        stage.play = play;
        if (opts.autoplay !== false) requestAnimationFrame(play);
        return stage;
    }

    // ---- building blocks ------------------------------------------------------------
    function section(title, opts, children) {
        opts = opts || {};
        var head = h("div.section-head", [
            opts.icon ? AT.icon(opts.icon) : null,
            h("h3.section-title", { text: title }),
            opts.hint && isBeginner() ? h("span.section-hint", { text: opts.hint }) : null,
            opts.right || null
        ]);
        return h("section.section" + (opts.cls ? "." + opts.cls : ""), [head, h("div.section-body", children)]);
    }

    function lead(text) {
        return isBeginner() ? h("p.lead", { text: text }) : null;
    }

    function toolButton(id, opts) {
        opts = opts || {};
        var item = AT.catalog.get(id);
        if (!item) return null;
        var b = h("button.tool" + (opts.cls ? "." + opts.cls : ""), {
            type: "button", title: item.summary,
            on: { click: function () { AT.run(item, opts.overrides ? opts.overrides() : null, b); } }
        }, [
            h("span.tool-icon", AT.icon(item.icon)),
            h("span.tool-label", { text: opts.label || item.title }),
            item.short && !opts.noShort ? h("kbd.tool-key", { text: item.short }) : null
        ]);
        if (opts.fav !== false) b.appendChild(favButton(id));
        return b;
    }

    function iconButton(id, opts) {
        opts = opts || {};
        var item = AT.catalog.get(id);
        var b = h("button.icon-tool", {
            type: "button", title: item.title + " — " + item.summary, "aria-label": item.title,
            on: {
                click: function () { AT.run(item, opts.overrides ? opts.overrides() : null, b); },
                contextmenu: function (e) { e.preventDefault(); explain(item, b); }
            }
        }, [AT.icon(item.icon), opts.caption ? h("span.icon-cap", { text: opts.caption }) : null]);
        return b;
    }

    function presetTile(preset) {
        var pv = preview(preset.preview, preset.phase, { autoplay: false });
        var tile = h("button.preset" + (preset.tier === "more" ? ".preset-more" : ""), {
            type: "button", title: preset.summary,
            on: {
                click: function () { AT.run(preset, null, tile); },
                mouseenter: function () { pv.play(); },
                focus: function () { pv.play(); }
            }
        }, [
            pv,
            h("span.preset-label", { text: preset.title }),
            favButton(preset.id),
            infoButton(preset)
        ]);
        return tile;
    }

    function segmented(options, value, onChange, opts) {
        opts = opts || {};
        var wrap = h("div.seg" + (opts.cls ? "." + opts.cls : ""), { role: "radiogroup", "aria-label": opts.label || "" });
        options.forEach(function (o) {
            var b = h("button.seg-btn" + (o.value === value ? ".on" : ""), {
                type: "button", role: "radio", "aria-checked": o.value === value ? "true" : "false", title: o.title || "",
                on: { click: function () {
                    wrap.querySelectorAll(".seg-btn").forEach(function (x) { x.classList.remove("on"); x.setAttribute("aria-checked", "false"); });
                    b.classList.add("on");
                    b.setAttribute("aria-checked", "true");
                    onChange(o.value);
                } }
            }, [o.icon ? AT.icon(o.icon) : null, o.label ? h("span", { text: o.label }) : null]);
            wrap.appendChild(b);
        });
        return wrap;
    }

    function slider(o) {
        var out = h("output.slider-val", { text: fmt(o.value) });
        function fmt(v) { return o.format ? o.format(v) : v + (o.unit || ""); }
        var input = h("input.slider-input", { type: "range", min: o.min, max: o.max, step: o.step || 1, value: o.value, "aria-label": o.label });
        function paint() {
            var pct = ((input.value - o.min) / (o.max - o.min)) * 100;
            input.style.setProperty("--pct", pct + "%");
        }
        input.addEventListener("input", function () {
            out.textContent = fmt(+input.value);
            paint();
            if (o.onInput) o.onInput(+input.value);
        });
        input.addEventListener("change", function () { if (o.onChange) o.onChange(+input.value); });
        paint();
        var wrap = h("label.slider", [h("span.slider-label", { text: o.label }), input, out]);
        wrap.set = function (v) { input.value = v; out.textContent = fmt(v); paint(); };
        return wrap;
    }

    // Frame rate of the open comp (for "15f = 0.5 s" hints); 29.97 otherwise.
    function fps() {
        var c = AT.app && AT.app.context ? AT.app.context() : null;
        return c && c.comp && c.comp.fps ? c.comp.fps : 29.97;
    }

    function secondsHint(frames) {
        if (!(frames > 0)) return "";
        return "\u2248 " + (Math.round(frames / fps() * 100) / 100) + " s";
    }

    // Saved duration in frames. Older builds could save seconds; convert.
    function savedFrames(key) {
        var s = AT.store.get("settings");
        var v = s[key + "Value"];
        if (!(v > 0)) return 0;
        return s[key + "Unit"] === "seconds" ? Math.max(1, Math.round(v * fps())) : v;
    }

    // Duration in FRAMES (how animators count timing), with the seconds
    // equivalent as a hint. allowAuto: empty = each preset's own length.
    function duration(o) {
        var value = savedFrames(o.key) || (o.allowAuto ? 0 : o.defaultFrames);
        var hint = h("span.duration-hint");
        var input = h("input.num-input", { type: "number", min: "0", step: "1", "aria-label": o.label + " in frames",
            placeholder: o.allowAuto ? "Auto" : "", value: value > 0 ? String(value) : "" });
        function paint() {
            var v = parseFloat(input.value);
            hint.textContent = v > 0 ? secondsHint(v) : (o.allowAuto ? "empty = each preset's own length" : "");
        }
        function save() {
            var v = Math.round(parseFloat(input.value));
            if (!(v > 0)) {
                v = o.allowAuto ? 0 : o.defaultFrames;
                input.value = v ? String(v) : "";
            } else {
                input.value = String(v);
            }
            AT.store.update("settings", function (x) { x[o.key + "Value"] = v; x[o.key + "Unit"] = "frames"; });
            paint();
        }
        input.addEventListener("input", paint);
        input.addEventListener("change", save);
        paint();
        return h("div.duration", [h("span.duration-label", { text: o.label }), input, h("span.duration-unit", { text: "frames" }), hint]);
    }

    // Converts a saved duration setting into a host payload fragment.
    function durationParams(key, defaultFrames) {
        var v = savedFrames(key);
        return { durationFrames: v > 0 ? v : defaultFrames };
    }

    function toggle(label, checked, onChange) {
        var input = h("input", { type: "checkbox" });
        input.checked = !!checked;
        input.addEventListener("change", function () { onChange(input.checked); });
        return h("label.toggle", [input, h("span.toggle-track", h("span.toggle-thumb")), h("span.toggle-label", { text: label })]);
    }

    // Renders "Mod + Shift + C" as key caps for the current platform.
    function keycaps(keys) {
        var mac = navigator.platform.indexOf("Mac") === 0;
        var map = mac ? { Mod: "⌘", Alt: "⌥", Shift: "⇧" } : { Mod: "Ctrl", Alt: "Alt", Shift: "Shift" };
        // "Mod + A / Mod + Shift + A" = two alternatives; menu paths stay text.
        if (/ > |\b(box|button|menu|name|switch)\b/i.test(keys)) {
            return h("span.keys", h("span.key-menu", { text: keys }));
        }
        return h("span.keys", keys.split(/\s+\/\s+/).map(function (alt, a) {
            var parts = a ? [h("span.key-plus", { text: "or" })] : [];
            alt.split(/\s*\+\s*/).forEach(function (k, i) {
                if (i) parts.push(h("span.key-plus", { text: "+" }));
                parts.push(h("kbd", { text: map[k] || k }));
            });
            return parts;
        }));
    }

    function empty(illo, title, text, actions) {
        return h("div.empty", [
            illo ? AT.illustration(illo, "empty-illo") : null,
            h("div.empty-title", { text: title }),
            text ? h("p.empty-text", { text: text }) : null,
            actions ? h("div.empty-actions", actions) : null
        ]);
    }

    AT.h = h;
    AT.ui = {
        h: h, pulse: pulse, explain: explain, infoButton: infoButton, favButton: favButton, curve: curve,
        yForX: yForX, preview: preview, section: section, lead: lead, toolButton: toolButton, iconButton: iconButton,
        presetTile: presetTile, segmented: segmented, slider: slider, toggle: toggle, duration: duration, durationParams: durationParams, secondsHint: secondsHint, keycaps: keycaps, empty: empty,
        isBeginner: isBeginner
    };
})(window.AT = window.AT || {});
