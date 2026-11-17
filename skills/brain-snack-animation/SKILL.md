---
name: brain-snack-animation
description: "Build fast-paced 9:16 vertical animated explainer Shorts (45-68s, 30fps) in the Brain Snack / Ricks Clips hybrid 2.5D/3D cel-shaded style using Three.js, React Three Fiber, Remotion, Fish Audio s2-pro + Whisper synced captions, and synthesized SFX. Companion workflow to ricks-clips-animation; use whenever the user asks for Brain Snack animation, bite-sized science/history/psychology fact Shorts, or Ricks Clips style animated videos."
---

# Brain Snack / Ricks Clips Animation Pipeline

Create bite-sized 9:16 vertical animated story Shorts combining two-tone cel-shaded 3D environments, screen-space ink outlines, painted HD textures, lit 2D bean-head billboard characters, frame-accurate Fish Audio narration, procedural music/SFX mastered to `-15.0 LUFS`, and bold pop-in captions.

Always start new projects from [assets/starter](./assets/starter) rather than rewriting the shader/render pipeline from scratch.

## Bundled Resources
- [assets/starter](./assets/starter): Runnable Remotion 4 + R3F + Three.js + Python audio project scaffold (`src/engine/` shader/toon/ink/DOF stack + `scripts/` DSP/TTS toolkit + 2-shot starter scene).
- [references/style-bible.md](./references/style-bible.md): 6-beat paradox script formula, `3.7` w/s rhythm, camera hold/glide/flash rules, and YouTube Shorts packaging rules.
- [references/visual-spec.md](./references/visual-spec.md): `EffectComposer` pass order, `NOINK` layer contract, `day`/`golden` lighting presets, `untone()` neutral inversion, unlit signage, and ANGLE WebGL fixes.
- [references/audio-tts.md](./references/audio-tts.md): Fish Audio `s2-pro` voice config (`FISH_API_KEY`), `faster-whisper` forced alignment, sidechain ducking, and BS.1770-4 mastering targets.
- [scripts/render-stills.mjs](./scripts/render-stills.mjs) & [scripts/render-video.mjs](./scripts/render-video.mjs): ANGLE-enabled Remotion still and MP4 renderers.
- [scripts/short_qa.py](./scripts/short_qa.py) & [scripts/sbs_sheet.py](./scripts/sbs_sheet.py): Per-frame visual/loudness QA report + contact sheets.

## End-to-End Execution Steps

### 0. Scaffold & Verify Environment
1. Copy `assets/starter/` into a clean target project folder (e.g. `./my-short/`), run `npm install`, and verify TypeScript compilation with `npx tsc --noEmit`.
2. Ensure Python 3 packages (`numpy scipy faster-whisper requests pillow`) and `ffmpeg` / `ffprobe` are available on PATH.

### 1. Research & Write Paradox Script (~45-68 s)
1. Pick one vivid, visual true-history, psychology, engineering, or science paradox that explains its mechanism with concrete props or spatial motion.
2. Write the 6-beat spoken script following [references/style-bible.md](./references/style-bible.md) (`10-18` words Hook at `0 s`, concrete Setting, Escalation, Mystery/Pivot, Everyday Mechanism, Proof + Ironic Twist ending on the final word).
3. Target `~3.5-4.1` words/sec active speech with crisp `0.15-0.28 s` beat gaps. Keep total frame count anchored to `TOTAL` in `src/scene/story.ts` at `30 fps`.

### 2. Synthesize Narration & Word Timings (`words.json`)
1. Read [references/audio-tts.md](./references/audio-tts.md) before configuring voice synthesis.
2. Put beat slots `(line_id, display_text, tts_text, speed, gap_sec, f0, f1)` into `scripts/gen_voice.py`, keep `ENABLE_AUDIO = false` in `src/scene/story.ts` during early layout work, and pass the API key via `FISH_API_KEY` env var (never hardcode secrets in repo files).
3. Run `python scripts/gen_voice.py` to create `public/audio/voice.wav` and `public/audio/words.json`.
4. Listen to key generated `_lines_fish/*_fit.wav` slices to verify zero clipped endings, natural prosody (`atempo <= 1.20`), and clean monotonic `words.json` spans.
5. Update `EMPHASIS_WORDS` in `src/CaptionsOverlay.tsx` with the key punch words from the script.

