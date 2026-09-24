/*
 * Keyboard shortcuts, explained. Keys use "Mod" for Cmd (macOS) / Ctrl
 * (Windows) and "Alt" for Option / Alt; the panel renders the right one.
 */
(function (AT) {
    "use strict";

    var S = [
        // Properties
        ["sc.position", "properties", "P", "Position", "Shows only Position for the selected layers."],
        ["sc.scale", "properties", "S", "Scale", "Shows only Scale."],
        ["sc.rotation", "properties", "R", "Rotation", "Shows only Rotation."],
        ["sc.opacity", "properties", "T", "Opacity", "Shows only Opacity (T for Transparency)."],
        ["sc.anchor", "properties", "A", "Anchor Point", "Shows only Anchor Point."],
        ["sc.u", "properties", "U", "Animated properties", "Shows every property that has keyframes. UU shows everything you've changed."],
        ["sc.shift-add", "properties", "Shift + P/S/R/T/A", "Add another property", "Hold Shift to reveal more than one property at once."],
        ["sc.effects", "properties", "E", "Effects", "Shows the effects on selected layers."],
        ["sc.mask", "properties", "M", "Mask Path", "Shows mask paths. MM shows all mask properties."],
        // Keyframes
        ["sc.add-key", "keyframes", "Alt + Shift + P/S/R/T", "Add keyframe", "Adds a keyframe for that property at the playhead."],
        ["sc.next-key", "keyframes", "K / J", "Next / previous keyframe", "Jumps the playhead to the next or previous visible keyframe."],
        ["sc.f9", "keyframes", "F9", "Easy Ease", "Eases selected keyframes on both sides."],
        ["sc.f9-in", "keyframes", "Shift + F9", "Easy Ease In", "Eases motion arriving into the selected keyframes."],
        ["sc.f9-out", "keyframes", "Mod + Shift + F9", "Easy Ease Out", "Eases motion leaving the selected keyframes."],
        ["sc.hold", "keyframes", "Mod + Alt + H", "Toggle Hold Keyframe", "Holds the value until the next keyframe."],
        ["sc.graph", "keyframes", "Shift + F3", "Graph Editor", "Switches the timeline to the Graph Editor to shape easing by hand."],
        ["sc.select-keys", "keyframes", "Click property name", "Select all keys", "Clicking a property's name selects all its keyframes."],
        // Layers
        ["sc.precompose", "layers", "Mod + Shift + C", "Pre-compose", "Moves selected layers into a new composition."],
        ["sc.duplicate", "layers", "Mod + D", "Duplicate", "Duplicates selected layers (or keyframes)."],
        ["sc.rename", "layers", "Enter / Return", "Rename", "Renames the selected layer."],
        ["sc.parent", "layers", "Shift + drag pick whip", "Parent", "Drag the pick whip to a layer to parent. Shift moves the child to the parent's position."],
        ["sc.lock", "layers", "Mod + L", "Lock", "Locks selected layers so they can't be edited."],
        ["sc.solo", "layers", "Alt + click solo", "Solo only this", "Solos a layer and un-solos all others."],
        ["sc.shy", "layers", "Shy switch", "Shy", "Hides a layer from the timeline (not the render) when Hide Shy Layers is on."],
        ["sc.new-solid", "layers", "Mod + Y", "New Solid", "Creates a solid the size of the comp."],
        ["sc.new-null", "layers", "Mod + Alt + Shift + Y", "New Null", "Creates a null object."],
        // Tools
        ["sc.select", "tools", "V", "Selection tool", "Select and move layers in the viewer."],
        ["sc.pan-behind", "tools", "Y", "Pan Behind (Anchor Point) tool", "Drags the anchor point without moving the layer."],
        ["sc.rotate-tool", "tools", "W", "Rotation tool", "Rotate layers in the viewer."],
        ["sc.pen", "tools", "G", "Pen tool", "Draws masks and shape paths."],
        ["sc.shape", "tools", "Q", "Shape tools", "Rectangle, ellipse and more. Press again to cycle."],
        ["sc.text-tool", "tools", "Mod + T", "Type tool", "Creates or edits text."],
        ["sc.camera-tool", "tools", "C", "Camera tools", "Orbit, pan and dolly the active camera. Press again to cycle."],
        ["sc.hand", "tools", "H / hold Space", "Hand tool", "Pans around the viewer."],
        // Timeline
        ["sc.space", "timeline", "Space", "Preview", "Plays a preview from the playhead."],
        ["sc.home", "timeline", "Home / End", "Start / end of comp", "Moves the playhead to the first or last frame."],
        ["sc.next-frame", "timeline", "Page Down / Page Up", "Next / previous frame", "Steps one frame. Add Shift for ten."],
        ["sc.trim-in", "timeline", "Alt + [ / Alt + ]", "Trim layer", "Trims the layer's In or Out point to the playhead."],
        ["sc.move-in", "timeline", "[ / ]", "Move layer", "Moves the layer so it starts or ends at the playhead."],
        ["sc.split", "timeline", "Mod + Shift + D", "Split layer", "Splits the layer at the playhead into two."],
        ["sc.work-area", "timeline", "B / N", "Work area", "Sets the start and end of the preview range."],
        ["sc.zoom-time", "timeline", "= / -", "Zoom timeline", "Zooms the timeline in and out in time."],
        ["sc.new-comp", "timeline", "Mod + N", "New composition", "Creates a new composition."]
    ];

    AT.content = AT.content || {};
    AT.content.shortcutCategories = [
        { id: "properties", title: "Properties" },
        { id: "keyframes", title: "Keyframes" },
        { id: "layers", title: "Layers" },
        { id: "tools", title: "Tools" },
        { id: "timeline", title: "Timeline" }
    ];
    AT.content.shortcuts = S.map(function (s) {
        return {
            type: "shortcut", id: s[0], category: s[1], keys: s[2], title: s[3], summary: s[4], view: "learn",
            keywords: (s[3] + " " + s[2] + " " + s[1] + " shortcut key keyboard").toLowerCase()
        };
    });
})(window.AT = window.AT || {});
