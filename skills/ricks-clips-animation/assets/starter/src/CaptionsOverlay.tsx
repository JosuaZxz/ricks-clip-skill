import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Roboto";
import wordsData from "../public/audio/words.json";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

export type WordEntry = {
  w: string;
  s: number;
  e: number;
  startMs: number;
  endMs: number;
  line: string;
};

type CaptionChunk = {
  tokens: { text: string; highlight: boolean }[];
  startFrame: number;
  endFrame: number;
};

/** Replace this set with keywords from each story script that should pop in bright yellow (#FFE44D). */
const EMPHASIS_WORDS = new Set([
  "DEADLY",
  "CURVE",
  "SECRET",
  "IMPOSSIBLE",
  "TRICK",
  "ILLUSION",
  "BRAIN",
  "SLOW",
  "BRAKES",
  "CRASH",
]);

const cleanToken = (raw: string) => raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toUpperCase();

const buildChunks = (words: WordEntry[], fps: number): CaptionChunk[] => {
  const chunks: CaptionChunk[] = [];
  let i = 0;

  while (i < words.length) {
    const first = words[i];
    const clean1 = cleanToken(first.w);
    const next = words[i + 1];

    const canPair =
      next &&
      next.line === first.line &&
      !/[.,!?]$/.test(first.w) &&
      clean1.length <= 7 &&
      cleanToken(next.w).length <= 7 &&
      first.w.length + next.w.length <= 13 &&
      next.s - first.e < 0.25;

    const picked = canPair ? [first, next] : [first];
    const last = picked[picked.length - 1];
    const nextAfter = words[i + picked.length];

    const startFrame = Math.max(0, Math.round(first.s * fps));
    const maxHoldFrame =
      nextAfter && nextAfter.line === first.line
        ? Math.max(startFrame + 3, Math.round(nextAfter.s * fps))
        : Math.round((last.e + 0.22) * fps);
    const endFrame = Math.min(maxHoldFrame, Math.round((last.e + 0.14) * fps));

    chunks.push({
      tokens: picked.map((p) => {
        const c = cleanToken(p.w);
        return {
          text: p.w.toUpperCase(),
          highlight: EMPHASIS_WORDS.has(c),
        };
      }),
      startFrame,
      endFrame,
    });
    i += picked.length;
  }

  for (let k = 0; k < chunks.length - 1; k++) {
    if (chunks[k].endFrame > chunks[k + 1].startFrame) {
      chunks[k].endFrame = chunks[k + 1].startFrame;
    }
  }
  return chunks;
};

export const CaptionsOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chunks = useMemo(() => buildChunks(wordsData.words as WordEntry[], fps), [fps]);
  const active = chunks.find((c) => frame >= c.startFrame && frame < c.endFrame);
  if (!active) return null;

  const age = frame - active.startFrame;
  const popScale = interpolate(age, [0, 2.5, 5], [0.88, 1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 325,
        paddingLeft: 56,
        paddingRight: 56,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 78,
          lineHeight: 1.08,
          textAlign: "center",
          letterSpacing: "0.015em",
          transform: `scale(${popScale})`,
          transformOrigin: "center center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 18px",
        }}
      >
        {active.tokens.map((tok, idx) => (
          <span
            key={`${active.startFrame}_${idx}`}
            style={{
              color: tok.highlight ? "#FFE44D" : "#FFFFFF",
              WebkitTextStroke: "10px #151018",
              paintOrder: "stroke fill",
              textShadow: "0 7px 0 #151018, 0 12px 22px rgba(0,0,0,0.62)",
            }}
          >
            {tok.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
