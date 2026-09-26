// ============================================================================
// Animator Toolkit - camera tools
//
// Terminology is taught, not hidden: designers often say "pan" for any
// sideways camera move, but a pan rotates the camera. Moving the whole
// camera sideways is a TRUCK; up/down is a PEDESTAL; toward the subject is
// a DOLLY (push in / pull out). The panel labels moves with both names.
// ============================================================================

// Everything lives in one uniquely named namespace: After Effects runs all
// extensions and scripts in a single shared ExtendScript global scope.
(function (AT) {

// Focal lengths on a 36mm-wide film back, like After Effects' presets.
AT.CAMERA_LENSES = { "24mm": 24, "35mm": 35, "50mm": 50, "80mm": 80, "135mm": 135 };

AT.cameraZoom = function (layer) {
    return layer.property(AT.MN.cameraOptions).property(AT.MN.cameraZoom);
};

AT.targetCamera = function (comp) {
    var sel = comp.selectedLayers;
    for (var i = 0; i < sel.length; i++) {
        if (sel[i] instanceof CameraLayer) return sel[i];
    }
    if (comp.activeCamera) return comp.activeCamera;
    AT.fail("no-camera", "This comp has no camera yet. Use Create Camera first.");
};

AT.isTwoNode = function (cam) {
    return cam.autoOrient === AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
};

AT.register("camera.create", {
    label: "Create Camera",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var comp = ctx.comp;
        var lens = AT.CAMERA_LENSES[payload.lens || "50mm"] || 50;
        var zoom = lens * comp.width / 36;
        var cam = comp.layers.addCamera(payload.name || ("Camera " + (payload.lens || "50mm")), [comp.width / 2, comp.height / 2]);
        AT.cameraZoom(cam).setValue(zoom);
        AT.tprop(cam, "position").setValue([comp.width / 2, comp.height / 2, -zoom]);
        // One-node cameras have no point of interest to drag around, which
        // makes simple moves far more predictable for new animators.
        if (payload.oneNode !== false) cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
        else {
            cam.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
            AT.tprop(cam, "anchor").setValue([comp.width / 2, comp.height / 2, 0]);
        }

        var made3D = 0;
        if (payload.make3D) {
            var layers = comp.selectedLayers;
            for (var i = 0; i < layers.length; i++) {
                if (AT.isVisualLayer(layers[i]) && !layers[i].threeDLayer) {
                    layers[i].threeDLayer = true;
                    made3D++;
                }
            }
        }
        var fb = (payload.lens || "50mm") + " camera created";
        if (made3D) fb += " - " + AT.plural(made3D, "layer") + " made 3D";
        return { result: { made3D: made3D }, feedback: fb };
    }
});

AT.CAMERA_MOVES = {
    "push": { axis: "dolly", sign: 1, title: "Push In" },
    "pull": { axis: "dolly", sign: -1, title: "Pull Out" },
    "truck-left": { axis: [-1, 0, 0], title: "Truck Left" },
    "truck-right": { axis: [1, 0, 0], title: "Truck Right" },
    "pedestal-up": { axis: [0, -1, 0], title: "Pedestal Up" },
    "pedestal-down": { axis: [0, 1, 0], title: "Pedestal Down" }
};

AT.keyMove = function (prop, t0, t1, delta, profile) {
    var v0 = prop.valueAtTime(t0, true);
    AT.clearWindow(prop, t0, t1);
    prop.setValueAtTime(t0, v0);
    prop.setValueAtTime(t1, AT.addArrays(v0, delta));
    AT.easeSegment(prop, prop.nearestKeyIndex(t0), prop.nearestKeyIndex(t1), profile);
};

AT.register("camera.move", {
    validate: function (p, ctx) { AT.targetCamera(ctx.comp); },
    label: "Camera Move",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var move = AT.CAMERA_MOVES[payload.move];
        if (!move) AT.fail("bad-payload", "Unknown camera move: " + payload.move);
        var cam = AT.targetCamera(ctx.comp);
        var dist = payload.distance || 300;
        var t0 = ctx.comp.time;
        var t1 = t0 + AT.durationOf(ctx.comp, payload, 48);
        var profile = AT.profile(payload.easing || "smooth");
        var position = AT.tprop(cam, "position");
        if (position.dimensionsSeparated) AT.fail("unsupported", "Camera Position has separated dimensions. Join them to use camera moves.");
        var twoNode = AT.isTwoNode(cam);

        var delta;
        if (move.axis === "dolly") {
            var dir = [0, 0, 1];
            if (twoNode) {
                var p = position.valueAtTime(t0, true);
                var poi = AT.tprop(cam, "anchor").valueAtTime(t0, true);
                var len = AT.valueDistance(p, poi);
                if (len > 1e-6) dir = [(poi[0] - p[0]) / len, (poi[1] - p[1]) / len, (poi[2] - p[2]) / len];
            }
            delta = [dir[0] * dist * move.sign, dir[1] * dist * move.sign, dir[2] * dist * move.sign];
            AT.keyMove(position, t0, t1, delta, profile);
        } else {
            delta = [move.axis[0] * dist, move.axis[1] * dist, 0];
            AT.keyMove(position, t0, t1, delta, profile);
            // Two-node cameras must move their point of interest too, or a
            // truck turns into a swivel.
            if (twoNode) AT.keyMove(AT.tprop(cam, "anchor"), t0, t1, delta, profile);
        }
        AT.addMarker(cam, t0, t1 - t0, move.title);
        return { result: { camera: cam.name }, feedback: move.title + " added to " + cam.name };
    }
});

