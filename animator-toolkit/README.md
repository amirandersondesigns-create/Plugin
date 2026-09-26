# Animator Toolkit (CEP panel for After Effects)

A dockable After Effects panel for designers moving into motion. It does
common jobs in one click and explains each one as it goes: anchor points,
keyframes, easing, motion presets, text animation, cameras and still capture.
It also includes micro-lessons and explained shortcuts.

- **Hosts:** After Effects 2021 (18.0) and newer, macOS and Windows
- **Tech:** CEP HTML/JS panel + ExtendScript host commands. No build step and no dependencies.

## Install

**Option A: ZXP (signed, no debug mode needed)**

1. Install a free ZXP installer, such as [ZXP Installer by aescripts](https://aescripts.com/learn/zxp-installer/)
   or Anastasiy's Extension Manager.
2. Drag `AnimatorToolkit-0.2.2.zxp` onto it.
3. Restart After Effects and open **Window › Extensions › Animator Toolkit**.

The ZXP is self-signed (not by an Adobe-trusted certificate), so installers
may say the publisher is unverified. That's expected for a test build.
To rebuild it, run `bash tools/build-zxp.sh`. It uses Adobe's ZXPSignCmd, run
under Wine on Linux, and writes `dist/`. Keep `dist/cert.p12` so later builds
install as updates.

**Option B: zip + install script (unsigned, debug mode)**

1. Unzip `animator-toolkit-0.2.2.zip`.
2. Run `install/install-mac.command` (macOS) or `install\install-windows.bat` (Windows).
   These turn on CEP *PlayerDebugMode* so AE will load an unsigned panel,
   then copy the extension to your user CEP extensions folder.
3. Restart After Effects and open **Window › Extensions › Animator Toolkit**.

Use only one option. If you switch, remove the other copy first: the
uninstall script, or the installer's Remove button.

**Panel opens but buttons do nothing?**

A red banner under the header appears (with the reason and a Retry button)
only when the panel can't reach After Effects; otherwise it reconnects on
its own.
Up to 0.1.1, and again in a VS Code-edited 0.1.3, one failed first
contact with the host (for example while After Effects was still starting)
broke every button until the panel was reopened. Those builds also used
generic global names (`AT`, `ATJSON`) in After Effects' shared script
engine, where other tools can overwrite them. From 0.1.2 on, the panel
retries and recovers, and the host keeps everything in
`$["com.cnn.animatortoolkit"]`. `npm run test:e2e` reproduces that failure
(`E2E_SRC=<folder>` runs it against any other build).
For full detail, open DevTools at <http://localhost:8099>: every command and
reply is logged in its console.

**"After Effects returned an empty reply" on buttons that worked?** Fixed
in 0.2.1. ExtendScript can drop a function's `return` value when it passes
through a `try/finally`. The dispatcher used one to close undo groups, so
commands ran but the panel never got the result. It now closes the group
without `finally`, and a test bans `finally` from host code. From 0.2.2 the
host also stores every reply, and if AE still loses the return value the panel
reads the stored reply back. Only a real failure shows an error; an
unconfirmed result shows a short info note instead.

**Panel not listed under Window › Extensions?**

First check `~/Library/Logs/CSXS/CEP12-AEFT.log` for `Unsupported Manifest version`.
That error means the manifest can't be parsed. Up to 0.1.0 the manifest
declared a default XML namespace, which After Effects 2026 rejects. 0.2.2
matches Adobe's schema, and `tests/manifest.test.js` guards against a repeat.

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
| **Home** | Suggestions for the current selection, 16 quick actions (incl. Stagger, Rasterize, Make 3D, Animate Fast), favorites, recent tools, and the 5 essential skills |
| **Animate** | Anchor grid and Align/Distribute, keyframe strip, **Stagger** (in frames), motion library (13 essentials, 11 more effects, each In and Out), and layer tools including **Continuous Rasterize** |
| **Easing** | Live curve and moving ball. Easy Ease/In/Out/Linear/Hold, strength chips, 8 **curve presets** (Sine to Expo, Smooth Stop/Start, Snap, Glide), **physics** (Overshoot, Bounce, Elastic keyframes between selected keys), and In/Out sliders |
| **Text** | New text, plus 11 essentials and 13 more effects (per-letter rise/pop/spin/random, word blur, type on and more) |
| **Mask** | Real animated mask reveals (wipes, soft wipe, iris, split), mask tools (rectangle, ellipse, invert, feather), and the "can't see my mask path" fix |
| **3D** | Make 3D/2D, spread in depth, 3D motion (flip, tumble, door swing, fly from depth, card flip), extruded 3D text with a renderer switch, and quick camera moves |
| **Camera** | Create, moves, **lens & focus** (DOF, aperture, focus on layer, lens zoom), **rigs** (orbit null, wiggle shake), and saved positions |
| **Capture** | Grab Still. Every Grab Still button (including Home) opens a pop-up with the image, file name and folder, plus Open folder |
| **Preview** | One-click **Animate Fast / Final Check**, then Resolution (Down Sample Factor), Fast Previews and 8/16/32 bpc as simple choice rows, speed tools (Draft 3D, 90f/180f work area, purge cache), and recommended Preview-panel settings |
| **Audio** | -3/+3 dB, bed at -12 dB, reset, fades with a length in frames, and two shortcuts |
| **Favorites** | Cards with previews, groups, rename, reorder |
| **Learn** | Lessons, including "Stuck? Quick fixes" (invisible mask paths, empty viewer, finding anything, guides, getting around) and production topics (preview speed, rasterize, bpc, audio, 3D). 79 shortcuts in 9 categories. About: density, version, replay the welcome |

Search (`/`) covers every tool, preset, lesson, shortcut and favorite
(including favorites you've renamed). Every animation option (presets,
camera moves, orbit, lens zoom, audio fades, stagger) takes a duration in
frames (animators count frames); a small hint shows the equivalent seconds.

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
                           shortcuts
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
npm test          # 58 unit/contract tests (Node, no dependencies)
npm run test:e2e  # 51 end-to-end checks (52 with E2E_DROP=1) (needs Playwright + Chromium);
                  # E2E_FRIENDLY=1 for ideal conditions, E2E_DROP=1 for lost
                  # return values, E2E_SRC=<dir> for another build
```

The unit tests run in Node against `tests/host/mock-ae.js`, a strict mock of the AE
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

`test:e2e` loads the real panel in Chromium with a fake `__adobe_cep__`
wired to the mock host. It boots the host scripts through `AT_boot` and
`$.evalFile` from a path with spaces, like the real "Application Support"
folder, then clicks through Animate, Easing, Text, search and Favorites.
After each click it checks the resulting keyframes, markers and undo groups.

A mock is not After Effects. Before relying on a release, check these in
real AE (2024 and 2025/26, on macOS and Windows):

- [ ] Panel loads and Home suggestions follow the selection.
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
