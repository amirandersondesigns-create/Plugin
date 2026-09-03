# Motion Spell Checker (CEP extension)

A spell-checking panel for After Effects 2022+, rebuilt as a CEP extension
(HTML/CSS/JS panel + an ExtendScript back end) so the UI can look like a
real product instead of a native ScriptUI dialog — rounded cards, a
settings drawer, colored suggestion states, hover/press feedback.

## How it's put together

```
CSXS/manifest.xml     Extension manifest (panel size, host app, entry points)
client/index.html     Panel markup
client/css/style.css  Dark theme, cards, buttons, the results list
client/js/main.js     Panel logic — renders state, talks to ExtendScript
client/js/CSInterface.js
                       Minimal bridge to the CEP host (evalScript, etc.)
host/spellcheck.jsx   ExtendScript engine — dictionary, scanner, replace,
                       reveal-in-timeline. This is what actually touches
                       the After Effects project.
Dictionary/            (created next to the extension on first run) —
                       drop category word-list .txt files here for fuller
                       coverage than the built-in fallback list.
```

The panel never touches the AE project directly — every scan, replace,
ignore, "add to dictionary" and reveal-in-timeline action calls into
`host/spellcheck.jsx` through `CSInterface.evalScript()`, which returns
JSON that `main.js` renders.

## What's in the box

- **Scope**: Active Comp, Entire Project, Selected Layers, or Selected
  Comps (comps selected in the Project panel) — plus one-click "Scan
  Active Comp" / "Scan Selected Comps" buttons in the gear-icon settings
  drawer.
- **On-canvas highlighting**: after a scan, every layer containing a
  misspelling gets a red outline drawn directly in the Composition
  viewer, on a non-rendering guide layer (`MSC Highlights`) that's
  excluded from render and never touches your actual layers. Toggle it
  with the eye icon, force it to reveal hidden layers ("Force highlight
  visibility"), or turn it off entirely for large projects ("Disable
  global highlights (faster)").
- **Scan settings drawer** (gear icon): layer filters (hidden / locked /
  selected-only) and the highlighting controls above, plus a Dictionary
  shortcut and the highlight-visibility toggle.
- **Host theme adaptation**: the panel reads After Effects' own UI skin
  color on load (and live, on theme change) and re-tints itself to match
  — dark or light — instead of assuming a fixed dark theme.
- Word-level suggestions (Levenshtein-ranked), one-click Replace/Undo,
  session Ignore, and a persistent custom dictionary — all as before.

## Installing it for testing (unsigned / debug mode)

CEP extensions normally need to be signed into a `.zxp` to install
normally. For development, Adobe lets you turn on **debug mode**, which
allows After Effects to load an unpacked extension folder straight from
disk:

**macOS**
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
```
**Windows** — in `regedit`, under `HKEY_CURRENT_USER\Software\Adobe\CSXS.9`
add a String value `PlayerDebugMode` set to `1`.

(If your After Effects ships a different CEP runtime, also try `CSXS.10`,
`CSXS.11`, etc. — check `CSXS/manifest.xml`'s `RequiredRuntime` version
against what your AE version reports.)

Then copy (or symlink) this whole folder into the CEP extensions
directory:

- **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/MotionSpellChecker`
- **Windows**: `%APPDATA%\Adobe\CEP\extensions\MotionSpellChecker`

Restart After Effects, then open it from **Window → Extensions → Motion
Spell Checker**.

## Packaging for distribution (signed `.zxp`)

For anything beyond your own machine, sign it with Adobe's
`ZXPSignCmd` (part of the CEP SDK):

```bash
ZXPSignCmd -selfSignedCert US CA "Amir Anderson" "MotionSpellChecker" password cert.p12
ZXPSignCmd -sign . MotionSpellChecker.zxp cert.p12 password
```

Users then install the `.zxp` with the free **Anastasiy's Extension
Manager** or Adobe's ExManCmd — no debug mode needed on their machine.

## Debugging the panel itself

With debug mode on, Chrome DevTools for this panel are reachable at
`http://localhost:8092` (the port set in `.debug`) while After Effects
has the panel open — useful for inspecting `main.js` and the DOM/CSS
directly, the same way you'd debug any web page.

## Dictionary files

Drop plain text files into the `Dictionary` folder that appears next to
this extension the first time you scan (or `Documents/MotionSpellChecker/Dictionary`
if the extension folder isn't writable):

- One word per line → added to the "known words" list.
- `wrongword -> correctword` → registered as a direct correction
  suggestion.
- Lines starting with `#` are comments.

File names matching the categories the panel checks for are listed in
`host/spellcheck.jsx` (`DICT_CATEGORIES`), e.g. `General_Vocabulary.txt`,
`Commonly_Misspelled_Words_A_Z.txt`. Use **Verify Dictionary** in the
panel to see what's currently loaded and how many words/corrections each
file contributed.
