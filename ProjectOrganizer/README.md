# Motion Project Organizer (CEP extension)

An end-of-job handoff tool for After Effects 2022+. Run it before you close
a project: it works out where the job lives on disk, builds the standard
project folder structure, **copies** every file the project uses into the
right subfolder, relinks the project to those copies, saves the `.aep`
into `AE/` and writes a handoff report. Whoever opens the project next gets
one self-contained folder with nothing offline.

It's built for fast-turnaround sports and daily-news graphics, where
projects change hands between shifts and "Collect Files" dumps everything
into one flat folder no one wants to dig through.

## The folder structure

Matches `z_PROJECT_TEMPLATE`:

```
<Project folder>/
  AE/                    the .aep (and AE's Auto-Save folder)
  AI/                    .ai .eps .svg
  AUDIO/                 .wav .mp3 .aif .m4a …
  C4D/                   .c4d (+ its tex/ folder), .fbx .obj .abc .glb …
    RENDER/              .exr, and image sequences from a C4D/Redshift/Octane path
  DELIVERABLES/          APS, AUDIO for ENCO, BILLBOARDS, EDIT, LOGOS,
                         ONE SHEET, SCENIC, STILLS
  ESP_EarthStudioPro/    anything from a Google Earth Studio / ESP folder
  FOOTAGE/               video, and image sequences (one folder per sequence)
    MISC/                anything that matches no rule
    _PROXIES/            proxy files
  PS/                    .psd .psb
  SOURCE IMAGES/
    PNG/  JPG/  PDF/  TIFF/  OTHER/
  FONTS/                 (only if fonts are collected)
  _HANDOFF_REPORT.txt
```

All of this — folder names, which extensions go where, the order rules are
checked in — lives in [`config/organizer-config.json`](config/organizer-config.json).
Edit it (or click **Options → Edit folder rules…** in the panel), save, and
click Analyze again. Delete the file to go back to the built-in defaults.

## How it decides where "the project folder" is

1. **Saved inside an `AE` folder** → the folder above `AE` is the project
   folder (the template layout).
2. **Saved in a folder that already has** two or more of the template
   folders (`FOOTAGE`, `PS`, …) → that folder is used.
3. **Saved anywhere else** (Desktop, Downloads…) → a new folder named after
   the project is made next to the `.aep` (version suffixes like `_v03` are
   dropped from the name). You can rename it in the panel.

**Change…** picks any folder instead; **Auto** goes back to the rule above.

## Using it

1. **Save** your project (the panel offers a Save button if you haven't).
2. **Analyze** — shows every file grouped by the folder it'll go to, with a
   badge: `COPY`, `RELINK` (an identical copy is already there), `IN PLACE`
   (already inside the project folder), `MISSING` (red, listed first) or
   `SKIP` (unused, if you chose to skip those). Click any row to select those
   items in the Project panel. **Nothing is changed.**
3. **Organize & Save** — copies files with a progress bar (Cancel stops
   before anything in the project is touched), then relinks, saves into
   `AE/` and writes the report. The relink is a single undo step. If files
   are missing it asks once first — relink them in AE before handoff.

Running it again on an organized project is safe: everything shows
`IN PLACE` and it just re-saves and refreshes the report.

### Options

| Option | Default | What it does |
|---|---|---|
| Copy fonts into FONTS | on | Copies installed font files used by text layers. Adobe Fonts can't be copied — they're listed in the report for the next person to activate. System fonts are skipped. **Check font licences before sending outside your organization.** |
| Skip unused footage | off | Leaves out footage not used in any comp. |
| Sort loose Project-panel items into bins | off | Footage sitting at the top of the Project panel is moved into bins named like the disk folders. Existing bins are left alone. |
| Point Render Queue outputs to DELIVERABLES/EDIT | off | Retargets queued render outputs (same file names). |
| Write a handoff report | on | `_HANDOFF_REPORT.txt`: what's missing, what went where, fonts, your note. |
| Starter template | none | Point at your `z_PROJECT_TEMPLATE` folder to also copy its starter files (One Sheet, banners, `.aet`) into the project folder. Never overwrites; skips `.DS_Store`, `Thumbs.db` and Auto-Save folders. |
| Handoff note | — | Free text added to the report ("Final is comp MAIN_1080…"). |

## What's preserved

- **Originals are never moved or deleted** — it copies, then relinks.
- Footage item **names** (including ones you renamed), labels, comments and
  **interpretation** (alpha, frame-rate conform, fields, pixel aspect, loops).
- **Layered PSD / AI** imports keep their layers: the copy is imported as a
  comp, each layer is matched by name and size, every comp layer is swapped
  over with `replaceSource`, and the temporary import is removed. A layer
  that can't be matched (e.g. one you renamed) is relinked to the flattened
  file and flagged as `CHECK` in the report.
- **Image sequences** copy every frame into their own folder.
- **Cinema 4D** scenes bring their `tex/` folder.
- **Duplicate file names** from different places get `_2`, `_3`…; an
  identical file already at the destination is reused, not copied again.
- **Proxies** are copied to `FOOTAGE/_PROXIES` and re-set, keeping the
  proxy on/off state.

## How it's put together

```
CSXS/manifest.xml             Extension manifest
client/index.html             Panel markup
client/css/style.css          Same flat dark theme as Motion Spell Checker
client/js/main.js             Panel logic — renders state, talks to ExtendScript
client/js/CSInterface.js      Minimal bridge to the CEP host
host/organizer.jsx            ExtendScript engine — analyze, copy, relink, save, report
config/organizer-config.json  Folder names and sorting rules (editable)
```

The panel never touches the project directly. `main.js` calls `csAnalyze`
(read-only), then `csPrepare` → `csCopyNext` (repeated; each call copies for
~0.4 s so the progress bar can update) → `csFinish` in `host/organizer.jsx`.

## Installing it for testing (unsigned / debug mode)

Same as Motion Spell Checker — turn on CEP debug mode:

**macOS**
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
```
**Windows** — in `regedit`, under `HKEY_CURRENT_USER\Software\Adobe\CSXS.9`
add a String value `PlayerDebugMode` set to `1`. (Also try `CSXS.10`,
`CSXS.11`… if your AE uses a newer CEP runtime.)

Copy (or symlink) **this `ProjectOrganizer` folder** into:

- **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/MotionProjectOrganizer`
- **Windows**: `%APPDATA%\Adobe\CEP\extensions\MotionProjectOrganizer`

Restart After Effects → **Window → Extensions → Motion Project Organizer**.

Chrome DevTools for the panel: `http://localhost:8093` (set in `.debug`).

## Packaging (signed `.zxp`)

```bash
ZXPSignCmd -selfSignedCert US CA "Amir Anderson" "MotionProjectOrganizer" password cert.p12
ZXPSignCmd -sign ProjectOrganizer MotionProjectOrganizer.zxp cert.p12 password
```

## Limits worth knowing

- Missing footage can't be collected — relink it in AE first (it's listed in
  red and in the report).
- Files referenced only inside expressions (e.g. `$.evalFile`, data JSON not
  imported as footage) aren't seen — import them as footage to have them
  collected.
- Adobe Fonts and system fonts aren't copied (listed in the report).
- On older AE versions without `app.project.usedFonts`, fonts are read from
  the current Source Text of each text layer, so a font used only in a
  later Source Text keyframe can be missed.
