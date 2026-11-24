import {
  FrontOpts,
  Outfit,
  Pen,
  SKIN,
  bodyFront,
  fxBurst,
  fxHatSteam,
  fxIdeaBulb,
  fxPhoneRing,
  fxSparkles,
  springBounce,
} from "../engine/toon";

export const createPen = (g: CanvasRenderingContext2D) => new Pen(g);

export type ExportCardSpec =
  | {
      id: string;
      kind?: "toon";
      width?: number;
      height?: number;
      designW?: number;
      designH?: number;
      draw: (p: Pen) => void;
    }
  | {
      id: string;
      kind: "canvas";
      width: number;
      height: number;
      draw2d: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
    };

export type CardPlacement = {
  id: string;
  card: string;
  pos: [number, number, number];
  heightM: number;
  a: number;
  b: number;
  emit?: number;
  shadow?: boolean;
  rotDeg?: number;
  pitchDeg?: number;
  yawDeg?: number;
  scaleX?: number;
  scaleY?: number;
  jitter?: number;
};

const HERO: Outfit = {
  jacket: "#3a69a8",
  pants: "#2b3240",
  boots: "#1f1526",
  hat: "hair_part",
  hair: "#6a4228",
  tie: "#e04838",
  skin: SKIN,
};

export const EXPORT_CARDS: ExportCardSpec[] = [];
export const CARD_PLACEMENTS: CardPlacement[] = [];

const seenCards = new Set<string>();
const BLINK_ENV = [0.55, 1.0, 1.0, 0.55];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const qInt = (v: number, steps = 20) => Math.round(v * steps);

function blinkValueAt(f: number, period: number, phaseShift: number, swaps: number[]): number {
  for (const ts of swaps) {
    const k = f - ts + 1;
    if (k >= 0 && k < 4) return BLINK_ENV[k];
  }
  const ph = (((f + phaseShift) % period) + period) % period;
  return ph >= 0 && ph < 4 ? BLINK_ENV[ph] : 0;
}

/** 3-phase grounded comic jump: 6f knee-bend anticipation -> 3D pos[1] arc -> 7f landing catch. */
function jumpState(f: number, tTakeoff: number, tLand: number, peakM = 0.36) {
  const antStart = tTakeoff - 6;
  const catchEnd = tLand + 7;
  if (f >= antStart && f < tTakeoff) {
    const u = Math.sin(clamp01((f - antStart) / 6) * Math.PI * 0.5);
    return { yLift: 0, hop: 0, knees: 0.95 * u, squash: 1 - 0.10 * u, bend: 8 * u };
  }
  if (f >= tTakeoff && f < tLand) {
    const u = (f - tTakeoff) / Math.max(1, tLand - tTakeoff);
    const arc = Math.sin(u * Math.PI);
    const takeStretch = u < 0.25 ? (1 - u / 0.25) * 0.07 : u > 0.78 ? ((u - 0.78) / 0.22) * 0.06 : 0;
    return { yLift: arc * peakM, hop: arc, knees: 0, squash: 1 + takeStretch, bend: 2 };
  }
  if (f >= tLand && f < catchEnd) {
    const u = smooth((f - tLand) / 7);
    const c = 1 - u;
    return { yLift: 0, hop: 0, knees: 0.75 * c, squash: 1 - 0.10 * c, bend: 6 * c };
  }
  return { yLift: 0, hop: 0, knees: 0, squash: 1, bend: 0 };
}

function actorCardKey(prefix: string, o: FrontOpts): string {
  const blinkQ = o.blink === true ? 4 : qInt(Number(o.blink) || 0, 4);
  const propK = Array.isArray(o.prop) ? `${o.prop[0]}_${qInt(o.prop[1], 16)}` : String(o.prop ?? "none");
  const hOff = o.headOff ? `${qInt(o.headOff[0], 6)}_${qInt(o.headOff[1], 6)}` : "0";
  const eLook = o.eyeLook ? `${qInt(o.eyeLook[0], 6)}_${qInt(o.eyeLook[1], 6)}` : qInt(o.look ?? 0, 8);
  return [
    prefix,
    o.mode ?? "stand",
    o.expr ?? "neutral",
    o.armL ?? "d",
    o.armR ?? "d",
    qInt(o.armK ?? 1, 14),
    qInt(o.phase ?? 0, 16),
    eLook,
    blinkQ,
    qInt(o.bend ?? 0, 2),
    qInt(o.tilt ?? 0, 2),
    qInt(o.headTilt ?? 0, 2),
    hOff,
    qInt(o.headSquash ?? 1, 12),
    qInt(o.squash ?? 1, 12),
    qInt(o.inflate ?? 1, 10),
    qInt(o.spineCurve ?? 0, 10),
    qInt(o.hop ?? 0, 12),
    qInt(o.knees ?? 0, 8),
    o.soleY ?? 975,
    qInt(o.browLift ?? 0, 4),
    o.faceTint ? o.faceTint.replace("#", "") : "s",
    o.facing ?? 0,
    propK,
  ].join("_");
}

function ensureActorCard(keyPrefix: string, outfit: Outfit, opts: FrontOpts): string {
  const cleanOpts: FrontOpts = { mouthOpen: "auto", soleY: 1080, ...opts };
  const id = actorCardKey(keyPrefix, cleanOpts).replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!seenCards.has(id)) {
    seenCards.add(id);
    EXPORT_CARDS.push({ id, width: 900, height: 1680, designW: 600, designH: 1120, draw: (p) => bodyFront(p, outfit, cleanOpts) });
  }
  return id;
}

