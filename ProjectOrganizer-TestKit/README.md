# Motion Project Organizer — Test Kit

A deliberately messy sports job for trying the organizer in After Effects.
`Scattered Media/` mimics files pulled from all over a machine — Downloads,
a media volume, render folders, Google Earth Studio, a designer's PSD — and
`Build_Test_Project.jsx` turns it into an AE project with a few traps.

## Run it

1. Unzip `MPO_TestKit.zip` somewhere easy (e.g. Desktop). Keep the folder together.
2. In After Effects: **File → Scripts → Run Script File…** → `Build_Test_Project.jsx`.
   (If AE refuses, turn on *Settings → Scripting & Expressions → Allow Scripts
   to Write Files and Access Network*.)
3. It builds and saves `Save Here/NBA_Finals_Open_v03.aep`.
4. Open **Window → Extensions → Motion Project Organizer**.

## What you should see

**After Analyze** (nothing on disk changes):

| Check | Expected |
|---|---|
| Project folder | `…/Save Here/NBA_Finals_Open`, tagged **NEW FOLDER** |
| Missing | **1** — `missing_bite.mov` in red at the top; the tile shakes |
| Folders | AI, AUDIO (+ SFX, VO), C4D / RENDER, DATA*, ESP_EarthStudioPro, FOOTAGE (+ STOCK), PS, REFERENCE, SOURCE IMAGES (HEADSHOTS, LOGOS, STOCK, PDF, PNG, TIFF) |
| Layered PSD | `scorebug.psd` in PS, marked **layered** |
| Duplicate name | two `team_photo.png` rows — the second goes to `team_photo_2.png` |
| Click a row | the item is selected in the Project panel |

\* DATA appears if your AE version imports CSV/JSON (the build script notes it if not).

**After Organize & Save** (click it twice — the first click warns about the missing file):

- `Save Here/NBA_Finals_Open/` exists with the full folder structure, and the
  project is now saved as `Save Here/NBA_Finals_Open/AE/NBA_Finals_Open_v03.aep`
  (check the title bar).
- The original files in `Scattered Media` are still there (copied, not moved).
- In the Project panel: **TEAM LOGO (renamed)** kept its name and label colour;
  `crowd_[0001-0024].png` still interprets at **24 fps** (Interpret Footage);
  the `scorebug` comp still has 3 separate layers (Background, Score Bar, Team Logo).
- File → Dependencies → Find Missing Footage finds only `missing_bite.mov`.
- `_HANDOFF_REPORT.txt` lists the missing file, where everything went and the
  fonts used.
- Run **Analyze** again: everything shows **IN PLACE**.

**Handoff check:** rename or move the original `Scattered Media` folder, close
the project, reopen `NBA_Finals_Open/AE/NBA_Finals_Open_v03.aep` — only
`missing_bite.mov` should be missing. Then try copying `NBA_Finals_Open` to
another machine or drive and opening it there.

Also try: **Options → Retarget Render Queue** (render output moves to
`DELIVERABLES/EDIT`), **Sort Project panel**, **Starter template** pointed at
your `z_PROJECT_TEMPLATE`, and **Undo** (Edit → Undo Organize Project)
right after organizing.

## Rebuilding the kit

`./make_kit.sh` (needs ffmpeg, python3, zip) regenerates `dist/MPO_TestKit.zip`.
