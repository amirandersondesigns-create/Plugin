# Motion Spell Checker — Project Knowledge & Development History

This document captures everything learned while building, debugging, and
shipping this plugin — architecture, hard-won bug fixes, design decisions,
and the packaging workflow. It exists so anyone (human or AI agent) picking
up this project doesn't have to rediscover the same failures. Read this
before making changes, especially to the CEP extension's manifest,
ExtendScript host, or signing/packaging steps.

---

## 1. What this project is

**Motion Spell Checker** is a spell-checking tool for Adobe After Effects.
It scans text layers, layer/comp names, marker comments, effect text
fields, and quoted strings in expressions; suggests corrections; replaces
in place; and optionally draws a non-destructive highlight around
misspelled layers directly in the Composition viewer.

It ships in **two independent formats**:

1. **CEP extension** (`CSXS/`, `client/`, `host/`, `Dictionary/`) — the
   real, released product. Custom dark-themed UI, settings drawer,
   distributed as a signed `.zxp`.
2. **`MotionSpellChecker.jsx`** — a standalone ExtendScript ScriptUI panel
   at the repo root. Same scanning/replace/highlight engine, no CEP, no
   signing, no debug mode — just drop the file into
   `Scripts/ScriptUI Panels/`. A lighter alternative for anyone who wants
   to skip the CEP install ceremony entirely. **This file was not updated
   alongside the CEP build's later UI/feature work** (Undo removal,
   settings simplification, hover polish, Copy Report, etc.) — treat it
   as behind unless someone explicitly ports those changes over.

Distribution target: free plugin on Gumroad and aescripts.com.

---

## 2. Architecture

```
CSXS/manifest.xml       Extension manifest — panel size, host app range,
                         entry points. See the xmlns gotcha in section 3.
client/index.html       Panel markup
client/css/style.css    Dark theme (near-black bg, #4a90d9 accent blue)
client/js/main.js       Panel logic — DOM rendering, calls into ExtendScript
                         via CSInterface.evalScript()
client/js/CSInterface.js
                         A MINIMAL hand-written CEP bridge (~65 lines),
                         NOT Adobe's official 700-line CSInterface.js.
                         Only implements what this panel needs: evalScript,
                         getHostEnvironment, getSystemPath, closeExtension,
                         openURLInDefaultBrowser, add/removeEventListener.
                         If a future feature needs something else from the
                         real CSInterface API, add it here rather than
                         assuming it exists.
host/spellcheck.jsx     ExtendScript engine — all scanning/replace/
                         highlight/dictionary logic. Every function the
                         panel calls is prefixed "cs" and returns a JSON
                         string (with one deliberate exception — see
                         section 3, JSON timing bug).
Dictionary/*.txt        46 category word lists, bundled INTO the package
                         (not user-added-only). getDictionaryPath() checks
                         this location first. See section 3 for why this
                         wasn't always the case.
MotionSpellChecker.jsx  Standalone alternative, see above.
INSTALL.md              Customer-facing install steps (ZXP Installer
                         workflow). This is what ships to end users —
                         README.md is developer-facing.
README.md               Developer/packaging documentation.
```

### Data flow
`client/js/main.js` calls `callHost("csFunctionName", paramsObj)`, which
JSON-stringifies params and calls `csInterface.evalScript('csFunctionName("...")')`.
The ExtendScript side (`host/spellcheck.jsx`) parses, does the real work
against the AE project via `app`/`Folder`/`File`, and returns a JSON
string back through the callback. Nearly all state (dictionary data,
scan results, ignored words) lives in ExtendScript-side globals
(`dictionaryData`, `sessionState`) that persist across `evalScript()`
calls for the life of the CEP engine (i.e., until AE is fully quit).

---

## 3. Critical bugs found — read before touching related code

These cost significant real debugging time. Each one is a genuine
platform quirk, not a typo — don't "simplify" the workarounds back out
without understanding why they're there.

