"use client";

import { useState } from "react";

type Props = {
  playerId: number;
  playerName: string;
  size?: "small" | "large";
};

export default function ProspectHeadshot({
  playerId,
  playerName,
  size = "small",
}: Props) {
  const [failed, setFailed] = useState(false);

  const isLarge = size === "large";

  const dimensions = isLarge
    ? "h-48 w-48"
    : "h-16 w-16";

  const imageWidth = isLarge ? 500 : 120;

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`No headshot available for ${playerName}`}
        className={`flex ${dimensions} shrink-0 items-center justify-center rounded-full border border-[#c5a253]/30 bg-[#142a47]`}
      >
        <span
          className={`font-black tracking-tight text-[#d5b66a] ${
            isLarge ? "text-4xl" : "text-sm"
          }`}
        >
          NYY
        </span>
      </div>
    );
  }

  return (
    <img
      src={`https://img.mlbstatic.com/mlb-photos/image/upload/w_${imageWidth},q_auto:best/v1/people/${playerId}/headshot/67/current`}
      alt={playerName}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${dimensions} shrink-0 rounded-full bg-[#142a47] object-cover`}
    />
  );
}
