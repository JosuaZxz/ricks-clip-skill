# Style Bible: Hybrid 2.5D/3D Animated Story Shorts

Use this narrative and pacing grammar when scripting and directing vertical (9:16) explainer or fact-story Shorts in the Ricks Clips / Brain Snack format.

## 1. Format & Delivery Metrics
- **Frame:** `1080x1920`, `30 fps`, `45-68 s` total (`1350-2040` frames). Voice starts at frame `1-4` with zero channel intro, logo sting, or "like and subscribe" outro.
- **Narration Speed:** `3.5-4.1` words/sec (target median `3.7` w/s). Minimal silence between sentences (`0.15-0.28 s` max) so retention never dips.
- **Sentence Length:** `~13.5` words median. Plain spoken conversational phrasing, active verbs, present tense (or vivid second-person `"When you..."`). Never explain on screen what the picture already shows.

## 2. Six-Beat Paradox Script Formula
1. **Paradox Hook (Beat 1, `~10-18` words, `0-5 s`):** State an absurd true event or counterintuitive fix as plain fact without warm-up.
   - *Pattern:* `"This deadly curve seemed impossible to fix, until Chicago just dumped white paint across the asphalt."`
2. **Concrete Setting (`1-2` lines):** Establish place, real year/numbers, and immediate obstacle.
3. **Escalation (`2-4` beats):** Show failed conventional attempts, escalating stakes, or social doubt/mockery (`Giant yellow signs were screaming...`, repeated collisions).
4. **Mystery / Pivot (`1-2` lines):** Frame the hidden failure mode (`speed adaptation`, `reflex delay`) and reveal the pivot idea (`"In 2006, engineers gave up on signs and tried a psychology trick instead."`).
5. **Everyday Mechanism (`2-3` lines):** Explain *why* the trick works visually so a viewer understands in one glance (e.g., closer stripes make your eyes think you are speeding up).
6. **Measured Proof + Ironic Twist (`2` lines):** Land the real statistic first, then end abruptly on the ironic takeaway. Stop cleanly right after the last word.

## 3. Camera & Editing Rules
- **Hold ~80% of frames with subtle creep:** Avoid pure static cameras (`>= 12` frozen frames trip QA and kill momentum). Always add a slow push-in (`~0.15-0.35%/f`) or tiny sway.
- **Ease-out glides (`18-40` frames):** Peak angular/linear speed at the start of a move, smoothly settling onto the focal subject.
- **Transitions:**
  - **4-frame pure white flash** exiting the Hook into Beat 2 (`FLASH_AT`).
  - **6-8 frame smooth crossfade (`XFADE`)** when jumping location or time of day.
  - **Impact kicks:** Fast decaying roll/pitch camera shakes (`7-10` frames) locked to crashes, slammed brakes, or sudden shockbeats.
- **Camera Sightlines:** Keep hero camera paths clear of foreground walls/trees. A blurred prop clipping the lens looks like a solid colored blob.

## 4. Captions & Packaging
- **Captions:** Large bold uppercase (`76-80 px`, `Roboto 900`), crisp black stroke + drop offset shadow (`#151018`) centered in the bottom-third safe zone (`paddingBottom: 325`). Pair at most 2 short words (`combined <= 13 chars`), highlight key punch words in `#FFE44D`, and snap cleanly frame-exact from Whisper word timestamps (`words.json`). Keep `SHOW_CAPTIONS = false` only if the user explicitly asks for captionless video.
- **YouTube Shorts Packaging:** Use a `5-7` word curiosity title in Title Case without hashtags/emojis (e.g. `How Paint Tricked Drivers Into Braking`), matching clean single-line or empty description, marked **"No, it's not made for kids"** so comments stay enabled.
- **Originality Rule:** Match the visual craft, pacing, and cinematic structure. Never trace, copy, or reuse any reference channel scripts, proprietary audio, or cloned creator voices.

