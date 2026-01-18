"use client";

import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

/**
 * Reusable text-based Logo component
 * Premium wordmark style with subtle glow effect
 * Sharp on all resolutions (no raster images)
 */
export default function Logo({ className = "", size = "md", animate = true }: LogoProps) {
  // Size configurations
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl md:text-2xl",
  };

  const content = (
    <span
      className={`font-bold tracking-tight ${sizes[size]} ${className}`}
      style={{
        background: "linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #fff 100%)",
        backgroundSize: "200% 200%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "shimmer 3s ease-in-out infinite",
      }}
    >
      Inerci
    </span>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {/* Subtle pulsing glow behind text */}
        <motion.div
          className="absolute inset-0 blur-lg opacity-40 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {content}
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Subtle pulsing glow behind text */}
      <motion.div
        className="absolute inset-0 blur-lg opacity-40 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {content}
    </div>
  );
}

/**
 * SVG-based logo for maximum sharpness
 * Use this variant when you need pixel-perfect rendering
 */
export function LogoSVG({ className = "", size = "md" }: Omit<LogoProps, "animate">) {
  // Size configurations (width in pixels)
  const sizes = {
    sm: { width: 60, height: 20 },
    md: { width: 80, height: 26 },
    lg: { width: 120, height: 40 },
  };

  const { width, height } = sizes[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Inerci"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
        </linearGradient>
        <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor="rgba(150, 140, 255, 0.3)" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="0"
        y="20"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="22"
        fontWeight="700"
        fill="url(#logoGradient)"
        filter="url(#logoGlow)"
        letterSpacing="-0.02em"
      >
        Inerci
      </text>
    </svg>
  );
}
