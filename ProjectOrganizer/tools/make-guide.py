#!/usr/bin/env python3
# Copyright (c) 2026 Amir Anderson. All rights reserved.
"""Builds docs/Project_Organizer_Quick_Start_Guide.pdf — the user guide, in the
same layout as the Amir Anderson Animator Toolkit guide (US Letter, Helvetica,
blue numbered section headings, screenshots in a right-hand column with
captions, tinted table headers, page footer).

Screenshots come from docs/screenshots/ (taken from the panel with a generic
sample project). Needs: pip install reportlab

usage: python3 tools/make-guide.py [output.pdf]
"""
import os
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (Image, KeepTogether, ListFlowable, ListItem, PageBreak, Paragraph,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHOTS = os.path.join(ROOT, "docs", "screenshots")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "docs", "Project_Organizer_Quick_Start_Guide.pdf")

PRODUCT = "Amir Anderson Project Organizer"
VERSION = "1.0"
BLUE = colors.HexColor("#6fa8da")
INK = colors.HexColor("#1e1e1e")
TEXT = colors.HexColor("#222222")
GREY = colors.HexColor("#555555")
HEAD_BG = colors.HexColor("#eef3ee")
RULE = colors.HexColor("#d4d8d4")

PAGE_W, PAGE_H = letter
LEFT = RIGHT = 64
TOP, BOTTOM = 54, 72
FRAME_W = PAGE_W - LEFT - RIGHT

# ---------------------------------------------------------------- styles
body = ParagraphStyle("body", fontName="Helvetica", fontSize=11.5, leading=19, textColor=TEXT, spaceAfter=8)
h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=22, leading=27, textColor=BLUE, spaceAfter=10)
h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=14.5, leading=19, textColor=INK, spaceBefore=8, spaceAfter=6)
cap = ParagraphStyle("cap", fontName="Helvetica", fontSize=9.5, leading=12.5, textColor=GREY, alignment=TA_CENTER, spaceBefore=4)
cell = ParagraphStyle("cell", fontName="Helvetica", fontSize=11, leading=14.5, textColor=TEXT)
cellb = ParagraphStyle("cellb", parent=cell, fontName="Helvetica-Bold")
closing = ParagraphStyle("closing", fontName="Helvetica", fontSize=10.5, leading=15, textColor=GREY, alignment=TA_CENTER, spaceBefore=6)

ARROW = '<font name="Symbol">→</font>'


def a(text):
    """Turn ' -> ' into the Symbol-font arrow used in the Toolkit guide."""
    return text.replace("->", ARROW)


def P(text, style=body):
    return Paragraph(a(text), style)


def bullets(items):
    return ListFlowable([ListItem(P(t), leftIndent=18, value="•") for t in items],
                        bulletType="bullet", start="•", bulletFontSize=8, leftIndent=18, bulletOffsetY=-1)


def steps(items):
    return ListFlowable([ListItem(P(t), leftIndent=18) for t in items], bulletType="1", bulletFormat="%s.",
                        bulletFontName="Helvetica-Bold", bulletFontSize=9, leftIndent=18, bulletOffsetY=-1)


def shot(name, width):
    path = os.path.join(SHOTS, name)
    iw, ih = ImageReader(path).getSize()
    return Image(path, width=width, height=width * ih / iw)


def figure(flowables, image, caption, img_w=170):
    """Text on the left, screenshot + caption on the right (Toolkit layout)."""
    if not isinstance(flowables, list):
        flowables = [flowables]
    right = [shot(image, img_w), Paragraph(caption, cap)]
    t = Table([[flowables, right]], colWidths=[FRAME_W - img_w - 22, img_w + 22])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (0, 0), 14), ("RIGHTPADDING", (1, 0), (1, 0), 0),
                           ("LEFTPADDING", (1, 0), (1, 0), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 14)]))
    return t


def wide(image, caption, width=FRAME_W - 120):
    return KeepTogether([shot(image, width), Paragraph(caption, cap), Spacer(1, 10)])


