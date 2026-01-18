"use client";

import ParticlesBackground from "./ParticlesBackground";

// Debug mode: set to true to see canvas border and boosted opacity
const DEBUG_PARTICLES = process.env.NODE_ENV !== "production" && false;

/**
 * Global particles layer - mounted once in layout.tsx
 * Uses z-index: 1 to stay above body background but below content (z-index: 2)
 */
export default function GlobalParticles() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 1,
        // Debug: show border around container
        ...(DEBUG_PARTICLES
          ? {
              border: "4px solid red",
              background: "rgba(255,0,0,0.1)",
            }
          : {}),
      }}
      aria-hidden="true"
    >
      <ParticlesBackground
        particleCount={120}
        baseColor={[150, 140, 255]}
        minOpacity={0.2}
        debug={DEBUG_PARTICLES}
      />
    </div>
  );
}