### 3.1 A default `xmlns` on `<ExtensionManifest>` breaks AE silently
```xml
<!-- BREAKS — AE's manifest parser silently rejects the whole extension -->
<ExtensionManifest ... xmlns="http://ns.adobe.com/extension/1.0">

<!-- FINE — no default namespace, or a prefixed one like Adobe's own extensions use -->
<ExtensionManifest ...>
<!-- or -->
<ExtensionManifest ... xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
```
Symptom: AE's `CEP<N>-AEFT.log` shows
`ERROR An illegal argument occurred while creating the ExtensionManifest: Unsupported Manifest version ''`
and the extension doesn't appear in Window → Extensions at all — no
crash, no visible error in AE itself. The manifest is otherwise 100%
valid XML (`xmllint` passes it) — this is an AE-specific parser quirk,
not an XML spec violation. Diagnosed by comparing byte-for-byte against
a known-working third-party extension's manifest.

### 3.2 `$.fileName` is not reliable across evalScript calls
`getScriptFolder()` used to do `new File($.fileName).parent` to find the
extension's own install directory (for locating the `Dictionary/`
folder). This works the moment `host/spellcheck.jsx` is first loaded by
CEP, but `$.fileName` can point at CEP's anonymous eval buffer instead on
**later** `evalScript()` calls — meaning it worked once at startup and
then silently broke dictionary path resolution on every actual use.

**Fix pattern**: capture `$.fileName` into a top-level variable
(`HOST_SCRIPT_FILE_NAME`) at the moment the file first loads (i.e., as a
top-level statement, not inside a function), and always read from that
variable rather than calling `$.fileName` again later.

Even so, this ultimately wasn't the most reliable source of truth — see
3.4.

### 3.3 ExtendScript's `JSON` global isn't available on the very first `evalScript()` call
The panel's `init()` tries to hand the extension's real install path to
ExtendScript immediately on startup (see 3.4). The first version of this
used `JSON.parse()` inside the ExtendScript-side handler
(`csSetExtensionRoot`). That call threw `ReferenceError: JSON is
undefined` — but **only** on this specific first-ever `evalScript()` call
of a fresh CEP session. Every other `cs*` function elsewhere in the file
uses `JSON.stringify`/`JSON.parse` successfully, because by the time a
user clicks a button, the engine has been running for a moment and `JSON`
has become available.

**Fix**: for anything that must run at panel-startup time, pass data as
a plain string argument (`csFunctionName("literal string")`), not as a
JSON-encoded object — sidesteps the timing issue entirely. Diagnosed by
adding an explicit diagnostic field that surfaced the exact exception
text rather than guessing.

### 3.4 The reliable way to find the extension's own install folder
Given 3.2, the robust fix was: have the **panel (JS side)** ask CEP
directly via `csInterface.getSystemPath("extension")`, then hand that
path to ExtendScript as a plain string (per 3.3) via a one-time
`csSetExtensionRoot(path)` call at panel init. `getDictionaryPath()` in
`host/spellcheck.jsx` checks this `EXTENSION_ROOT_PATH` first, before
falling back to the `$.fileName`-based sibling-folder approach, before
finally falling back to `Documents/MotionSpellChecker/Dictionary/`.
`getSystemPath("extension")` can return a `file://` URI (URL-encoded)
instead of a plain path depending on CEP build — normalize both cases,
and fail gracefully (fall back to the raw value) rather than losing the
whole path if `decodeURI` throws on something unexpected.

### 3.5 Scripted "Undo" does not reliably work in After Effects
Multiple approaches were tried and abandoned:
- `app.findMenuCommandId("Undo")` — fails because AE's Edit menu shows
  the *last action's name* ("Undo Move Layer"), not literally "Undo", so
  the exact-text lookup essentially never matches.
- `app.executeCommand(2103)` (a commonly-cited "stable" numeric Undo
  command ID) — ran with no error, but silently did nothing. Real
  undo-worthy actions were not reverted.
- A diagnostic build tried both approaches and reported exactly what ran
  — still nothing worked.

