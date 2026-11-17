export const FPS = 30;
export const TOTAL = 150;
export const FLASH_AT = 75;

/** Flip ENABLE_AUDIO to true once public/audio/mix.wav is generated in Step 5. */
export const ENABLE_AUDIO = false;
export const SHOW_CAPTIONS = true;

export type ShotDef = {
  id: number;
  a: number;
  b: number;
  light: "day" | "golden";
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

export type CamSpec = {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  roll: number;
};

export const camAt = (id: number, f: number): CamSpec => {
  if (id === 1) {
    // Creeping slow push-in along street toward hero character (never static!)
    const u = clamp01(f / 75);
    return {
      pos: [1.4 - 0.5 * smoother(u), 2.1 - 0.1 * u, 9.5 - 2.4 * smoother(u)],
      look: [0.0, 1.35, 0.0],
      fov: 40,
      roll: 0.03 * Math.sin(u * Math.PI),
    };
  }
  const u = clamp01((f - 75) / 75);
  return {
    pos: [-2.4 + 0.6 * smoother(u), 1.9, 6.8 - 1.5 * smoother(u)],
    look: [0.0, 1.45, 0.0],
    fov: 38,
    roll: -0.04,
  };
};

export const dofAt = (f: number): { cInf: number } => ({
  cInf: f < 75 ? 9 : 13,
});

export const focusAt = (_id: number, _f: number): [number, number, number] => [0, 1.35, 0];

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
