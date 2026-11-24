---
name: brain-snack-animation
description: "Build high-retention 9:16 vertical animated explainer Shorts (45-68s, 30fps) in the Brain Snack / Ricks Clips v5.1 hybrid 2D-cards-in-3D style using outline-FREE multi-part PBR Blender 5.2 GPU sets (geometry-nodes ink opt-in via --ink, fast Stage-1 Three.js/Remotion blocking), 10-14 multi-location spaces with animated 3D props, snap-and-hold 30fps sprites (`900x1680` / `designH: 1120` / `soleY: 1080` crown clearance, 3-phase `jumpState` crouch anticipation, grounded runs, facing-aligned hand props), Fish Audio s2-pro + Whisper synced pure white captions, 40-check plan validation, and mastered SFX. Companion workflow to ricks-clips-animation; use whenever the user asks for Brain Snack animation, bite-sized science/history/psychology paradox Shorts, or Ricks Clips style animated videos."
---

# Brain Snack / Ricks Clips Animated Short Pipeline (v5.1)

Create bite-sized `9:16` vertical animated story and explainer Shorts (`45-68s`, `30 fps`) combining outline-FREE multi-part PBR 3D worlds rendered with **Stage-2 Blender 5.2 GPU** (plus fast Stage-1 Three.js/R3F/Remotion blocking), **10-14 distinct 3D locations**, snap-and-hold 2D bean-head billboard characters (`30fps on ones`), Fish Audio `s2-pro` narration with Whisper alignment, procedural music/SFX mastered to `-15.0 LUFS`, and bold white captions.

Always start new projects from [assets/starter](./assets/starter) rather than rewriting the shader, character, or render pipeline from scratch. Read [references/style-bible.md](./references/style-bible.md), [references/visual-spec.md](./references/visual-spec.md), and [references/audio-tts.md](./references/audio-tts.md) before authoring scenes or narration.

## Bundled Resources
- [assets/starter](./assets/starter): Runnable Remotion + R3F + Stage-2 Blender 5.2 + Python audio scaffold (`src/engine/` v5.1 character & shader stack, `public/plan.json`, `scripts/` TTS/DSP/Blender pipeline, and snap-and-hold `jumpState` starter scene).
- [references/style-bible.md](./references/style-bible.md): Story beat architecture, `3.5-4.1 w/s` narration rhythm, the 7 film grammar laws, snap-and-hold acting rules, and YouTube Shorts packaging rules.
- [references/visual-spec.md](./references/visual-spec.md): Stage-1 `EffectComposer` blocking stack, v5.1 `toon.ts` headroom (`900x1680` / `designH: 1120` / `soleY: 1080`), 3-phase `jumpState`, Stage-2 Blender 5.2 outline-FREE multi-part `bmesh` 3D spec, and ANGLE WebGL fixes.
- [references/audio-tts.md](./references/audio-tts.md): Fish Audio `s2-pro` config (`FISH_API_KEY`), `faster-whisper` alignment, sidechain ducking, and BS.1770-4 mastering (`-15.0 LUFS`).
- [scripts/validate_plan.py](./scripts/validate_plan.py), [scripts/export-cards.mjs](./scripts/export-cards.mjs), [scripts/blender_render.py](./scripts/blender_render.py), [scripts/composite_stage2.mjs](./scripts/composite_stage2.mjs), [scripts/short_qa.py](./scripts/short_qa.py), [scripts/sbs_sheet.py](./scripts/sbs_sheet.py).

## Workflow Summary (4 Steps)

1. **Paradox Topic, Beat Script & Voice Lock:**
   - Pick a vivid true-history, science, engineering, or psychology paradox whose mechanism reads cleanly in spatial 3D props and physical acting.
   - Keep **Fish Audio `s2-pro`** default narration active (`FISH_REF_ID="b0204e37cbc94a16954c78697b844af2"` US English or `"090af282b9204275ace6fd7aecbf5748"` Indonesian Baritone; requires `FISH_API_KEY`).

2. **Voiceover Synthesis, Whisper Sync & 40-Check `public/plan.json`:**
   - Configure `SCRIPT_LINES` in `scripts/gen_voice.py` (`3.5-4.1 w/s`, gaps `0.15-0.28s`), run `python scripts/gen_voice.py`, and verify `public/audio/voice.wav` + monotonic `public/audio/words.json`.
   - Author `public/plan.json` (`<= 12` shots, `avg >= 4.5s`, **10-14 visual locations/angles** via `planned` whip frames, hero face `<= 2.5s`, `light` shifts, AABBs for hero props, packaging title/description/hashtags).
   - Run `python scripts/validate_plan.py public/plan.json public/audio/words.json` and pass all **40/40 checks** before rendering.

3. **Multi-Zone Multi-Part 3D Sets, Snap-and-Hold Acting & Smoke Preview:**
   - Build non-overlapping Y zones (`0, 150, 300, ...`) in `scripts/blender_scene.py` (`src/scene/world.ts` for Stage-1 blocking) toggled via `hide_render` in `update_frame`, using beveled multi-part `bmesh` models (open-spoked wheels on unrotated XZ Empty pivots + synced rods, I-beam rails + sleepers + ballast, sculpted desk props) kept outline-FREE PBR by default. Never float autonomous 3D hand props (`stamp`, `mug`, `phone`) over bare 2D hands.
   - Drive characters (`addLivingSeq` in `src/scene/cards.ts`) on tall top-hat-safe cards (`900x1680`, `designW: 600, designH: 1120, soleY: 1080, heightM: 2.15`) using **snap-and-hold pose discipline** (no constant idle wobble), **3-phase `jumpState` leaps** (6f crouch anticipation -> 3D `pos[1]` arc -> 7f landing catch), grounded `"run"` feet, `facing`-aligned single-hand props, `0.7-1.4s` shaped blinks, and static beat faces (`mouthOpen: "auto"`) during third-person narration.
   - Inspect multi-zone smoke preview frames via `export-cards.mjs` + `blender_render.py --frames-list ... --engine EEVEE --samples 6 --format JPEG` with `read_file` before running a full pass.

4. **Final Stage-2 Render, Audio Mastering & QA:**
   - Export batched transparent 30fps cards + `camPath` (`node scripts/export-cards.mjs --entry src/scene/cards.ts --story src/scene/story.ts --out out/cards`), render Blender 5.2 frames (`out/blender_frames/frame_XXXX.jpg`), build `-15.0 LUFS` audio (`python scripts/make_audio.py`), and composite pure white `98px` bold captions + AAC audio (`node scripts/composite_stage2.mjs --frames out/blender_frames --format jpg --audio public/audio/mix.wav --out out/final.mp4`).
   - Run `python scripts/short_qa.py out/final.mp4 out/qa_report public/plan.json` plus `sbs_sheet.py` visual inspection, confirm zero black/frozen spans, clean headroom, and deliver a `5-7` word Title Case title, `1-2` sentence factual description, and `4` hashtags.