**Conclusion**: AE appears to block or no-op script-triggered Undo as a
safety measure (plausibly to prevent scripts from corrupting the undo
stack). **The Undo button was removed entirely.** The plugin instead
relies on AE's own native Cmd/Ctrl+Z, which works correctly and
untouched, *as long as nothing in the panel's JS intercepts that
keystroke* (an earlier keyboard-shortcut addition briefly did exactly
that and broke it — see 3.6). All destructive actions (`csReplace`, etc.)
are wrapped in `app.beginUndoGroup()`/`app.endUndoGroup()` specifically
so that AE's native Undo reverts them as one clean step.

### 3.6 Don't intercept Cmd/Ctrl+Z in the panel's keydown handler
A `document.addEventListener("keydown", ...)` was added for Enter (scan)
and Escape (close overlay) shortcuts, and briefly also captured Cmd/Ctrl+Z
to call the (still-broken) Undo button's handler. This **broke** the one
thing that previously worked by accident — native Cmd+Z used to pass
straight through to AE untouched. Lesson: a panel-level keydown listener
should never shadow a key that AE's own native handling already serves
correctly.

### 3.7 ZXPSignCmd gotchas
- **Refuses to overwrite an existing output file** and crashes with a
  boost filesystem exception (`copy_file: File exists`) rather than
  overwriting — `rm` the old `.zxp` before re-signing to the same path.
- The `-sign` command's first argument (`.`) means "sign the current
  directory" — you must `cd` into the actual extension folder (the one
  containing `CSXS/manifest.xml`) first. Running it from the wrong
  directory (e.g. home folder) will attempt to sign everything in that
  folder instead, and can crash on unrelated system files (e.g. a Photos
  library).
- A self-signed certificate (`-selfSignedCert`) is sufficient for free
  distribution via Gumroad/aescripts — it triggers a one-time
  "unverified developer" notice on install, which is normal and
  documented in `INSTALL.md`. No paid Adobe developer certificate is
  required for this.

### 3.8 Signature verification only bites when debug mode is off
While `PlayerDebugMode` is enabled (`defaults write com.adobe.CSXS.<N>
PlayerDebugMode 1`), CEP does not check the extension's signature at all
— meaning individual files can be hand-patched in an installed extension
folder (e.g. via `curl` during active development) and AE will happily
load the mismatched result. The moment debug mode is turned off (as it
must be for a realistic release test), AE checks the actual signature
against the original signed package contents and will refuse to load the
extension at all (blank panel, `CEP<N>-AEFT.log` shows `ERROR Signature
verification failed ... PlugPlugErrorCode_invalidSignature`) if anything
was hand-patched post-signing.

**Practical implication**: once you've been iterating by hand-patching an
installed dev copy, a true release test requires deleting that folder
entirely (`rm -rf .../CEP/extensions/com.aanders.motionspellchecker`) and
reinstalling fresh from an actual freshly-signed `.zxp` — don't trust a
folder that's had any manual file edits, even if it currently "works"
under debug mode.

### 3.9 The Dictionary folder must be bundled in the package, not left for users to populate
`getDictionaryPath()` always checked the extension's own `Dictionary/`
folder first — but for a long time that folder didn't exist in the
source repo at all, only on the developer's live machine (manually
populated from a separately-provided zip). Every fresh install/rebuild
wiped it, requiring re-adding 46 files by hand each time — this was pure
packaging oversight, not a code bug. **Fix**: `Dictionary/*.txt` now
lives in the repo at the root (sibling to `CSXS/`, `client/`, `host/`),
so it gets signed into the `.zxp` and lands pre-populated on every
install. No code changes were needed once this was recognized — the
lookup logic was already correct.

---

## 4. Design decisions (and why)

- **Scope vs. Filter are two independent axes**, not overlapping
  controls: Scope = *where* to scan (Active Comp / Entire Project /
  Selected Layers / Selected Comps), Filter = *what kind of content*
  within that scope (Text / Expressions / Effects / Markers /
  Composition & Layer Names — this last one covers **both** comp and
  layer names, despite the short label).
