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
        ["sc.new-comp", "timeline", "Mod + N", "New composition", "Creates a new composition."],
        // Preview & render
        ["sc.preview", "preview", "Space", "Preview (play)", "Plays from the playhead. The green bar in the timeline shows frames already cached; those play in real time."],
        ["sc.preview-num0", "preview", "Numpad 0", "Preview with cache settings", "Uses the Numpad 0 settings in the Preview panel (e.g. Cache Before Playback)."],
        ["sc.preview-alt", "preview", "Shift + Numpad 0", "Preview (alternate settings)", "A second set of Preview panel settings, e.g. every other frame at half resolution."],
        ["sc.preview-audio", "preview", "Numpad .", "Preview audio only", "Plays just the audio from the playhead: quick timing checks against voice-over."],
        ["sc.res-full", "preview", "Mod + J", "Resolution: Full", "Sets the viewer's Resolution/Down Sample Factor to Full."],
        ["sc.res-half", "preview", "Mod + Shift + J", "Resolution: Half", "Half resolution: previews render about 4 times faster."],
        ["sc.res-quarter", "preview", "Mod + Alt + Shift + J", "Resolution: Quarter", "Quarter resolution: about 16 times fewer pixels."],
        ["sc.res-custom", "preview", "Mod + Alt + J", "Resolution: Custom", "Pick any down sample factor."],
        ["sc.caps", "preview", "Caps Lock", "Freeze viewer updates", "Stops the viewer redrawing while you make changes. A red bar reminds you it's on."],
        ["sc.render-queue", "preview", "Mod + M", "Add to Render Queue", "Queues the comp for rendering inside After Effects."],
        ["sc.render-ame", "preview", "Mod + Alt + M", "Add to Media Encoder", "Sends the comp to Adobe Media Encoder (keeps After Effects free while it renders)."],
        ["sc.save-frame", "preview", "Mod + Alt + S", "Save Frame As", "Adds the current frame to the Render Queue as a still image."],
        // View & guides
        ["sc.layer-controls", "view", "Mod + Shift + H", "Show/hide layer controls", "Mask paths, shape paths and handles vanished? This toggles them. Also try the 'Toggle Mask and Shape Path Visibility' button under the viewer."],
        ["sc.guides", "view", "Mod + ;", "Show/hide guides", "Drag guides out of the rulers to line things up."],
        ["sc.rulers", "view", "Mod + R", "Show/hide rulers", "Needed to drag out guides."],
        ["sc.snap-guides", "view", "Mod + Shift + ;", "Snap to guides", "Layers snap to guides as you drag."],
        ["sc.lock-guides", "view", "Mod + Alt + Shift + ;", "Lock guides", "Stops guides moving by accident."],
        ["sc.grid", "view", "Mod + '", "Show/hide grid", "A proportional grid over the viewer."],
        ["sc.safe", "view", "'", "Title/action safe", "Shows the safe-area guides. Keep text inside the inner (title safe) box for broadcast."],
        ["sc.transparency", "view", "Transparency grid button", "Checkerboard background", "Shows transparency as a checkerboard instead of the comp colour, so you can see what's really empty."],
        // Getting around
        ["sc.maximize", "navigate", "~", "Maximize panel", "Fills the window with the panel under the mouse. Press again to restore."],
        ["sc.zoom-viewer", "navigate", ", / .", "Zoom viewer out / in", "Zooms the Composition viewer."],
        ["sc.fit", "navigate", "Shift + /", "Fit comp in viewer", "Fits the whole comp in the viewer."],
        ["sc.in-out", "navigate", "I / O", "Go to layer In / Out", "Jumps the playhead to the selected layer's first or last frame."],
        ["sc.work-start", "navigate", "Shift + Home / Shift + End", "Work area start / end", "Jumps to the start or end of the work area."],
        ["sc.scroll-layer", "navigate", "X", "Scroll to selected layer", "Scrolls the timeline so the selected layer is at the top."],
        ["sc.flowchart", "navigate", "Tab", "Comp mini-flowchart", "Shows how comps nest; click to jump between them."],
        ["sc.select-all", "navigate", "Mod + A / Mod + Shift + A", "Select all / deselect all", "Deselecting first avoids changing the wrong layers."],
        ["sc.comp-settings", "navigate", "Mod + K", "Composition settings", "Size, frame rate, duration and 3D renderer."],
        // Find & fix
        ["sc.find", "find", "Mod + F", "Search the timeline", "Filters layers and properties by name, e.g. 'opacity' shows every Opacity."],
        ["sc.effects-panel", "find", "Mod + 5", "Effects & Presets panel", "Type in its search field to find any effect or preset instantly."],
        ["sc.project-panel", "find", "Mod + 0", "Project panel", "Has its own search field for footage and comps."],
        ["sc.help-search", "find", "Help search box", "Search After Effects help", "The search box at the top right of After Effects searches Adobe's help and tutorials."],
        ["sc.workspace", "find", "Window > Workspace > Reset", "Reset the workspace", "Panels missing or moved? Resetting puts every panel back where it belongs."],
        ["sc.window-menu", "find", "Window menu", "Open any panel", "Every panel (Align, Character, Preview, Effect Controls...) is listed under Window."],
        ["sc.effect-controls", "find", "F3", "Effect Controls", "Shows the effects on the selected layer."]
    ];

    AT.content = AT.content || {};
    AT.content.shortcutCategories = [
        { id: "properties", title: "Properties" },
        { id: "keyframes", title: "Keyframes" },
        { id: "layers", title: "Layers" },
        { id: "tools", title: "Tools" },
        { id: "timeline", title: "Timeline" },
        { id: "preview", title: "Preview & Render" },
        { id: "view", title: "View & Guides" },
        { id: "navigate", title: "Getting Around" },
        { id: "find", title: "Find & Fix" }
    ];
    AT.content.shortcuts = S.map(function (s) {
        return {
            type: "shortcut", id: s[0], category: s[1], keys: s[2], title: s[3], summary: s[4], view: "learn",
            keywords: (s[3] + " " + s[2] + " " + s[1] + " shortcut key keyboard").toLowerCase()
        };
    });
})(window.AT = window.AT || {});