type ExtraTrans = Partial<Pick<CardPlacement, "rotDeg" | "pitchDeg" | "yawDeg" | "scaleX" | "scaleY" | "jitter">>;

/** 30fps on-ones elastic actor generator with automatic deduplication for consecutive identical frames. */
function addLivingSeq(
  id: string,
  keyPrefix: string,
  outfit: Outfit,
  a: number,
  b: number,
  posAt: (u: number, f: number) => [number, number, number],
  optsAt: (u: number, f: number) => FrontOpts,
  cfg?: {
    blinkPeriod?: number;
    blinkShift?: number;
    swaps?: number[];
    heightAt?: (u: number, f: number) => number;
    emit?: number;
    extraAt?: (u: number, f: number) => ExtraTrans;
  }
) {
  const period = cfg?.blinkPeriod ?? 36;
  const shift = cfg?.blinkShift ?? 0;
  const swaps = cfg?.swaps ?? [];
  const span = Math.max(1, b - a - 1);
  let lastKey = "";

  for (let f = a; f < b; f++) {
    const u = (f - a) / span;
    const baseOpts = optsAt(u, f);
    const bl = baseOpts.blink ?? blinkValueAt(f, period, shift, swaps);
    const card = ensureActorCard(keyPrefix, outfit, { ...baseOpts, blink: bl });
    const pos = posAt(u, f);
    const heightM = cfg?.heightAt ? cfg.heightAt(u, f) : 2.15;
    const extra = cfg?.extraAt ? cfg.extraAt(u, f) : {};
    const placementKey = JSON.stringify([card, pos.map((v) => Math.round(v * 1000)), Math.round(heightM * 100), extra]);
    const prev = CARD_PLACEMENTS[CARD_PLACEMENTS.length - 1];
    if (prev && prev.id === id && prev.b === f && placementKey === lastKey) {
      prev.b = f + 1;
    } else {
      CARD_PLACEMENTS.push({ id, card, pos, heightM, a: f, b: f + 1, emit: cfg?.emit ?? 0.50, ...extra });
      lastKey = placementKey;
    }
  }
}

// 30fps on-ones snap-and-hold + 3-phase jump demo sequence (6f crouch -> 3D pos[1] arc -> 7f catch)
addLivingSeq(
  "hero",
  "hero",
  HERO,
  0,
  75,
  (u, f) => [lerp(-0.22, 0, smooth(u)), jumpState(f, 44, 64, 0.34).yLift, 0],
  (_u, f) => {
    const k = smooth(f / 32);
    const j = jumpState(f, 44, 64, 0.34);
    const landSq = springBounce(f - 64, 0.45, 0.18, 0.16);
    return {
      mode: f < 38 ? "stroll" : "stand",
      phase: (f * 0.045) % 1,
      armL: f < 38 ? "hip" : "think",
      armK: k,
      expr: f < 44 ? "smug" : "meme_grin",
      prop: "contract",
      hop: j.hop,
      knees: j.knees,
      bend: j.bend,
      squash: j.squash - landSq * 0.5,
      spineCurve: f < 38 ? 0.10 * Math.sin(f * 0.2) : 0,
      headOff: [0, landSq * 10],
      headSquash: 1 + landSq * 0.25,
      eyeLook: [0.35, 0.05],
      facing: 0,
      seed: 3,
    };
  },
  { blinkPeriod: 36, blinkShift: 10, swaps: [44] }
);

addLivingSeq(
  "hero",
  "hero",
  HERO,
  75,
  150,
  () => [0, 0, 0],
  (_u, f) => {
    const sp = springBounce(f - 75, 0.55, 0.18, 0.15);
    return {
      mode: "lean",
      armL: "raise",
      armR: "shrug",
      armK: smooth((f - 75) / 10),
      expr: "meme_shock",
      browLift: 0.7,
      squash: 1 - sp,
      inflate: 1 + sp * 0.35,
      spineCurve: 0.22 * (1 - clamp01((f - 75) / 14)),
      headOff: [0, sp * 10],
      headSquash: 1 + sp * 0.2,
      bend: 6,
      facing: 1,
      seed: 3,
    };
  },
  { blinkPeriod: 34, blinkShift: 4, swaps: [75] }
);

for (let k = 0; k < 6; k++) {
  const id = `fx_sp_${k}`;
  EXPORT_CARDS.push({ id, width: 600, height: 432, designW: 500, designH: 360, draw: (p) => fxSparkles(p, k / 6) });
  EXPORT_CARDS.push({ id: `fx_st_${k}`, width: 500, height: 360, designW: 500, designH: 360, draw: (p) => fxHatSteam(p, k / 6) });
  EXPORT_CARDS.push({ id: `fx_bulb_${k}`, width: 500, height: 500, designW: 420, designH: 420, draw: (p) => fxIdeaBulb(p, k / 6) });
  EXPORT_CARDS.push({ id: `fx_ring_${k}`, width: 500, height: 400, designW: 500, designH: 400, draw: (p) => fxPhoneRing(p, k / 6) });
}
EXPORT_CARDS.push({ id: "fx_burst_peak", width: 600, height: 600, designW: 500, designH: 500, draw: (p) => fxBurst(p, 0.45, "#fff3b0", 10, 40, 220) });

for (let f = 75; f < 150; f++) {
  const idx = ((f - 75) >> 1) % 6;
  CARD_PLACEMENTS.push({ id: "fx_spark", card: `fx_sp_${idx}`, pos: [0, 1.55, 0.12], heightM: 1.0, a: f, b: f + 1, emit: 0.9, shadow: false });
}
