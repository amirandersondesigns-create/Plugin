// ============================================================================
// Animator Toolkit - context.inspect
//
// Cheap, read-only snapshot of what the artist has open and selected. The
// panel polls it (only while visible) to reorder tools and to explain what
// needs selecting before a button can work.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.register("context.inspect", {
    needs: "none",
    run: function () {
        var out = { project: !!app.project, comp: null, layers: [], kinds: {}, selectedKeys: 0 };
        var comp = AT.activeComp();
        if (!comp) return { result: out };
        out.comp = {
            name: comp.name,
            width: comp.width,
            height: comp.height,
            fps: Math.round(comp.frameRate * 100) / 100,
            time: comp.time,
            frame: Math.round(comp.time / comp.frameDuration),
            hasCamera: !!comp.activeCamera
        };
        var sel = comp.selectedLayers;
        for (var i = 0; i < sel.length && i < 50; i++) {
            var kind = AT.layerKind(sel[i]);
            out.kinds[kind] = (out.kinds[kind] || 0) + 1;
            if (i < 8) out.layers.push({ name: sel[i].name, kind: kind, threeD: !!sel[i].threeDLayer });
        }
        out.layerCount = sel.length;
        var keys = AT.selectedKeyframes(comp);
        for (var k = 0; k < keys.length; k++) out.selectedKeys += keys[k].keys.length;
        return { result: out };
    }
});

}($["com.aanders.animatortoolkit"]));
