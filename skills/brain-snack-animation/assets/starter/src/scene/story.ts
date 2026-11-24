export const FPS = 30;
export const TOTAL = 150;
export const FLASH_AT = 75;

/** Flip ENABLE_AUDIO to true once public/audio/mix.wav is generated. */
export const ENABLE_AUDIO = false;
export const SHOW_CAPTIONS = true;

export type ShotDef = {
  id: number;
  a: number;
  b: number;
  light: "day" | "golden" | "interior" | "night";
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 75, light: "day" },
  { id: 2, a: 75, b: 150, light: "golden" },
];

export const XFADE: { from: number; to: number; a: number; b: number }[] = [];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (t: number) => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};
export const smoother = (t: number) => {
  const u = clamp01(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const easeOut = (t: number) => 1 - (1 - clamp01(t)) ** 3;

export type V3 = [number, number, number];
export type CamSpec = { pos: V3; look: V3; fov: number; roll: number };

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixCam = (a: CamSpec, b: CamSpec, t: number): CamSpec => ({
  pos: [mix(a.pos[0], b.pos[0], t), mix(a.pos[1], b.pos[1], t), mix(a.pos[2], b.pos[2], t)],
  look: [mix(a.look[0], b.look[0], t), mix(a.look[1], b.look[1], t), mix(a.look[2], b.look[2], t)],
  fov: mix(a.fov, b.fov, t),
  roll: mix(a.roll, b.roll, t),
});

/** Continuous push-in creep so cameras never freeze dead during dialogue holds. */
const push = (pos: V3, look: V3, f: number, f0: number, rate = 0.0032): V3 => {
  const k = Math.min(0.24, Math.max(0, f - f0) * rate);
  return [
    pos[0] + (look[0] - pos[0]) * k,
    pos[1] + (look[1] - pos[1]) * k,
    pos[2] + (look[2] - pos[2]) * k,
  ];
};

const kickAt = (f: number, f0: number, amp = 1) => {
  const k = f - f0;
  if (k < 0 || k > 7) return 0;
  return Math.cos(k * Math.PI * 0.9) * (1 - k / 7) * amp;
};

type CamKey = { f: number; dur?: number; cut?: boolean; s: (f: number) => CamSpec };

// High-cadence declarative KEYS (~6 camera moves per 10s: ECU opener -> whip pullback -> turn push -> crane wide)
const KEYS: CamKey[] = [
  {
    f: 0,
    s: (f) => {
      const look: V3 = [0.0, 1.48, 0.0];
      return { pos: push([0.08, 1.54, 1.78], look, f, 0, 0.0025), look, fov: 35, roll: 0.045 };
    },
  },
  {
    f: 26,
    dur: 20,
    s: (f) => {
      const look: V3 = [0.0, 1.32, 0.0];
      return { pos: push([0.85, 1.62, 4.15], look, f, 26, 0.0028), look, fov: 44, roll: -0.025 };
    },
  },
  {
    f: 75,
    cut: true,
    s: (f) => {
      const look: V3 = [0.0, 1.38, 0.0];
      return { pos: push([-0.92, 1.24, 2.75], look, f, 75, 0.0036), look, fov: 37, roll: 0.052 };
    },
  },
  {
    f: 112,
    dur: 22,
    s: (f) => {
      const look: V3 = [0.0, 1.42, -0.25];
      return { pos: push([0.45, 2.15, 4.95], look, f, 112, 0.0018), look, fov: 44, roll: -0.015 };
    },
  },
];

export const camAt = (_id: number, f: number): CamSpec => {
  let cur = KEYS[0].s(f);
  for (let i = 1; i < KEYS.length; i++) {
    const k = KEYS[i];
    if (f < k.f) break;
    cur = k.cut ? k.s(f) : mixCam(cur, k.s(f), smoother((f - k.f) / (k.dur ?? 22)));
  }
  const ka = kickAt(f, 75, 1.4);
  if (!ka) return cur;
  const dx = cur.look[0] - cur.pos[0];
  const dz = cur.look[2] - cur.pos[2];
  const dist = Math.hypot(dx, cur.look[1] - cur.pos[1], dz) || 1;
  const horiz = Math.hypot(dx, dz) || 1;
  const m = 0.0042 * Math.tan((cur.fov * Math.PI) / 360) * dist * ka;
  return {
    ...cur,
    look: [cur.look[0] - (dz / horiz) * m, cur.look[1] + 0.65 * m, cur.look[2] + (dx / horiz) * m],
    roll: cur.roll + ka * 0.008,
  };
};

export const dofAt = (f: number): { cInf: number } => ({
  cInf: f < 26 ? 8 : f >= 75 && f < 112 ? 7 : 4,
});

export const focusAt = (_id: number, _f: number): V3 => [0, 1.35, 0];

export const flashLevelAt = (f: number): number =>
  f >= FLASH_AT && f < FLASH_AT + 4 ? Math.sin(((f - FLASH_AT + 0.5) / 4) * Math.PI) : 0;

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const xf of XFADE) {
    if (f >= xf.a && f < xf.b) {
      const a = smooth((f - xf.a) / (xf.b - xf.a));
      return [
        { id: xf.from, alpha: 1 - a },
        { id: xf.to, alpha: a },
      ];
    }
  }
  const s = SHOTS.find((x) => f >= x.a && f < x.b) ?? SHOTS[SHOTS.length - 1];
  return [{ id: s.id, alpha: 1 }];
};

/** Continuous per-frame lighting mood lookup (supports mid-shot zone turns seamlessly). */
export const lightAt = (f: number): "day" | "golden" | "interior" | "night" =>
  f < FLASH_AT ? "day" : "golden";
