/*
 * Global search across tools, presets, lessons, shortcuts, workflows and
 * favorites. Words are lightly stemmed so "ease", "eases" and "easing" all
 * match each other, and every query word must match (prefix) somewhere.
 */
(function (AT) {
    "use strict";

    var TYPE_WEIGHT = { action: 3, preset: 3, favorite: 4, lesson: 2, workflow: 2, shortcut: 1 };
    var index = [];

    function stem(w) {
        w = w.toLowerCase();
        if (w.length > 5 && /ing$/.test(w)) w = w.slice(0, -3);
        else if (w.length > 4 && /ed$/.test(w)) w = w.slice(0, -2);
        else if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.slice(0, -1);
        if (w.length > 3 && /e$/.test(w)) w = w.slice(0, -1);
        return w;
    }

    function words(text) {
        return String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(stem);
    }

    function entry(item, label) {
        return {
            item: item,
            title: words(label || item.title),
            keys: words(item.keywords),
            body: words(item.summary),
            rawTitle: (label || item.title).toLowerCase()
        };
    }

    function build(items, favorites) {
        index = items.map(function (it) { return entry(it); });
        (favorites || []).forEach(function (f) {
            var target = AT.catalog ? AT.catalog.get(f.targetId) : null;
            if (!target) return;
            var e = entry(target, f.label);
            e.favorite = f;
            index.push(e);
        });
        return index.length;
    }

    function hit(list, q) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].indexOf(q) === 0 || (q.length > 3 && q.indexOf(list[i]) === 0 && list[i].length > 2)) return true;
        }
        return false;
    }

    function query(text, limit) {
        var qs = words(text);
        if (!qs.length) return [];
        var raw = String(text).toLowerCase().trim();
        var results = [];
        index.forEach(function (e) {
            var score = 0;
            for (var i = 0; i < qs.length; i++) {
                var q = qs[i];
                if (hit(e.title, q)) score += 6;
                else if (hit(e.keys, q)) score += 3;
                else if (hit(e.body, q)) score += 1;
                else return; // every word must match somewhere
            }
            if (e.rawTitle.indexOf(raw) === 0) score += 6;
            score += e.favorite ? TYPE_WEIGHT.favorite : TYPE_WEIGHT[e.item.type] || 0;
            results.push({ item: e.item, favorite: e.favorite || null, score: score });
        });
        results.sort(function (a, b) { return b.score - a.score || a.item.title.localeCompare(b.item.title); });
        // Collapse duplicates (a favorite and its target): keep the best.
        var seen = {};
        return results.filter(function (r) {
            var key = r.item.id;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        }).slice(0, limit || 30);
    }

    AT.search = { build: build, query: query, _stem: stem };
})(window.AT = window.AT || {});
