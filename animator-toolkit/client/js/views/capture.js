/*
 * Capture: grab the current comp frame as a PNG (experimental — uses
 * After Effects' undocumented saveFrameToPng).
 */
(function (AT) {
    "use strict";

    var h = AT.h;
    var session = [];

    function render(page, c) {
        var s = AT.store.get("settings");
        var illo = AT.illustration("capture", "capture-illo");
        var grab = h("button.btn.btn-primary.btn-hero", { type: "button", on: { click: function () {
            AT.run("still.capture", null, grab).then(function (res) {
                if (!res.ok) return;
                illo.classList.remove("flash");
                void illo.offsetWidth;
                illo.classList.add("flash");
                session.unshift({ path: res.result.path, at: new Date() });
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
