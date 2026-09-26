// ============================================================================
// Animator Toolkit - text-animator presets
//
// These build real After Effects Text Animators (the same thing
// Animate > Tracking etc. creates in the timeline), named "AT <Preset>" so
// the artist can twirl them open and see how they work. Each preset owns
// one animator: re-applying replaces it, and different presets (Type On +
// Tracking In + Type Off) stack because animators are additive.
//
// Layer-level text presets (Fade, Slide, Bounce...) reuse the kinds in
// presets.jsx; only the per-character ones need this file.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

AT.TEXT_MN = {
    animator: "ADBE Text Animator",
    animatorProps: "ADBE Text Animator Properties",
    selectors: "ADBE Text Selectors",
    rangeSelector: "ADBE Text Selector",
    start: "ADBE Text Percent Start",
    advanced: "ADBE Text Range Advanced",
    basedOn: "ADBE Text Range Type2",
    opacity: "ADBE Text Opacity",
    position: "ADBE Text Position 3D",
    tracking: "ADBE Text Tracking Amount",
    blur: "ADBE Text Blur",
    scale: "ADBE Text Scale 3D",
    rotation: "ADBE Text Rotation",
    randomize: "ADBE Text Randomize Order"
};

AT.BASED_ON = { characters: 1, words: 3, lines: 4 };

// Adds (or replaces) a named animator with the given animator properties.
// Returns a getter, because After Effects invalidates property references
// whenever a sibling is added - always re-fetch through it.
AT.textAnimator = function (layer, name, propMatchNames, withSelector) {
    function animators() {
        return layer.property(AT.MN.text).property(AT.MN.textAnimators);
    }
    for (var i = animators().numProperties; i >= 1; i--) {
        if (animators().property(i).name === name) animators().property(i).remove();
    }
    var added = animators().addProperty(AT.TEXT_MN.animator);
    added.name = name;
    var index = added.propertyIndex;
    function get() {
        return animators().property(index);
    }
    for (var p = 0; p < propMatchNames.length; p++) {
        get().property(AT.TEXT_MN.animatorProps).addProperty(propMatchNames[p]);
    }
    if (withSelector && get().property(AT.TEXT_MN.selectors).numProperties === 0) {
        get().property(AT.TEXT_MN.selectors).addProperty(AT.TEXT_MN.rangeSelector);
    }
    return get;
};

AT.animatorTitle = function (def) {
    return "AT " + (def.title || def.kind);
};

AT.PRESET_KINDS["text-tracking"] = function (layer, win, def) {
    var get = AT.textAnimator(layer, AT.animatorTitle(def), [AT.TEXT_MN.tracking], false);
    var amount = def.amount || 40;
    var prop = get().property(AT.TEXT_MN.animatorProps).property(AT.TEXT_MN.tracking);
    return AT.animateProperty(prop, win, def, function () { return amount; });
};

// Characters/words/lines appear (in) or disappear (out) one after another.
// Static animator values describe the hidden state; the Range Selector's
// Start sweeps across the text to release characters from it.
AT.PRESET_KINDS["text-reveal"] = function (layer, win, def) {
    var props = [AT.TEXT_MN.opacity];
    if (def.offsetY) props.push(AT.TEXT_MN.position);
    if (def.blur) props.push(AT.TEXT_MN.blur);
    if (def.scale !== undefined) props.push(AT.TEXT_MN.scale);
    if (def.rotation) props.push(AT.TEXT_MN.rotation);
    var get = AT.textAnimator(layer, AT.animatorTitle(def), props, true);

    // Static animator values = the hidden state of each character.
    var ap = function () { return get().property(AT.TEXT_MN.animatorProps); };
    ap().property(AT.TEXT_MN.opacity).setValue(def.opacity === undefined ? 0 : def.opacity);
    if (def.offsetY) ap().property(AT.TEXT_MN.position).setValue([0, def.offsetY, 0]);
    if (def.blur) ap().property(AT.TEXT_MN.blur).setValue([def.blur, def.blur]);
    if (def.scale !== undefined) ap().property(AT.TEXT_MN.scale).setValue([def.scale, def.scale, 100]);
    if (def.rotation) ap().property(AT.TEXT_MN.rotation).setValue(def.rotation);

    var selector = function () { return get().property(AT.TEXT_MN.selectors).property(1); };
    var advanced = function () { return selector().property(AT.TEXT_MN.advanced); };
    advanced().property(AT.TEXT_MN.basedOn).setValue(AT.BASED_ON[def.basedOn || "characters"]);
    if (def.random) advanced().property(AT.TEXT_MN.randomize).setValue(1);

    // Start = 100 selects nothing (all visible); 0 selects everything.
    var start = selector().property(AT.TEXT_MN.start);
    start.setValue(100);
    return AT.animateProperty(start, win, def, function () { return 0; });
};

AT.register("text.create", {
    label: "Create Text",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var layer = ctx.comp.layers.addText(payload.text || "Headline");
        var doc = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
        doc.justification = ParagraphJustification.CENTER_JUSTIFY;
        layer.property("ADBE Text Properties").property("ADBE Text Document").setValue(doc);
        // Anchor to the visual center so scale/rotate presets pivot nicely.
        AT.moveAnchor(layer, ctx.comp.time, 0.5, 0.5, false);
        AT.tprop(layer, "position").setValue([ctx.comp.width / 2, ctx.comp.height / 2]);
        return { result: { layer: layer.name }, feedback: "Text layer created" };
    }
});

}($["com.aanders.animatortoolkit"]));
