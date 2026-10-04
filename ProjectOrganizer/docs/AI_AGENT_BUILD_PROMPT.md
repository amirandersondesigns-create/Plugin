# Amir Anderson Project Organizer — AI Agent Handoff

Everything needed to understand, rebuild, maintain and release this plugin.
Read fully before changing anything. Source of truth: the repo
`amirandersondesigns-create/Plugin`, branch `claude/youthful-davinci-26if92`,
folder `ProjectOrganizer/` (plus `ProjectOrganizer-TestKit/`).

---

## 1. What it is

A free CEP panel for Adobe After Effects 2022+ (macOS/Windows), by Amir
Anderson. Released as **Version 1.0.0**. Audience: fast-turnaround sports /
daily-news motion designers who hand projects to someone else.

Run it before closing a job. It:
1. Finds the job's **project folder** from where the `.aep` is saved.
2. Builds a standard folder structure on disk.
3. **Copies** (never moves/deletes) every file the project uses into the right
   subfolder.
4. **Relinks** the project to the copies (one undo step).
5. **Files every asset into matching Project-panel folders** inside AE
   (reusing existing folders, never duplicating).
6. Saves the `.aep` into `AE/` and writes `_HANDOFF_REPORT.txt`.

**Analyze** previews all of this read-only; **Organize & Save** does it.

## 2. Repo layout

```
ProjectOrganizer/
  CSXS/manifest.xml           CEP manifest (schema 7.0 — see §9)
  client/index.html           Panel markup + inline SVG icon sprite + welcome + Help/About/Terms
  client/css/style.css        House-style theme + all animations
  client/js/main.js           Panel logic (talks to host via evalScript)
  client/js/CSInterface.js    Minimal CEP bridge (evalScript, getSystemPath strips file://)
  client/icons/               logo.svg (AA logo), icon.png / icon-rollover.png / icon-dark.png
  host/organizer.jsx          ExtendScript engine (ES3) — all project/disk work
  config/organizer-config.json  Built-in folder list + sorting rules (read-only at runtime)
  LICENSE.txt                 Toolkit-format license, "Version 1.0"
  README.md                   Product README (copied into packages as INSTALL.md)
  install/                    install/uninstall (Mac .command, Win .bat CRLF), diagnose_mac.command
  tools/build-zxp.sh          Signed ZXP build (mirrors Animator Toolkit)
  tools/package.sh            Optional zip (plugin + installers + INSTALL.md + LICENSE)
  tools/repack-zxp.py         mimetype first + Unix perms (from the Toolkit)
  tools/make-guide.py         ReportLab user guide → docs/Project_Organizer_Quick_Start_Guide.pdf
  docs/screenshots/           29 PNGs, one per UI section/state (generic sample data)
  docs/logo-cover.png         Cover logo for the guide
  .gitignore                  dist/
ProjectOrganizer-TestKit/     make_kit.sh, make_psd.py, Build_Test_Project.jsx, README.md
```
Root repo also holds Motion Spell Checker (separate extension, root folders).

## 3. Identity / naming (match the Animator Toolkit exactly)

- Product name everywhere: **Amir Anderson Project Organizer** (manifest
  `ExtensionBundleName` + `<Menu>`, header, welcome, report, README, license).
- Bundle ID `com.aanders.motionprojectorganizer`, panel ID `….panel`. **Do not
  change** (would install a second copy).
- Version `1.0.0` in manifest (bundle + extension), `VERSION` in host, About,
  README; "Version 1.0" in LICENSE and guide.
- Package files: `Amir_Anderson_Project_Organizer.zxp`,
  `Amir_Anderson_Project_Organizer.zip`, `Project_Organizer_Quick_Start_Guide.pdf`.
