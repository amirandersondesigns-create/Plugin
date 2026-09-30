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

Matches `z_PROJECT_TEMPLATE`, with a few extra folders for sports/news
work added in the same style (marked `+`):

```
<Project folder>/
  AE/                    the .aep (and AE's Auto-Save folder)
    ARCHIVE/           + old .aep versions
  AI/                    .ai .eps .svg
  AUDIO/                 .wav .mp3 .aif .m4a … (music beds, nat sound)
    SFX/               + file names with sfx, whoosh, impact, riser …
    VO/                + file names with VO, voiceover, narration, announcer
  C4D/                   .c4d (+ its tex/ folder)
    MODELS/            + .fbx .obj .abc .glb .usd …
    RENDER/              .exr, and image sequences from a C4D/Redshift/Octane path
  DATA/                + .csv .tsv .json .mgjson — stats, scores, standings
  DELIVERABLES/          APS, AUDIO for ENCO, BILLBOARDS, EDIT, LOGOS,
                         ONE SHEET, SCENIC, STILLS
                       + REVIEW (approval renders), SOCIAL (9x16 / 1x1 / 4x5
                         cut-downs), THUMBNAILS
  ESP_EarthStudioPro/    anything from a Google Earth Studio / ESP folder
  FOOTAGE/               video, and image sequences (one folder per sequence)
    STOCK/             + Getty, Shutterstock, Pond5, iStock, Adobe Stock, AP, Reuters …
    MISC/                anything that matches no rule
    _PROXIES/            proxy files
  PS/                    .psd .psb
  REFERENCE/           + images/video named ref, reference, mockup, sketch, styleframe
  SOURCE IMAGES/
    HEADSHOTS/         + file names with headshot, portrait, mugshot
    LOGOS/             + raster images with logo, crest, badge, wordmark in the name or folder
    STOCK/             + stock / agency stills
    PNG/  JPG/  PDF/  TIFF/  OTHER/
  FONTS/                 (only if fonts are collected)
  _HANDOFF_REPORT.txt
```

The added folders are always created so people have somewhere to drop
things; the type folders (PNG, JPG, MISC, _PROXIES, FONTS…) only appear
when something goes in them. Vector logos (.ai/.eps/.svg) still go to `AI/`.

All of this — folder names, which extensions or file names go where, the
order rules are checked in — is editable. Click **Options → Edit folder
rules…** in the panel: it opens your own copy at
`Documents/MotionProjectOrganizer/organizer-config.json` (created from the
defaults the first time). Edit, save, and click Analyze again. Delete that
file to go back to the built-in defaults in
[`config/organizer-config.json`](config/organizer-config.json).

> Don't edit the copy inside the installed extension: a signed `.zxp`
> install is signature-checked every time After Effects loads it, and
> changing any file inside it stops the panel from loading.

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

The panel walks you through three steps, shown in the stepper at the top —
the step you're on pulses, finished steps turn into green checks, and the
button you should press next gently glows. The coach bar under the buttons
always says what's happening and what to do next.

