// Copyright (c) 2026 Amir Anderson. All rights reserved. Unauthorized copying,
// recreation or distribution is prohibited. See LICENSE.txt.
/*
 * Capture: grab the current comp frame as a PNG (experimental — uses
 * After Effects' undocumented saveFrameToPng).
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var session = [];

    // file:// URL for a local path (macOS "/Users/..." or Windows "C:\\...").
    function fileUrl(path) {
        var p = String(path).replace(/\\/g, "/");
        return "file://" + (p.charAt(0) === "/" ? "" : "/") + encodeURI(p).replace(/#/g, "%23").replace(/\?/g, "%3F");
    }

    // Shared by every "Grab Still" button (Capture tab, Quick actions, search,
    // favorites): remember it and show where it went, with a thumbnail.
    function captured(result) {
        var s = AT.store.get("settings");
        var name = String(result.path).split(/[\\/]/).pop();
        session.unshift({ path: result.path, folder: result.folder, at: new Date() });
        var img = h("img.still-img", { alt: "Captured still: " + name });
        var tries = 0;
        img.addEventListener("error", function () {
            // The PNG can still be flushing to disk; retry briefly.
            if (tries++ < 4) setTimeout(function () { img.src = fileUrl(result.path) + "?t=" + Date.now(); }, 400);
            else img.replaceWith(h("div.still-missing", { text: "Preview not available yet. The file is in the folder below." }));
        });
        img.src = fileUrl(result.path);
        var imported = s.stillImport ? "Also imported into the project." : null;
        AT.app.sheet("Still saved", [
            h("div.still-frame", img),
            h("div.still-name", { text: name }),
            h("div.still-path", { text: result.folder || result.path, title: result.path }),
            imported ? h("p.hint", { text: imported }) : null,
            h("div.row.still-actions", [
                h("button.btn.btn-primary", { type: "button", on: { click: function () {
                    AT.bridge.run("still.reveal", { folder: result.folder });
                } } }, [AT.icon("folder"), h("span", { text: "Open folder" })]),
                h("button.btn", { type: "button", on: { click: function (e) {
                    AT.app.closeSheet();
                    AT.run("still.capture", null, e.currentTarget);
                } } }, [AT.icon("capture"), h("span", { text: "Grab another" })]),
                h("button.btn", { type: "button", text: "Capture settings", on: { click: function () {
                    AT.app.closeSheet();
                    AT.app.show("capture");
                } } })
            ])
        ]);
        if (AT.app.current && AT.app.current() === "capture") AT.app.rerender();
    }
    AT.stills = { captured: captured, session: function () { return session; }, fileUrl: fileUrl };

    function render(page, c) {
        var s = AT.store.get("settings");
        var illo = AT.illustration("capture", "capture-illo");
        var grab = h("button.btn.btn-primary.btn-hero", { type: "button", on: { click: function () {
            AT.run("still.capture", null, grab).then(function (res) {
                if (!AT.worked(res)) return;
                illo.classList.remove("flash");
                void illo.offsetWidth;
                illo.classList.add("flash");
            });
        } } }, [AT.icon("capture"), h("span", { text: "Grab Still" })]);

        var where = h("span.path", { text: s.stillFolder || "Desktop / Animator Toolkit Stills", title: s.stillFolder || "" });
        var folderRow = h("div.folder-row", [
            AT.icon("folder"), where,
            h("button.btn.btn-sm", { type: "button", text: "Change", on: { click: function () {
                AT.bridge.run("still.chooseFolder", { folder: s.stillFolder }).then(function (res) {
                    if (res.ok && res.result.folder) {
                        AT.store.update("settings", function (x) { x.stillFolder = res.result.folder; });
                        s = AT.store.get("settings");
                        where.textContent = res.result.folder;
                    }
                });
            } } }),
            h("button.btn.btn-sm", { type: "button", text: "Open", on: { click: function () { AT.bridge.run("still.reveal", { folder: s.stillFolder }); } } })
        ]);


        page.appendChild(h("div.capture-hero", [
            illo,
            h("div.capture-meta", { text: c && c.comp ? c.comp.name + " · frame " + c.comp.frame + " · " + c.comp.width + "×" + c.comp.height : "Open a composition to capture" }),
            grab
        ]));
        // Still size: Full, Half, Third or Quarter of the comp, like the
        // Preview tab's resolution cards. Each card shows the real pixel size.
        var sizes = [[1, "Full"], [2, "Half"], [3, "Third"], [4, "Quarter"]];
        function sizeArt(f) {
            var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
            svg.setAttribute("viewBox", "0 0 36 24"); svg.setAttribute("class", "size-art"); svg.setAttribute("aria-hidden", "true");
            var frame = document.createElementNS(ns, "rect");
            frame.setAttribute("x", 1); frame.setAttribute("y", 1); frame.setAttribute("width", 34); frame.setAttribute("height", 22); frame.setAttribute("class", "size-frame");
            var still = document.createElementNS(ns, "rect");
            still.setAttribute("x", 1); still.setAttribute("y", 1); still.setAttribute("width", 34 / f); still.setAttribute("height", 22 / f); still.setAttribute("class", "size-still");
            svg.appendChild(frame); svg.appendChild(still);
            return svg;
        }
        function dims(f) {
            return c && c.comp ? Math.ceil(c.comp.width / f) + "\u00d7" + Math.ceil(c.comp.height / f) : ["full size", "1/2 size", "1/3 size", "1/4 size"][f - 1];
        }
        var sizeRow = h("div.option-row.res-cards.size-cards", { role: "radiogroup", "aria-label": "Still size" }, sizes.map(function (z) {
            var on = (s.stillScale || 1) === z[0];
            var b = h("button.option" + (on ? ".on" : ""), { type: "button", role: "radio", "aria-checked": on ? "true" : "false", "data-scale": String(z[0]), on: { click: function () {
                AT.store.update("settings", function (x) { x.stillScale = z[0]; });
                s = AT.store.get("settings");
                Array.prototype.forEach.call(sizeRow.children, function (x) { var me = x === b; x.classList.toggle("on", me); x.setAttribute("aria-checked", me ? "true" : "false"); });
            } } }, [h("span.res-stage", sizeArt(z[0])), h("span.res-name", { text: z[1] }), h("span.res-note.size-dims", { text: dims(z[0]) })]);
            return b;
        }));
        page.appendChild(AT.ui.section("Still size", { icon: "capture", hint: "PNG, from the playhead" }, sizeRow));

        page.appendChild(AT.ui.section("Options", { icon: "folder" }, h("div.card", [
            folderRow,
            AT.ui.toggle("Import into project", s.stillImport, function (v) { AT.store.update("settings", function (x) { x.stillImport = v; }); })
        ])));
        page.appendChild(h("p.fine", { text: "Experimental: renders through the active camera at the current time, for approvals and reference. For a deliverable still use Composition › Save Frame As › File (Render Queue)." }));
    }

    AT.registerView({
        id: "capture", title: "Capture", icon: "capture", render: render,
        onContext: function (c) {
            var meta = document.querySelector(".capture-meta");
            if (meta) meta.textContent = c && c.comp ? c.comp.name + " · frame " + c.comp.frame + " · " + c.comp.width + "×" + c.comp.height : "Open a composition to capture";
            var f = [1, 2, 3, 4];
            Array.prototype.forEach.call(document.querySelectorAll(".size-dims"), function (el, i) {
                if (c && c.comp) el.textContent = Math.ceil(c.comp.width / f[i]) + "\u00d7" + Math.ceil(c.comp.height / f[i]);
            });
        }
    });
})(window.AT = window.AT || {});
