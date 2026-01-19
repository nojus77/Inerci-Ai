"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollConnectorProps {
  isReversed?: boolean;
}

export default function ScrollConnector({ isReversed = false }: ScrollConnectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Animate the path drawing based on scroll
  const pathLength = useTransform(scrollYProgress, [0.2, 0.8], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.25, 0.7, 0.9], [0, 0.5, 0.5, 0]);

  // Smooth S-curve paths - one curves right-to-left, other left-to-right
  const path = isReversed
    ? "M 150 0 C 150 40, 50 60, 50 100" // S-curve from right to left
    : "M 50 0 C 50 40, 150 60, 150 100"; // S-curve from left to right

  return (
    <div
      ref={containerRef}
      className="relative w-full h-32 md:h-40 overflow-visible pointer-events-none"
    >
      <svg
        className="absolute left-1/2 -translate-x-1/2 w-[300px] h-full overflow-visible"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={`connectorGrad-${isReversed ? 'rev' : 'norm'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Main flowing line */}
        <motion.path
          d={path}
          stroke={`url(#connectorGrad-${isReversed ? 'rev' : 'norm'})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength,
            opacity,
          }}
        />

        {/* Subtle glow effect underneath */}
        <motion.path
          d={path}
          stroke="#8b5cf6"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          style={{
            pathLength,
            opacity: useTransform(opacity, (v) => v * 0.2),
            filter: "blur(6px)",
          }}
        />
      </svg>
    </div>
  );
}
