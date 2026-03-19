interface Props {
  /**
   * Controls the visibility of the grain (0 to 1).
   * @default 0.2
   */
  intensity?: number;
}

export function GrainOverlay({ intensity = 0.2 }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 h-full w-full overflow-hidden"
      style={{ opacity: intensity }}
    >
      <svg className="h-full w-full">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

GrainOverlay.displayName = "GrainOverlay";