AT.register("camera.select", {
    label: "Select Camera",
    mutating: false,
    needs: "comp",
    run: function (payload, ctx) {
        var cam = AT.targetCamera(ctx.comp);
        var sel = ctx.comp.selectedLayers;
        for (var i = 0; i < sel.length; i++) sel[i].selected = false;
        cam.selected = true;
        return { result: { camera: cam.name }, feedback: cam.name + " selected" };
    }
});

AT.register("camera.read", {
    needs: "comp",
    run: function (payload, ctx) {
        var cam = AT.targetCamera(ctx.comp);
        var t = ctx.comp.time;
        return {
            result: {
                camera: cam.name,
                position: AT.tprop(cam, "position").valueAtTime(t, true),
                pointOfInterest: AT.tprop(cam, "anchor").valueAtTime(t, true),
                zoom: AT.cameraZoom(cam).valueAtTime(t, true)
            },
            feedback: "Camera position saved"
        };
    }
});

AT.setOrKey = function (prop, t, value) {
    if (prop.numKeys > 0) prop.setValueAtTime(t, value);
    else prop.setValue(value);
};

AT.register("camera.restore", {
    validate: function (p, ctx) { AT.targetCamera(ctx.comp); },
    label: "Restore Camera",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        if (!payload.position) AT.fail("bad-payload", "No saved camera position.");
        var cam = AT.targetCamera(ctx.comp);
        var t = ctx.comp.time;
        AT.setOrKey(AT.tprop(cam, "position"), t, payload.position);
        if (AT.isTwoNode(cam) && payload.pointOfInterest) AT.setOrKey(AT.tprop(cam, "anchor"), t, payload.pointOfInterest);
        if (payload.zoom) AT.setOrKey(AT.cameraZoom(cam), t, payload.zoom);
        return { result: {}, feedback: "Camera restored" + (AT.tprop(cam, "position").numKeys ? " (keyframed at playhead)" : "") };
    }
});

// ---- lens, focus, shake, orbit ----------------------------------------------------

AT.cameraOpt = function (cam, mn) {
    return cam.property(AT.MN.cameraOptions).property(mn);
};

// Depth of field: things away from the focus distance blur, like a real lens.
AT.register("camera.dof", {
    validate: function (p, ctx) { AT.targetCamera(ctx.comp); },
    label: "Depth of Field",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var cam = AT.targetCamera(ctx.comp);
        var on = payload.on !== false;
        AT.cameraOpt(cam, "ADBE Camera Depth of Field").setValue(on ? 1 : 0);
        if (on && typeof payload.aperture === "number") AT.setOrKey(AT.cameraOpt(cam, "ADBE Camera Aperture"), ctx.comp.time, payload.aperture);
        return { result: { on: on }, feedback: "Depth of field " + (on ? "on" : "off") + " for " + cam.name };
    }
});