def table(head, rows, widths=(118, 352)):
    data = [[Paragraph(head[0], cellb), Paragraph(head[1], cellb)]] + \
           [[Paragraph(a(r[0]), cell), Paragraph(a(r[1]), cell)] for r in rows]
    t = Table(data, colWidths=widths, hAlign="CENTER")
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), HEAD_BG), ("GRID", (0, 0), (-1, -1), 0.6, RULE),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 7),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("LEFTPADDING", (0, 0), (-1, -1), 8),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 8)]))
    return t


# ---------------------------------------------------------------- page furniture
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(GREY)
    canvas.drawCentredString(PAGE_W / 2, 36, "%s — User Guide · Page %d" % (PRODUCT, doc.page))
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    size = 118
    canvas.drawImage(os.path.join(ROOT, "docs", "logo-cover.png"), (PAGE_W - size) / 2, PAGE_H - 278, size, size)
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 27)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 318, PRODUCT)
    canvas.setFillColor(GREY)
    canvas.setFont("Helvetica", 12.5)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 345, "Hand off complete, organized projects — an organizer panel for After Effects.")
    canvas.setFillColor(BLUE)
    canvas.setFont("Helvetica-Bold", 15)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 381, "User Guide")
    canvas.setFillColor(GREY)
    canvas.setFont("Helvetica", 10.5)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 404, "by Amir Anderson  ·  Version %s" % VERSION)
    canvas.restoreState()
    footer(canvas, doc)


# ---------------------------------------------------------------- content
story = [Spacer(1, 1), PageBreak()]

# 1 · Start Guide ------------------------------------------------------------
story += [
    P("1 · Start Guide", h1),
    P("What's in This Download", h2),
    bullets([
        "<b>Amir_Anderson_Project_Organizer.zxp</b> — the plugin. This is the only file you need to install.",
        "<b>Project_Organizer_Quick_Start_Guide.pdf</b> — this document.",
        "<b>Amir_Anderson_Project_Organizer.zip</b> — optional: the same plugin with install scripts, for installing without a ZXP installer.",
        "<b>INSTALL.md</b> — install steps, tips and troubleshooting (inside the zip).",
        "<b>LICENSE.txt</b> — the license: a plain-language summary and the full terms.",
    ]),
    P("What It Does", h2),
    P("Project Organizer gets an After Effects project ready to hand off. It works out the job folder from where "
      "your project is saved, builds a standard folder structure (AE, AI, AUDIO, C4D, DATA, DELIVERABLES, FOOTAGE, "
      "PS, REFERENCE, SOURCE IMAGES and more), copies every file the project uses into the right place, relinks the "
      "project to those copies, files every asset into matching folders in the Project panel, saves the project into "
      "<b>AE/</b> and writes a handoff report."),
    P("Your original files are never moved or deleted, and the relink is a single step in Edit -> Undo."),
    P("Requirements", h2),
    bullets(["Adobe After Effects 2022 (22.0) or later", "macOS or Windows"]),
    P("Install (about two minutes)", h2),
    steps([
        "Install a ZXP installer app once — <b>ZXP Installer</b> (aescripts.com/learn/zxp-installer, recommended) or "
        "<b>Anastasiy's Extension Manager</b> (install.anastasiy.com). A .zxp is Adobe's package format for extensions; "
        "this small free app opens it.",
        "Open the installer, drag <b>Amir_Anderson_Project_Organizer.zxp</b> into it, and click <b>Install</b>.",
        "If a one-time “unverified developer” notice appears, click through it — the plugin is signed, just not "
        "through Adobe's paid developer program. On macOS: <b>System Settings -> Privacy &amp; Security -> Open Anyway</b>. "
        "On Windows: <b>More info -> Run anyway</b>.",
        "<b>Fully quit</b> After Effects (Cmd+Q on a Mac, File -> Exit on Windows) and reopen it.",
        "Open <b>Window -> Extensions -> Amir Anderson Project Organizer</b>. The panel docks like any other AE panel.",
    ]),
    P("Your First Organize (60 seconds)", h2),
    steps([
        "<b>Save</b> your project where the job lives (File -> Save As).",
        "Open the panel and click <b>Analyze</b>. Nothing is changed yet.",
        "Check the plan. Anything in <b>red</b> is missing — relink it in After Effects, then Analyze again.",
        "Click <b>Organize &amp; Save</b>.",
        "Click <b>Open Project Folder</b>. Everything the project needs is now inside it, sorted into folders.",
    ]),
    P("Changed your mind? <b>Edit -> Undo Organize Project</b> puts the links back in one step. The copied files stay on disk."),
    PageBreak(),
]

