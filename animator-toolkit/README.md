# Amir Anderson Animator Toolkit

By Amir Anderson · [LinkedIn](https://www.linkedin.com/in/amiranderson)

A dockable Adobe After Effects panel for animators and designers moving into
motion. It does everyday jobs in one click (anchor points, keyframes, easing,
motion presets, text animation, masks, 3D, cameras, previews, audio and still
capture) and explains each one as it goes, with short lessons and shortcuts.

- **Works with:** After Effects 2021 (18.0) and newer, macOS and Windows
- **Version:** 1.0.0
- **Price:** free

## Install

Use **one** of these, not both.

**Option A: ZXP (recommended)**

1. Install a free ZXP installer, such as ZXP Installer by aescripts or
   Anastasiy's Extension Manager.
2. Drag `Amir_Anderson_Animator_Toolkit-1.0.0.zxp` onto it.
3. Restart After Effects and open
   **Window › Extensions › Amir Anderson Animator Toolkit**.

The ZXP is self-signed, so an installer may say the publisher is unverified.

**Option B: zip + install script**

1. Unzip `Amir_Anderson_Animator_Toolkit-1.0.0.zip`.
2. Run `install/install-mac.command` (macOS) or `install\install-windows.bat`
   (Windows). This lets After Effects load the panel and copies it into your
   user extensions folder.
3. Restart After Effects and open
   **Window › Extensions › Amir Anderson Animator Toolkit**.

To remove it, use your ZXP installer's Remove button, or
`install/uninstall-mac.command`.

## What's in the panel

| Tab | What it does |
|---|---|
| **Home** | Suggestions for what you have selected, editable **Quick actions**, your favorites, recent tools and the 5 essential skills |
| **Animate** | Anchor point grid, Align and Distribute, keyframe buttons, Reverse Keys, **Stagger** (frames), the motion library (entrances and exits) and layer tools, including Continuous Rasterize |
| **Easing** | Live curve and motion preview, Easy Ease / In / Out / Linear / Hold, curve presets, physics (Overshoot, Bounce, Elastic) and In/Out influence sliders |
| **Text** | New text, plus text entrances and exits by letter, word and line |
| **Mask** | Animated mask reveals (wipes, iris, split) and mask tools |
| **3D** | Make 3D/2D, spread in depth, 3D motion, and extruded 3D text with an Advanced 3D / Classic 3D switch |
| **Camera** | Create, moves (push, pull, truck, pedestal), lens and focus, orbit and shake rigs, saved positions |
| **Capture** | **Grab Still** saves the frame at the playhead as a PNG, with an option to import it into the project; a pop-up shows the still and where it was saved |
| **Preview** | One-click **Animate Fast / Final Check**, resolution cards (Auto, Full, Half, Third, Quarter), **Rulers** and **Transparency grid** cards, Fast Previews, speed tools (**Work Area 90f / 150f / 300f**, Draft 3D, **Purge Memory**, **Purge All**), color depth, and a planner that mirrors After Effects' Preview panel |
| **Audio** | Level and fade tools for selected audio layers |
| **Favorites** | Your own kit of cards. Each favorite can keep **its own settings** (for example Stagger by 8 frames), or follow the tab it came from |
| **Learn** | Lessons, quick fixes and explained shortcuts, including Title/Action Safe, grids, guides and snapping. About: panel density, version, license, LinkedIn |

Search (press `/`) finds every tool, preset, lesson and shortcut. Durations
are in frames, with the seconds shown as a hint.

**Undo:** every button that changes your project is one Ctrl/Cmd+Z, and each
message has an **Undo** button. Viewer settings (rulers, transparency grid,
Fast Previews) aren't part of After Effects' undo history; press them again to
switch them back.

## If something isn't working

- **The panel isn't listed under Window › Extensions:** make sure only one
  copy is installed (ZXP or zip, not both), then restart After Effects. Run
  `install/diagnose-mac.command` (or `diagnose-windows.bat`); it writes a
  report to your Desktop.
- **A red banner says the panel can't reach After Effects:** press Retry. If
  it stays, restart After Effects.
- **A button says what it needs:** most tools act on the selected layers or
  keyframes. The message and the "What does this tool need?" link explain.

## Good to know

- **Anchor** won't move a layer whose Scale or Rotation is animated, that has
  an expression, or that is a tilted 3D layer, because no single offset can
  keep it in place. It tells you why.
- **Align** skips parented and 3D layers for the same reason.
- **Grab Still** is for approvals and reference. For a deliverable still, use
  Composition › Save Frame As › File (Render Queue).
- Bounce, elastic and overshoot are real keyframes, so you can edit them in
  the timeline.

## License

Copyright (c) 2026 Amir Anderson. All rights reserved.

The toolkit is **free** to use for personal and commercial projects,
including client work, and what you make with it is yours. Free doesn't mean
open source: copying, recreating, modifying, reverse engineering, reselling,
re-uploading or creating derivative works of this software, its code or its
design is prohibited without written permission from Amir Anderson. To share
it, share the official download link. Unauthorized use violates copyright law
and may result in takedown notices and legal action. It is provided "as is",
without warranty. See `LICENSE.txt` for the full terms.

Adobe and After Effects are trademarks of Adobe Inc. This is an independent
product, not affiliated with or endorsed by Adobe.