### 3. Plan Shots, Cameras & World Architecture
1. Define shot ranges (`SHOTS`), crossfades (`XFADE`), hook exit flash (`FLASH_AT`), camera curves (`camAt`), hero reactions/reveals, restrained DOF stops (`dofAt`: keep `cInf = 0` on wides, rooms, and signage; `5-8` ONLY on tight hero closeups), and explicit foreground subject `focusAt` in `src/scene/story.ts`.
   - Keep camera holds gently creeping (`0.15-0.35%/f`) so no span freezes for `>= 12` frames.
   - Start visual reactions `0-3` frames before their spoken trigger word.
2. Build 3D geometry in `src/scene/world.ts` extending `WorldBase`:
   - Wrap static meshes via `Batch` with `terrain.build(R, true)` (`castShadow = true`) and `lam()` (`twoTone()` cel shading), plus `twoTone(new THREE.MeshPhongMaterial(...))` on metallic/painted hero props.
   - Paint every large wall, floor, rock, and tabletop using HD Canvas2D textures (`panelWallHD`, `concreteFloorHD`, `slateRockHD`, `facadeHD`, never plain solid slabs).
   - Run camera sightline distance culling on decorative trees and buildings before placing them.
   - Put all readable signage/blueprints/screens on unlit `MeshBasicMaterial` with `.layers.set(NOINK)`.
3. Stage 2D bean-head actors (`bodyFront` / `bodySide` from `src/engine/toon.ts`) and 2D effects (`fxBurst`, `fxStars`, contact blobs, `drawSunShadowTail`) via `Pool`, `Actor`, and `Fx` in `src/scene/cast.ts` using `charCanvasSize(dist)` (up to `1800x3000px`, NEVER low fixed caps like `250px`). Keep every billboard and FX plane on layer `NOINK`.

### 4. Inspect Stills Before Full Video Render
1. Run `npx tsc --noEmit`.
2. Render key shot frames at `scale=0.75` using `node scripts/render-stills.mjs --comp MainShort --out out/stills <frame1> <frame2> ...`.
3. View rendered `.jpg` stills directly. Verify:
   - Razor-crisp character ink lines, signage, and sharp focal subjects (no soft haze or grain soup over walls).
   - Zero cropped foreground blobs occluding cameras.
   - Zero unreadable greyed-out signs or floating ungrounded feet without contact blobs + sun shadow tails.
   - No unwanted box ink outlines around characters/signs (`NOINK` intact) and clean contrast in both `day` and `golden` shots.
4. Fix geometry/camera/lighting mismatches cleanly in `src/scene/` and re-check stills before encoding video.

### 5. Build Frame-Synced Audio & Mix
1. Lock shot boundaries and hero impact/reveal frame numbers in `src/scene/story.ts` and mirror those frame constants in `scripts/make_audio.py`.
2. Author story-matched backing music + frame-locked SFX (`frame / 30.0`) using `dsp.py`, `instruments.py`, and `sfx_gen.py`.
3. Run `python scripts/make_audio.py` to generate `public/audio/mix.wav` (`-15.0 LUFS`, `-1.2 dBTP`, `-5.2 dB` ducking during speech). Listen to start/middle/end slices to confirm voice clarity and punchy SFX timing.
4. Flip `ENABLE_AUDIO = true` in `src/scene/story.ts`.

### 6. Render Final MP4 & Mux
1. Run `npx tsc --noEmit`.
2. Render clean H.264 video:
   `node scripts/render-video.mjs --comp MainShort --out out/video_raw.mp4`
3. Mux video with mastered WAV (`-c:a aac -b:a 192k -ar 48000 -movflags +faststart`):
   `ffmpeg -y -i out/video_raw.mp4 -i public/audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest out/final_short.mp4`

### 7. Automated QA & Cleanup
1. Run `python scripts/short_qa.py` (from the skill folder) on `out/final_short.mp4 out/qa` and inspect `ffprobe` streams/duration, `-15.0 LUFS`, `SILENCES none`, black/white/frozen spans, and spot-check frames from `out/final_short.mp4`.
2. Delete intermediate `out/video_raw.mp4` and `%TEMP%\remotion-webpack-bundle-*` temporary directories before delivering `out/final_short.mp4`.
