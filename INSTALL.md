# Installing Motion Spell Checker

## Requirements

- Adobe After Effects 2022 or later (macOS or Windows)

## What's in this download

- **`Amir Anderson Motion Spell Checker.zxp`** — the plugin itself. This is the only file you need to install.
- **`Motion_Spell_Checker_Quick_Start_Guide.pdf`** — a full walkthrough of every feature.
- **`INSTALL.md`** (this file) — the short version of getting it installed.
- **`LICENSE.txt`** — usage terms.

## Install

1. Download **`Amir Anderson Motion Spell Checker.zxp`**.
2. Install it using a ZXP installer app — if you don't already have one:
   - **ZXP Installer** (free): https://aescripts.com/learn/zxp-installer/
   - or **Anastasiy's Extension Manager** (free): https://install.anastasiy.com/
3. Open the installer app and drag `Amir Anderson Motion Spell Checker.zxp` into it (or double-click the `.zxp` if your installer is already set as the default handler), then click **Install**.
4. If you see a one-time "unverified developer" notice, that's expected — click through it. This plugin is signed but not through Adobe's paid developer program, so this warning shows once and doesn't affect how it runs.
   - **If macOS blocks it outright** instead of just warning: open **System Settings → Privacy & Security**, scroll down, and you'll see a message naming the blocked file with an **Open Anyway** button next to it. Click that, confirm once more, and continue installing.
5. **Fully quit After Effects** (don't just close a project — quit the whole app) and reopen it.
6. Open it from **Window → Extensions → Amir Anderson Motion Spell Checker**.

That's it — no debug mode, no manual file copying, no Terminal commands. Those are only needed for *developers* working on the plugin's source code, not for installing the finished version.

## Adding your own words (optional)

The plugin ships with a full dictionary already installed — 46 category
files (world leaders, countries, medical terms, tech vocabulary, common
misspelling corrections, and more) plus a general fallback list, so it
works out of the box with no setup. To extend it further with your own
words (brand names, character names, industry terms specific to your
work):

1. In the plugin, open **Settings → Verify Dictionary** to see the exact
   `Dictionary` folder path it's using.
2. Drop `.txt` files into that folder — one word per line, or
   `wrongword -> correctword` lines for direct corrections. Lines starting
   with `#` are comments.
3. Click **Scan** again (no restart needed) — new dictionary files are
   picked up right away.

## Troubleshooting

- **Plugin doesn't appear under Window → Extensions**: make sure you fully
  quit and reopened After Effects (not just closed a project) after
  installing.
- **Nothing happens when you double-click the `.zxp`**: install ZXP
  Installer or Anastasiy's Extension Manager first (links above), then
  open the `.zxp` through that app instead.

## Questions or issues

Amir Anderson — https://www.linkedin.com/in/amiranderson
