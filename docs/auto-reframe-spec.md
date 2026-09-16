# Auto Reframe — Product Spec (draft)

> **Status:** partial draft. Only Section 17 has been supplied so far; sections
> 1–16 are referenced throughout (e.g. 5.3, 5.7, 7, 8, Phase 3) but not yet
> written up here. This file exists to hold spec content as it arrives so
> nothing gets lost — it is not an implementation guide on its own.
>
> **Relationship to this repo:** this repo also ships **Motion Spell
> Checker**, an unrelated AE spell-checking CEP panel (see root `README.md`,
> `client/`, `host/spellcheck.jsx`). The tool described below is a separate
> product and lives in its own extension folder: **[`AutoReframe/`](../AutoReframe/)**.
> A first build exists there now, implementing everything in Section 17 to
> the extent the missing sections 1–16 allow (see
> [`AutoReframe/README.md`](../AutoReframe/README.md) for what's implemented
> vs. simplified/heuristic). It should be re-checked against sections 1–16
> once those are available, since this section referenced mechanisms (5.3
> controller-null method, 5.7 solid handling, Section 7 audit, Section 8
> metadata, Phase 3 resync) that had to be inferred rather than read
> directly.

## 17. Competitive Benchmark & Required Differentiators

Reference tools reviewed:
- **Super Resize Me!** (aescripts.com/super-resize-me): recursive comp
  scaler, SAME aspect ratio only.
- **Smart Resize** (aescripts.com/smart-resize): manual responsive rig using
  pointer nulls and per-aspect-ratio effect controls; manual setup per
  graphic; not Apple Silicon compatible.

Our tool MUST exceed both in these specific ways:

### 17.1 Aspect ratio changes, fully automatic
- Unlike Super Resize Me!, we convert BETWEEN aspect ratios
  (16:9 ↔ 9:16 ↔ 4:5 ↔ 1:1).
- Unlike Smart Resize, conversion requires ZERO manual rig setup. One click
  produces a usable layout; manual adjustment is optional, not required.

### 17.2 Never require baking expressions
- Super Resize Me! asks users to convert transform/camera expressions to
  keyframes first. We must NOT. The controller-null method (5.3) leaves
  expressions live and editable. Expressions are only flagged in the audit
  (Section 7), never baked automatically.

### 17.3 Never modify shared project items
- Resizing a solid's source affects every comp using it. Therefore
  (REPLACES the solid behavior in 5.7): for full-frame solids, create a NEW
  solid source at target dimensions and use `layer.replaceSource()` on the
  copied layer only. Never edit shared solid sources.
- Same rule for precomps: if a precomp must be altered for a format,
  duplicate it first (named `"{PrecompName}_{PresetName}"`) and point only
  the social comp at the duplicate. The broadcast master and any other comps
  using the original must be untouched.

### 17.4 Precomp handling (match Super Resize Me!'s recursion, but safer)
- **Fit All mode:** precomps stay intact and scale via the controller (no
  recursion needed).
- **Smart Stack mode:** offer "Reframe inside precomps" (recursive), which
  duplicates each nested precomp per 17.3 and applies the reframe engine at
  every level, so individual elements inside a precomp can be repositioned
  for the new aspect ratio.
- Shared precomps used multiple times in one comp are duplicated only once
  per format.

### 17.5 Per-format adjustments that survive updates (improves on Smart Resize's rig)
- Each generated comp's `REFRAME_CONTROLLER`, and a sub-controller null per
  Element Role group, carries Slider/Point Control effects: "Offset
  Position", "Scale Adjust %", named per format.
- When a designer nudges a layout, those values are saved in the comp
  metadata (Section 8).
- Resync (Phase 3) re-imports updated broadcast layers but REAPPLIES saved
  adjustments, so designers never redo manual tweaks after a headline or
  graphic change.

### 17.6 Platform & hardware
- Must run natively on Apple Silicon and Intel Macs, and on Windows (CEP 12
  in current AE).
- Must support current After Effects versions only (2024+); no legacy
  baggage.

### 17.7 Match Super Resize Me!'s technical coverage at minimum
- 2D layers, 3D layers, cameras (including default camera behavior),
  parented layers, locked layers, and nested precomps must all be handled
  and included in the test project.
- Benchmark target: a real-world HD graphic with ~50 nested precomps
  converts to one social format in under 30 seconds.

### 17.8 Newsroom speed features neither tool has
- Multi-format batch output in one click.
- Platform safe-zone guides and Safe Zone Checker.
- Element Roles for news layouts (lower third, headline, bug, OTS,
  background).
- Quality warnings for upscaled rasters and pixel-based effect scaling.
- Live Text Link so broadcast edits flow to social versions.
- Render Queue / Media Encoder integration with naming tokens.