- Author credit: header logo+name is one button opening
  `https://www.linkedin.com/in/amiranderson` (tooltip "Amir Anderson on
  LinkedIn"); Help → About has Version / Made by (logo, name, LinkedIn button) /
  License (© line + Terms sheet + "Permissions & questions" LinkedIn button) /
  Replay the welcome. Links open via `cep.util.openURLInDefaultBrowser`.
- The **PDF guide must NOT explain** the LinkedIn/name header or About panel
  (user request). Only the closing contact line mentions LinkedIn.

## 4. Disk folder structure (default config)

```
AE (ARCHIVE) · AI · AUDIO (SFX, VO) · C4D (MODELS, RENDER) · DATA ·
DELIVERABLES (APS, AUDIO for ENCO, BILLBOARDS, EDIT, LOGOS, ONE SHEET, REVIEW,
SCENIC, SOCIAL, STILLS, THUMBNAILS) · ESP_EarthStudioPro · FOOTAGE (STOCK) · PS ·
REFERENCE · SOURCE IMAGES (HEADSHOTS, LOGOS, STOCK)
On demand: SOURCE IMAGES/PNG|JPG|PDF|TIFF|OTHER, FOOTAGE/MISC, FOOTAGE/_PROXIES, FONTS
```
Based on the user's `z_PROJECT_TEMPLATE`; added folders use the same ALL-CAPS
style. Image sequences get their own subfolder (`FOOTAGE/crowd/…`).

**Rules** (first match wins; fields `ext`, `kinds` [still|sequence|video|audio|other],
`path` regex on full path, `name` regex on file name):
Earth Studio path → ESP · 3D-render path sequences → C4D/RENDER · .exr →
C4D/RENDER · .c4d → C4D (+ copies its `tex/`) · fbx/obj/abc/glb/usd → C4D/MODELS ·
csv/tsv/json/mgjson → DATA · name VO/voiceover/narration → AUDIO/VO · name
sfx/whoosh/impact/riser → AUDIO/SFX · other audio → AUDIO · stock path
(getty, shutterstock, pond5, istock, adobestock, storyblocks, artgrid, envato,
reuters, apimages) → FOOTAGE/STOCK or SOURCE IMAGES/STOCK · psd/psb → PS ·
ai/eps/svg → AI (EPS goes to AI) · name ref/mockup/styleframe → REFERENCE · name
headshot/portrait → SOURCE IMAGES/HEADSHOTS · raster with logo/crest/badge in
path → SOURCE IMAGES/LOGOS · sequences/video → FOOTAGE · png/jpg/pdf/tif →
SOURCE IMAGES/<TYPE> · other stills → SOURCE IMAGES/OTHER · else FOOTAGE/MISC.

Config: built-in `DEFAULT_CONFIG` in host = `config/organizer-config.json`. The
user's editable copy is `Documents/MotionProjectOrganizer/organizer-config.json`
(created by Options → Edit folder rules; it wins). **Never write inside the
installed extension** — signed installs stop loading if files change.

## 5. Engine (host/organizer.jsx, ES3, returns JSON strings)

API: `csSetExtensionRoot, csGetInfo, csSaveProjectAs, csChooseFolder, csAnalyze,
csPrepare, csCopyNext, csCancel, csFinish, csRevealItems, csOpenPath, csOpenConfig`.

- **Root resolution:** user-chosen folder › `.aep` inside a folder named `AE` →
  its parent › `.aep` folder already has ≥2 template folders → that folder ›
  else new folder `<aep folder>/<project name minus _vNN>`.
- **Plan:** every FootageItem with FileSource (main + proxy) → unique source
  (deduped by path) with status `copy | reuse` (identical file already at
  destination) `| inplace` (inside root) `| missing | unused` (only if Skip
  unused). Duplicate names get `_2`. Placeholders reported.
- **Copy:** `csPrepare` builds jobs (sources, sequence frames, c4d tex, fonts,
  optional starter-template files never overwriting); `csCopyNext` copies for
  ~400 ms per call so the panel shows progress; Cancel before relink is safe.
- **Relink** (one undo group): snapshot/restore item name, label, comment,
  pixel aspect, interpretation. Sequences via `replaceWithSequence`; proxies via
  `setProxy*` keeping `useProxy`. **Layered PSD/AI items** (name `Layer/file.psd`)
  are NOT `replace()`d (that flattens): import copy as COMP (then
  COMP_CROPPED_LAYERS), match layers by layer name + size, `replaceSource` in all
  comps, remove old + temp import; unmatched → replace + "CHECK" warning.
  `ID_MAP` records old→new ids.
- **Project panel** (`organizeProjectPanel`, always on): bins mirror the
  destination (top + one sublevel; in-place files mirror their actual disk
  folder). Reuse folders case/space-insensitively at root, else a unique match
  anywhere. Items already inside the right bin subtree stay. Layered imports move
  as their "… Layers" folder. Remove only folders this step emptied. Comps and
  solids untouched.
- **Fonts:** `app.project.usedFonts` (fallback: text layers' fontLocation); skip
  Adobe Fonts (CoreSync/livetype path) and `/System/Library`.
- **Render Queue option:** queued outputs → `DELIVERABLES/EDIT`.
- **Save** to `root/AE/<name>.aep`; **report** `_HANDOFF_REPORT.txt` (needs
  attention, project panel summary, files by folder, fonts, note).
- **Item lookup:** `itemById` uses `app.project.itemByID` or a cached id→item
  index (rebuilt on miss) — avoids O(n²) on big projects.

## 6. Panel UI (client/)

**House style = Animator Toolkit:** bg `#1e1e1e`, sections `#262626`, controls
`#2c2c2c`, hover `#333`, lines `#3a3a3a`, text `#d8d8d8/#f0f0f0`, muted
`#8a8a8a`, accent `#4a90d9` (hover `#5a9ce2`), logo blue `#6fa8da`, ok
`#6a9955`, warn `#c9974a`, err `#c46464`; radii 3–4 px; font stack with "Adobe
Clean"; Toolkit-sized buttons (30 / 40 px), 26×14 toggles, section header =
icon + bold uppercase title + grey hint. Folder colours = Toolkit group hues.

Layout top→bottom: **sticky top bar** (brand button + Help; stepper Locate →
Analyze → Organize) · Project folder card (AE chip, breadcrumb path, mode pill
New folder/Existing/Chosen, explanation **on the same row as Auto/Change…**,
Folder name row only for new folders, Save… when unsaved) · Collect & handoff
card (Analyze, Organize & Save, Options drawer: Copy fonts, Skip unused,
Retarget Render Queue, Handoff report, Starter template, Handoff note, Edit
folder rules) · hint bar (accent left edge; colour by state) · 4 stat tiles ·
progress card · result card · Plan (groups by destination, badges Copy / Relink
/ In place / Missing / Skip, click row → selects items in AE, Collapse all).
Help overlay: how it works, folder legend, badge legend (spaced list), layered
files, project panel, fonts, About. Terms overlay.

**Motion (user likes it — keep):** pulsing current step, glow on next button,
count-up tiles, Missing tile shake, cascading rows, striped progress, drawn
check, toast. Missing files: first Organize click turns button red ("Organize
anyway"), second proceeds. Respects `prefers-reduced-motion`.

**Welcome walkthrough** (Toolkit pattern; first open only, `localStorage`
`motionProjectOrganizer.onboarded`; Help → Replay): 3 SVG slides — files fly into
folders (`Project_Name` root), Analyze scan stamps badges, copy → relink → save.
Back / Next / Skip, dots, arrow/Esc keys. Placeholders must stay **generic**
(no sports/brand names).

**Scrolling:** the whole page scrolls (`html` overflow-y), `.topbar` sticky.
Never use a nested overflow box for the main panel, and never put an overflow
value on `body` (breaks sticky). Reason: AE's CEP browser stopped delivering
the wheel to the nested scroller after Analyze.

## 7. Build, sign, package, guide

```bash
cd ProjectOrganizer
ZXP_PASSWORD=... bash tools/build-zxp.sh   # dist/Amir_Anderson_Project_Organizer.zxp
bash tools/package.sh                       # dist/Amir_Anderson_Project_Organizer.zip
python3 tools/make-guide.py                 # docs/…Quick_Start_Guide.pdf (pip install reportlab)
```
- Signing = self-signed via Adobe `ZXPSignCmd` (`ZXPSIGN=` or PATH; on Linux the
  Windows exe under Wine). Cert `dist/cert.p12` ("US NY Amir Anderson / Amir
  Anderson Project Organizer", 3650 days) is reused so updates install over
  1.0.0 — user holds the release cert + password; keep out of git.
- After signing, `repack-zxp.py` (mimetype first, perms 755/644), then `-verify`.
- Guide = Toolkit layout: Letter, Helvetica, cover logo + title + tagline + blue
  "User Guide" + "by Amir Anderson · Version 1.0"; numbered blue sections (1 Start
  Guide, 2 Interface, 3 Step by Step, 4 Where Files Go, 5 Words to Know &
  Troubleshooting); screenshots right with grey captions; tinted table headers;
  footer "<Product> — User Guide · Page N". Currently 13 pages.
- Screenshots: taken with a generic sample project (Sample_Project,
  `/Users/editor/...`); re-take if UI changes.

## 8. Testing

No AE in CI. Approach used: a Node mock of the AE DOM + ExtendScript File/Folder
backed by the real filesystem runs the real `organizer.jsx` (organize, rerun =
all In place, template copy, 22 rule cases, config override, project-panel reuse
with existing "Footage"/nested AUDIO, second run creates 0 folders). Playwright
drives `client/index.html` with a mocked `window.__adobe_cep__` for UI checks
and screenshots. Also validate `CSXS/manifest.xml` against Adobe's
`ExtensionManifest_v_7_0.xsd`. Real-AE check: `ProjectOrganizer-TestKit`
(`make_kit.sh` builds messy generic media + layered PSD; `Build_Test_Project.jsx`
builds a project with traps: renamed item, 24 fps conform, duplicate names,
unused file, missing file, RQ item). Its README lists expected results.

## 9. Hard-won rules (do not regress)

1. **Manifest must pass schema 7.0:** `Version="7.0"`, `xmlns:xsi` only (a default
   `xmlns="http://ns.adobe.com/extension/1.0"` makes CEP report "Unsupported
   Manifest version ''" and hide the panel), `MaxSize` before `MinSize`, icon types
   Normal/RollOver/DarkNormal/DarkRollOver, no CEFCommandLine node flags.
2. **No localhost/debug port:** no `.debug` file; panel makes no network calls.
3. **ZXP from Windows/Wine signer** has FAT entries with 000 perms → UPIA "status
   = -160". Always run `repack-zxp.py`. Timestamp server is optional (none used).
4. **Extension path:** panel sends `getSystemPath("extension")` (file:// stripped)
   via `csSetExtensionRoot`; don't rely on `$.fileName`.
5. **ExtendScript is ES3:** no let/const/arrow/forEach/indexOf on arrays; JSON
   polyfill included; compare AE items by `.id`, not `===`.
6. CEP Chromium (AE 2022–25): avoid `:has()`, `color-mix()`, container queries.
7. Windows `.bat` files must keep CRLF line endings.
8. Downgrade note: the user's test Mac had 1.5.2 installed; CEP loads the
   higher version, so remove old installs before 1.0.0
   (`UnifiedPluginInstallerAgent --remove "Amir Anderson Project Organizer"`).

## 10. Status / open items

- Released: 1.0.0 signed ZXP, zip, guide, LICENSE, 29 screenshots (all pushed;
  binaries in `dist/` are git-ignored).
- **Paused request:** redraw the 3 welcome illustrations so they have no empty
  grey space — fill them with miniature real UI (slide 1: AE Project panel list
  copying files into the disk tree, then tidying into bins; slide 2: real Plan
  rows with names/destinations/sizes stamped by the scan; slide 3: real progress
  card + plan badges flipping Copy→In place, then the result card with drawn check
  and glowing Open Project Folder). Keep generic names. Not started — confirm
  with the user first.
- An unused "bolder animation" variant (ambient glow, confetti) exists only as a
  local git stash in the original session; not required.
