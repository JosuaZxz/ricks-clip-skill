# Visual Spec: HD 3D Toon World + 2D Character Pipeline

All rendering runs inside Remotion's `<ThreeCanvas>` using Three.js, React Three Fiber, `postprocessing`, and custom GLSL/Canvas2D shaders in `src/engine/`.

## 1. Exact Post-Processing Stack Order (`ShortComposition.tsx`)
Preserve this exact pass chain inside `EffectComposer`:
1. `RenderPass(scene, camera)`
2. `InkPass(scene, camera)`: Renders world geometry (`layer 0`) into view-space normals + depth, detects depth silhouettes (`>= 1%` jump) and dihedral creases (`>= 35 deg`), composites near-black `#030303` anti-aliased ink outlines (`widthNear=5.1 px`, `widthFar=3.3 px` scaled by output height / 1920).
3. `EffectPass(camera, lens.pre)`: Pre-computes depth circle-of-confusion from camera distance and `dofAt(frame)`.
4. `EffectPass(camera, lens.main, bloom, tone, grade, grain)`: Applies separable bokeh blur (`cInf = 0..10 px`), HDR bloom (`luminanceThreshold = 1.0`, `intensity = 0.40..0.55`), `ToneMappingMode.NEUTRAL`, `GradeEffect` (`GRADE_DAY2` / `GRADE_GOLD`), and micro-grain (`<= 0.006`, or `0` for zero noise over flat surfaces).

## 2. Critical HD Sharpness Rules (Never Ship Soft / Grainy Renders)
- **Distance-Tiered Character Bitmaps (`charCanvasSize(dist)` in `src/engine/billboard.ts`):** NEVER clamp foreground 2D characters below `540px`. Use `[1800, 3000, 3.0]` for `< 3.6 m`, `[1080, 1800, 1.8]` for `< 8.5 m`, `[540, 900, 0.9]` for midshots, so bean-head ink lines stay razor crisp.
- **Restrained DOF Blur (`dofAt` & `focusAt`):** Keep `cInf = 0` on wide/landscape shots, indoor control rooms, and shots displaying wall signage behind actors. Use `cInf = 5..9` ONLY on close hero focus shots, locking `focusAt` directly onto the hero eye plane.
- **Zero Muddy Grain (`GrainEffect <= 0.006`):** High `0.025` grain over flat painted walls turns H.264 encodes into smudged noise (`burik`) and quadruples bitrate. Keep `grain.amount <= 0.006` (default in starter) and render final MP4 at `crf <= 15` (use `--scale 1.3333` for 1440x2560 2K YouTube uploads when extra sharpness is desired).
- **Rich Painted Textures + Specular + Shadows:** Never leave large foreground/midground meshes as plain untextured flat color slabs. Use HD Canvas2D textures (`facadeHD`, `asphaltHD`, `slateRockHD`, `panelWallHD`), beveled multi-part props (legs, rails, trim, coasters, gauges), `twoTone(new THREE.MeshPhongMaterial(...))` for metal/chrome/paint sheen, `castShadow = true` on hero architecture and props, plus `drawSunShadowTail` under characters in daylight shots.

## 3. Critical Shader & Layer Contracts
- **`NOINK` Layer (`NOINK = 3` in `src/engine/ink.ts`):** Put ALL camera-facing character cards, FX sprites (`fxBurst`, `fxStars`, blobs), painted clouds, sun disc/halo, unlit sign planes, and transparent glasses on layer `NOINK` (`obj.layers.set(NOINK)`), AND enable layer `NOINK` on the active camera (`cam.layers.enable(NOINK)`).
- **Unlit Readable Signage:** Any painted canvas texture containing text, gauges, or high-contrast graphics (speed signs, blueprints, scoreboards, TV screens) MUST use `THREE.MeshBasicMaterial({ map })`. Side-lit Lambert shading shifts white/yellow signage toward murky blue-grey in shadow.
- **Two-Tone Cel World (`twoTone()` in `src/engine/shade.ts`):** Wrap every world mesh material via `lam()` or `twoTone()`, never default unpatched Three.js PBR. Keep dark albedos lifted above `#282830`.
- **Tone-Map Inversion (`untone()`):** `ToneMappingMode.NEUTRAL` applies a -0.04 toe and shoulder roll-off above `0.76`. Always write sky shader stops, fog color, and self-lit palette targets through `untone(hex, outColor)`.
- **Character Card Shading (`cardShade()` in `src/engine/cardshade.ts`):** Characters are lit by directional sun tint, scene cast shadows (`receiveShadow = true`), soft across-card shading gradient, and warm orange inner rim on golden sunset shots.

## 4. Lighting Presets (`src/engine/lights.ts`)
- **`day`:** Key sun azimuth `75 deg` (camera-relative, frozen per shot), elevation `48 deg`, warm highlight `[1.58, 1.50, 1.33]`, cool violet shadow `[0.30, 0.29, 0.36]`, crisp blue sky `#3373cc -> #b8d0ec`, fog `25 -> 300 m`.
- **`golden`:** Low backlit sun (`az=6 deg`, `el=7 deg`), saturated warm lit `[1.50, 0.68, 0.24]`, lavender-blue shadows `[0.15, 0.15, 0.30]`, sky `#8a6f8a -> #ffd08a`, glowing sun disc + additive halo, fog `50 -> 380 m`.

## 5. Character Design & Proportions (`src/engine/toon.ts`)
- Design space `600 x 1000` units with shoes grounded cleanly at `y = 975`.
- Adults stand `~3.5` head-heights tall (torso `1.1 HH`, legs `1.4 HH`); kids use tighter build (`1.0 HH` legs).
- Superellipse bean head (`h/w ~ 0.94`), plum ink `#241726` weighted away from light, soft internal crescent shadow, deadpan expressive eyes, natural `4f` eye blinks every `~2-2.6 s`.

## 6. Remotion + WebGL Render Gotchas
- **Always use `chromiumOptions: { gl: "angle" }`** on Windows when calling `renderStill` or `renderMedia` with `@remotion/three`.
- **Check Disk TEMP:** Clean `%TEMP%\remotion-webpack-bundle-*` temporary directories after rendering finishes.
- **Camera Culling & Placement:** Build combined static geometry via `Batch`, enable `castShadow` on hero buildings/props, and run camera sightline distance culling on trees/poles.
