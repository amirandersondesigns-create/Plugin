/*
 * Favorites reference catalog ids — never copies of tools — so a favorite
 * always runs the current definition. Stored in favorites.json.
 *
 *   { id, targetId, label, group, addedAt }
 */
(function (AT) {
    "use strict";

    // Hex colors (not CSS vars) so tints can be computed: CEP's Chromium
    // predates color-mix().
    var GROUPS = [
        { id: "motion", title: "Motion", color: "#6fa8da" },
        { id: "text", title: "Text", color: "#c4849a" },
        { id: "easing", title: "Easing", color: "#5fa8a0" },
        { id: "tools", title: "Tools", color: "#9a9a9a" },
        { id: "camera", title: "Camera", color: "#c9974a" },
        { id: "learn", title: "Learning", color: "#6a9955" }
    ];

    function tint(hex, alpha) {
        var n = parseInt(hex.slice(1), 16);
        return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
    }

    function groupFor(item) {
        if (item.type === "preset") return item.view === "text" ? "text" : item.view === "threed" ? "camera" : "motion";
        if (item.view === "threed") return "camera";
        if (item.view === "mask") return "motion";
        if (item.type === "lesson" || item.type === "workflow" || item.type === "shortcut") return "learn";
        if (item.view === "easing") return "easing";
        if (item.view === "camera" || item.view === "capture") return "camera";
        if (item.view === "audio" || item.view === "preview") return "tools";
        if (item.view === "text") return "text";
        return "tools";
    }

    function items() {
        return AT.store.get("favorites").items;
    }

    function find(targetId) {
        var list = items();
        for (var i = 0; i < list.length; i++) if (list[i].targetId === targetId) return list[i];
        return null;
    }

    function add(targetId) {
        var item = AT.catalog.get(targetId);
        if (!item || find(targetId)) return;
        AT.store.update("favorites", function (f) {
            f.items.push({
                id: "fav-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                targetId: targetId,
                label: item.title,
                group: groupFor(item),
                addedAt: new Date().toISOString()
            });
        });
        AT.toast("★ Added to Favorites", "fav");
    }

    function remove(targetId) {
        AT.store.update("favorites", function (f) {
            f.items = f.items.filter(function (x) { return x.targetId !== targetId; });
        });
        AT.toast("Removed from Favorites", "info");
    }

    function toggle(targetId) {
        if (find(targetId)) remove(targetId);
        else add(targetId);
        return !!find(targetId);
    }

    function rename(targetId, label) {
        label = String(label || "").trim();
        if (!label) return;
        AT.store.update("favorites", function (f) {
            f.items.forEach(function (x) { if (x.targetId === targetId) x.label = label.slice(0, 40); });
        });
    }

    function move(targetId, delta) {
        AT.store.update("favorites", function (f) {
            var i = f.items.findIndex(function (x) { return x.targetId === targetId; });
            var j = i + delta;
            if (i < 0 || j < 0 || j >= f.items.length) return;
            var tmp = f.items[i];
            f.items[i] = f.items[j];
            f.items[j] = tmp;
        });
    }

    AT.favorites = {
        GROUPS: GROUPS,
        tint: tint,
        groupFor: groupFor,
        items: items,
        find: find,
        isFavorite: function (id) { return !!find(id); },
        add: add,
        remove: remove,
        toggle: toggle,
        rename: rename,
        move: move
    };
})(window.AT = window.AT || {});