// Sets focus distance to the selected (non-camera) layer, turning DOF on.
AT.register("camera.focusSelected", {
    validate: function (p, ctx) { AT.targetCamera(ctx.comp); },
    label: "Focus on Layer",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var cam = AT.targetCamera(ctx.comp);
        var target = null;
        var sel = ctx.comp.selectedLayers;
        for (var i = 0; i < sel.length; i++) if (!(sel[i] instanceof CameraLayer) && AT.isVisualLayer(sel[i])) { target = sel[i]; break; }
        if (!target) AT.fail("no-selection", "Select the layer to focus on (plus the camera, or the comp's active camera is used).");
        var t = ctx.comp.time;
        var c = AT.tprop(cam, "position").valueAtTime(t, false);
        var p = AT.tprop(target, "position").valueAtTime(t, false);
        var dist = AT.valueDistance([c[0], c[1], c[2]], [p[0], p[1], p.length > 2 ? p[2] : 0]);
        AT.cameraOpt(cam, "ADBE Camera Depth of Field").setValue(1);
        AT.setOrKey(AT.cameraOpt(cam, "ADBE Camera Focus Distance"), t, dist);
        return { result: { distance: dist }, feedback: "Focused on " + target.name + " (" + Math.round(dist) + "px)" };
    }
});

// Handheld shake as a wiggle() expression: editable, removable, no keys.
AT.SHAKE_TAG = "// AT shake";
AT.register("camera.shake", {
    validate: function (p, ctx) { AT.targetCamera(ctx.comp); },
    label: "Camera Shake",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var cam = AT.targetCamera(ctx.comp);
        var pos = AT.tprop(cam, "position");
        var ours = pos.expression.indexOf(AT.SHAKE_TAG) === 0;
        if (pos.expression && !ours) AT.fail("expression", "The camera's Position already has an expression. Remove it first.");
        if (payload.remove) {
            if (!ours) AT.fail("no-shake", "This camera has no toolkit shake.");
            pos.expression = "";
            return { result: {}, feedback: "Camera shake removed" };
        }
        var freq = payload.frequency || 2, amt = payload.amount || 12;
        pos.expression = AT.SHAKE_TAG + "\nwiggle(" + freq + ", " + amt + ");";
        return { result: {}, feedback: "Shake added (" + freq + "x/sec, " + amt + "px). Edit it in Position's expression." };
    }
});

// Orbit: parents the camera to a 3D null at the comp centre and rotates the
// null. Rotating a parent is the reliable way to circle a subject.
AT.register("camera.orbit", {
    validate: function (p, ctx) { AT.targetCamera(ctx.comp); },
    label: "Camera Orbit",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var comp = ctx.comp;
        var cam = AT.targetCamera(comp);
        var rig = cam.parent;
        if (rig && rig.name !== "AT Camera Orbit") AT.fail("parented", "This camera is already parented to " + rig.name + ". Unparent it to use Orbit.");
        if (!rig) {
            rig = comp.layers.addNull(comp.duration);
            rig.name = "AT Camera Orbit";
            rig.threeDLayer = true;
            AT.tprop(rig, "position").setValue([comp.width / 2, comp.height / 2, 0]);
            rig.moveBefore(cam);
            cam.parent = rig;
        }
        var deg = (payload.degrees || 30) * (payload.direction === "right" ? -1 : 1);
        var t0 = comp.time;
        var t1 = t0 + AT.durationOf(comp, payload, 72);
        AT.keyMove(AT.tprop(rig, "rotationY"), t0, t1, [deg], AT.profile(payload.easing || "smooth"));
        AT.addMarker(cam, t0, t1 - t0, "Orbit " + (payload.direction === "right" ? "Right" : "Left"));
        return { result: {}, feedback: "Orbit " + Math.abs(deg) + " deg added (rotates the 'AT Camera Orbit' null)" };
    }
});

// Lens zoom: animates Zoom (focal length), not position - the view narrows
// and flattens instead of travelling.
AT.register("camera.lensZoom", {
    validate: function (p, ctx) { AT.targetCamera(ctx.comp); },
    label: "Lens Zoom",
    mutating: true,
    needs: "comp",
    run: function (payload, ctx) {
        var cam = AT.targetCamera(ctx.comp);
        var pct = typeof payload.percent === "number" ? payload.percent : 30;
        var zoom = AT.cameraZoom(cam);
        var t0 = ctx.comp.time;
        var t1 = t0 + AT.durationOf(ctx.comp, payload, 48);
        var z0 = zoom.valueAtTime(t0, true);
        AT.keyMove(zoom, t0, t1, [z0 * pct / 100], AT.profile(payload.easing || "smooth"));
        AT.addMarker(cam, t0, t1 - t0, pct >= 0 ? "Lens Zoom In" : "Lens Zoom Out");
        return { result: {}, feedback: "Lens zoom " + (pct >= 0 ? "in " : "out ") + Math.abs(pct) + "% added" };
    }
});

}($["com.aanders.animatortoolkit"]));
