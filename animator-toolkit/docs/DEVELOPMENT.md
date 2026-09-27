# Amir Anderson Animator Toolkit: development notes

Copyright (c) 2026 Amir Anderson. All rights reserved. Internal document; not
part of the distributed package.

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

Every click is one undo group, including multi-step presets. Each message has an **Undo** button, and Ctrl/Cmd+Z in the panel undoes the toolkit's last action: project changes through Edit › Undo (only while they're still the latest step), viewer toggles (rulers, transparency grid, Fast Previews, which After Effects keeps out of Edit › Undo) by switching them back.

## Architecture

```
CSXS/manifest.xml          CEP manifest
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
npm test          # unit and contract tests (Node, no dependencies)
npm run test:e2e  # end-to-end checks in Chromium (needs Playwright);
                  # E2E_FRIENDLY=1 ideal conditions, E2E_DROP=1 lost replies,
                  # E2E_SRC=<dir> runs against an installed/unpacked build
npm run package   # dist/Amir_Anderson_Animator_Toolkit.zip
npm run zxp       # dist/Amir_Anderson_Animator_Toolkit.zxp (self-signed)
```

The unit tests run against `tests/host/mock-ae.js`, a strict mock of the
After Effects scripting DOM that throws where After Effects throws (for
example a work area that doesn't fit the comp, or deleting a locked layer).
The end-to-end run loads the real panel with a fake `__adobe_cep__` wired to
the mock and clicks through every tab.

A mock is not After Effects. Before a release, check in After Effects (macOS
and Windows): every tab loads; each button is one undo; Bounce In + Bounce Out
on one layer; text presets on point and paragraph text; camera moves; Grab
Still (with and without Import into project); Rulers, Transparency grid and Fast Previews switch on and
off; Work Area buttons from different playhead positions; Purge All
shows After Effects' confirmation; favorites with their own settings.
