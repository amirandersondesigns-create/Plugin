# Animator Toolkit (CEP panel for After Effects)

A dockable After Effects panel for designers moving into motion. It does
common jobs in one click and explains each one as it goes: anchor points,
keyframes, easing, motion presets, text animation, cameras and still capture.
It also includes micro-lessons, explained shortcuts and guided workflows.

- **Hosts:** After Effects 2021 (18.0) and newer, macOS and Windows
- **Tech:** CEP HTML/JS panel + ExtendScript host commands. No build step and no dependencies.

## Install

**Option A: ZXP (signed, no debug mode needed)**

1. Install a free ZXP installer, such as [ZXP Installer by aescripts](https://aescripts.com/learn/zxp-installer/)
   or Anastasiy's Extension Manager.
2. Drag `AnimatorToolkit-0.1.1.zxp` onto it.
3. Restart After Effects and open **Window › Extensions › Animator Toolkit**.

The ZXP is self-signed (not by an Adobe-trusted certificate), so installers
may say the publisher is unverified. That's expected for a test build.
To rebuild it, run `bash tools/build-zxp.sh`. It uses Adobe's ZXPSignCmd, run
under Wine on Linux, and writes `dist/`. Keep `dist/cert.p12` so later builds
install as updates.

**Option B: zip + install script (unsigned, debug mode)**

1. Unzip `animator-toolkit-0.1.1.zip`.
2. Run `install/install-mac.command` (macOS) or `install\install-windows.bat` (Windows).
   These turn on CEP *PlayerDebugMode* so AE will load an unsigned panel,
   then copy the extension to your user CEP extensions folder.
3. Restart After Effects and open **Window › Extensions › Animator Toolkit**.

Use only one option. If you switch, remove the other copy first: the
uninstall script, or the installer's Remove button.

**Panel not listed under Window › Extensions?**

1. Run `install/diagnose-mac.command` (or `diagnose-windows.bat`) from the zip.
   It writes `AnimatorToolkit-diagnostics.txt` to your Desktop: install
   locations, permissions, debug-mode flags and CEP log lines. It also turns on
   detailed CEP logging, so reopen After Effects once and run it again if the
   log section is empty.
2. The most reliable test path is Option B. Its debug mode makes After
   Effects skip signature checks, so if the panel appears after Option B, the
   ZXP signature or installer was the problem.
3. Keep only one installed copy: two folders with the same ID can conflict.

Debugging (Option B install): with the panel open, Chrome DevTools are at <http://localhost:8099>.
If you open `client/index.html` in a normal browser, the panel runs in
**preview mode** against a simulated host. Use this for reviewing layout
and flows; it doesn't touch After Effects.

## What's in the panel

| Tab | What it does |
|---|---|
| **Home** | Suggestions based on the current selection (text, camera, keyframes, multiple layers), quick-action icons, favorites, recent tools and the 5 essential skills |
| **Animate** | Layout dock: a 3×3 anchor grid (the layer doesn't move) plus Align/Distribute to comp. Also: keyframe strip (P S R T A All, delete, reverse, stagger), the motion library (Essentials plus More effects: Pop, **Bounce**, Drop, Spin, Wipe) and layer tools (Null + Parent, Pre-compose, Motion Blur, Marker) |
| **Easing** | Live curve with a moving-ball comparison against linear. "Read selected keys" draws the curve of your real keyframes. Also: Easy Ease / In / Out / Linear / Hold, strength chips and **In/Out influence sliders** |
| **Text** | New centered text, plus text motion: layer presets and real Text Animator presets (Tracking, Type On, Word/Line Reveal, Soft Letters, **Bounce**) |
| **Camera** | Create camera (lens, one-node, make selected 3D), push/pull/truck/pedestal moves with distance, duration and feel, and saved camera positions |
| **Capture** | Grab Still (PNG of the current frame), with folder choice and optional import or add-to-comp |
| **Favorites** | Cards with live previews, curves or icons. Filter by group, rename, reorder, remove. Saved between sessions |
| **Learn** | 16 micro-lessons, 43 explained shortcuts, 5 guided workflows. **About this panel** holds Panel (mode, density), Version and Replay the welcome |

Search (`/`) covers every tool, preset, lesson, shortcut, guide and favorite
(including favorites you've renamed). Beginner mode shows explanations.
Pro mode is compact and hides them.

## How presets stack

Presets are data (`client/js/content/motions.js`). The host engine
(`host/commands/presets.jsx`) follows five rules:

1. **Timing.** Entrances start at the layer's In point and exits end at its
   Out point, so *Bounce In* and *Bounce Out* land at opposite ends of the
   layer. The **Playhead** option starts the animation at the current time instead.
2. **Rest value.** An entrance animates *to* the property's value at the end
   of its window, and an exit animates *from* its value at the start. Presets
   build on the layer's real position and scale instead of resetting it.
3. **Own window only.** Before writing keys, the engine removes any existing
   keys inside the preset's time range on that property. Re-applying a preset,
   or swapping Pop In for Bounce In, replaces the old keys instead of adding more.
4. **Different properties never collide.** Fade (Opacity), Slide (Position)
   and Blur (one shared "AT Blur" effect) all work together on one layer.
   Each text preset gets its own named animator ("AT Type On").
5. **Markers.** Every application adds a layer marker labelled with the
   preset name and spanning its duration. Presets that start on the same frame
   share one marker ("Fade In + Slide Up").

Every click is one undo group, including multi-step presets.

## Architecture

```
CSXS/manifest.xml          CEP manifest (root tag on one line: CEP 12 needs that)
host/                      ExtendScript: the only code that touches the project
  index.jsx                loads the modules below (AT_boot)
  core/json.jsx            JSON encode + no-eval parser (ES3 has no JSON)
  core/dispatcher.jsx      versioned command bus, undo groups, user-facing errors
  core/props.jsx           match names, layer kinds, keyframe-safe offsets
  commands/*.jsx           anchor, easing, presets, text, keyframes, layers,
                           camera, still, context
client/
  js/core/bridge.js        the ONLY caller of evalScript; preview-mode fallback
  js/core/store.js         settings/favorites/progress: versioned JSON files in
                           <user data>/AnimatorToolkit, atomic writes
  js/core/catalog.js       id → tool/preset/lesson; AT.run() executes anything
  js/core/search.js        stemmed, weighted search index
  js/core/favorites.js     favorites reference ids (never copies)
  js/content/*.js          data only: tools, motion presets, lessons,
                           shortcuts, workflows
  js/ui/*.js               icons, illustrations, component kit
  js/views/*.js            one file per tab (tab order = script order in index.html)
  css/                     tokens, layout/components, preset preview animations
tests/                     mock After Effects DOM + Node tests
```

The panel sends `{ version, requestId, command, payload }`, serialized as a
single string literal. ExtendScript parses it with a real JSON parser (no
`eval`) and returns `{ ok, result, feedback }` or `{ ok:false, error:{code,message} }`.

**Adding a tool:** register a command in `host/commands/`, then add one entry to
`client/js/content/actions.js`. Search, favorites, the info popover and
feedback all pick it up. **Adding a preset:** add one object to `motions.js`.
If it needs a new keyframe shape or kind, add it to `AT.SHAPES` or
`AT.PRESET_KINDS` in `presets.jsx`.

## Tests

```
npm test
```

37 tests run in Node against `tests/host/mock-ae.js`, a strict mock of the AE
scripting DOM. The mock throws where AE throws, for example on `setValue` on
a keyframed property or a temporal-ease array of the wrong length. The tests cover:

- anchor moves on rotated/scaled, animated, separated-dimension layers, where
  the layer's visual position must stay exact, and refusals with a reason
- easing sides, slider influences, ease-array length for Scale, curve read-back
- **stacking**: Bounce In + Bounce Out in either order, re-apply idempotence,
  Fade + Slide + Blur in/out on one layer, shared effects, merged markers,
  drop-bounce never overshooting the ground
- a contract test that applies **every** panel preset, In and Out, stacked on
  one graphic layer and one text layer through the real host code
- text animators, align/distribute, reverse keys, camera push, null parenting
- search stemming and ranking, the storage backends and corrupt-file recovery,
  and bridge escaping (hostile strings stay data)

A mock is not After Effects. Before relying on a release, check these in
real AE (2024 and 2025/26, on macOS and Windows):

- [ ] Panel loads. The context chip shows the open comp and selection.
- [ ] Anchor grid on text, shape, footage, a parented layer, a rotated layer, a
      2D layer and an unrotated 3D layer: the artwork must not move.
- [ ] Every button is one Cmd/Ctrl+Z, and redo restores it.
- [ ] Bounce In + Bounce Out (and Type On + Type Off) on one layer; markers read correctly.
- [ ] Text presets on point text and paragraph text; animators appear named "AT …".
- [ ] Easing on Position (spatial), Scale (3D ease arrays) and effect properties.
- [ ] Camera moves on one-node and two-node cameras.
- [ ] Wipe In reveals left-to-right (Linear Wipe angle mapping in `AT.WIPE_ANGLES`).
- [ ] Grab Still, with and without "import", on a comp with transparency.
- [ ] Favorites and settings survive an AE restart.

## Known limits (by design)

- **Anchor** refuses a layer, with the reason, when Scale or Rotation is
  animated, when there's an expression, or when a 3D layer is tilted on X or Y.
  No single offset can keep the layer in place in those cases.
- **Align** skips parented and 3D layers for the same reason.
- **Grab Still** uses AE's undocumented `saveFrameToPng`. It's fine for
  approvals. For a deliverable, use the Render Queue.
- Bounce, elastic and overshoot are keyframe shapes, not expressions. They're
  editable and visible in the timeline, but only as smooth as their keys.