# 2 · The Interface ----------------------------------------------------------
story += [
    P("2 · The Interface", h1),
    figure([P("The panel has a header with the logo and name, a step tracker (<b>Locate</b>, <b>Analyze</b>, "
              "<b>Organize</b>), and a card for each part of the job. The step you're on pulses, finished steps turn "
              "into green checks, and the button you should press next gently glows."),
            P("Click the logo or name at the top to visit Amir Anderson on LinkedIn. Click <b>?</b> for Help.")],
           "06_full_panel_after_analyze.png", "The panel after Analyze.", img_w=180),
    PageBreak(),
    P("The Panel at a Glance", h2),
    table(("Area", "What it's for"), [
        ("Header", "Logo and name (opens LinkedIn) and the Help button."),
        ("Steps", "Shows where you are: Locate, Analyze, Organize."),
        ("Project folder", "Where the job lives on disk, and where the project will be saved."),
        ("Collect & handoff", "The Analyze and Organize & Save buttons, and Options."),
        ("Hint bar", "One line that says what's happening and what to do next."),
        ("Tiles", "Files to collect, files already in place, missing files and the size to copy."),
        ("Plan", "Every file, grouped under the folder it will go to, with a badge."),
        ("Result", "What was collected, relinked and filed, with Open Project Folder and Report."),
        ("Help", "How it works, where files go, badges, About (version, LinkedIn, license)."),
    ]),
    Spacer(1, 10),
    P("The Welcome", h2),
    figure(P("The first time the panel opens, a short animated welcome shows the workflow: loose files flying into "
             "their folders, Analyze stamping each file, then copy, relink and save. Use <b>Next</b>, <b>Back</b> or "
             "<b>Skip</b>. Replay it any time from <b>Help -> Replay the welcome</b>."),
           "01_welcome_1_files_into_folders.png", "The welcome: files fly into their folders."),
    figure(P("The second and third slides walk through <b>Analyze</b> and <b>Organize &amp; Save</b>. "
             "<b>Start organizing</b> closes the welcome and takes you to the panel."),
           "03_welcome_3_organize_save.png", "Slide 3: copy, relink, save."),
    P("Hint Bar and Tiles", h2),
    figure(P("The hint bar always tells you what's happening and what to do next. Its edge turns blue for a hint, "
             "green when everything is fine, amber for a warning and red when files are missing."),
           "11_hint_bar.png", "A missing file is reported in red."),
    figure(P("The tiles count the files to collect, the files already inside the project folder, missing files "
             "and the total size to copy. The Missing tile shakes and turns red when something can't be found."),
           "12_stat_tiles.png", "The tiles after Analyze."),
    PageBreak(),
    P("Getting Help Inside the Panel", h2),
    figure([bullets(["Click <b>?</b> in the header for <b>How it works</b>, where each kind of file goes, what the "
                     "badges mean, and how the Project panel is organized.",
                     "<b>About</b> at the bottom shows the version, who made it with a <b>LinkedIn</b> button, the "
                     "license and <b>Terms</b>, and <b>Replay the welcome</b>.",
                     "Hover over the header to see “Amir Anderson on LinkedIn”."])],
           "28_about_credit.png", "About: version, credit, license."),
    figure(P("<b>Terms</b> opens a short summary of the license. The full terms are in LICENSE.txt in the plugin "
             "folder; <b>Permissions &amp; questions</b> opens LinkedIn."),
           "29_license_and_terms.png", "License &amp; Terms.", img_w=150),
    PageBreak(),
]