1. **Locate** — save your project (the panel offers a Save button if you
   haven't). The project-folder card shows where everything will go as a
   breadcrumb, tagged `NEW FOLDER`, `EXISTING` or `CHOSEN`.
2. **Analyze** — shows every file grouped under colour-coded folders, with a
   badge: `COPY`, `RELINK` (an identical copy is already there), `IN PLACE`
   (already inside the project folder), `MISSING` (red, listed first — the
   Missing tile shakes to get your attention) or `SKIP` (unused, if you chose
   to skip those). Click any row to select those items in the Project panel.
   **Nothing is changed.**
3. **Organize & Save** — copies files with a live progress bar (Cancel stops
   before anything in the project is touched), then relinks, saves into
   `AE/` and writes the report. The relink is a single undo step. If files
   are missing, the button turns red and asks you to click once more. When
   it's done, a result card draws a check mark and offers
   **Open Project Folder** and **Report**.

Running it again on an organized project is safe: everything shows
`IN PLACE` and it just re-saves and refreshes the report.

Animations respect the system "reduce motion" setting.

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
client/index.html             Panel markup (icons are an inline SVG sprite)
client/css/style.css          Theme, layout and all animations
client/js/main.js             Panel logic — renders state, talks to ExtendScript
client/js/CSInterface.js      Minimal bridge to the CEP host
host/organizer.jsx            ExtendScript engine — analyze, copy, relink, save, report
config/organizer-config.json  Folder names and sorting rules (editable)
install/                      Mac/Windows installers, uninstallers, .zxp packager
```

A test kit (messy sample media + a script that builds a test project) lives
in [`../ProjectOrganizer-TestKit`](../ProjectOrganizer-TestKit) — see its README.

The panel never touches the project directly. `main.js` calls `csAnalyze`
(read-only), then `csPrepare` → `csCopyNext` (repeated; each call copies for
~0.4 s so the progress bar can update) → `csFinish` in `host/organizer.jsx`.

## Installing it

### Quick install (unsigned, for you and your team)

Close After Effects, then run the installer for your platform from the
`install/` folder:

- **macOS** — double-click `install/install_mac.command`
  (first time: right-click → Open, since it's downloaded).
- **Windows** — double-click `install/install_windows.bat`.

It turns on CEP debug mode (needed for unsigned extensions) for CEP 9–12,
copies the extension to your user extensions folder and keeps your edited
`organizer-config.json` if you're reinstalling. Restart After Effects →
**Window → Extensions → Motion Project Organizer**.

`uninstall_mac.command` / `uninstall_windows.bat` remove it again.

<details>
<summary>Manual install</summary>

Turn on debug mode — macOS: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`
(repeat for 9, 10, 12); Windows: add String `PlayerDebugMode` = `1` under
`HKEY_CURRENT_USER\Software\Adobe\CSXS.11` (and .9/.10/.12). Then copy this
`ProjectOrganizer` folder to:

- **macOS**: `~/Library/Application Support/Adobe/CEP/extensions/MotionProjectOrganizer`
- **Windows**: `%APPDATA%\Adobe\CEP\extensions\MotionProjectOrganizer`
</details>

### Signed `.zxp` (recommended — no debug mode needed)

**Install:** the easiest way is the free
[ZXP Installer from aescripts](https://aescripts.com/learn/zxp-installer/) —
drag the `.zxp` onto it. Or use Adobe's built-in installer from Terminal /
Command Prompt (After Effects closed):

```bash
# macOS
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" --install ~/Downloads/MotionProjectOrganizer_1.2.2.zxp
```
```bat
:: Windows
"C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe" /install "%USERPROFILE%\Downloads\MotionProjectOrganizer_1.2.2.zxp"
```

If you used the debug installer before, run `install/uninstall_mac.command`
/ `uninstall_windows.bat` first so two copies don't clash.

**Build:**

With Adobe's `ZXPSignCmd` on your PATH (Mac/Windows builds only — on
Linux the Windows build runs fine under Wine):

```bash
install/package_zxp.sh              # creates a self-signed cert the first time
install/package_zxp.sh my.p12 pass  # or sign with your own certificate
```

It stages a clean copy (no installers), signs and timestamps it,
sets normal file permissions inside the package (see below)
and writes `install/MotionProjectOrganizer.zxp`. Users install that with
Anastasiy's Extension Manager or Adobe's `ExManCmd`.


The panel is fully self-contained: it loads only its own local files, opens
no debug port and makes no network or localhost connections.

> **"Failed to install, status = -160"** from Adobe's installer means the
> files inside the `.zxp` have no read permissions — this happens when a
> package is signed on Windows (or with the Windows signer under Wine).
> `install/fix_zxp_permissions.py` repairs a package in place without
> touching the signature; `package_zxp.sh` runs it automatically.

> **Panel missing from Window → Extensions?** CEP silently skips any
> extension whose `CSXS/manifest.xml` doesn't match Adobe's
> `ExtensionManifest_v_7_0.xsd` (use `Version="7.0"`, no default `xmlns`,
> `MaxSize` before `MinSize`, icon types `DarkNormal`/`DarkRollOver`).
> On a Mac, double-click `install/diagnose_mac.command` — it turns on CEP
> logging and writes `MPO_Diagnostics.txt` to your Desktop with the reason.

### Compatibility

After Effects 2022 (22.0) and later, macOS and Windows. The panel's CSS/JS
sticks to what the Chromium builds in CEP 9–12 support, and the host script
is plain ES3 ExtendScript with a JSON fallback. The panel passes its own
install path to the host on start-up, so the rules file is found no matter
where the extension is installed.

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
