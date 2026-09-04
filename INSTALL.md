# Installing Motion Spell Checker

## Requirements

- Adobe After Effects 2022 or later (macOS or Windows)

## Install

1. Download **`MotionSpellChecker.zxp`**.
2. Install it using a ZXP installer app — if you don't already have one:
   - **ZXP Installer** (free): https://aescripts.com/learn/zxp-installer/
   - or **Anastasiy's Extension Manager** (free): https://install.anastasiy.com/
3. Open the installer app and drag `MotionSpellChecker.zxp` into it (or double-click the `.zxp` if your installer is already set as the default handler), then click **Install**.
4. If you see a one-time "unverified developer" notice, that's expected — click through it. This plugin is signed but not through Adobe's paid developer program, so this warning shows once and doesn't affect how it runs.
5. **Fully quit After Effects** (don't just close a project — quit the whole app) and reopen it.
6. Open it from **Window → Extensions → Motion Spell Checker**.

That's it — no debug mode, no manual file copying, no Terminal commands. Those are only needed for *developers* working on the plugin's source code, not for installing the finished version.

## Adding a custom dictionary (optional)

The plugin works out of the box with a built-in ~8,100-word dictionary. To
extend it with your own word lists (brand names, industry terms, names of
people/places specific to your work):

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
