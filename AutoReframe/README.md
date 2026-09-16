# Auto Reframe (CEP extension)

Automatic aspect-ratio reframing for After Effects — convert a comp between
16:9, 9:16, 4:5 and 1:1 in one click, driven by a controller-null rig that
never bakes expressions and never edits a shared solid or precomp source.
Built against `docs/auto-reframe-spec.md` (section 17: competitive
benchmark & required differentiators).

This is a separate, independent extension living alongside Motion Spell
Checker in this repo — it does not touch that codebase.

## How it's put together

```
CSXS/manifest.xml      Extension manifest (panel size, host app, entry points)
client/index.html      Panel markup
client/css/style.css   Same restrained dark theme as Motion Spell Checker
client/js/main.js      Panel logic — renders state, talks to ExtendScript
client/js/CSInterface.js
                        Minimal bridge to the CEP host (evalScript, etc.)
host/reframe.jsx        ExtendScript engine — the whole reframe pipeline.
                        This is what actually touches the AE project.
```

The panel never touches the AE project directly — every action (assign
roles, reframe, audit, queue render) calls into `host/reframe.jsx` through
`CSInterface.evalScript()`, which returns JSON that `main.js` renders.

## What it does

- **One-click, cross-aspect conversion.** Pick any of 16:9 / 9:16 / 4:5 /
  1:1 and click Generate — each becomes its own new comp; the source comp
  is never modified.
- **Fit All mode.** Everything reparents to a single `REFRAME_CONTROLLER`
  null that uniformly contain-scales the whole comp into the new frame.
  No recursion into precomps needed.
- **Smart Stack mode.** Layers tagged with an Element Role (background,
  headline, lower-third, bug, OTS, foreground) get their own
  `{ROLE}_CONTROLLER` null, positioned into a per-format safe-zone layout
  automatically. Unassigned layers are treated as foreground. With
  "Reframe inside precomps" on, nested precomps are duplicated
  (`{Name}_{Preset}`, once per format even if reused several times) and the
  same engine recurses into them, up to 8 levels deep.
- **Never bakes expressions.** Existing expressions on your layers are
  left exactly as-is; the audit only flags their presence. The rig's own
  controller nulls carry a self-referencing expression (reads their own
  "Offset Position" / "Scale Adjust %" effects) so manual nudges are never
  destructive and are always visible/editable.
- **Never edits shared items.** Full-frame solids get a brand-new solid
  source sized to the target comp and `layer.replaceSource()`'d in; the
  original solid source is untouched. Same for precomps in Smart Stack
  recursion.
- **Resync.** Re-running Generate with Resync checked finds the comp it
  previously produced for that exact source comp + format (matched by
  internal metadata stored in the comp's `.comment` field, not by name)
  and reapplies the designer's saved controller slider/point values after
  regenerating — so a copy change upstream doesn't wipe manual tweaks.
- **Live Text Link.** Text layers in each generated comp get a live
  `Source Text` expression pulling from the matching layer in the master
  comp by name, so broadcast copy edits flow through automatically.
- **Safe-zone guides.** Adds a non-rendering guide shape layer
  (`AVLayer.guideLayer = true`) with action-safe / title-safe outlines
  sized for the target format's aspect class.
- **Audit (Section 7).** Flags live expressions, locked layers, effects
  with absolute-pixel parameters that won't auto-scale (Fast Box Blur,
  Drop Shadow, etc.), and layers already scaled past ~115% of native
  resolution. Informational only — nothing is changed.
- **Render queue integration.** Queues every comp generated in the last
  run with an output filename built from a naming template
  (`{comp} {preset} {width} {height}` tokens).

## Known limitations (honest scope)

- Smart Stack placement uses a bounding-box heuristic (position + scale of
  each role group, ignoring rotation/masks) — good for a one-click
  starting layout, not a substitute for a designer's eye. Adjust with the
  per-controller Offset/Scale sliders; those adjustments survive Resync.
- Camera/3D handling reparents cameras and 3D layers under a 3D-enabled
  controller like any other layer; it is not a full perspective-aware
  reframe. Treat it as a reasonable default, verify visually.
- Element Roles are stored as a layer marker (`REFRAME_ROLE:<role>`)
  since AE layers have no free-form metadata field — visible if you scrub
  markers, harmless otherwise.

## Installing it for testing (unsigned / debug mode)

Same process as Motion Spell Checker — see the root `README.md` for the
debug-mode / extensions-folder steps. Copy (or symlink) this `AutoReframe`
folder into the CEP extensions directory as `AutoReframe`, then open it
from **Window → Extensions → Auto Reframe**. Chrome DevTools for this
panel are reachable at `http://localhost:8093` while AE has it open (see
`.debug`).
