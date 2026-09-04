# Motion Spell Checker

A spell-checking panel for After Effects 2022+: scans text layers, layer
names, marker comments, string effect parameters, and quoted strings in
expressions; suggests corrections; replaces in place; and (optionally)
draws a highlight box around every layer with an error, directly in the
Composition viewer.

## Recommended: `MotionSpellChecker.jsx` — a single-file script

**`MotionSpellChecker.jsx`** (repo root) is the primary way to install and
distribute this. It's a plain ExtendScript `.jsx` file with a ScriptUI
panel built in — no CEP manifest, no signing, no debug mode, no `.zxp`.

**Install it:**
1. Copy `MotionSpellChecker.jsx` into your After Effects Scripts folder,
   in the `ScriptUI Panels` subfolder:
   - **macOS**: `/Applications/Adobe After Effects <version>/Scripts/ScriptUI Panels/`
   - **Windows**: `C:\Program Files\Adobe\Adobe After Effects <version>\Support Files\Scripts\ScriptUI Panels\`
2. Restart After Effects.
3. Open it from **Window → Motion Spell Checker**.

That's it — no other steps. (You can also run it once via **File → Scripts
→ Run Script File…** for a floating window instead of a docked panel, if
you'd rather not install it permanently.)

**To hand it to someone else**: send them the one `.jsx` file. Same two
steps on their end. Nothing to sign, no installer needed.

### What it can do

- **Scope**: Active Comp, Entire Project, Selected Layers, or Selected
  Comps (comps selected in the Project panel).
- **On-canvas highlighting**: after a scan, every layer with a
  misspelling gets a red outline drawn directly in the Composition
  viewer, on a non-rendering guide layer (`MSC Highlights`) that's
  excluded from render and never touches your actual layers. Toggle it,
  force it to reveal hidden layers, or turn it off for large projects —
  all in the **Settings…** dialog.
- Word-level suggestions (Levenshtein-ranked against an ~8,100-word
  built-in dictionary), one-click Replace/Undo, session Ignore, and a
  persistent custom dictionary.
- **Verify Dictionary** and **Help** dialogs built in.

### Dictionary files (optional)

Drop plain text files into a `Dictionary` folder placed **next to**
`MotionSpellChecker.jsx` for coverage beyond the built-in list:

- One word per line → added to the "known words" list.
- `wrongword -> correctword` → registered as a direct correction
  suggestion.
- Lines starting with `#` are comments.

File names matching the categories the script checks for are listed in
`MotionSpellChecker.jsx` (`DICT_CATEGORIES`), e.g. `General_Vocabulary.txt`,
`Commonly_Misspelled_Words_A_Z.txt`. Use **Verify Dictionary** in the panel
to see what's currently loaded.

---

## Also included: a CEP extension build

This repo also contains a full CEP (HTML/CSS/JS panel + ExtendScript host)
version of the same tool, under `CSXS/`, `client/`, and `host/`. It looks
more like a polished commercial product (custom theme, settings drawer,
host-theme adaptation), but installing an unsigned copy for testing
requires enabling AE's developer debug mode and placing it in a specific
system folder — considerably more setup than the single-file script above,
and more failure-prone across different AE versions and machine
configurations.

Use the CEP build if you specifically want that richer UI and are willing
to sign it into a `.zxp` for real distribution (see below). Otherwise,
`MotionSpellChecker.jsx` is the simpler, more robust choice for both
personal use and sharing with other artists.

```
CSXS/manifest.xml     Extension manifest (panel size, host app, entry points)
client/index.html     Panel markup
client/css/style.css  Dark theme, cards, buttons, the results list
client/js/main.js     Panel logic — renders state, talks to ExtendScript
client/js/CSInterface.js
                       Minimal bridge to the CEP host (evalScript, etc.)
host/spellcheck.jsx   ExtendScript engine — same scan/replace/highlight
                       logic as MotionSpellChecker.jsx, wrapped for CEP.
```

### Installing the CEP build for testing (unsigned / debug mode)

**macOS**
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```
**Windows** — in `regedit`, under `HKEY_CURRENT_USER\Software\Adobe\CSXS.9`
(and `.10`, `.11`, `.12`) add a String value `PlayerDebugMode` set to `1`.

Then copy this whole repo folder into the CEP extensions directory, named
by its bundle ID:

- **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/com.aanders.motionspellchecker`
- **Windows**: `%APPDATA%\Adobe\CEP\extensions\com.aanders.motionspellchecker`

Restart After Effects, then open it from **Window → Extensions → Motion
Spell Checker**.

### Packaging the CEP build for distribution (signed `.zxp`)

Sign it with Adobe's `ZXPSignCmd` (from
[Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources) on
GitHub) so it installs without debug mode:

```bash
ZXPSignCmd -selfSignedCert US CA "Amir Anderson" "Motion Spell Checker" password cert.p12
ZXPSignCmd -sign . MotionSpellChecker.zxp cert.p12 password -tsa https://timestamp.digicert.com
```

Users then install the `.zxp` with **ZXP Installer** (zxpinstaller.com) or
**Anastasiy's Extension Manager** — no debug mode needed on their machine.

### Debugging the CEP panel itself

With debug mode on, Chrome DevTools for this panel are reachable at
`http://localhost:8092` (the port set in `.debug`) while After Effects
has the panel open.
