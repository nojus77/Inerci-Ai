"use client";

/**
 * Hero KPI counter with animated count-up
 * - One-time RAF animation for count-up (stops when complete)
 * - IntersectionObserver to only start animation when visible
 * - Respects prefers-reduced-motion
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { heroKpi } from "@/content/copy.lt";

interface HeroKpiProps {
  hoursTotal?: number;
  eurPerHour?: number;
  initialDuration?: number;
  hoursDuration?: number;
  eurosDuration?: number;
}

// Format number with thin space as thousands separator
function formatNumber(num: number): string {
  return num.toLocaleString("lt-LT").replace(/\s/g, "\u2009");
}

// Easing function for smooth count-up
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Spark/bolt icon component with subtle pulse animation
function SparkIcon({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={animate ? {
        opacity: [0.6, 1, 0.6],
        filter: ["brightness(0.9)", "brightness(1.2)", "brightness(0.9)"],
      } : {}}
      transition={animate ? {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      } : {}}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </motion.svg>
  );
}

export default function HeroKpi({
  hoursTotal = 3461,
  eurPerHour = 10,
  initialDuration = 4,
  hoursDuration = 3,
  eurosDuration = 1.5,
}: HeroKpiProps) {
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const [showEuros, setShowEuros] = useState(false);
  const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasStartedAnimation, setHasStartedAnimation] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const eurosTotal = hoursTotal * eurPerHour;

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Mount detection for SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // IntersectionObserver to start animation only when visible (once)
  useEffect(() => {
    if (!mounted || hasStartedAnimation) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStartedAnimation) {
          setHasStartedAnimation(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [mounted, hasStartedAnimation]);

  // Initial count-up animation
  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / (initialDuration * 1000), 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(eased * hoursTotal);

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setInitialAnimationComplete(true);
      }
    },
    [hoursTotal, initialDuration]
  );

  useEffect(() => {
    if (!mounted || !hasStartedAnimation) return;

    if (prefersReducedMotion) {
      setDisplayValue(hoursTotal);
      setInitialAnimationComplete(true);
      return;
    }

    const timeout = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mounted, hasStartedAnimation, animate, prefersReducedMotion, hoursTotal]);

  // Alternate between hours and euros after initial animation
  // Hours show for hoursDuration, euros show for eurosDuration
  useEffect(() => {
    if (!initialAnimationComplete) return;

    const duration = showEuros ? eurosDuration : hoursDuration;
    const timeout = setTimeout(() => {
      setShowEuros((prev) => !prev);
    }, duration * 1000);

    return () => clearTimeout(timeout);
  }, [initialAnimationComplete, showEuros, hoursDuration, eurosDuration]);

  // Current display values
  const formattedValue = formatNumber(
    showEuros ? eurosTotal : (initialAnimationComplete ? hoursTotal : displayValue)
  );

  // Animation variants for value transition - smoother easing
  const valueVariants = {
    initial: {
      opacity: 0,
      y: 12,
      filter: "blur(4px)",
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      y: -12,
      filter: "blur(4px)",
    },
  };

  // Smoother spring-like transition
  const valueTransition = {
    duration: 0.5,
    ease: [0.25, 0.1, 0.25, 1] as const, // Smooth ease-in-out
  };

  // SSR placeholder
  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-3 md:flex-row md:gap-6 px-6 py-4">
        <span className="text-sm text-foreground/50">{heroKpi.sentence}</span>
        <span className="text-4xl font-bold text-foreground tabular-nums">
          {formatNumber(hoursTotal)} {heroKpi.hoursSuffix}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative group cursor-default"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        y: isHovered && !prefersReducedMotion ? -4 : 0,
      }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Outer glow on hover */}
      <motion.div
        className="absolute -inset-3 rounded-3xl blur-2xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(172, 156, 252, 0.2) 0%, transparent 70%)",
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Animated border sweep - rotating gradient */}
      <div
        className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none"
        style={{ padding: "1px" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, rgba(172, 156, 252, 0.5) 10%, transparent 20%, transparent 100%)",
          }}
          animate={{
            rotate: prefersReducedMotion ? 0 : 360,
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main card */}
      <div className="relative flex flex-col items-center gap-3 px-5 py-2.5 md:flex-row md:items-center md:gap-6 md:px-8 md:py-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_40px_rgba(0,0,0,0.15)]">
        {/* Inner glow (top edge) */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
          }}
        />

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          initial={false}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
            }}
            animate={{
              x: isHovered && !prefersReducedMotion ? ["0%", "200%"] : "0%",
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          />
        </motion.div>

        {/* Mobile: Value on top */}
        <div className="flex flex-col items-center gap-3 md:hidden">
          {/* Animated value - fixed width container to prevent layout shift */}
          <div className="relative flex items-center justify-center min-h-[36px] min-w-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={showEuros ? "euros" : "hours"}
                variants={prefersReducedMotion ? {} : valueVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={prefersReducedMotion ? { duration: 0 } : valueTransition}
                className="flex items-end justify-center gap-1.5"
              >
                <span
                  className="text-[26px] font-bold tracking-tight tabular-nums leading-none"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.75) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {showEuros ? heroKpi.euroPrefix : ""}{formattedValue}
                </span>
                <span className="text-xs font-medium text-foreground/50 pb-[1px]">
                  {showEuros ? heroKpi.euroSuffix : heroKpi.hoursSuffix}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sentence with icon */}
          <div className="flex items-center gap-2">
            {/* Icon with glow */}
            <div className="relative flex-shrink-0">
              <div
                className="absolute inset-0 rounded-full blur-md"
                style={{
                  background: "rgba(172, 156, 252, 0.4)",
                }}
              />
              <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
                <SparkIcon className="w-3.5 h-3.5 text-primary" animate={!prefersReducedMotion} />
              </div>
            </div>
            <p className="text-xs font-medium text-foreground/60 text-center leading-snug max-w-[220px]">
              {heroKpi.sentence}
            </p>
          </div>

        </div>

        {/* Desktop: Horizontal layout [Icon] [Sentence] [Value] */}
        <div className="hidden md:flex md:items-center md:gap-5">
          {/* Icon with glow */}
          <div className="relative flex-shrink-0">
            <motion.div
              className="absolute inset-0 rounded-full blur-lg"
              style={{
                background: "rgba(172, 156, 252, 0.35)",
              }}
              animate={{
                opacity: isHovered ? 0.6 : 0.35,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
            <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/25 flex items-center justify-center">
              <SparkIcon className="w-3.5 h-3.5 text-primary" animate={!prefersReducedMotion} />
            </div>
          </div>

          {/* Sentence */}
          <p className="text-xs lg:text-sm font-medium text-foreground/60 leading-snug whitespace-nowrap">
            {heroKpi.sentence}
          </p>

          {/* Divider */}
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/15 to-transparent flex-shrink-0" />

          {/* Value container - fixed width to prevent layout shift */}
          <div className="relative flex items-center justify-start min-w-[180px] lg:min-w-[200px] h-[32px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={showEuros ? "euros" : "hours"}
                variants={prefersReducedMotion ? {} : valueVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={prefersReducedMotion ? { duration: 0 } : valueTransition}
                className="flex items-end gap-1.5"
              >
                <span
                  className="text-[24px] lg:text-[28px] font-bold tracking-tight tabular-nums leading-none"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {showEuros ? heroKpi.euroPrefix : ""}{formattedValue}
                </span>
                <span className="text-xs lg:text-sm font-medium text-foreground/50 pb-0">
                  {showEuros ? heroKpi.euroSuffix : heroKpi.hoursSuffix}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Gradient border overlay */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(172, 156, 252, 0.15) 0%, transparent 40%, transparent 60%, rgba(172, 156, 252, 0.08) 100%)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
        />
      </div>
    </motion.div>
  );
}
