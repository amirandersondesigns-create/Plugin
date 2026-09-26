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
        var imported = s.stillAddToComp ? "Also added as a layer in this comp." : s.stillImport ? "Also imported into the project." : null;
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
                if (!res.ok) return;
                illo.classList.remove("flash");
                void illo.offsetWidth;
                illo.classList.add("flash");
                drawRecent();
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

        var recent = h("div.capture-list");
        function drawRecent() {
            recent.innerHTML = "";
            if (!session.length) {
                recent.appendChild(h("p.muted", { text: "Stills you grab this session appear here." }));
                return;
            }
            session.slice(0, 6).forEach(function (r) {
                recent.appendChild(h("div.capture-item", [AT.icon("capture"), h("span.path", { text: r.path.split(/[\\/]/).pop(), title: r.path }),
                    h("span.muted", { text: r.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })]));
            });
        }
        drawRecent();

        page.appendChild(h("div.capture-hero", [
            illo,
            h("div.capture-meta", { text: c && c.comp ? c.comp.name + " · frame " + c.comp.frame + " · " + c.comp.width + "×" + c.comp.height : "Open a composition to capture" }),
            grab
        ]));
        page.appendChild(AT.ui.section("Options", { icon: "folder" }, h("div.card", [
            folderRow,
            AT.ui.toggle("Import into project", s.stillImport, function (v) { AT.store.update("settings", function (x) { x.stillImport = v; }); }),
            AT.ui.toggle("Also add as a layer in this comp", s.stillAddToComp, function (v) { AT.store.update("settings", function (x) { x.stillAddToComp = v; }); })
        ])));
        page.appendChild(AT.ui.section("This session", { icon: "clock" }, recent));
        page.appendChild(h("p.fine", { text: "Experimental: renders through the active camera at the current time, for approvals and reference. For a deliverable still use Composition › Save Frame As › File (Render Queue)." }));
    }

    AT.registerView({
        id: "capture", title: "Capture", icon: "capture", render: render,
        onContext: function (c) {
            var meta = document.querySelector(".capture-meta");
            if (meta) meta.textContent = c && c.comp ? c.comp.name + " · frame " + c.comp.frame + " · " + c.comp.width + "×" + c.comp.height : "Open a composition to capture";
        }
    });
})(window.AT = window.AT || {});