# 3 · Step by Step -----------------------------------------------------------
story += [
    P("3 · Step by Step", h1),
    P("Every job follows the same three steps. The panel always shows which one you're on."),
    P("1 · Locate", h2),
    figure([P("The <b>Project folder</b> card shows where the job lives, worked out from where your project is saved:"),
            bullets(["Saved inside an <b>AE</b> folder -> the folder above it.",
                     "Saved next to FOOTAGE, PS and so on -> that folder.",
                     "Saved anywhere else -> a new folder next to the .aep, named in <b>Folder name</b>."]),
            P("Click <b>Change…</b> to pick any folder, or <b>Auto</b> to go back.")],
           "09_project_folder_new.png", "A new project folder will be created."),
    figure(P("If the project hasn't been saved yet, the card asks you to save it first — the organizer builds "
             "the folders around the saved .aep. Click <b>Save…</b>."),
           "05_project_folder_unsaved.png", "An unsaved project."),
    PageBreak(),
    P("2 · Analyze", h2),
    figure([P("Click <b>Analyze</b> to see where every file will go. Nothing on disk or in the project changes."),
            P("The <b>Plan</b> lists every file under the folder it will go to, with its source and size. Missing "
              "files are listed first, in red. Click any row to select that item in the Project panel. Use "
              "<b>Collapse all</b> to fold the folders.")],
           "13_plan_list.png", "The plan, grouped by folder.", img_w=180),
    table(("Badge", "What it means"), [
        ("Copy", "Will be copied into the project folder."),
        ("Relink", "An identical copy is already there; the project is just pointed at it."),
        ("In place", "Already inside the project folder."),
        ("Missing", "Can't be found. Relink it in After Effects first."),
        ("Skip", "Not used in any comp (only when Skip unused footage is on)."),
    ]),
    Spacer(1, 12),
    figure(P("If files are missing, the first click on Organize turns the button red and asks you to click once more. "
             "Missing files are listed in the handoff report. It's best to relink them first: <b>File -> Dependencies -> "
             "Find Missing Footage</b>, then Analyze again."),
           "17_missing_file_warning.png", "The warning before organizing with missing files."),
    P("3 · Organize &amp; Save", h2),
    figure(P("Click <b>Organize &amp; Save</b>. The folder structure is built and each file is <b>copied</b> in, with a "
             "progress bar. Click <b>Cancel</b> during the copy to stop before anything in the project changes."),
           "18_copy_progress.png", "Copying files."),
    figure([P("Then the project is relinked to the copies, every asset is filed into matching Project-panel folders, the "
              "project is saved into <b>AE/</b> and <b>_HANDOFF_REPORT.txt</b> is written."),
            P("The result card shows what happened. Click <b>Open Project Folder</b> to hand it off, or <b>Report</b> to "
              "read the report.")],
           "20_result_card.png", "The result card."),
    P("Running it again on an organized project is safe: everything shows <b>In place</b>, and it just re-saves and "
      "refreshes the report."),
    P("The Handoff Report", h2),
    P("<b>_HANDOFF_REPORT.txt</b> in the project folder lists what needs attention (missing files, anything to check), "
      "how the Project panel was organized, where every file went, the fonts used, and your handoff note."),
    KeepTogether([
    P("Inside the After Effects Project", h2),
        P("Organize &amp; Save also files every asset into Project-panel folders that match the disk: FOOTAGE, AUDIO, "
          "SOURCE IMAGES -> PNG, PS and so on."),
        bullets(["Folders you already have are reused, never duplicated. Names match regardless of capitals.",
                 "Items already in the right folder, or in your own subfolder of it, stay where they are.",
                 "Layered Photoshop and Illustrator imports move together with their “Layers” folder.",
                 "Only folders that end up empty are removed. Comps and solids aren't moved."])
    ]),
    Spacer(1, 6),
    KeepTogether([
    P("Options", h2),
    figure(P("Click <b>Options</b> under the buttons. The summary on the right shows what's switched on."),
           "15_options.png", "Options.", img_w=140),
    table(("Option", "What it does"), [
        ("Copy fonts", "Copies installed fonts used in text layers into FONTS. Adobe Fonts and system fonts are listed in the report instead."),
        ("Skip unused footage", "Leaves out footage that isn't used in any comp."),
        ("Retarget Render Queue", "Queued renders output to DELIVERABLES/EDIT."),
        ("Handoff report", "Writes _HANDOFF_REPORT.txt into the project folder."),
        ("Starter template", "Point at your project template folder to also copy its starter files. Existing files are never overwritten."),
        ("Handoff note", "A note added to the report, such as which comp is final."),
        ("Edit folder rules…", "Opens the folder rules file to change folder names or what goes where."),
    ]),
    ]),
    PageBreak(),
]

