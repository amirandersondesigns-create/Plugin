# Motion Spell Checker

A spell-checking panel for After Effects 2022+: scans text layers, layer
names, marker comments, string effect parameters, and quoted strings in
expressions; suggests corrections; replaces in place; and (optionally)
draws a highlight box around every layer with an error, directly in the
Composition viewer.

## Released build: the CEP extension (`CSXS/`, `client/`, `host/`)

This is the version distributed as `Amir Anderson Motion Spell Checker.zxp`
— custom theme, settings drawer, host-theme adaptation, on-canvas highlighting.
**If you just downloaded this to install it, see [`INSTALL.md`](./INSTALL.md)
instead of the developer notes below.**

The rest of this file (packaging, signing, debug-mode testing) is for
working on the plugin's source, not for installing the finished product.

## Alternative: `MotionSpellChecker.jsx` — a single-file script

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

Drop plain text files into `Documents/MotionSpellChecker/Dictionary/`
(created automatically the first time you scan) for coverage beyond the
built-in list. This location is used regardless of where you installed
`MotionSpellChecker.jsx` — `Scripts/ScriptUI Panels/` normally lives
inside `Applications`/`Program Files`, which a standard user account
usually can't write to, so a folder placed there wouldn't reliably work.
(If a `Dictionary` folder already exists right next to the `.jsx` file
itself, that's used instead — useful if you keep the script somewhere
writable outside the AE install.)

- One word per line → added to the "known words" list.
- `wrongword -> correctword` → registered as a direct correction
  suggestion.
- Lines starting with `#` are comments.

File names matching the categories the script checks for are listed in
`MotionSpellChecker.jsx` (`DICT_CATEGORIES`), e.g. `General_Vocabulary.txt`,
`Commonly_Misspelled_Words_A_Z.txt`. Use **Verify Dictionary** in the panel
to see what's currently loaded.

---

## CEP extension source layout

The CEP (HTML/CSS/JS panel + ExtendScript host) build under `CSXS/`,
`client/`, and `host/` is the released product (see the top of this file).
The standalone `MotionSpellChecker.jsx` above is a lighter-weight
alternative for anyone who'd rather skip signing/installers entirely — the
tradeoff is the plain ScriptUI look instead of the CEP build's custom
theme and settings drawer.

```
CSXS/manifest.xml     Extension manifest (panel size, host app, entry points)
client/index.html     Panel markup
client/css/style.css  Dark theme, cards, buttons, the results list
client/js/main.js     Panel logic — renders state, talks to ExtendScript
client/js/CSInterface.js
                       Minimal bridge to the CEP host (evalScript, etc.)
host/spellcheck.jsx   ExtendScript engine — same scan/replace/highlight
                       logic as MotionSpellChecker.jsx, wrapped for CEP.
Dictionary/*.txt      46 bundled category word lists — ships pre-loaded,
                       not something users have to add themselves.
package-zxp.sh        Builds a clean, signed .zxp — see below.
LICENSE.txt           Standalone terms file, distributed alongside the .zxp.
.debug                Dev-only — opens a DevTools debug port for this
                       panel while PlayerDebugMode is on. Deliberately
                       excluded from the signed package by package-zxp.sh.
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

Restart After Effects, then open it from **Window → Extensions → Amir
Anderson Motion Spell Checker**.

### Packaging the CEP build for distribution (signed `.zxp`)

Use **`package-zxp.sh`** (repo root) — it downloads the latest pushed
source fresh, stages *only* the files the running extension actually
needs (`CSXS/`, `client/`, `host/`, `Dictionary/`), and signs that clean
staging folder. It deliberately leaves out `.debug` (opens a DevTools
debug port — a dev-only artifact with no reason to ship), plus
`MotionSpellChecker.jsx`, the docs, and the PDF guide, none of which the
running extension reads.

```bash
./package-zxp.sh YourCertPassword
```

Requires the same two things as always, already set up if you've built
this before: `~/cert.p12` (the self-signed cert) and
`~/Downloads/ZXPSignCmd-64bit` (from
[Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources) —
re-download from there if it's gone; it doesn't survive between sessions
on this machine for some reason). Output lands at
`~/Desktop/Amir Anderson Motion Spell Checker.zxp`, and the script prints
the final package's file listing so you can eyeball that nothing
unwanted got in.

If you need to sign by hand instead (e.g. `package-zxp.sh` isn't
available and you're working from a manually downloaded copy), stage the
four folders into an empty directory yourself first, then:

```bash
ZXPSignCmd -selfSignedCert US CA "Amir Anderson" "Motion Spell Checker" password cert.p12   # once
ZXPSignCmd -sign . "Amir Anderson Motion Spell Checker.zxp" cert.p12 password -tsa https://timestamp.digicert.com
```

Run the `-sign` command from *inside* that staging folder (the one
containing `CSXS/manifest.xml` at its root) — `.` means "sign the current
directory," and pointing it anywhere else (e.g. your home folder, or the
full repo checkout with the extra docs still in it) will sign whatever's
actually there. Delete any existing output file at that exact path first
— `ZXPSignCmd` crashes instead of overwriting. Drop `-tsa` if the
timestamp server is unreachable; it's optional.

Users then install the `.zxp` with **ZXP Installer** (zxpinstaller.com) or
**Anastasiy's Extension Manager** — no debug mode needed on their machine.
`INSTALL.md` in this repo is the customer-facing version of these steps —
that's what to hand to people downloading the finished `.zxp`, not this
file. `LICENSE.txt` (repo root) is the standalone terms file to include
alongside it.

**What to actually upload to Gumroad/aescripts** (as separate files, not
zipped together): the `.zxp` from `package-zxp.sh`,
`Motion_Spell_Checker_Quick_Start_Guide.pdf`, `INSTALL.md`, and
`LICENSE.txt`. Leave out the standalone `.jsx`, the unpacked source
folders, and any loose dictionary files — they either duplicate what's
already inside the `.zxp` or reopen the "two install methods" confusion
this project already worked through.

> **Manifest note**: `CSXS/manifest.xml`'s root `<ExtensionManifest>` tag
> must NOT carry a default `xmlns="..."` attribute. Adding one (even
> pointing at a real Adobe namespace URL) makes AE's manifest parser
> silently fail with `Unsupported Manifest version ''` and skip loading
> the extension entirely, with no indication why — this cost significant
> debugging time to track down. A prefixed namespace like
> `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` (as seen in
> Adobe's own extensions) is fine; a bare `xmlns="..."` is not.

### Debugging the CEP panel itself

With debug mode on, Chrome DevTools for this panel are reachable at
`http://localhost:8092` (the port set in `.debug`) while After Effects
has the panel open.