- **Settings was deliberately cut down** from 8 checkboxes + 2 buttons to
  5 checkboxes + 1 button: removed "Smart word matching" (now always
  on — no real reason to disable it), removed "Selected layers only"
  (redundant with the Scope dropdown's own "Selected Layers" option),
  and collapsed two highlight checkboxes + a separate "Toggle Highlight
  Visibility" button into one "Show highlights in the comp" checkbox
  that takes effect on the next scan.
- **Copy Report** (a clipboard-copy of a plain-text QC summary — word,
  count, every location, suggestions) was added specifically for the
  broadcast/commercial-delivery use case: proof of a spelling check
  before air/client delivery. Falls back to the older
  `document.execCommand("copy")` approach if the modern Clipboard API
  isn't available in this CEP build's Chromium version.
- **Hover states** were made deliberately consistent and visible: every
  interactive control (buttons, selects, checkboxes, result rows) shifts
  toward the same `--accent` blue on hover with a short transition,
  rather than the earlier barely-perceptible gray shift.
- **License/Terms + contact link**: added because it's going out for free
  public distribution. Real technical copy-protection isn't feasible for
  a CEP extension (source ships as plain readable files by necessity) —
  the Help overlay's license paragraph is the standard "sets legal terms,
  doesn't technically prevent copying" approach real software uses.

---

## 5. Packaging & release workflow

1. Confirm `CSXS/manifest.xml` has **no default `xmlns`** on the root
   element (section 3.1) and the version numbers are bumped
   (`ExtensionBundleVersion`, the `<Extension Version>`, and `VERSION` in
   `host/spellcheck.jsx` — keep these in sync; the panel byline displays
   the latter).
2. Get a **clean** copy of the repo (not a hand-patched dev install) —
   e.g. download the branch as a zip from GitHub and extract fresh —
   specifically to avoid signing a folder that's drifted from source
   (section 3.8).
3. From inside that clean folder (containing `CSXS/manifest.xml` at its
   root):
   ```bash
   ZXPSignCmd -selfSignedCert US CA "Your Name" "Product Name" password cert.p12   # once, reuse after
   ZXPSignCmd -sign . MotionSpellChecker.zxp cert.p12 password -tsa https://timestamp.digicert.com
   ```
   Delete any existing output `.zxp` first (section 3.7). Drop `-tsa` if
   the timestamp server is unreachable — it's optional.
4. **Real release test**: turn debug mode off
   (`defaults write com.adobe.CSXS.<N> PlayerDebugMode 0` for whichever
   CSXS versions apply), delete any existing installed copy of the
   extension folder entirely, install the fresh signed `.zxp` via ZXP
   Installer, fully quit/reopen AE, and click through every feature —
   this is the only way to catch a signature mismatch (3.8) or a
   packaging gap (3.9) before a real customer does.
5. Ship `MotionSpellChecker.zxp` + `INSTALL.md` together (Gumroad: both
   as product files; aescripts: send both plus screenshots/description
   when submitting).

---

## 6. The debugging methodology that actually worked

Worth internalizing as a pattern, not just the specific bugs: nearly
every hard bug in this project was solved by the same loop —

1. Don't guess twice. If a fix doesn't work, add a **diagnostic** that
   surfaces the actual runtime value/error (e.g., "what did
   `getSystemPath` actually return", "what did `findMenuCommandId`
   actually resolve to") rather than trying a second blind fix.
2. Get **exact command output**, not a paraphrase — ask for the literal
   terminal output or log lines, read them precisely, and diagnose from
   what's actually there rather than from what "should" be there.
3. Check version/state assumptions explicitly (e.g., `grep
   ExtensionBundleVersion` on the installed manifest) rather than
   assuming a reinstall/reload actually took effect — several apparent
   bugs were actually "the new code never got picked up" in disguise.
4. Prefer reading the actual shipped source over recalling how a
   platform is "supposed to" work (e.g., ExtendScript/CEP has several
   behaviors that contradict common assumptions — sections 3.2, 3.3,
   3.5).