# 4 · Where Files Go ---------------------------------------------------------
story += [
    P("4 · Where Files Go", h1),
    P("Files are sorted by type, and by name where it helps. Image sequences get their own folder."),
    table(("Folder", "What goes there"), [
        ("AE", "The project itself. ARCHIVE for old versions."),
        ("AI", ".ai, .eps and .svg files."),
        ("AUDIO", "Music and natural sound. VO and SFX subfolders, sorted by file name."),
        ("C4D", ".c4d scenes (with their tex folder). MODELS: .fbx, .obj and other 3D files. RENDER: .exr and 3D render passes."),
        ("DATA", ".csv and .json data files."),
        ("DELIVERABLES", "Your exports: APS, AUDIO for ENCO, BILLBOARDS, EDIT, LOGOS, ONE SHEET, REVIEW, SCENIC, SOCIAL, STILLS, THUMBNAILS."),
        ("ESP_EarthStudioPro", "Anything from a Google Earth Studio folder."),
        ("FOOTAGE", "Video and image sequences. STOCK for stock and agency footage."),
        ("PS", ".psd and .psb files."),
        ("REFERENCE", "Files named ref, reference, mockup, sketch or styleframe."),
        ("SOURCE IMAGES", "HEADSHOTS, LOGOS and STOCK by name, then PNG, JPG, PDF, TIFF and OTHER."),
        ("FONTS", "Installed fonts used in text layers (when Copy fonts is on)."),
    ], widths=(128, 342)),
    P("Changing the Rules", h2),
    P("Click <b>Options -> Edit folder rules…</b>. Your own copy of the rules opens from "
      "<b>Documents/MotionProjectOrganizer/organizer-config.json</b>. Edit it, save it, then click Analyze again. "
      "Delete the file to go back to the built-in rules."),
    PageBreak(),
]

# 5 · Words to Know & Troubleshooting ----------------------------------------
story += [
    P("5 · Words to Know &amp; Troubleshooting", h1),
    table(("Word", "What it means"), [
        ("Project folder", "The one folder that holds the project and every file it uses."),
        ("Collect", "Copy a file into the project folder."),
        ("Relink", "Point the project at the copy instead of the original."),
        ("Missing footage", "A file the project uses that can't be found on disk."),
        ("Image sequence", "Numbered stills played as one clip."),
        ("Layered PSD", "A Photoshop file imported as a comp, one item per layer."),
        ("Proxy", "A lighter stand-in for footage, used while working."),
        ("Handoff report", "The text file that tells the next person what's in the folder."),
    ]),
    P("Troubleshooting", h2),
    bullets([
        "<b>Plugin doesn't appear under Window -> Extensions</b> — fully quit and reopen After Effects.",
        "<b>Nothing happens when you double-click the .zxp</b> — install ZXP Installer or Anastasiy's Extension "
        "Manager first, then open the .zxp through that app.",
        "<b>macOS says it can't verify the developer</b> — System Settings -> Privacy &amp; Security -> Open Anyway.",
        "<b>“Save the project first”</b> — save the .aep where the job lives, then click Analyze.",
        "<b>Files listed as Missing</b> — relink them in After Effects (File -> Dependencies -> Find Missing "
        "Footage), then Analyze again.",
        "<b>The report says “CHECK” for a Photoshop layer</b> — that layer was relinked to the flattened "
        "file. Open the comp and make sure it looks right.",
    ]),
    KeepTogether([Spacer(1, 6),
                  Paragraph("Questions or feedback — Amir Anderson · linkedin.com/in/amiranderson", closing),
                  Paragraph("© 2026 Amir Anderson. Free to use. Not for redistribution or resale.", closing)]),
]

doc = SimpleDocTemplate(OUT, pagesize=letter, leftMargin=LEFT, rightMargin=RIGHT, topMargin=TOP, bottomMargin=BOTTOM,
                        title="%s — User Guide" % PRODUCT, author="Amir Anderson", subject="User guide")
doc.build(story, onFirstPage=cover, onLaterPages=footer)
print(OUT)
