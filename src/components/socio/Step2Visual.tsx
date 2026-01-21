"use client";

import { useRef, useState, useEffect, useMemo, memo } from "react";
import { motion, useMotionValue, useTransform, useSpring, type MotionValue } from "framer-motion";

// Lerp helper
function lerp(start: number, end: number, p: number): number {
  return start + (end - start) * p;
}

// ============================================================================
// BEFORE CHAOS LAYER - INTENSE rapid-fire error explosion, crashes into transition
// Timeline: Rapid escalation over ~2.5s → CRITICAL at 2.8s → CRASH/FREEZE → Transition
// ============================================================================

// Seeded random number generator for deterministic randomness
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Problem labels pool - ALL get used rapidly
const PROBLEMS_ALL = [
  { label: "Nesinc.", icon: "🔗", size: "small" as const },
  { label: "Timeout", icon: "⌛", size: "small" as const },
  { label: "Laukia...", icon: "⏳", size: "small" as const },
  { label: "Įspėjimas", icon: "⚠", size: "small" as const },
  { label: "Dublikatai", icon: "📄", size: "medium" as const },
  { label: "Vėluoja ats.", icon: "⏰", size: "medium" as const },
  { label: "Neatsakyta", icon: "📭", size: "medium" as const },
  { label: "Sync fail", icon: "🔄", size: "medium" as const },
  { label: "Sinchronizuojama...", icon: "🔄", size: "medium" as const },
  { label: "Klaida!", icon: "❌", size: "large" as const },
  { label: "Nerastas", icon: "🔍", size: "large" as const },
  { label: "OFFLINE", icon: "⚡", size: "large" as const },
  { label: "Sąskaita ×2", icon: "📄", size: "large" as const },
  { label: "Dublikatai", icon: "⚠", size: "large" as const },
  { label: "KLAIDA", icon: "❌", size: "large" as const },
];

interface ChaosPopup {
  id: number;
  label: string;
  icon: string;
  size: "small" | "medium" | "large";
  type: "warning" | "danger";
  x: number;
  y: number;
  delay: number; // ms from start
  rotation: number;
  driftX: number;
  driftY: number;
}

// Generate INTENSE chaos - many more popups, faster timing, fills screen
// Mobile: minimal popups (3), super fast (~0.8s), then instant transition
function generateChaosPopups(seed: number, isMobile: boolean): ChaosPopup[] {
  const rng = seededRandom(seed);
  const popups: ChaosPopup[] = [];

  // Total popups: 20 on desktop, 3 on mobile (just enough to show chaos)
  // Mobile timeline: 0-0.8s (quick burst), Desktop: 0-2.5s
  const totalCount = isMobile ? 3 : 20;

  for (let i = 0; i < totalCount; i++) {
    const progress = i / totalCount; // 0 to 1
    const problem = PROBLEMS_ALL[Math.floor(rng() * PROBLEMS_ALL.length)];

    // Size escalates: early = small, middle = medium, late = large
    let size: "small" | "medium" | "large";
    if (progress < 0.3) size = "small";
    else if (progress < 0.6) size = rng() > 0.3 ? "medium" : "small";
    else if (progress < 0.85) size = rng() > 0.4 ? "large" : "medium";
    else size = "large";

    // Spread across MORE of the card (5-75% x, 15-85% y)
    // Avoid only the right panel area (>70% x in top half)
    let x = 5 + rng() * 70;
    let y = 15 + rng() * 70;

    // Keep some away from right panel in upper area
    if (x > 65 && y < 45) {
      x = 5 + rng() * 55;
    }

    // Timing: Mobile is MUCH faster (all errors in ~0.8s)
    // Desktop: slower buildup over 2.5s
    let baseDelay: number;
    if (isMobile) {
      // Mobile: quick succession, all errors within 0.8s
      baseDelay = progress * 800;
    } else {
      // Desktop: original timing - rapid-fire, accelerating
      baseDelay = progress < 0.5
        ? progress * 1600 // 0-800ms for first half
        : 800 + (progress - 0.5) * 2800; // 800-2200ms for second half
    }

    const jitter = isMobile ? (rng() - 0.5) * 100 : (rng() - 0.5) * 200;

    popups.push({
      id: i,
      label: problem.label,
      icon: problem.icon,
      size,
      type: progress > 0.4 || rng() > 0.6 ? "danger" : "warning",
      x,
      y,
      delay: Math.max(50, Math.floor(baseDelay + jitter)),
      rotation: (rng() - 0.5) * 12,
      driftX: (rng() - 0.5) * 30,
      driftY: (rng() - 0.5) * 25,
    });
  }

  return popups;
}

// Individual chaos popup chip with size variants
const ChaosChip = memo(function ChaosChip({ popup }: { popup: ChaosPopup }) {
  const sizeClasses = {
    small: "chaos-size-small",
    medium: "chaos-size-medium",
    large: "chaos-size-large",
  };

  const colors = popup.type === "danger"
    ? {
        bg: "rgba(239, 68, 68, 0.18)",
        border: "rgba(239, 68, 68, 0.6)",
        text: "#f87171",
        glow: "rgba(239, 68, 68, 0.5)",
      }
    : {
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.5)",
        text: "#fbbf24",
        glow: "rgba(245, 158, 11, 0.4)",
      };

  return (
    <div
      className={`chaos-chip ${sizeClasses[popup.size]}`}
      style={{
        position: "absolute",
        left: `${popup.x}%`,
        top: `${popup.y}%`,
        animationDelay: `${popup.delay}ms`,
        ["--rot" as string]: `${popup.rotation}deg`,
        ["--drift-x" as string]: `${popup.driftX}px`,
        ["--drift-y" as string]: `${popup.driftY}px`,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 ${popup.size === "large" ? "20px" : "12px"} ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        backdropFilter: "blur(4px)",
        zIndex: popup.size === "large" ? 18 : popup.size === "medium" ? 16 : 14,
      }}
    >
      <span className="chaos-icon">{popup.icon}</span>
      <span className="chaos-label" style={{ color: colors.text }}>{popup.label}</span>
    </div>
  );
});

// Final CRITICAL error that breaks the page + screen freeze/flash
function CriticalError() {
  return (
    <div className="critical-error-container">
      {/* Screen freeze flash - white flash then red */}
      <div className="screen-freeze-flash" />
      {/* The critical error badge */}
      <div className="critical-error">
        <span className="critical-icon">⚠</span>
        <span className="critical-label">Sistema užstrigo</span>
      </div>
      {/* Screen crack/glitch effect */}
      <div className="screen-crack" />
      {/* Red overlay that builds up */}
      <div className="crash-overlay" />
    </div>
  );
}

// Red vignette that intensifies FAST
function ChaosVignette() {
  return (
    <div className="chaos-vignette" />
  );
}

// Main chaos layer component
const BeforeChaosLayer = memo(function BeforeChaosLayer({
  isVisible,
  isInView
}: {
  isVisible: boolean;
  isInView: boolean;
}) {
  const [hasTriggered, setHasTriggered] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const seedRef = useRef(Date.now());

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const popups = useMemo(() => {
    return generateChaosPopups(seedRef.current, isMobile);
  }, [isMobile]);

  // Trigger when visible and in view - increment key to reset CSS animations
  useEffect(() => {
    if (isVisible && isInView && !hasTriggered) {
      setAnimationKey(prev => prev + 1);
      setHasTriggered(true);
    }
  }, [isVisible, isInView, hasTriggered]);

  // Reset triggered state when not visible (so it can re-trigger next cycle)
  useEffect(() => {
    if (!isVisible && hasTriggered) {
      const timeout = setTimeout(() => {
        setHasTriggered(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, hasTriggered]);

  // Also reset when leaving view entirely
  useEffect(() => {
    if (!isInView) {
      setHasTriggered(false);
    }
  }, [isInView]);

  if (!hasTriggered) return null;

  return (
    <div key={animationKey} className="absolute inset-0 pointer-events-none z-10 overflow-hidden chaos-container">
      {/* Vignette that intensifies */}
      <ChaosVignette />

      {/* Escalating popups */}
      {popups.map((popup) => (
        <ChaosChip key={popup.id} popup={popup} />
      ))}

      {/* Final CRITICAL error at 3.5s */}
      <CriticalError />

      {/* CSS for chaos animations */}
      <style jsx global>{`
        /* === CHAOS CONTAINER (for screen shake) === */
        .chaos-container {
          animation: none;
        }

        /* === CHAOS CHIP BASE === */
        .chaos-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          border-radius: 6px;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.5) rotate(var(--rot, 0deg));
          transform-origin: center center;
          will-change: transform, opacity;
          /* Pop in then drift continuously */
          animation:
            chaosPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
            chaosDrift 3s ease-in-out 0.6s infinite alternate;
        }

        /* === SIZE VARIANTS === */
        .chaos-size-small {
          padding: 3px 6px;
        }
        .chaos-size-small .chaos-icon { font-size: 8px; }
        .chaos-size-small .chaos-label { font-size: 7px; font-weight: 500; }

        .chaos-size-medium {
          padding: 5px 10px;
        }
        .chaos-size-medium .chaos-icon { font-size: 10px; }
        .chaos-size-medium .chaos-label { font-size: 9px; font-weight: 600; }

        .chaos-size-large {
          padding: 8px 14px;
        }
        .chaos-size-large .chaos-icon { font-size: 13px; }
        .chaos-size-large .chaos-label { font-size: 11px; font-weight: 700; }

        .chaos-label {
          white-space: nowrap;
        }

        /* === POP-IN ANIMATION (scale + shake) === */
        @keyframes chaosPopIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3) rotate(var(--rot, 0deg));
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2) rotate(calc(var(--rot, 0deg) + 4deg));
          }
          70% {
            transform: translate(-50%, -50%) scale(0.9) rotate(calc(var(--rot, 0deg) - 3deg));
          }
          85% {
            transform: translate(-50%, -50%) scale(1.05) rotate(calc(var(--rot, 0deg) + 1deg));
          }
          100% {
            opacity: 0.85;
            transform: translate(-50%, -50%) scale(1) rotate(var(--rot, 0deg));
          }
        }

        /* === DRIFT ANIMATION (continuous floating movement) === */
        @keyframes chaosDrift {
          0% {
            transform: translate(calc(-50% + 0px), calc(-50% + 0px)) scale(1) rotate(var(--rot, 0deg));
          }
          25% {
            transform: translate(calc(-50% + var(--drift-x, 5px)), calc(-50% + calc(var(--drift-y, 3px) * 0.5))) scale(1.02) rotate(calc(var(--rot, 0deg) + 1deg));
          }
          50% {
            transform: translate(calc(-50% + calc(var(--drift-x, 5px) * 0.7)), calc(-50% + var(--drift-y, 3px))) scale(0.98) rotate(calc(var(--rot, 0deg) - 0.5deg));
          }
          75% {
            transform: translate(calc(-50% + calc(var(--drift-x, 5px) * 0.3)), calc(-50% + calc(var(--drift-y, 3px) * 0.7))) scale(1.01) rotate(calc(var(--rot, 0deg) + 0.5deg));
          }
          100% {
            transform: translate(calc(-50% + 0px), calc(-50% + 0px)) scale(1) rotate(var(--rot, 0deg));
          }
        }

        /* === CRITICAL ERROR === */
        .critical-error-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 25;
        }

        /* Subtle dim flash - no harsh white */
        .screen-freeze-flash {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          opacity: 0;
          animation: screenFreezeFlash 0.5s ease-out 1800ms forwards;
          z-index: 35;
        }

        @keyframes screenFreezeFlash {
          0% { opacity: 0; }
          30% { opacity: 0.6; }
          100% { opacity: 0; }
        }

        /* Soft amber/orange overlay - not harsh red */
        .crash-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(251, 146, 60, 0.15) 0%, rgba(251, 146, 60, 0.35) 100%);
          opacity: 0;
          animation: crashOverlayBuild 0.8s ease-out 1900ms forwards;
          z-index: 22;
        }

        @keyframes crashOverlayBuild {
          0% { opacity: 0; }
          100% { opacity: 0.6; }
        }

        .critical-error {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scale(0.9);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(239, 68, 68, 0.3);
          opacity: 0;
          animation: criticalAppear 0.4s ease-out 1850ms forwards;
          z-index: 40;
        }

        .critical-icon {
          font-size: 18px;
        }

        .critical-label {
          font-size: 13px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        @keyframes criticalAppear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        /* Screen crack - just subtle lines, no shake */
        .screen-crack {
          position: absolute;
          inset: 0;
          opacity: 0;
          background: linear-gradient(
            135deg,
            transparent 40%,
            rgba(251, 146, 60, 0.08) 45%,
            transparent 50%,
            rgba(251, 146, 60, 0.06) 55%,
            transparent 60%
          );
          animation: screenCrackFade 0.6s ease-out 2100ms forwards;
          z-index: 20;
        }

        @keyframes screenCrackFade {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }

        /* Soft amber vignette - subtle, not aggressive */
        .chaos-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(ellipse at center, transparent 30%, rgba(251, 146, 60, 0.18) 100%);
          animation: vignetteIntensify 2.5s ease-out forwards;
          z-index: 5;
        }

        @keyframes vignetteIntensify {
          0% { opacity: 0; }
          50% { opacity: 0.5; }
          100% { opacity: 0.7; }
        }

        /* === MOBILE: Larger chips + FASTER timing === */
        @media (max-width: 767px) {
          .chaos-size-small {
            padding: 4px 8px;
          }
          .chaos-size-small .chaos-icon { font-size: 9px; }
          .chaos-size-small .chaos-label { font-size: 8px; }

          .chaos-size-medium {
            padding: 6px 12px;
          }
          .chaos-size-medium .chaos-icon { font-size: 11px; }
          .chaos-size-medium .chaos-label { font-size: 10px; }

          .chaos-size-large {
            padding: 10px 16px;
          }
          .chaos-size-large .chaos-icon { font-size: 14px; }
          .chaos-size-large .chaos-label { font-size: 12px; }

          /* MOBILE: Faster chaos popup animation */
          .chaos-chip {
            animation:
              chaosPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
              chaosDrift 2s ease-in-out 0.3s infinite alternate;
          }

          /* MOBILE: Vignette builds faster (0.9s instead of 2.5s) */
          .chaos-vignette {
            animation: vignetteIntensify 0.9s ease-out forwards;
          }

          /* MOBILE: Critical error appears at 0.9s (errors done at 0.8s) */
          .screen-freeze-flash {
            animation: screenFreezeFlash 0.3s ease-out 900ms forwards;
          }

          .crash-overlay {
            animation: crashOverlayBuild 0.4s ease-out 950ms forwards;
          }

          .critical-error {
            padding: 10px 16px;
            animation: criticalAppear 0.3s ease-out 950ms forwards;
          }
          .critical-icon {
            font-size: 16px;
          }
          .critical-label { font-size: 11px; }

          /* MOBILE: Subtle crack effect */
          .screen-crack {
            animation: screenCrackFade 0.4s ease-out 1100ms forwards;
          }
        }

        /* === REDUCED MOTION === */
        @media (prefers-reduced-motion: reduce) {
          .chaos-chip,
          .chaos-vignette,
          .critical-error,
          .screen-crack,
          .screen-freeze-flash,
          .crash-overlay {
            animation: none !important;
            opacity: 0 !important;
          }
        }
      `}</style>
    </div>
  );
});
// ============================================================================

// Alert row item for the alert stack
function AlertRow({ icon, text, color }: { icon: string; text: string; color: "red" | "orange" }) {
  const colors = {
    red: {
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.35)",
      text: "#f87171",
      dot: "#ef4444",
    },
    orange: {
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.35)",
      text: "#fbbf24",
      dot: "#f59e0b",
    },
  };
  const c = colors[color];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <span className="text-[9px]">{icon}</span>
      <span className="text-[8px] font-semibold" style={{ color: c.text }}>{text}</span>
    </div>
  );
}

// Before state: Chaotic scattered widgets with clear problems
function BeforeState({ opacity }: { opacity: number }) {
  if (opacity < 0.01) return null;

  return (
    <div
      className="absolute inset-0 p-3 pointer-events-none"
      style={{ opacity }}
    >
      <div className="relative h-full">
        {/* ========== TOP-LEFT: Broken KPIs strip (ENLARGED) ========== */}
        <div
          className="absolute top-10 left-2 flex gap-2"
          style={{ transform: "rotate(-1deg)" }}
        >
          {/* KPI 1 */}
          <div
            className="px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[9px] text-white/60 font-medium">Atsakymų</span>
            </div>
            <span className="text-[16px] font-bold text-red-400">12%</span>
          </div>
          {/* KPI 2 */}
          <div
            className="px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-[9px] text-white/60 font-medium">Vėluoja</span>
            </div>
            <span className="text-[16px] font-bold text-orange-400">14</span>
          </div>
          {/* KPI 3 */}
          <div
            className="px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[9px] text-white/60 font-medium">Dublikatų</span>
            </div>
            <span className="text-[16px] font-bold text-red-400">27</span>
          </div>
        </div>

        {/* ========== TOP-RIGHT: Alert stack ========== */}
        <div
          className="absolute top-10 right-2 w-[130px] rounded-xl overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="px-2 py-1 border-b border-white/10 flex items-center justify-between">
            <span className="text-[7px] text-white/40 font-semibold uppercase tracking-wide">Problemos</span>
            <span className="text-[7px] text-red-400 font-bold">4</span>
          </div>
          <div className="p-1.5 space-y-1">
            <AlertRow icon="⚠" text="Dublikatų sąskaitos" color="red" />
            <AlertRow icon="⏰" text="Vėluojantys atsisk." color="orange" />
            <AlertRow icon="📭" text="Neatsakyti klientai" color="red" />
            <AlertRow icon="🔗" text="Kalendorius nesinc." color="orange" />
          </div>
        </div>

        {/* ========== DISCONNECTED TOOLS (floating tiles) ========== */}
        {/* Invoices tile */}
        <div
          className="absolute top-[95px] left-3 w-[70px] p-1.5 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.15)",
            transform: "rotate(-3deg)",
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[9px]">📄</span>
            <span className="text-[8px] text-white/50 font-medium">Sąskaitos</span>
          </div>
          <div className="text-[7px] text-orange-400/80">12 laukia</div>
        </div>

        {/* Calendar tile */}
        <div
          className="absolute top-[130px] left-[85px] w-[65px] p-1.5 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px dashed rgba(255,255,255,0.12)",
            transform: "rotate(2deg)",
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[9px]">📅</span>
            <span className="text-[8px] text-white/50 font-medium">Kalendorius</span>
          </div>
          <div className="text-[7px] text-red-400/80">Nesinc.</div>
        </div>

        {/* CRM tile */}
        <div
          className="absolute top-[105px] right-[140px] w-[55px] p-1.5 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)",
            transform: "rotate(-1.5deg)",
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[9px]">👥</span>
            <span className="text-[8px] text-white/50 font-medium">CRM</span>
          </div>
          <div className="text-[7px] text-white/30">Atsk.</div>
        </div>

        {/* ========== BROKEN CONNECTOR LINES (SVG) ========== */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {/* Dashed line from Invoices toward center - broken */}
          <path
            d="M 75 115 Q 100 130, 110 145"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Dashed line from Calendar toward center - broken */}
          <path
            d="M 120 155 Q 140 165, 145 175"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Gap indicators (small X marks) */}
          <text x="108" y="148" fill="rgba(239, 68, 68, 0.6)" fontSize="8" fontWeight="bold">✕</text>
          <text x="143" y="178" fill="rgba(239, 68, 68, 0.6)" fontSize="8" fontWeight="bold">✕</text>
        </svg>

        {/* ========== MANUAL WORK CALLOUT (bottom-right) ========== */}
        <div
          className="absolute bottom-[55px] right-3 px-2.5 py-1.5 rounded-lg"
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            transform: "rotate(1deg)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">✋</span>
            <span className="text-[9px] font-bold text-orange-400">Rankiniai sekimai</span>
          </div>
          <div className="text-[7px] text-orange-300/60 mt-0.5">Daug laiko suvalgo</div>
        </div>

        {/* ========== BROKEN CHART with "Nėra aiškumo" (ENLARGED) ========== */}
        <div
          className="absolute bottom-3 left-3 w-[180px] h-[70px] rounded-xl p-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/40 font-medium">Efektyvumas</span>
            <span className="text-[8px] text-red-400/80 font-semibold">Nėra aiškumo</span>
          </div>
          <svg viewBox="0 0 100 28" className="w-full h-[32px]">
            {/* Noisy flat line - chaotic chart */}
            <path
              d="M 0 16 L 8 18 L 16 14 L 24 20 L 32 12 L 40 17 L 48 13 L 56 19 L 64 15 L 72 18 L 80 14 L 88 20 L 100 16"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
            {/* Question mark */}
            <text x="85" y="10" fill="rgba(255,255,255,0.25)" fontSize="12" fontWeight="bold">?</text>
          </svg>
        </div>

        {/* ========== STATUS: OFFLINE + Sync error ========== */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {/* Sync error */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[7px] text-red-400 font-medium">Sync: klaida</span>
          </div>
          {/* OFFLINE badge */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{
              background: "rgba(100,100,100,0.25)",
              border: "1px solid rgba(100,100,100,0.4)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span className="text-[8px] text-gray-400 font-semibold">OFFLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// After state: Premium unified dashboard - Clean, readable, instantly understandable
function AfterState({ opacity, progress }: { opacity: number; progress: number }) {
  if (opacity < 0.01) return null;

  // Animated KPI values - big, meaningful numbers
  const savedEuros = Math.round(lerp(0, 2847, progress));
  const savedHours = lerp(0, 47.2, progress).toFixed(1);
  const automations = Math.round(lerp(0, 5, progress));

  // Active automations data - real, specific names with status
  const activeAutomations = [
    { name: "Email → CRM", status: "live", saved: "+18h/sav.", lastRun: "prieš 2 min" },
    { name: "Sąskaitos sync", status: "live", saved: "+12h/sav.", lastRun: "prieš 8 min" },
    { name: "Follow-up priminimai", status: "live", saved: "+9h/sav.", lastRun: "prieš 15 min" },
    { name: "Ataskaitų generavimas", status: "warning", saved: "+5h/sav.", lastRun: "prieš 1 val." },
    { name: "Užduočių priskyrimas", status: "live", saved: "+3h/sav.", lastRun: "prieš 22 min" },
  ];

  // What's been fixed - solution view with green savings
  const fixedIssues = [
    { label: "Rankinis suvedimas", saved: "+6.1h/sav.", pct: 85 },
    { label: "Dublikatų tvarkymas", saved: "+3.8h/sav.", pct: 72 },
    { label: "Follow-up vėlavimai", saved: "+2.9h/sav.", pct: 68 },
    { label: "Sąskaitų klaidos", saved: "+1.7h/sav.", pct: 91 },
  ];

  return (
    <div
      className="absolute inset-0 p-2 pt-8 pointer-events-none po-dashboard"
      style={{ opacity }}
    >
      {/* ══════════════════════════════════════════════════════════════
         TOP: 3 KPIs in grid - no overlap
         ══════════════════════════════════════════════════════════════ */}
      <div className="po-kpi-grid">
        <div className="po-kpi-card">
          <div className="po-kpi-label">Sutaupyta €</div>
          <div className="po-kpi-value po-kpi-green">€{savedEuros.toLocaleString()}</div>
          <div className="po-kpi-delta po-delta-up">+23% 7d</div>
        </div>
        <div className="po-kpi-card">
          <div className="po-kpi-label">Sutaupyta val.</div>
          <div className="po-kpi-value po-kpi-purple">{savedHours}h</div>
          <div className="po-kpi-delta po-delta-up">+12% 7d</div>
        </div>
        <div className="po-kpi-card">
          <div className="po-kpi-label">Automatizacijos</div>
          <div className="po-kpi-value po-kpi-cyan">{automations}</div>
          <div className="po-kpi-status">
            <span className="po-status-pill po-status-ok">OK</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         CHART: Fixed height block with header
         ══════════════════════════════════════════════════════════════ */}
      <div className="po-chart-card">
        <div className="po-chart-header">
          <span className="po-chart-title">Sutaupymai (7 d.)</span>
          <div className="po-chart-toggle">
            <span className="po-toggle-active">€</span>
            <span className="po-toggle-divider">|</span>
            <span className="po-toggle-inactive">Val.</span>
          </div>
        </div>
        <div className="po-chart-container">
          <svg viewBox="0 0 200 48" className="w-full h-[42px]" preserveAspectRatio="none">
            <defs>
              <linearGradient id="poChartGradNew" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(52, 211, 153, 0.20)" />
                <stop offset="100%" stopColor="rgba(52, 211, 153, 0)" />
              </linearGradient>
            </defs>
            {/* Faint horizontal grid lines */}
            <line x1="0" y1="10" x2="200" y2="10" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            {/* Area fill with fluctuations */}
            <path
              d="M 0 34 L 14 33 L 28 30 L 42 31 L 57 27 L 71 25 L 85 22 L 100 20 L 114 16 L 128 14 L 142 11 L 157 10 L 171 8 L 185 7 L 200 6 L 200 40 L 0 40 Z"
              fill="url(#poChartGradNew)"
            />
            {/* Chart line with small fluctuations */}
            <path
              d="M 0 34 L 14 33 L 28 30 L 42 31 L 57 27 L 71 25 L 85 22 L 100 20 L 114 16 L 128 14 L 142 11 L 157 10 L 171 8 L 185 7 L 200 6"
              fill="none"
              stroke="#34d399"
              strokeWidth="1.5"
              className="po-chart-line"
            />
            {/* Event markers at day 2, 4, 5, 7 */}
            <circle cx="28" cy="30" r="2" fill="#34d399" className="po-chart-marker" style={{ animationDelay: '0.2s' }} />
            <circle cx="85" cy="22" r="2" fill="#34d399" className="po-chart-marker" style={{ animationDelay: '0.5s' }} />
            <circle cx="114" cy="16" r="2" fill="#34d399" className="po-chart-marker" style={{ animationDelay: '0.7s' }} />
            <circle cx="200" cy="6" r="2" fill="#34d399" className="po-chart-marker" style={{ animationDelay: '1s' }} />
            {/* X-axis day labels */}
            <text x="14" y="47" className="po-chart-xaxis">Pr</text>
            <text x="42" y="47" className="po-chart-xaxis">An</text>
            <text x="71" y="47" className="po-chart-xaxis">Tr</text>
            <text x="100" y="47" className="po-chart-xaxis">Kt</text>
            <text x="128" y="47" className="po-chart-xaxis">Pn</text>
            <text x="157" y="47" className="po-chart-xaxis">Št</text>
            <text x="185" y="47" className="po-chart-xaxis">Sk</text>
          </svg>
          {/* Event annotations - positioned to avoid overlap */}
          <div className="po-chart-annotation po-anno-1">
            <span>Sąskaitos sync</span>
          </div>
          <div className="po-chart-annotation po-anno-2">
            <span>Follow-up</span>
          </div>
          <div className="po-chart-annotation po-anno-3">
            <span>Kalendorius</span>
          </div>
          <div className="po-chart-annotation po-anno-4">
            <span>Email → CRM</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         BOTTOM: 2-column grid for panels
         ══════════════════════════════════════════════════════════════ */}
      <div className="po-bottom-grid">
        {/* Left: Aktyvios automatizacijos */}
        <div className="po-panel">
          <div className="po-panel-header">
            <span className="po-panel-title">Automatizacijos</span>
            <span className="po-panel-live">
              <span className="po-live-dot" />
              LIVE
            </span>
          </div>
          <div className="po-auto-list">
            {activeAutomations.slice(0, 3).map((item, i) => (
              <div key={i} className="po-auto-row" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="po-auto-left">
                  <span className={`po-auto-dot ${item.status === 'live' ? 'po-dot-live' : 'po-dot-warn'}`} />
                  <span className="po-auto-name">{item.name}</span>
                </div>
                <div className="po-auto-right">
                  <span className="po-auto-saved">{item.saved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Kas sutvarkyta */}
        <div className="po-panel">
          <div className="po-panel-header">
            <span className="po-panel-title">Sutvarkyta</span>
          </div>
          <div className="po-fixed-list">
            {fixedIssues.slice(0, 3).map((item, i) => (
              <div key={i} className="po-fixed-row" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="po-fixed-top">
                  <span className="po-fixed-label">{item.label}</span>
                  <span className="po-fixed-saved">{item.saved}</span>
                </div>
                <div className="po-fixed-bar">
                  <div className="po-fixed-fill" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// Transition elements (warnings becoming checks, etc.)
function TransitionElements({ progress }: { progress: number }) {
  // Warnings fade out from 0.15 to 0.4
  const warningOpacity = Math.max(0, Math.min(1, (0.4 - progress) / 0.25));
  // Checks fade in from 0.35 to 0.6, then fade out QUICKLY from 0.7 to 0.78 (before PO appears at 0.91)
  const checkFadeIn = Math.max(0, Math.min(1, (progress - 0.35) / 0.25));
  const checkFadeOut = Math.max(0, Math.min(1, (0.78 - progress) / 0.08));
  const checkOpacity = Math.min(checkFadeIn, checkFadeOut);

  if (progress < 0.15 || progress > 0.78) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Fading warning: Syncing in progress */}
      {warningOpacity > 0.01 && (
        <div
          className="absolute top-[45%] left-[15%] px-2.5 py-1.5 rounded-lg"
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            opacity: warningOpacity,
            transform: `scale(${0.85 + warningOpacity * 0.15})`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">⏳</span>
            <span className="text-[9px] font-semibold text-orange-400">Sinchronizuojama...</span>
          </div>
        </div>
      )}

      {/* Fading warning: Processing */}
      {warningOpacity > 0.01 && (
        <div
          className="absolute top-[60%] left-[25%] px-2 py-1 rounded-lg"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            opacity: warningOpacity * 0.8,
            transform: `scale(${0.85 + warningOpacity * 0.15})`,
          }}
        >
          <span className="text-[8px] font-medium text-red-400">⚠ Tikrinamos problemos...</span>
        </div>
      )}

      {/* Appearing checks - staggered */}
      {checkOpacity > 0.01 && (
        <>
          {/* Check 1 */}
          <div
            className="absolute top-[38%] left-[18%] px-2.5 py-1.5 rounded-lg"
            style={{
              background: "rgba(52, 211, 153, 0.12)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              opacity: checkOpacity,
              transform: `scale(${0.85 + checkOpacity * 0.15})`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">✓</span>
              <span className="text-[9px] font-semibold text-emerald-400">Sąskaitos sujungtos</span>
            </div>
          </div>

          {/* Check 2 - slightly delayed appearance */}
          {progress > 0.45 && (
            <div
              className="absolute top-[52%] left-[22%] px-2 py-1 rounded-lg"
              style={{
                background: "rgba(52, 211, 153, 0.1)",
                border: "1px solid rgba(52, 211, 153, 0.25)",
                opacity: Math.min(checkOpacity, (progress - 0.45) * 5),
                transform: `scale(${0.85 + checkOpacity * 0.15})`,
              }}
            >
              <span className="text-[8px] font-medium text-emerald-400">✓ Kalendorius sinc.</span>
            </div>
          )}

          {/* Check 3 - more delayed */}
          {progress > 0.55 && (
            <div
              className="absolute top-[65%] left-[15%] px-2 py-1 rounded-lg"
              style={{
                background: "rgba(52, 211, 153, 0.1)",
                border: "1px solid rgba(52, 211, 153, 0.25)",
                opacity: Math.min(checkOpacity, (progress - 0.55) * 5),
                transform: `scale(${0.85 + checkOpacity * 0.15})`,
              }}
            >
              <span className="text-[8px] font-medium text-emerald-400">✓ CRM aktyvus</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Energy Connection Effect - particles flowing from holo card to PO dashboard
// Creates visual continuity between the robot animation and the dashboard reveal
function EnergyConnection({ progress }: { progress: number }) {
  // Only show during the transition window (0.70-0.92)
  if (progress < 0.70 || progress > 0.92) return null;

  // Fade in from 0.70-0.74, full from 0.74-0.86, fade out 0.86-0.92
  let opacity = 1;
  if (progress < 0.74) {
    opacity = (progress - 0.70) / 0.04;
  } else if (progress > 0.86) {
    opacity = (0.92 - progress) / 0.06;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-25 overflow-hidden"
      style={{ opacity }}
    >
      {/* Energy beam from bottom-right (holo card area) spreading across */}
      <div className="energy-beam-container">
        <div className="energy-beam energy-beam-1" />
        <div className="energy-beam energy-beam-2" />
        <div className="energy-beam energy-beam-3" />
      </div>

      {/* Floating energy particles */}
      <div className="energy-particle ep-1" />
      <div className="energy-particle ep-2" />
      <div className="energy-particle ep-3" />
      <div className="energy-particle ep-4" />
      <div className="energy-particle ep-5" />
      <div className="energy-particle ep-6" />
      <div className="energy-particle ep-7" />
      <div className="energy-particle ep-8" />

      {/* Central activation pulse */}
      <div className="energy-pulse-ring" />

      {/* Data stream lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dataStreamGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(52, 211, 153, 0.8)" />
            <stop offset="50%" stopColor="rgba(167, 139, 250, 0.6)" />
            <stop offset="100%" stopColor="rgba(52, 211, 153, 0)" />
          </linearGradient>
        </defs>
        <path
          className="data-stream-path ds-1"
          d="M 380 280 Q 300 200, 200 150 T 20 50"
          fill="none"
          stroke="url(#dataStreamGrad)"
          strokeWidth="2"
        />
        <path
          className="data-stream-path ds-2"
          d="M 380 260 Q 280 180, 180 130 T 40 30"
          fill="none"
          stroke="url(#dataStreamGrad)"
          strokeWidth="1.5"
        />
        <path
          className="data-stream-path ds-3"
          d="M 360 280 Q 260 220, 160 170 T 30 80"
          fill="none"
          stroke="url(#dataStreamGrad)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

// Helper: Calculate overlay opacity based on progress (piecewise linear)
// Robots appear INSTANTLY at 0.20 - same moment BEFORE state disappears (no overlap/duplicates)
function getOverlayOpacity(progress: number): number {
  if (progress < 0.20 || progress > 0.84) return 0;
  if (progress < 0.21) return 1; // instant appear at 0.20
  if (progress < 0.8325) return 1; // fully visible
  return (0.84 - progress) / 0.0075; // ultra-fast fade out
}

// Bomb explosion transition - chaotic particle explosion
// Matches the bomb emoji from "SISTEMA UŽSTRIGO" critical error
function GlassShatterTransition({ progress }: { progress: MotionValue<number> }) {
  const [isActive, setIsActive] = useState(false);
  const [explosionKey, setExplosionKey] = useState(0);

  // Generate particles - must be called before any conditional returns (React hooks rule)
  const particles = useMemo(() => {
    const seed = explosionKey * 12345;
    const rng = seededRandom(seed);
    const result: Array<{
      id: number;
      endX: number;
      endY: number;
      size: number;
      delay: number;
      rot: number;
      duration: number;
      type: 'spark' | 'chunk' | 'ember';
    }> = [];

    // 60 fast sparks - tiny, chaotic (2x slower)
    for (let i = 0; i < 60; i++) {
      const angle = rng() * 360;
      const dist = 80 + rng() * 180; // 80-260%
      const rad = (angle * Math.PI) / 180;
      result.push({
        id: i,
        endX: Math.cos(rad) * dist,
        endY: Math.sin(rad) * dist,
        size: 2 + rng() * 4, // 2-6px tiny sparks
        delay: rng() * 80, // 0-80ms
        rot: (rng() - 0.5) * 2000, // wild rotation
        duration: 520 + rng() * 520, // 520-1040ms
        type: 'spark',
      });
    }

    // 25 medium chunks - bigger pieces flying out (2x slower)
    for (let i = 0; i < 25; i++) {
      const angle = rng() * 360;
      const dist = 60 + rng() * 140; // 60-200%
      const rad = (angle * Math.PI) / 180;
      result.push({
        id: 60 + i,
        endX: Math.cos(rad) * dist,
        endY: Math.sin(rad) * dist,
        size: 8 + rng() * 14, // 8-22px
        delay: rng() * 130, // 0-130ms
        rot: (rng() - 0.5) * 1200,
        duration: 780 + rng() * 520, // 780-1300ms
        type: 'chunk',
      });
    }

    // 40 embers - orange/red glowing particles that float up (2x slower)
    for (let i = 0; i < 40; i++) {
      const angle = rng() * 360;
      const dist = 40 + rng() * 120; // 40-160%
      const rad = (angle * Math.PI) / 180;
      result.push({
        id: 85 + i,
        endX: Math.cos(rad) * dist * 0.7, // less horizontal spread
        endY: Math.sin(rad) * dist - 60 - rng() * 80, // bias upward
        size: 3 + rng() * 5, // 3-8px
        delay: 52 + rng() * 208, // 52-260ms slight delay
        rot: (rng() - 0.5) * 400,
        duration: 1040 + rng() * 1040, // 1040-2080ms slower float
        type: 'ember',
      });
    }

    return result;
  }, [explosionKey]);

  useEffect(() => {
    const unsubscribe = progress.on("change", (value) => {
      if (value < 0.28) {
        if (isActive) setIsActive(false);
      } else if (value < 0.45) {
        // Active during explosion (0.28-0.45)
        if (!isActive) {
          setExplosionKey(prev => prev + 1);
          setIsActive(true);
        }
      } else {
        if (isActive) setIsActive(false);
      }
    });
    return unsubscribe;
  }, [progress, isActive]);

  // Conditional return AFTER all hooks
  if (!isActive) return null;

  return (
    <div key={explosionKey} className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
      {/* INERCI logo - the source of the explosion */}
      <div className="inerci-logo">
        <span className="inerci-text">INERCI</span>
      </div>

      {/* INERCI logo that flies to header badge after explosion */}
      <div className="inerci-flying">
        <span className="inerci-flying-text">INERCI</span>
      </div>

      {/* Initial bright flash - faster */}
      <div className="explosion-flash" />

      {/* Fireball core - faster expand */}
      <div className="fireball" />

      {/* Shockwave rings - faster */}
      <div className="shockwave shockwave-1" />
      <div className="shockwave shockwave-2" />

      {/* LOTS of chaotic particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle particle-${p.type}`}
          style={{
            ['--end-x' as string]: `${p.endX}%`,
            ['--end-y' as string]: `${p.endY}%`,
            ['--size' as string]: `${p.size}px`,
            ['--delay' as string]: `${p.delay}ms`,
            ['--rot' as string]: `${p.rot}deg`,
            ['--duration' as string]: `${p.duration}ms`,
          }}
        />
      ))}

      {/* Quick smoke puffs */}
      <div className="smoke smoke-1" />
      <div className="smoke smoke-3" />

      {/* Ember particles */}
      <div className="embers" />

      {/* Screen shake overlay */}
      <div className="screen-shake" />

      <style jsx>{`
        /* INERCI logo - appears in center and triggers explosion (2x slower) */
        .inerci-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 60;
          opacity: 0;
          animation: inerciAppear 1.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .inerci-text {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 3px;
          color: white;
          text-shadow:
            0 0 20px rgba(124, 58, 237, 1),
            0 0 40px rgba(124, 58, 237, 0.8),
            0 0 60px rgba(124, 58, 237, 0.6),
            0 0 80px rgba(124, 58, 237, 0.4);
          background: linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 15px rgba(124, 58, 237, 0.9));
        }

        @keyframes inerciAppear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
            filter: brightness(3);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.3);
            filter: brightness(2);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            filter: brightness(1.5);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
            filter: brightness(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
            filter: brightness(0.5);
          }
        }

        /* INERCI flying to headline - starts after explosion peak */
        /* Faster animation: 0.7s instead of 1.4s */
        .inerci-flying {
          position: absolute;
          z-index: 65;
          opacity: 0;
          top: 50%;
          left: 50%;
          animation: inerciFlyToHeadline 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.2s;
        }

        .inerci-flying-text {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: white;
          text-shadow:
            0 0 20px rgba(124, 58, 237, 1),
            0 0 40px rgba(124, 58, 237, 0.8);
          background: linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #22d3ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 15px rgba(124, 58, 237, 0.9));
          white-space: nowrap;
        }

        /* Headline INERCI text - hidden, instantly appears when flying lands */
        /* Flying: 0.7s + 0.2s delay = 0.9s total, reveal at 0.75s (when at 80%) */
        .inerci-headline-target {
          opacity: 0;
          animation: inerciHeadlineReveal 0.15s ease-out forwards;
          animation-delay: 0.75s;
          filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.5));
        }

        @keyframes inerciHeadlineReveal {
          0% {
            opacity: 0;
            transform: scale(1.05);
            filter: brightness(1.3) drop-shadow(0 0 15px rgba(167, 139, 250, 0.8));
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 10px rgba(167, 139, 250, 0.5));
          }
        }

        @keyframes inerciFlyToHeadline {
          0% {
            opacity: 0;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(1.8);
            filter: brightness(2);
          }
          20% {
            opacity: 1;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(1.3);
            filter: brightness(1.5);
          }
          80% {
            opacity: 1;
            /* Land exactly at headline INERCI position */
            top: 68%;
            left: 36%;
            transform: translate(-50%, -50%) scale(1);
            filter: brightness(1.2);
          }
          100% {
            opacity: 0;
            /* Fade out at exact position */
            top: 68%;
            left: 36%;
            transform: translate(-50%, -50%) scale(1);
            filter: brightness(1);
          }
        }

        /* Initial bright white/orange flash - FAST */
        .explosion-flash {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 220, 150, 0.98) 10%,
            rgba(255, 150, 50, 0.9) 25%,
            rgba(255, 80, 0, 0.6) 45%,
            transparent 65%
          );
          opacity: 0;
          z-index: 50;
          animation: flashBoom 0.26s ease-out forwards;
        }

        @keyframes flashBoom {
          0% { opacity: 0; transform: scale(0.5); }
          30% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(2.5); }
        }

        /* Fireball expanding from center - FASTER */
        .fireball {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 60px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 220, 1) 0%,
            rgba(255, 200, 50, 0.95) 15%,
            rgba(255, 120, 0, 0.85) 35%,
            rgba(255, 50, 0, 0.6) 55%,
            rgba(180, 30, 0, 0.3) 75%,
            transparent 100%
          );
          opacity: 0;
          z-index: 48;
          animation: fireballExpand 0.91s ease-out forwards;
        }

        @keyframes fireballExpand {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
            filter: brightness(2.5);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(2.5);
            filter: brightness(1.8);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(4);
            filter: brightness(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(6);
            filter: brightness(0.6);
          }
        }

        /* Shockwave rings - FASTER */
        .shockwave {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 2px solid rgba(255, 180, 80, 0.9);
          box-shadow:
            0 0 15px rgba(255, 120, 0, 0.7),
            inset 0 0 15px rgba(255, 200, 100, 0.4);
          opacity: 0;
          z-index: 46;
        }

        .shockwave-1 {
          width: 30px;
          height: 30px;
          animation: shockwaveExpand 1.04s ease-out forwards;
        }

        .shockwave-2 {
          width: 20px;
          height: 20px;
          animation: shockwaveExpand 1.04s ease-out 0.13s forwards;
        }

        @keyframes shockwaveExpand {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
            border-width: 3px;
          }
          15% {
            opacity: 1;
            border-width: 2px;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(15);
            border-width: 0.5px;
          }
        }

        /* === PARTICLE BASE === */
        .particle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: var(--size);
          height: var(--size);
          border-radius: 1px;
          opacity: 0;
          z-index: 44;
          will-change: transform, opacity;
        }

        /* SPARKS - tiny bright yellow/white, SUPER FAST */
        .particle-spark {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 200, 1) 0%,
            rgba(255, 220, 100, 0.95) 40%,
            rgba(255, 180, 50, 0.9) 100%
          );
          border-radius: 50%;
          box-shadow:
            0 0 6px rgba(255, 200, 50, 1),
            0 0 12px rgba(255, 150, 0, 0.8);
          animation: sparkFly var(--duration) cubic-bezier(0.15, 0.8, 0.3, 1) var(--delay) forwards;
        }

        @keyframes sparkFly {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          8% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(calc(var(--rot) * 0.05)) scale(1.5);
          }
          25% {
            opacity: 1;
            transform:
              translate(
                calc(-50% + var(--end-x) * 0.4),
                calc(-50% + var(--end-y) * 0.4)
              )
              rotate(calc(var(--rot) * 0.25))
              scale(1);
          }
          100% {
            opacity: 0;
            transform:
              translate(
                calc(-50% + var(--end-x)),
                calc(-50% + var(--end-y))
              )
              rotate(var(--rot))
              scale(0.1);
          }
        }

        /* CHUNKS - bigger orange/red pieces */
        .particle-chunk {
          background: linear-gradient(
            135deg,
            rgba(255, 120, 50, 0.95) 0%,
            rgba(220, 60, 20, 0.9) 50%,
            rgba(150, 40, 10, 0.95) 100%
          );
          border-radius: 2px;
          box-shadow:
            0 0 8px rgba(255, 100, 0, 0.9),
            0 0 16px rgba(255, 50, 0, 0.5);
          animation: chunkFly var(--duration) cubic-bezier(0.2, 0.8, 0.35, 1) var(--delay) forwards;
        }

        @keyframes chunkFly {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(0deg) scale(0.3);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(calc(var(--rot) * 0.08)) scale(1.3);
          }
          35% {
            opacity: 1;
            transform:
              translate(
                calc(-50% + var(--end-x) * 0.35),
                calc(-50% + var(--end-y) * 0.35)
              )
              rotate(calc(var(--rot) * 0.35))
              scale(1);
          }
          100% {
            opacity: 0;
            transform:
              translate(
                calc(-50% + var(--end-x)),
                calc(-50% + var(--end-y))
              )
              rotate(var(--rot))
              scale(0.2);
          }
        }

        /* EMBERS - glowing particles that float upward */
        .particle-ember {
          background: radial-gradient(
            circle,
            rgba(255, 200, 100, 1) 0%,
            rgba(255, 120, 0, 0.9) 50%,
            rgba(200, 50, 0, 0.7) 100%
          );
          border-radius: 50%;
          box-shadow:
            0 0 5px rgba(255, 150, 50, 1),
            0 0 10px rgba(255, 100, 0, 0.6);
          animation: emberFloat var(--duration) cubic-bezier(0.25, 0.6, 0.4, 1) var(--delay) forwards;
        }

        @keyframes emberFloat {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(calc(var(--rot) * 0.1)) scale(1.2);
          }
          40% {
            opacity: 0.9;
            transform:
              translate(
                calc(-50% + var(--end-x) * 0.3),
                calc(-50% + var(--end-y) * 0.3)
              )
              rotate(calc(var(--rot) * 0.4))
              scale(1);
          }
          100% {
            opacity: 0;
            transform:
              translate(
                calc(-50% + var(--end-x)),
                calc(-50% + var(--end-y))
              )
              rotate(var(--rot))
              scale(0.3);
          }
        }

        /* Quick smoke puffs */
        .smoke {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(60, 50, 45, 0.5) 0%,
            rgba(50, 45, 40, 0.3) 50%,
            transparent 100%
          );
          opacity: 0;
          z-index: 43;
        }

        .smoke-1 {
          width: 80px;
          height: 80px;
          animation: smokeRise 1.3s ease-out 0.13s forwards;
        }

        .smoke-3 {
          width: 60px;
          height: 60px;
          animation: smokeRise 1.3s ease-out 0.26s forwards;
          transform: translate(-30%, -40%);
        }

        @keyframes smokeRise {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          25% {
            opacity: 0.5;
            transform: translate(-50%, -65%) scale(2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100%) scale(4);
          }
        }

        /* Additional ember glow layer */
        .embers {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(2px 2px at 25% 25%, rgba(255, 220, 100, 1), transparent),
            radial-gradient(2px 2px at 75% 30%, rgba(255, 180, 50, 0.9), transparent),
            radial-gradient(3px 3px at 20% 55%, rgba(255, 150, 0, 1), transparent),
            radial-gradient(2px 2px at 80% 60%, rgba(255, 200, 80, 0.85), transparent),
            radial-gradient(2px 2px at 35% 75%, rgba(255, 160, 50, 0.9), transparent),
            radial-gradient(3px 3px at 65% 70%, rgba(255, 120, 0, 1), transparent);
          opacity: 0;
          z-index: 47;
          animation: embersFloat 1.56s ease-out forwards;
        }

        @keyframes embersFloat {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.2) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(2.5) translateY(-25%);
          }
        }

        /* Screen shake effect - quick and intense (2x slower) */
        .screen-shake {
          position: absolute;
          inset: -10px;
          background: transparent;
          z-index: 51;
          animation: screenShake 0.65s ease-out forwards;
          pointer-events: none;
        }

        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-6px, 4px); }
          30% { transform: translate(5px, -5px); }
          45% { transform: translate(-4px, 3px); }
          60% { transform: translate(3px, -2px); }
          75% { transform: translate(-2px, 2px); }
          90% { transform: translate(1px, -1px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .inerci-logo, .explosion-flash, .fireball, .shockwave, .particle, .smoke, .embers, .screen-shake {
            animation: none !important;
            opacity: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

// Mid-transition automation overlay with DATA CUBE story animation
// Timeline: Robot A (RED cube) → Robot B (YELLOW) → Robot C (GREEN)
// 6.5-second animation with proper walking cycles, handoffs, and color transforms
// Uses animationKey to reset CSS animations each time overlay appears
function AutomationOverlay({ progress }: { progress: MotionValue<number> }) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Track when overlay becomes visible to reset animations
  useEffect(() => {
    const unsubscribe = progress.on("change", (value) => {
      const shouldBeVisible = getOverlayOpacity(value) > 0;
      if (shouldBeVisible && !isVisible) {
        // Overlay just became visible - increment key to reset CSS animations
        setAnimationKey(prev => prev + 1);
      }
      setIsVisible(shouldBeVisible);
    });
    return unsubscribe;
  }, [progress, isVisible]);

  const opacity = useTransform(progress, getOverlayOpacity);

  // Don't render anything if not visible (saves resources)
  if (!isVisible) return null;

  return (
    <>
      {/* Full opaque backdrop - completely hides BEFORE state (no bleed-through) */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-15"
        style={{
          background: "linear-gradient(135deg, rgba(15, 15, 30, 1) 0%, rgba(10, 10, 25, 1) 100%)",
          opacity,
        }}
      />

      {/* Main overlay - key forces re-mount to reset all CSS animations */}
      <motion.div
        key={animationKey}
        className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
        style={{ opacity, transform: "translateZ(0)" }}
      >
        {/* Glass container - stretched to fill most of the card */}
        <div
          className="relative px-5 py-5 rounded-2xl w-[calc(100%-24px)] max-w-[520px] text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(15, 15, 30, 0.96) 0%, rgba(10, 10, 25, 0.96) 100%)",
            border: "1px solid rgba(167, 139, 250, 0.25)",
            boxShadow: "0 0 40px rgba(124, 58, 237, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            transform: "translateZ(0)",
            contain: "layout paint",
          }}
        >
          {/* Robot stage - expanded to fill container, taller */}
          <div className="robot-stage relative h-[120px] w-full mb-4 overflow-visible">
            {/* Floor line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Robot A - walks right with RED cube, then returns */}
            <div className="robot-a-wrapper">
              <div className="robot-unit robot-a-unit">
                {/* Head */}
                <div className="robot-head">
                  <div className="robot-face">
                    <div className="robot-eye eye-left" />
                    <div className="robot-eye eye-right" />
                  </div>
                  <div className="robot-antenna">
                    <div className="antenna-tip antenna-a" />
                  </div>
                </div>
                {/* Body */}
                <div className="robot-body-main robot-body-a">
                  <div className="body-light body-light-a" />
                </div>
                {/* Arm right (for cube handoff) */}
                <div className="robot-arm arm-a">
                  <div className="arm-segment" />
                  <div className="arm-hand" />
                </div>
                {/* Arm left (for celebration) */}
                <div className="robot-arm arm-a-left">
                  <div className="arm-segment" />
                  <div className="arm-hand" />
                </div>
                {/* Legs */}
                <div className="robot-legs">
                  <div className="leg leg-left leg-a-left" />
                  <div className="leg leg-right leg-a-right" />
                </div>
              </div>
            </div>

            {/* Robot B - center, receives and transforms cube */}
            <div className="robot-b-wrapper">
              <div className="robot-unit robot-b-unit">
                {/* Head */}
                <div className="robot-head robot-head-b">
                  <div className="robot-face">
                    <div className="robot-eye eye-left eye-b" />
                    <div className="robot-eye eye-right eye-b" />
                  </div>
                  <div className="robot-antenna">
                    <div className="antenna-tip antenna-b" />
                  </div>
                </div>
                {/* Body */}
                <div className="robot-body-main robot-body-b">
                  <div className="body-light body-light-b" />
                  <div className="body-light body-light-b-2" />
                </div>
                {/* Arms (both sides) */}
                <div className="robot-arm arm-b-left">
                  <div className="arm-segment" />
                  <div className="arm-hand" />
                </div>
                <div className="robot-arm arm-b-right">
                  <div className="arm-segment" />
                  <div className="arm-hand" />
                </div>
                {/* Legs */}
                <div className="robot-legs">
                  <div className="leg leg-left leg-b-left" />
                  <div className="leg leg-right leg-b-right" />
                </div>
              </div>
            </div>

            {/* Robot C - receives GREEN cube, celebrates */}
            <div className="robot-c-wrapper">
              <div className="robot-unit robot-c-unit">
                {/* Head */}
                <div className="robot-head">
                  <div className="robot-face">
                    <div className="robot-eye eye-left eye-c" />
                    <div className="robot-eye eye-right eye-c" />
                  </div>
                  <div className="robot-antenna">
                    <div className="antenna-tip antenna-c" />
                  </div>
                </div>
                {/* Body */}
                <div className="robot-body-main robot-body-c">
                  <div className="body-light body-light-c" />
                </div>
                {/* Arms (both sides) */}
                <div className="robot-arm arm-c-left">
                  <div className="arm-segment" />
                  <div className="arm-hand" />
                </div>
                <div className="robot-arm arm-c-right">
                  <div className="arm-segment" />
                  <div className="arm-hand" />
                </div>
                {/* Legs */}
                <div className="robot-legs">
                  <div className="leg leg-left leg-c-left" />
                  <div className="leg leg-right leg-c-right" />
                </div>
                {/* Activation ring (appears at end) */}
                <div className="activation-ring" />
              </div>
            </div>

            {/* MYSTIC ORB - magical energy sphere that transforms */}
            <div className="mystic-orb-wrapper">
              <div className="mystic-orb">
                {/* Outer glow ring */}
                <div className="orb-glow-ring" />
                {/* Core sphere */}
                <div className="orb-core">
                  <div className="orb-inner-glow" />
                  {/* Energy particles orbiting inside */}
                  <div className="orb-particle op-1" />
                  <div className="orb-particle op-2" />
                  <div className="orb-particle op-3" />
                </div>
                {/* Mystical runes/symbols floating around */}
                <div className="orb-rune rune-1">✦</div>
                <div className="orb-rune rune-2">◈</div>
                <div className="orb-rune rune-3">✧</div>
                {/* Energy wisps */}
                <div className="orb-wisp wisp-1" />
                <div className="orb-wisp wisp-2" />
              </div>
            </div>

            {/* MINI PC - Robot C inserts cube here */}
            <div className="mini-pc-wrapper">
              <div className="mini-pc">
                {/* PC Body */}
                <div className="pc-body">
                  <div className="pc-screen">
                    <div className="pc-screen-content" />
                  </div>
                  <div className="pc-slot" />
                  <div className="pc-lights">
                    <div className="pc-light pc-light-1" />
                    <div className="pc-light pc-light-2" />
                  </div>
                </div>
                {/* PC Base/Stand */}
                <div className="pc-base" />
              </div>
              {/* Holographic projector beam */}
              <div className="holo-projector">
                <div className="holo-beam" />
                <div className="holo-particles">
                  <div className="holo-particle hp-1" />
                  <div className="holo-particle hp-2" />
                  <div className="holo-particle hp-3" />
                  <div className="holo-particle hp-4" />
                  <div className="holo-particle hp-5" />
                </div>
                {/* Holographic CRM Card projection */}
                <div className="holo-card">
                  <div className="holo-card-scanlines" />
                  <div className="holo-card-content">
                    <div className="holo-card-header">
                      <span className="holo-card-icon">✓</span>
                      <span className="holo-card-title">CRM</span>
                    </div>
                    <div className="holo-card-row">
                      <span className="holo-card-label">Status</span>
                      <span className="holo-card-value holo-success">Active</span>
                    </div>
                    <div className="holo-card-row">
                      <span className="holo-card-label">Sync</span>
                      <span className="holo-card-value">100%</span>
                    </div>
                  </div>
                  <div className="holo-card-flicker" />
                </div>
              </div>
            </div>
          </div>

          {/* Headline - INERCI flies here after explosion */}
          <div className="relative inline-flex items-baseline headline-container">
            {/* INERCI text - hidden initially, revealed after flying animation lands */}
            <span className="inerci-headline-target text-[15px] md:text-[17px] font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              INERCI
            </span>
            <span className="text-[13px] md:text-[15px] font-semibold text-white/90 ml-1.5">
              automatizacijų diegimas
            </span>
          </div>
        </div>
      </motion.div>

      {/* CSS Keyframes - 5 second loop with proper walking */}
      <style jsx global>{`
        /* === COLOR VARIABLES === */
        :root {
          --cube-red: #ff4d4d;
          --cube-yellow: #ffcc00;
          --cube-green: #2dff7a;
          --robot-a-accent: #a78bfa;
          --robot-b-accent: #22d3ee;
          --robot-c-accent: #60a5fa;
        }

        /* === ROBOT STAGE LAYOUT === */
        .robot-stage {
          position: relative;
          contain: layout style;
          transform: translateZ(0);
        }

        /* === ROBOT UNIT BASE === */
        .robot-unit {
          position: relative;
          width: 32px;
          height: 52px;
          overflow: visible;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        .robot-head {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 20px;
          background: linear-gradient(180deg, #475569 0%, #334155 100%);
          border-radius: 6px 6px 4px 4px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .robot-head-b {
          width: 28px;
          height: 22px;
        }
        .robot-face {
          position: absolute;
          inset: 3px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .robot-eye {
          width: 5px;
          height: 6px;
          border-radius: 2px;
          background: var(--robot-a-accent);
          box-shadow: 0 0 6px var(--robot-a-accent);
        }
        .eye-b { background: var(--robot-b-accent); box-shadow: 0 0 6px var(--robot-b-accent); }
        .eye-c { background: var(--robot-c-accent); box-shadow: 0 0 6px var(--robot-c-accent); }
        .robot-antenna {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 8px;
          background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%);
        }
        .antenna-tip {
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--robot-a-accent);
          box-shadow: 0 0 8px var(--robot-a-accent);
        }
        .antenna-b { background: var(--robot-b-accent); box-shadow: 0 0 8px var(--robot-b-accent); }
        .antenna-c { background: var(--robot-c-accent); box-shadow: 0 0 8px var(--robot-c-accent); }

        .robot-body-main {
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 18px;
          background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
          border-radius: 4px 4px 6px 6px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .robot-body-b { width: 24px; height: 20px; }
        .body-light {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--robot-a-accent);
          opacity: 0.6;
        }
        .body-light-b { background: var(--robot-b-accent); left: 35%; }
        .body-light-b-2 { background: var(--robot-b-accent); left: 65%; width: 4px; height: 4px; }
        .body-light-c { background: var(--robot-c-accent); }

        /* === ROBOT ARMS === */
        .robot-arm {
          position: absolute;
          top: 20px;
          width: 4px;
          height: 14px;
          transform-origin: top center;
        }
        .arm-a { right: -6px; animation: armA 6.5s ease-in-out forwards; }
        .arm-a-left { left: -6px; animation: armALeftCelebrate 6.5s ease-in-out forwards; }
        .arm-b-left { left: -6px; animation: armBLeft 6.5s ease-in-out forwards; }
        .arm-b-right { right: -6px; animation: armBRight 6.5s ease-in-out forwards; }
        .arm-c-left { left: -6px; animation: armCLeft 6.5s ease-in-out forwards; }
        .arm-c-right { right: -6px; animation: armCRight 6.5s ease-in-out forwards; }
        .arm-segment {
          width: 100%;
          height: 10px;
          background: linear-gradient(180deg, #475569 0%, #334155 100%);
          border-radius: 2px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .arm-hand {
          width: 6px;
          height: 4px;
          background: #64748b;
          border-radius: 1px;
          margin-top: 1px;
          margin-left: -1px;
        }

        /* === ROBOT LEGS === */
        .robot-legs {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 16px;
          display: flex;
          justify-content: space-between;
        }
        .leg {
          width: 6px;
          height: 16px;
          background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
          border-radius: 2px 2px 3px 3px;
          border: 1px solid rgba(255,255,255,0.06);
          transform-origin: top center;
        }

        /* === ROBOT WRAPPERS (positioning) === */
        /* GPU-accelerated for smooth animations */
        /* Robot A starts far left (0%), walks toward center (stops at 26%) */
        .robot-a-wrapper {
          position: absolute;
          bottom: 12px;
          left: 0%;
          overflow: visible;
          animation: robotAWalk 6.5s ease-in-out forwards;
          will-change: left;
          transform: translateZ(0);
        }
        /* Robot B starts at center (50%), walks left to meet A (38%), then right to C (62%), returns */
        .robot-b-wrapper {
          position: absolute;
          bottom: 12px;
          left: 50%;
          overflow: visible;
          animation: robotBWalk 6.5s ease-in-out forwards;
          will-change: left;
          transform: translateZ(0);
        }
        /* Robot C starts on right side (80%), walks left to meet B at 68%, walks to PC (92%) */
        .robot-c-wrapper {
          position: absolute;
          bottom: 12px;
          left: 80%;
          overflow: visible;
          animation: robotCWalk 6.5s ease-in-out forwards;
          will-change: left;
          transform: translateZ(0);
        }

        /* === WALK ANIMATIONS === */
        /* Robot A: walks from far left (0%) toward center (26%), hands off cube, walks back */
        /* Gap between A (26%) and B (38%) = 12% - enough room for handoff without overlap */
        /* Timeline: 0-3% idle, 3-22% walk right, 22-30% handoff, 30-45% walk back, 45-100% idle */
        @keyframes robotAWalk {
          0%, 3% { left: 0%; }
          22%, 30% { left: 26%; }
          45%, 100% { left: 0%; }
        }

        /* Robot A left leg - alternating walk cycle */
        .leg-a-left { animation: legALeft 6.5s ease-in-out forwards; }
        @keyframes legALeft {
          0%, 3% { transform: rotate(0deg); }
          /* Walk forward - 6 steps */
          6% { transform: rotate(-18deg); }
          9% { transform: rotate(18deg); }
          12% { transform: rotate(-18deg); }
          15% { transform: rotate(18deg); }
          18% { transform: rotate(-18deg); }
          22% { transform: rotate(0deg); }
          /* Idle during handoff */
          30% { transform: rotate(0deg); }
          /* Walk back - 5 steps */
          33% { transform: rotate(18deg); }
          36% { transform: rotate(-18deg); }
          39% { transform: rotate(18deg); }
          42% { transform: rotate(-18deg); }
          45% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        /* Robot A right leg - offset from left */
        .leg-a-right { animation: legARight 6.5s ease-in-out forwards; }
        @keyframes legARight {
          0%, 3% { transform: rotate(0deg); }
          /* Walk forward - 6 steps (opposite phase) */
          6% { transform: rotate(18deg); }
          9% { transform: rotate(-18deg); }
          12% { transform: rotate(18deg); }
          15% { transform: rotate(-18deg); }
          18% { transform: rotate(18deg); }
          22% { transform: rotate(0deg); }
          /* Idle during handoff */
          30% { transform: rotate(0deg); }
          /* Walk back - 5 steps (opposite phase) */
          33% { transform: rotate(-18deg); }
          36% { transform: rotate(18deg); }
          39% { transform: rotate(-18deg); }
          42% { transform: rotate(18deg); }
          45% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        /* Robot B: walks left to receive from A (38%), processes, walks right to meet C (58%), returns to center (50%) */
        /* Gap between A (26%) and B (38%) = 12%, B meets C at 58% (shorter walk for B, C walks left to meet) */
        /* Timeline: 0-18% idle, 18-25% walk left, 25-38% receive+process,
           38-50% walk right to 58%, 50-65% handoff to C, 65-78% walk back, 78-100% idle */
        @keyframes robotBWalk {
          0%, 18% { left: 50%; }
          25%, 38% { left: 38%; }
          50%, 65% { left: 58%; }
          78%, 100% { left: 50%; }
        }

        /* Robot C: walks from right (80%) left to meet B (68%), receives cube, walks to mini PC (82%), inserts cube */
        /* Timeline: 0-42% idle, 42-50% walk left to 68%, 50-65% receive from B, 65-78% walk right to PC, 78-90% stand+insert, 90-100% done */
        @keyframes robotCWalk {
          0%, 42% { left: 80%; }
          50%, 65% { left: 68%; }
          78%, 100% { left: 82%; }
        }

        /* Robot B legs - walk cycle when moving */
        .leg-b-left { animation: legBLeft 6.5s ease-in-out forwards; }
        .leg-b-right { animation: legBRight 6.5s ease-in-out forwards; }
        @keyframes legBLeft {
          0%, 18% { transform: rotate(0deg); }
          /* Walk left to meet A - 3 steps */
          20% { transform: rotate(15deg); }
          22% { transform: rotate(-15deg); }
          24% { transform: rotate(15deg); }
          25% { transform: rotate(0deg); }
          /* Idle during processing */
          38% { transform: rotate(0deg); }
          /* Walk right to meet C - 4 steps (shorter walk) */
          41% { transform: rotate(-15deg); }
          44% { transform: rotate(15deg); }
          47% { transform: rotate(-15deg); }
          50% { transform: rotate(0deg); }
          /* Idle during handoff */
          65% { transform: rotate(0deg); }
          /* Walk back to center - 4 steps */
          68% { transform: rotate(15deg); }
          71% { transform: rotate(-15deg); }
          74% { transform: rotate(15deg); }
          78% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes legBRight {
          0%, 18% { transform: rotate(0deg); }
          /* Walk left (opposite phase) */
          20% { transform: rotate(-15deg); }
          22% { transform: rotate(15deg); }
          24% { transform: rotate(-15deg); }
          25% { transform: rotate(0deg); }
          /* Idle during processing */
          38% { transform: rotate(0deg); }
          /* Walk right (opposite phase, shorter) */
          41% { transform: rotate(15deg); }
          44% { transform: rotate(-15deg); }
          47% { transform: rotate(15deg); }
          50% { transform: rotate(0deg); }
          /* Idle during handoff */
          65% { transform: rotate(0deg); }
          /* Walk back (opposite phase) */
          68% { transform: rotate(-15deg); }
          71% { transform: rotate(15deg); }
          74% { transform: rotate(-15deg); }
          78% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        /* Robot C legs - walk left to meet B, then walk right to mini PC */
        .leg-c-left { animation: legCLeft 6.5s ease-in-out forwards; }
        .leg-c-right { animation: legCRight 6.5s ease-in-out forwards; }
        @keyframes legCLeft {
          0%, 42% { transform: rotate(0deg); }
          /* Walk left to meet B - 4 steps */
          44% { transform: rotate(15deg); }
          46% { transform: rotate(-15deg); }
          48% { transform: rotate(15deg); }
          50% { transform: rotate(0deg); }
          /* Idle during handoff */
          65% { transform: rotate(0deg); }
          /* Walk right to mini PC - 5 steps */
          68% { transform: rotate(-15deg); }
          71% { transform: rotate(15deg); }
          74% { transform: rotate(-15deg); }
          77% { transform: rotate(15deg); }
          80% { transform: rotate(0deg); }
          /* Stand still at PC */
          100% { transform: rotate(0deg); }
        }
        @keyframes legCRight {
          0%, 42% { transform: rotate(0deg); }
          /* Walk left (opposite phase) */
          44% { transform: rotate(-15deg); }
          46% { transform: rotate(15deg); }
          48% { transform: rotate(-15deg); }
          50% { transform: rotate(0deg); }
          /* Idle during handoff */
          65% { transform: rotate(0deg); }
          /* Walk right to PC (opposite phase) */
          68% { transform: rotate(15deg); }
          71% { transform: rotate(-15deg); }
          74% { transform: rotate(15deg); }
          77% { transform: rotate(-15deg); }
          80% { transform: rotate(0deg); }
          /* Stand still at PC */
          100% { transform: rotate(0deg); }
        }

        /* === ARM ANIMATIONS === */
        /* Robot A right arm - extends to hand off cube (at 24-28%), then celebrates (88-100%) */
        .arm-a { animation: armA 6.5s ease-in-out forwards; }
        @keyframes armA {
          0%, 22% { transform: rotate(0deg); }
          25%, 28% { transform: rotate(-40deg); }
          30%, 86% { transform: rotate(0deg); }
          /* CELEBRATE! Raise arm up */
          89% { transform: rotate(-75deg); }
          92% { transform: rotate(-65deg); }
          95% { transform: rotate(-80deg); }
          98% { transform: rotate(-70deg); }
          100% { transform: rotate(-75deg); }
        }
        /* Robot A left arm - stays down until celebration (88-100%) */
        @keyframes armALeftCelebrate {
          0%, 86% { transform: rotate(0deg); }
          /* CELEBRATE! Raise arm up */
          89% { transform: rotate(75deg); }
          92% { transform: rotate(65deg); }
          95% { transform: rotate(80deg); }
          98% { transform: rotate(70deg); }
          100% { transform: rotate(75deg); }
        }
        /* Robot B arms - receive from left (25-30%), give to right (50-58%), then CELEBRATE (88-100%) */
        .arm-b-left { animation: armBLeft 6.5s ease-in-out forwards; }
        @keyframes armBLeft {
          0%, 23% { transform: rotate(0deg); }
          25%, 30% { transform: rotate(40deg); }
          35%, 86% { transform: rotate(0deg); }
          /* CELEBRATE! Raise arm up */
          89% { transform: rotate(80deg); }
          92% { transform: rotate(70deg); }
          95% { transform: rotate(85deg); }
          98% { transform: rotate(72deg); }
          100% { transform: rotate(80deg); }
        }
        .arm-b-right { animation: armBRight 6.5s ease-in-out forwards; }
        @keyframes armBRight {
          0%, 48% { transform: rotate(0deg); }
          50%, 58% { transform: rotate(-40deg); }
          62%, 86% { transform: rotate(0deg); }
          /* CELEBRATE! Raise arm up */
          89% { transform: rotate(-80deg); }
          92% { transform: rotate(-70deg); }
          95% { transform: rotate(-85deg); }
          98% { transform: rotate(-72deg); }
          100% { transform: rotate(-80deg); }
        }
        /* Robot C left arm reaches to receive (50-58%), holds during walk, then idle */
        @keyframes armCLeft {
          0%, 48% { transform: rotate(0deg); }
          /* Reach to receive orb from B */
          50%, 58% { transform: rotate(40deg); }
          /* Hold orb during walk to PC */
          62%, 78% { transform: rotate(20deg); }
          /* Idle while right arm inserts */
          80%, 100% { transform: rotate(0deg); }
        }
        /* Robot C right arm - idle, then extends to insert cube into PC (78-85%) */
        @keyframes armCRight {
          0%, 76% { transform: rotate(0deg); }
          /* Extend arm forward to insert cube into PC slot */
          78%, 85% { transform: rotate(-40deg); }
          88%, 100% { transform: rotate(0deg); }
        }

        /* === MYSTIC ORB === */
        /* Magical energy sphere that transforms as it passes between robots */
        /* Smaller size (14px) and positioned at hand level (bottom: 48-52px) */
        .mystic-orb-wrapper {
          position: absolute;
          bottom: 24px;
          left: 4%;
          width: 14px;
          height: 14px;
          animation: orbMove 6.5s ease-in-out forwards;
          z-index: 10;
          will-change: left, bottom, opacity;
          transform: translateZ(0);
        }
        @keyframes orbMove {
          /* === PHASE 1: Robot A carries orb (in RIGHT hand) === */
          /* A starts at 0%, orb in A's RIGHT hand (+4% offset from robot) */
          0%, 3% { left: 4%; bottom: 24px; opacity: 1; }
          /* A walks to 26%, orb stays in right hand */
          22% { left: 30%; bottom: 24px; opacity: 1; }
          /* A extends right arm for handoff */
          25% { left: 33%; bottom: 28px; opacity: 1; }

          /* === PHASE 2: Handoff A->B (B's LEFT hand) === */
          /* B is at 38%, LEFT hand is at ~35% (robot center - 3%) */
          28% { left: 35%; bottom: 26px; opacity: 1; }

          /* === PHASE 3: Robot B holds in LEFT hand, then transfers to RIGHT === */
          /* B holds in left hand (35%), processes */
          32% { left: 35%; bottom: 30px; opacity: 1; }
          /* Transfer to B's RIGHT hand before walking right */
          38% { left: 41%; bottom: 26px; opacity: 1; }
          /* B walks right to 58%, orb in RIGHT hand (+3% offset) */
          50% { left: 61%; bottom: 24px; opacity: 1; }
          /* B extends right arm for handoff to C */
          53% { left: 64%; bottom: 28px; opacity: 1; }

          /* === PHASE 4: Handoff B->C (C's LEFT hand) === */
          /* C is at 68%, LEFT hand is at ~65% */
          56% { left: 65%; bottom: 26px; opacity: 1; }

          /* === PHASE 5: Robot C carries in LEFT hand, then RIGHT for insert === */
          /* C holds in left hand while walking to 82% */
          65% { left: 65%; bottom: 24px; opacity: 1; }
          74% { left: 76%; bottom: 24px; opacity: 1; }
          /* Transfer to C's RIGHT hand for PC insert */
          78% { left: 85%; bottom: 26px; opacity: 1; }
          /* C extends right arm to insert */
          82% { left: 89%; bottom: 35px; opacity: 1; }
          /* Orb inserts into PC slot */
          86% { left: 92%; bottom: 50px; opacity: 1; transform: scale(0.6); }
          /* Orb absorbed into PC */
          90%, 100% { left: 92%; bottom: 55px; opacity: 0; transform: scale(0.1); }
        }

        .mystic-orb {
          position: relative;
          width: 100%;
          height: 100%;
          animation: orbPulse 2s ease-in-out infinite;
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        /* Outer glow ring - scaled down for smaller orb */
        .orb-glow-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1.5px solid transparent;
          animation: orbGlowRing 6.5s ease-in-out forwards, orbRingSpin 3s linear infinite;
        }
        @keyframes orbGlowRing {
          0%, 32% {
            border-color: rgba(255, 77, 77, 0.7);
            box-shadow: 0 0 10px rgba(255, 77, 77, 0.5), inset 0 0 6px rgba(255, 77, 77, 0.2);
          }
          36%, 52% {
            border-color: rgba(255, 204, 0, 0.8);
            box-shadow: 0 0 12px rgba(255, 204, 0, 0.6), inset 0 0 8px rgba(255, 204, 0, 0.3);
          }
          56%, 100% {
            border-color: rgba(45, 255, 122, 0.9);
            box-shadow: 0 0 14px rgba(45, 255, 122, 0.7), inset 0 0 10px rgba(45, 255, 122, 0.4);
          }
        }
        @keyframes orbRingSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Core sphere - scaled for smaller orb */
        .orb-core {
          position: absolute;
          inset: 1px;
          border-radius: 50%;
          overflow: hidden;
          animation: orbCoreColor 6.5s ease-in-out forwards;
        }
        @keyframes orbCoreColor {
          0%, 32% {
            background: radial-gradient(circle at 30% 30%,
              rgba(255, 150, 150, 0.95) 0%,
              rgba(255, 77, 77, 0.9) 40%,
              rgba(180, 30, 30, 0.85) 100%
            );
            box-shadow: 0 0 12px rgba(255, 77, 77, 0.8), inset 0 0 8px rgba(255, 200, 200, 0.4);
          }
          36%, 52% {
            background: radial-gradient(circle at 30% 30%,
              rgba(255, 255, 180, 0.95) 0%,
              rgba(255, 204, 0, 0.9) 40%,
              rgba(200, 150, 0, 0.85) 100%
            );
            box-shadow: 0 0 15px rgba(255, 204, 0, 0.9), inset 0 0 10px rgba(255, 255, 200, 0.5);
          }
          56%, 100% {
            background: radial-gradient(circle at 30% 30%,
              rgba(180, 255, 200, 0.95) 0%,
              rgba(45, 255, 122, 0.9) 40%,
              rgba(20, 180, 80, 0.85) 100%
            );
            box-shadow: 0 0 18px rgba(45, 255, 122, 1), inset 0 0 12px rgba(200, 255, 220, 0.6);
          }
        }

        /* Inner glow highlight - smaller */
        .orb-inner-glow {
          position: absolute;
          top: 15%;
          left: 20%;
          width: 35%;
          height: 25%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          filter: blur(1px);
        }

        /* Energy particles orbiting inside - smaller */
        .orb-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 3px white;
        }
        .op-1 {
          animation: orbParticle1 1.2s linear infinite;
        }
        .op-2 {
          animation: orbParticle2 1.5s linear infinite;
        }
        .op-3 {
          animation: orbParticle3 1.8s linear infinite;
        }
        @keyframes orbParticle1 {
          0% { top: 50%; left: 10%; opacity: 1; }
          25% { top: 20%; left: 50%; opacity: 0.8; }
          50% { top: 50%; left: 80%; opacity: 1; }
          75% { top: 75%; left: 50%; opacity: 0.8; }
          100% { top: 50%; left: 10%; opacity: 1; }
        }
        @keyframes orbParticle2 {
          0% { top: 30%; left: 70%; opacity: 0.8; }
          33% { top: 70%; left: 20%; opacity: 1; }
          66% { top: 25%; left: 30%; opacity: 0.8; }
          100% { top: 30%; left: 70%; opacity: 0.8; }
        }
        @keyframes orbParticle3 {
          0% { top: 65%; left: 40%; opacity: 1; }
          50% { top: 35%; left: 60%; opacity: 0.7; }
          100% { top: 65%; left: 40%; opacity: 1; }
        }

        /* Mystical runes floating around - smaller orbit for smaller orb */
        .orb-rune {
          position: absolute;
          font-size: 5px;
          color: white;
          text-shadow: 0 0 3px currentColor;
          opacity: 0.8;
          pointer-events: none;
        }
        .rune-1 {
          animation: runeOrbit1 2s linear infinite, runeColor 6.5s ease-in-out forwards;
        }
        .rune-2 {
          animation: runeOrbit2 2.5s linear infinite, runeColor 6.5s ease-in-out forwards;
        }
        .rune-3 {
          animation: runeOrbit3 3s linear infinite, runeColor 6.5s ease-in-out forwards;
        }
        @keyframes runeOrbit1 {
          0% { top: -5px; left: 50%; transform: translateX(-50%); }
          25% { top: 50%; left: calc(100% + 5px); transform: translateY(-50%); }
          50% { top: calc(100% + 5px); left: 50%; transform: translateX(-50%); }
          75% { top: 50%; left: -5px; transform: translateY(-50%); }
          100% { top: -5px; left: 50%; transform: translateX(-50%); }
        }
        @keyframes runeOrbit2 {
          0% { top: 50%; left: calc(100% + 6px); transform: translateY(-50%); }
          33% { top: calc(100% + 4px); left: 20%; }
          66% { top: -4px; left: 80%; }
          100% { top: 50%; left: calc(100% + 6px); transform: translateY(-50%); }
        }
        @keyframes runeOrbit3 {
          0% { top: calc(100% + 4px); left: 30%; }
          50% { top: -6px; left: 70%; }
          100% { top: calc(100% + 4px); left: 30%; }
        }
        @keyframes runeColor {
          0%, 32% { color: rgba(255, 120, 120, 0.9); text-shadow: 0 0 6px rgba(255, 77, 77, 0.8); }
          36%, 52% { color: rgba(255, 230, 120, 0.9); text-shadow: 0 0 6px rgba(255, 204, 0, 0.8); }
          56%, 100% { color: rgba(120, 255, 160, 0.9); text-shadow: 0 0 6px rgba(45, 255, 122, 0.8); }
        }

        /* Energy wisps trailing - smaller for smaller orb */
        .orb-wisp {
          position: absolute;
          width: 5px;
          height: 1.5px;
          border-radius: 50%;
          filter: blur(0.5px);
          animation: wispFloat 6.5s ease-in-out forwards;
        }
        .wisp-1 {
          animation: wispFloat1 1.8s ease-in-out infinite, wispColor 6.5s ease-in-out forwards;
        }
        .wisp-2 {
          animation: wispFloat2 2.2s ease-in-out infinite, wispColor 6.5s ease-in-out forwards;
        }
        @keyframes wispFloat1 {
          0%, 100% { top: 30%; left: -8px; opacity: 0.8; transform: scaleX(1); }
          50% { top: 40%; left: -12px; opacity: 0.4; transform: scaleX(1.3); }
        }
        @keyframes wispFloat2 {
          0%, 100% { top: 60%; left: -6px; opacity: 0.6; transform: scaleX(1.1); }
          50% { top: 55%; left: -10px; opacity: 0.3; transform: scaleX(0.7); }
        }
        @keyframes wispColor {
          0%, 32% { background: rgba(255, 77, 77, 0.8); }
          36%, 52% { background: rgba(255, 204, 0, 0.8); }
          56%, 100% { background: rgba(45, 255, 122, 0.8); }
        }

        /* Transformation flash during color changes - scaled for smaller orb */
        .mystic-orb::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          background: white;
          opacity: 0;
          animation: orbTransformFlash 6.5s ease-out forwards;
          pointer-events: none;
        }
        @keyframes orbTransformFlash {
          0%, 34%, 38%, 54%, 58%, 100% { opacity: 0; transform: scale(1); }
          35% { opacity: 0.9; transform: scale(1.4); }
          36% { opacity: 0; transform: scale(1.6); }
          55% { opacity: 1; transform: scale(1.5); }
          56% { opacity: 0; transform: scale(1.8); }
        }

        /* === ACTIVATION RING (Robot C at PC) === */
        .activation-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid var(--cube-green);
          opacity: 0;
          animation: activationRing 6.5s ease-out forwards;
        }
        @keyframes activationRing {
          0%, 84% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          88% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
          94% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }

        /* === EYE BLINK === */
        .robot-eye {
          animation: eyeBlink 6.5s ease-in-out forwards;
        }
        .eye-b { animation: eyeBlinkB 6.5s ease-in-out forwards; }
        .eye-c { animation: eyeBlinkC 6.5s ease-in-out forwards; }
        @keyframes eyeBlink {
          0%, 12%, 14%, 100% { transform: scaleY(1); }
          13% { transform: scaleY(0.1); }
        }
        @keyframes eyeBlinkB {
          0%, 36%, 38%, 100% { transform: scaleY(1); }
          37% { transform: scaleY(0.1); }
        }
        @keyframes eyeBlinkC {
          0%, 66%, 68%, 100% { transform: scaleY(1); }
          67% { transform: scaleY(0.1); }
        }

        /* === ANTENNA PULSE (synced with actions) === */
        .antenna-a { animation: antennaPulseA 6.5s ease-in-out forwards; }
        .antenna-b { animation: antennaPulseB 6.5s ease-in-out forwards; }
        .antenna-c { animation: antennaPulseC 6.5s ease-in-out forwards; }
        @keyframes antennaPulseA {
          0%, 23%, 30%, 100% { box-shadow: 0 0 8px var(--robot-a-accent); }
          26% { box-shadow: 0 0 16px var(--robot-a-accent), 0 0 24px var(--robot-a-accent); }
        }
        @keyframes antennaPulseB {
          0%, 33%, 42%, 52%, 64%, 100% { box-shadow: 0 0 8px var(--robot-b-accent); }
          38% { box-shadow: 0 0 16px var(--robot-b-accent), 0 0 24px var(--robot-b-accent); }
          58% { box-shadow: 0 0 16px var(--robot-b-accent), 0 0 24px var(--robot-b-accent); }
        }
        @keyframes antennaPulseC {
          0%, 64%, 72%, 100% { box-shadow: 0 0 8px var(--robot-c-accent); }
          68% { box-shadow: 0 0 20px var(--robot-c-accent), 0 0 30px var(--robot-c-accent); }
        }

        /* === MINI PC === */
        .mini-pc-wrapper {
          position: absolute;
          bottom: 8px;
          right: -6px;
          width: 44px;
          height: 70px;
          z-index: 5;
        }
        .mini-pc {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .pc-body {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 48px;
          background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .pc-screen {
          position: absolute;
          top: 4px;
          left: 4px;
          right: 4px;
          height: 20px;
          background: #0f172a;
          border-radius: 2px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .pc-screen-content {
          position: absolute;
          inset: 2px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
          opacity: 0;
          animation: screenActivate 6.5s ease-out forwards;
        }
        @keyframes screenActivate {
          0%, 88% { opacity: 0; background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%); }
          90% { opacity: 1; background: linear-gradient(135deg, rgba(45, 255, 122, 0.6) 0%, rgba(34, 211, 238, 0.4) 100%); }
          92%, 100% { opacity: 1; background: linear-gradient(135deg, rgba(45, 255, 122, 0.3) 0%, rgba(34, 211, 238, 0.2) 100%); }
        }
        .pc-slot {
          position: absolute;
          top: 28px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 4px;
          background: #0f172a;
          border-radius: 1px;
          border: 1px solid rgba(45, 255, 122, 0.3);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
          animation: slotGlow 6.5s ease-out forwards;
        }
        @keyframes slotGlow {
          0%, 80% { border-color: rgba(45, 255, 122, 0.2); box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }
          85% { border-color: rgba(45, 255, 122, 0.8); box-shadow: inset 0 1px 2px rgba(0,0,0,0.5), 0 0 8px rgba(45, 255, 122, 0.5); }
          90%, 100% { border-color: rgba(45, 255, 122, 0.4); box-shadow: inset 0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(45, 255, 122, 0.3); }
        }
        .pc-lights {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
        }
        .pc-light {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #334155;
        }
        .pc-light-1 {
          animation: pcLight1 6.5s ease-out forwards;
        }
        .pc-light-2 {
          animation: pcLight2 6.5s ease-out forwards;
        }
        @keyframes pcLight1 {
          0%, 88% { background: #334155; box-shadow: none; }
          90%, 100% { background: var(--cube-green); box-shadow: 0 0 6px var(--cube-green); }
        }
        @keyframes pcLight2 {
          0%, 90% { background: #334155; box-shadow: none; }
          92%, 100% { background: var(--robot-b-accent); box-shadow: 0 0 6px var(--robot-b-accent); }
        }
        .pc-base {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 28px;
          height: 10px;
          background: linear-gradient(180deg, #475569 0%, #334155 100%);
          border-radius: 2px 2px 4px 4px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* === HOLOGRAPHIC PROJECTOR === */
        .holo-projector {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 50px;
          pointer-events: none;
        }
        .holo-beam {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 0;
          background: linear-gradient(180deg,
            rgba(45, 255, 122, 0) 0%,
            rgba(45, 255, 122, 0.4) 30%,
            rgba(34, 211, 238, 0.6) 70%,
            rgba(124, 58, 237, 0.8) 100%
          );
          border-radius: 50% 50% 4px 4px;
          opacity: 0;
          filter: blur(2px);
          animation: holoBeam 6.5s ease-out forwards;
        }
        @keyframes holoBeam {
          0%, 88% { height: 0; width: 8px; opacity: 0; }
          90% { height: 35px; width: 12px; opacity: 1; }
          92% { height: 45px; width: 20px; opacity: 1; }
          94%, 100% { height: 50px; width: 30px; opacity: 0.8; }
        }
        .holo-particles {
          position: absolute;
          inset: 0;
        }
        .holo-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--cube-green);
          opacity: 0;
          box-shadow: 0 0 4px var(--cube-green);
        }
        .hp-1 { animation: holoParticle1 6.5s ease-out forwards; }
        .hp-2 { animation: holoParticle2 6.5s ease-out forwards; }
        .hp-3 { animation: holoParticle3 6.5s ease-out forwards; }
        .hp-4 { animation: holoParticle4 6.5s ease-out forwards; }
        .hp-5 { animation: holoParticle5 6.5s ease-out forwards; }
        @keyframes holoParticle1 {
          0%, 90% { opacity: 0; bottom: 10px; left: 20px; }
          92% { opacity: 1; bottom: 30px; left: 15px; }
          96% { opacity: 0.5; bottom: 45px; left: 10px; }
          100% { opacity: 0; bottom: 50px; left: 5px; }
        }
        @keyframes holoParticle2 {
          0%, 91% { opacity: 0; bottom: 10px; left: 35px; }
          93% { opacity: 1; bottom: 35px; left: 40px; }
          97% { opacity: 0.5; bottom: 48px; left: 48px; }
          100% { opacity: 0; bottom: 52px; left: 52px; }
        }
        @keyframes holoParticle3 {
          0%, 89% { opacity: 0; bottom: 8px; left: 28px; }
          91% { opacity: 1; bottom: 25px; left: 30px; }
          95% { opacity: 0.5; bottom: 42px; left: 28px; }
          100% { opacity: 0; bottom: 48px; left: 26px; }
        }
        @keyframes holoParticle4 {
          0%, 92% { opacity: 0; bottom: 12px; left: 25px; }
          94% { opacity: 1; bottom: 32px; left: 20px; }
          98% { opacity: 0.5; bottom: 46px; left: 18px; }
          100% { opacity: 0; bottom: 50px; left: 16px; }
        }
        @keyframes holoParticle5 {
          0%, 90% { opacity: 0; bottom: 6px; left: 32px; }
          93% { opacity: 1; bottom: 28px; left: 36px; }
          97% { opacity: 0.5; bottom: 44px; left: 38px; }
          100% { opacity: 0; bottom: 50px; left: 40px; }
        }

        /* === HOLOGRAPHIC CRM CARD === */
        .holo-card {
          position: absolute;
          bottom: 55px;
          left: 50%;
          transform: translateX(-50%) translateZ(0);
          width: 70px;
          height: 50px;
          border-radius: 6px;
          opacity: 0;
          overflow: hidden;
          animation: holoCardAppear 6.5s ease-out forwards;
          will-change: opacity, transform;
          backface-visibility: hidden;
          /* Holographic styling */
          background: linear-gradient(135deg,
            rgba(45, 255, 122, 0.15) 0%,
            rgba(34, 211, 238, 0.12) 50%,
            rgba(124, 58, 237, 0.1) 100%
          );
          border: 1px solid rgba(45, 255, 122, 0.4);
          box-shadow:
            0 0 20px rgba(45, 255, 122, 0.3),
            0 0 40px rgba(34, 211, 238, 0.2),
            inset 0 0 15px rgba(45, 255, 122, 0.1);
        }
        @keyframes holoCardAppear {
          0%, 90% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.5) rotateX(30deg);
            filter: blur(4px);
          }
          92% {
            opacity: 0.3;
            transform: translateX(-50%) translateY(10px) scale(0.8) rotateX(15deg);
            filter: blur(2px);
          }
          94% {
            opacity: 0.7;
            transform: translateX(-50%) translateY(0) scale(1.05) rotateX(5deg);
            filter: blur(1px);
          }
          96%, 100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1) rotateX(0deg);
            filter: blur(0);
          }
        }

        /* Holographic scanlines overlay */
        .holo-card-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(45, 255, 122, 0.03) 2px,
            rgba(45, 255, 122, 0.03) 4px
          );
          pointer-events: none;
          animation: scanlineScroll 0.5s linear infinite;
        }
        @keyframes scanlineScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }

        /* Card content */
        .holo-card-content {
          position: relative;
          padding: 6px;
          z-index: 2;
        }

        .holo-card-header {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
          padding-bottom: 3px;
          border-bottom: 1px solid rgba(45, 255, 122, 0.3);
        }

        .holo-card-icon {
          font-size: 8px;
          color: #2dff7a;
          text-shadow: 0 0 6px rgba(45, 255, 122, 0.8);
        }

        .holo-card-title {
          font-size: 9px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 0 0 8px rgba(45, 255, 122, 0.5);
          letter-spacing: 0.5px;
        }

        .holo-card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 3px;
        }

        .holo-card-label {
          font-size: 6px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .holo-card-value {
          font-size: 7px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .holo-card-value.holo-success {
          color: #2dff7a;
          text-shadow: 0 0 4px rgba(45, 255, 122, 0.6);
        }

        /* Holographic flicker effect */
        .holo-card-flicker {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          opacity: 0;
          animation: holoFlicker 6.5s ease-out forwards;
        }
        @keyframes holoFlicker {
          0%, 91%, 93%, 95%, 97%, 100% { opacity: 0; }
          92% { opacity: 0.5; transform: translateX(-100%); }
          94% { opacity: 0.3; transform: translateX(100%); }
          96% { opacity: 0.4; transform: translateX(-50%); }
          98% { opacity: 0.2; transform: translateX(50%); }
        }

        /* Holographic shimmer on the card */
        .holo-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(45, 255, 122, 0.2) 50%,
            transparent 100%
          );
          animation: holoShimmer 6.5s ease-out forwards;
        }
        @keyframes holoShimmer {
          0%, 94% { left: -100%; opacity: 0; }
          96% { left: 0%; opacity: 1; }
          98% { left: 100%; opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        /* Glow pulse on the card */
        .holo-card::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(45, 255, 122, 0.6);
          opacity: 0;
          animation: holoGlowPulse 6.5s ease-out forwards;
        }
        @keyframes holoGlowPulse {
          0%, 92% { opacity: 0; }
          94% { opacity: 1; box-shadow: 0 0 15px rgba(45, 255, 122, 0.5); }
          96% { opacity: 0.5; box-shadow: 0 0 25px rgba(45, 255, 122, 0.3); }
          98%, 100% { opacity: 0.8; box-shadow: 0 0 10px rgba(45, 255, 122, 0.4); }
        }

        /* === MOBILE: Only 2 robots - hide Robot C, Robot B does full workflow === */
        /* Flow: Robot A (red cube) -> Robot B receives, transforms to yellow, walks to PC, cube turns green */
        @media (max-width: 767px) {
          /* Hide Robot C on mobile */
          .robot-c-wrapper {
            display: none !important;
          }

          /* Robot A: walks from left (0%) to meet B (25%), hands off cube, walks back */
          .robot-a-wrapper {
            animation: robotAWalkMobile 6.5s ease-in-out forwards;
          }
          @keyframes robotAWalkMobile {
            0%, 5% { left: 0%; }
            22%, 32% { left: 25%; }
            50%, 100% { left: 0%; }
          }

          /* Robot B: starts at center (50%), walks left to meet A (42%), receives cube,
             processes it briefly, then walks to PC (75%) - more space from machine */
          .robot-b-wrapper {
            animation: robotBWalkMobile 6.5s ease-in-out forwards;
          }
          @keyframes robotBWalkMobile {
            0%, 18% { left: 50%; }
            25%, 40% { left: 42%; }
            70%, 100% { left: 75%; }
          }

          /* Robot B legs - walk cycle for mobile (left to A, then directly to PC) */
          .leg-b-left { animation: legBLeftMobile 6.5s ease-in-out forwards; }
          .leg-b-right { animation: legBRightMobile 6.5s ease-in-out forwards; }
          @keyframes legBLeftMobile {
            0%, 18% { transform: rotate(0deg); }
            /* Walk left to meet A */
            20% { transform: rotate(15deg); }
            22% { transform: rotate(-15deg); }
            24% { transform: rotate(15deg); }
            25% { transform: rotate(0deg); }
            /* Idle during handoff + processing */
            40% { transform: rotate(0deg); }
            /* Walk right directly to PC (longer walk) */
            44% { transform: rotate(-15deg); }
            48% { transform: rotate(15deg); }
            52% { transform: rotate(-15deg); }
            56% { transform: rotate(15deg); }
            60% { transform: rotate(-15deg); }
            64% { transform: rotate(15deg); }
            68% { transform: rotate(-15deg); }
            70% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes legBRightMobile {
            0%, 18% { transform: rotate(0deg); }
            /* Walk left (opposite phase) */
            20% { transform: rotate(-15deg); }
            22% { transform: rotate(15deg); }
            24% { transform: rotate(-15deg); }
            25% { transform: rotate(0deg); }
            /* Idle during handoff + processing */
            40% { transform: rotate(0deg); }
            /* Walk right directly to PC (opposite phase) */
            44% { transform: rotate(15deg); }
            48% { transform: rotate(-15deg); }
            52% { transform: rotate(15deg); }
            56% { transform: rotate(-15deg); }
            60% { transform: rotate(15deg); }
            64% { transform: rotate(-15deg); }
            68% { transform: rotate(15deg); }
            70% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }

          /* Robot B arms on mobile - receive AND carry with left arm only (no hand switching) */
          .arm-b-left { animation: armBLeftMobile 6.5s ease-in-out forwards; }
          .arm-b-right { animation: armBRightMobile 6.5s ease-in-out forwards; }
          @keyframes armBLeftMobile {
            0%, 24% { transform: rotate(0deg); }
            /* Reach to receive from A */
            28% { transform: rotate(-45deg); }
            /* Hold orb while walking - same arm, stays extended */
            32%, 70% { transform: rotate(-30deg); }
            /* Extend more to insert into PC */
            76%, 82% { transform: rotate(-45deg); }
            /* Celebrate - arm up */
            88%, 100% { transform: rotate(-60deg); }
          }
          @keyframes armBRightMobile {
            /* Right arm just does a small celebration wave at the end */
            0%, 82% { transform: rotate(0deg); }
            88%, 100% { transform: rotate(20deg); }
          }

          /* Mobile orb - override wrapper animation for simplified 2-robot flow */
          .mystic-orb-wrapper {
            animation: orbMoveMobile 6.5s linear forwards !important;
            will-change: left, bottom;
            transform: translateZ(0);
          }
          @keyframes orbMoveMobile {
            /* Start with Robot A at 0% - orb in A's right hand */
            0%, 5% {
              left: 4%;
              bottom: 24px;
              opacity: 1;
            }
            /* A walks toward B (A goes from 0% to 25%) - orb follows A smoothly */
            22% {
              left: 28%;
              bottom: 24px;
              opacity: 1;
            }
            /* Handoff moment - orb goes to B's left hand (B is at 42%, orb on left side = 40%) */
            28% {
              left: 40%;
              bottom: 28px;
              opacity: 1;
            }
            /* B holds orb in left hand - stays ~2% left of B's center consistently */
            /* B at 42% -> orb at 40% */
            32%, 40% {
              left: 40%;
              bottom: 28px;
              opacity: 1;
            }
            /* B walks to PC (42% -> 75%) - orb stays 2% left of B */
            /* B at 75% -> orb at 73% */
            70% {
              left: 73%;
              bottom: 28px;
              opacity: 1;
            }
            /* B extends left arm to insert into PC */
            76% {
              left: 80%;
              bottom: 30px;
              opacity: 1;
            }
            /* Orb enters PC slot */
            82%, 100% {
              left: 88%;
              bottom: 32px;
              opacity: 1;
            }
          }

          /* Mobile: Keep orb yellow (no green transition) - goes red -> yellow only */
          .orb-core {
            animation: orbCoreColorMobile 6.5s ease-in-out forwards !important;
          }
          @keyframes orbCoreColorMobile {
            0%, 32% {
              background: radial-gradient(circle at 30% 30%,
                rgba(255, 150, 150, 0.95) 0%,
                rgba(255, 77, 77, 0.9) 40%,
                rgba(180, 30, 30, 0.85) 100%
              );
              box-shadow: 0 0 12px rgba(255, 77, 77, 0.8), inset 0 0 8px rgba(255, 200, 200, 0.4);
            }
            36%, 100% {
              background: radial-gradient(circle at 30% 30%,
                rgba(255, 255, 180, 0.95) 0%,
                rgba(255, 204, 0, 0.9) 40%,
                rgba(200, 150, 0, 0.85) 100%
              );
              box-shadow: 0 0 15px rgba(255, 204, 0, 0.9), inset 0 0 10px rgba(255, 255, 200, 0.5);
            }
          }

          .orb-glow-ring {
            animation: orbGlowRingMobile 6.5s ease-in-out forwards, orbRingSpin 3s linear infinite !important;
          }
          @keyframes orbGlowRingMobile {
            0%, 32% {
              border-color: rgba(255, 77, 77, 0.7);
              box-shadow: 0 0 10px rgba(255, 77, 77, 0.5), inset 0 0 6px rgba(255, 77, 77, 0.2);
            }
            36%, 100% {
              border-color: rgba(255, 204, 0, 0.8);
              box-shadow: 0 0 12px rgba(255, 204, 0, 0.6), inset 0 0 8px rgba(255, 204, 0, 0.3);
            }
          }

          .rune-1, .rune-2, .rune-3 {
            animation-name: runeOrbit1, runeColorMobile !important;
          }
          .rune-2 {
            animation-name: runeOrbit2, runeColorMobile !important;
          }
          .rune-3 {
            animation-name: runeOrbit3, runeColorMobile !important;
          }
          @keyframes runeColorMobile {
            0%, 32% { color: rgba(255, 120, 120, 0.9); text-shadow: 0 0 6px rgba(255, 77, 77, 0.8); }
            36%, 100% { color: rgba(255, 230, 120, 0.9); text-shadow: 0 0 6px rgba(255, 204, 0, 0.8); }
          }

          .wisp-1, .wisp-2 {
            animation-name: wispFloat1, wispColorMobile !important;
          }
          .wisp-2 {
            animation-name: wispFloat2, wispColorMobile !important;
          }
          @keyframes wispColorMobile {
            0%, 32% { background: rgba(255, 77, 77, 0.8); }
            36%, 100% { background: rgba(255, 204, 0, 0.8); }
          }

          /* No flash on green since we skip green */
          .mystic-orb::after {
            animation: orbTransformFlashMobile 6.5s ease-out forwards !important;
          }
          @keyframes orbTransformFlashMobile {
            0%, 34%, 38%, 100% { opacity: 0; transform: scale(1); }
            35% { opacity: 0.9; transform: scale(1.4); }
            36% { opacity: 0; transform: scale(1.6); }
          }
        }

        /* Pause animations when not in view */
        .paused .robot-stage * {
          animation-play-state: paused !important;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .robot-stage * {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}

// Scanline effect
function Scanline({ progress }: { progress: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-30"
      style={{
        left: `${progress * 100}%`,
        background: "linear-gradient(180deg, rgba(167, 139, 250, 0.6) 0%, #a78bfa 50%, rgba(167, 139, 250, 0.6) 100%)",
        boxShadow: `
          0 0 15px rgba(167, 139, 250, 0.8),
          0 0 30px rgba(167, 139, 250, 0.4)
        `,
      }}
    >
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{
          background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{
          background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// Progress indicator bar
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden rounded-b-2xl">
      <motion.div
        className="h-full rounded-full"
        style={{
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #22d3ee 100%)",
          boxShadow: progress > 0.1 ? "0 0 10px rgba(167, 139, 250, 0.6)" : "none",
        }}
      />
    </div>
  );
}

// PRIEŠ/PO pill - uses motion value directly for perfect sync with scanline
function ProgressPill({ progress }: { progress: MotionValue<number> }) {
  // Transform progress to width percentage string
  const widthPercent = useTransform(progress, (v) => `${v * 100}%`);
  // Transform progress to PRIEŠ opacity
  const priesOpacity = useTransform(progress, (v) => Math.max(0.4, 1 - v));
  // Transform progress to PO opacity
  const poOpacity = useTransform(progress, (v) => Math.max(0.4, v));
  // Transform progress to PRIEŠ color
  const priesColor = useTransform(progress, (v) =>
    v < 0.5 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"
  );
  // Transform progress to PO color
  const poColor = useTransform(progress, (v) =>
    v > 0.5 ? "#a78bfa" : "rgba(255,255,255,0.4)"
  );

  return (
    <div
      className="absolute top-2.5 right-2.5 flex items-center gap-2 text-[9px] z-40 px-2.5 py-1.5 rounded-lg"
      style={{
        background: "rgba(0, 0, 0, 0.15)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255, 255, 255, 0.03)",
      }}
    >
      <motion.span
        className="font-bold"
        style={{ opacity: priesOpacity, color: priesColor }}
      >
        PRIEŠ
      </motion.span>
      <div className="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          style={{ width: widthPercent }}
        />
      </div>
      <motion.span
        className="font-bold"
        style={{ opacity: poOpacity, color: poColor }}
      >
        PO
      </motion.span>
    </div>
  );
}

export default function Step2Visual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, { stiffness: 180, damping: 25 });

  const [displayProgress, setDisplayProgress] = useState(0);
  const [rawProgress, setRawProgress] = useState(0);
  const [isInView, setIsInView] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection for faster animation timing
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync smoothProgress to state for content transitions (opacity fades)
  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (v) => {
      setDisplayProgress(v);
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  // Sync raw progress for snappy UI elements (scanline, progress bar)
  useEffect(() => {
    const unsubscribe = progress.on("change", (v) => {
      setRawProgress(v);
    });
    return () => unsubscribe();
  }, [progress]);

  // Reduced motion check
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // IntersectionObserver for visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Track if this is the first time coming into view
  const [hasStarted, setHasStarted] = useState(false);

  // Reset animation when coming into view for the first time or after being out of view
  useEffect(() => {
    if (isInView && !hasStarted) {
      // First time in view - reset to start
      progress.jump(0);
      smoothProgress.jump(0);
      setHasStarted(true);
    } else if (!isInView && hasStarted) {
      // Left view - mark as not started so it resets next time
      setHasStarted(false);
    }
  }, [isInView, hasStarted, progress, smoothProgress]);

  // Automatic endless loop: 0 -> 1 (animate) -> pause 5s -> instant reset to 0 -> repeat
  // Mobile: faster animation (~8s total vs ~12.5s desktop)
  useEffect(() => {
    if (!isInView || prefersReducedMotion || !hasStarted) return;

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    // Mobile: 0.003 increment = ~8.3s total, Desktop: 0.002 = ~12.5s
    const progressIncrement = isMobile ? 0.003 : 0.002;
    // Mobile: shorter pause (4s vs 6s)
    const endPause = isMobile ? 4000 : 6000;
    // Mobile: shorter initial delay (1s vs 1.5s) - show "before" less
    const initialDelay = isMobile ? 1000 : 1500;

    const animateForward = () => {
      intervalId = setInterval(() => {
        const current = progress.get();

        if (current >= 1) {
          // Reached 100%, stop and pause
          clearInterval(intervalId);
          timeoutId = setTimeout(() => {
            // Instant reset to 0 - jump both progress and smoothProgress
            progress.jump(0);
            smoothProgress.jump(0);
            // Start animating forward again after a brief moment
            timeoutId = setTimeout(animateForward, 100);
          }, endPause);
        } else {
          // Animate forward
          progress.set(Math.min(1, current + progressIncrement));
        }
      }, 25);
    };

    // Start with a delay to show "before" state
    timeoutId = setTimeout(animateForward, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isInView, prefersReducedMotion, hasStarted, isMobile, progress, smoothProgress]);

  // Calculate opacities for states
  // BEFORE state stays fully visible until progress 0.19, then INSTANTLY disappears at 0.20
  // Robots appear at 0.20 - instant cut, no fade, no duplicate elements visible
  // PO (After) appears INSTANTLY at 0.78 - right after transition elements fade out (no gap)
  const beforeOpacity = useTransform(smoothProgress, [0.19, 0.20], [1, 0]);
  const afterOpacity = useTransform(smoothProgress, [0.77, 0.78], [0, 1]);

  const [beforeOp, setBeforeOp] = useState(1);
  const [afterOp, setAfterOp] = useState(0);

  useEffect(() => {
    const unsubBefore = beforeOpacity.on("change", setBeforeOp);
    const unsubAfter = afterOpacity.on("change", setAfterOp);
    return () => { unsubBefore(); unsubAfter(); };
  }, [beforeOpacity, afterOpacity]);

  const finalProgress = prefersReducedMotion ? 1 : displayProgress;
  const snappyProgress = prefersReducedMotion ? 1 : rawProgress;

  return (
    <div className="relative aspect-[4/3]">
      {/* Stacked cards behind for depth */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          transform: "translate(16px, 16px) rotate(2deg)",
          background: "linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(15, 15, 35, 0.8) 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      />
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          transform: "translate(8px, 8px) rotate(1deg)",
          background: "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(15, 15, 35, 0.9) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      />

      {/* Main card */}
      <div
        ref={containerRef}
        className={`relative h-full rounded-2xl overflow-hidden ${isInView ? '' : 'paused'}`}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Inner glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 30%)",
          }}
        />

        {/* Before state */}
        <BeforeState opacity={prefersReducedMotion ? 0 : beforeOp} />

        {/* Chaos layer - explosive error popups during BEFORE phase */}
        {!prefersReducedMotion && (
          <BeforeChaosLayer
            isVisible={beforeOp > 0.5}
            isInView={isInView}
          />
        )}

        {/* Transition elements */}
        {!prefersReducedMotion && <TransitionElements progress={finalProgress} />}

        {/* Explosion animation removed - robots take over directly after SISTEMA UŽSTRIGO */}
        {/* {!prefersReducedMotion && <GlassShatterTransition progress={progress} />} */}

        {/* Automation overlay (robots) - shows immediately after chaos ends */}
        {!prefersReducedMotion && <AutomationOverlay progress={progress} />}

        {/* Energy connection - particles flowing from holo card to dashboard */}
        {!prefersReducedMotion && <EnergyConnection progress={finalProgress} />}

        {/* After state */}
        <AfterState opacity={prefersReducedMotion ? 1 : afterOp} progress={finalProgress} />

        {/* Scanline */}
        {!prefersReducedMotion && snappyProgress > 0.01 && snappyProgress < 0.99 && (
          <Scanline progress={snappyProgress} />
        )}

        {/* Progress bar */}
        <ProgressBar progress={snappyProgress} />

        {/* Header badge - simple label */}
        <div
          className="absolute top-1 left-2.5 flex items-center gap-1.5 z-40 px-2 py-1.5 rounded-lg"
          style={{
            background: "rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.03)",
          }}
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.4) 0%, rgba(124, 58, 237, 0.3) 100%)",
              border: "1px solid rgba(167, 139, 250, 0.4)",
            }}
          >
            <svg className="w-2.5 h-2.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-[8px] font-bold text-white/70">
            Transformacija
          </span>
        </div>

        {/* Before/After labels - always visible above all content */}
        <ProgressPill progress={progress} />
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        .live-pulse span:first-child {
          animation: live-dot 1.5s ease-in-out infinite;
        }
        @keyframes live-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .paused .live-pulse span:first-child {
          animation: none;
        }

        /* ═══════════════════════════════════════════════════════════════
           PO DASHBOARD - Fixed Layout (No Overlap)
           Flexbox column layout with proper grid sections
           ═══════════════════════════════════════════════════════════════ */

        .po-dashboard {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: 100%;
          box-sizing: border-box;
        }

        /* ─────────────────────────────────────────────────────────────────
           KPI GRID - 3 columns desktop, 1 column mobile
           ───────────────────────────────────────────────────────────────── */
        .po-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .po-kpi-card {
          min-width: 0;
          overflow: hidden;
          padding: 8px 6px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center;
        }
        .po-kpi-label {
          font-size: 7px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .po-kpi-value {
          font-size: 18px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
          margin-bottom: 3px;
          white-space: nowrap;
        }
        .po-kpi-green { color: #34d399; }
        .po-kpi-purple { color: #a78bfa; }
        .po-kpi-cyan { color: #22d3ee; }
        .po-kpi-delta {
          font-size: 6px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        .po-delta-up { color: rgba(52, 211, 153, 0.8); }
        .po-kpi-status {
          margin-top: 2px;
        }
        .po-status-pill {
          display: inline-block;
          font-size: 6px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }
        .po-status-ok {
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
        }

        /* ─────────────────────────────────────────────────────────────────
           CHART SECTION - Fixed height block
           ───────────────────────────────────────────────────────────────── */
        .po-chart-card {
          min-width: 0;
          overflow: visible;
          min-height: 72px;
          padding: 6px 8px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .po-chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
          gap: 8px;
        }
        .po-chart-title {
          font-size: 9px;
          color: rgba(255,255,255,0.8);
          font-weight: 800;
          white-space: nowrap;
        }
        .po-chart-toggle {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 7px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .po-toggle-active {
          color: #34d399;
          padding: 2px 4px;
          background: rgba(52, 211, 153, 0.15);
          border-radius: 3px;
        }
        .po-toggle-divider {
          color: rgba(255,255,255,0.2);
        }
        .po-toggle-inactive {
          color: rgba(255,255,255,0.35);
        }
        .po-chart-line {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: poChartDraw 1.5s ease forwards;
        }
        .po-chart-marker {
          animation: poMarkerPulse 2s ease-in-out infinite;
        }
        @keyframes poChartDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes poMarkerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .po-chart-container {
          position: relative;
          width: 100%;
          padding-bottom: 2px;
        }
        .po-chart-xaxis {
          font-size: 5px;
          fill: rgba(255,255,255,0.35);
          font-weight: 500;
          text-anchor: middle;
        }
        .po-chart-annotation {
          position: absolute;
          font-size: 5px;
          font-weight: 600;
          color: rgba(52, 211, 153, 0.85);
          white-space: nowrap;
          background: rgba(0,0,0,0.6);
          padding: 1px 3px;
          border-radius: 2px;
          pointer-events: none;
        }
        /* Position each annotation to avoid overlap */
        .po-anno-1 {
          top: 58%;
          left: 8%;
        }
        .po-anno-2 {
          top: 28%;
          left: 36%;
        }
        .po-anno-3 {
          top: 8%;
          left: 50%;
        }
        .po-anno-4 {
          top: -8%;
          left: 82%;
        }

        /* ─────────────────────────────────────────────────────────────────
           BOTTOM GRID - 2 columns desktop, 1 column mobile
           ───────────────────────────────────────────────────────────────── */
        .po-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }
        .po-panel {
          min-width: 0;
          overflow: visible;
          min-height: 90px;
          padding: 6px 8px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
        }
        .po-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
          gap: 4px;
        }
        .po-panel-title {
          font-size: 8px;
          color: rgba(255,255,255,0.7);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .po-panel-live {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 6px;
          font-weight: 800;
          color: #34d399;
          flex-shrink: 0;
        }
        .po-live-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 4px rgba(52, 211, 153, 0.8);
          animation: poLivePulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes poLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
        .po-panel-footer {
          margin-top: auto;
          padding-top: 3px;
        }
        .po-warning-pill {
          display: inline-block;
          font-size: 5px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 8px;
          background: rgba(251, 146, 60, 0.12);
          color: #fb923c;
          white-space: nowrap;
        }

        /* Automations list */
        .po-auto-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-height: 0;
          overflow: visible;
        }
        .po-auto-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 4px;
          border-radius: 4px;
          background: rgba(255,255,255,0.02);
          animation: poRowSlide 0.4s ease backwards;
          min-width: 0;
        }
        @keyframes poRowSlide {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .po-auto-left {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }
        .po-auto-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .po-dot-live {
          background: #34d399;
          box-shadow: 0 0 3px rgba(52, 211, 153, 0.6);
        }
        .po-dot-warn {
          background: #fb923c;
          box-shadow: 0 0 3px rgba(251, 146, 60, 0.6);
        }
        .po-auto-name {
          font-size: 8px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .po-auto-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .po-auto-saved {
          font-size: 7px;
          font-weight: 800;
          color: #34d399;
          white-space: nowrap;
        }
        .po-auto-time {
          font-size: 5px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          white-space: nowrap;
        }

        /* Fixed issues list */
        .po-fixed-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .po-fixed-row {
          animation: poRowSlide 0.4s ease backwards;
          min-width: 0;
        }
        .po-fixed-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
          gap: 4px;
        }
        .po-fixed-label {
          font-size: 8px;
          font-weight: 700;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
        .po-fixed-saved {
          font-size: 8px;
          font-weight: 800;
          color: #34d399;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .po-fixed-bar {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .po-fixed-fill {
          height: 100%;
          background: linear-gradient(90deg, rgba(52, 211, 153, 0.4) 0%, rgba(52, 211, 153, 0.2) 100%);
          border-radius: 2px;
        }

        /* ─────────────────────────────────────────────────────────────────
           ACTIVITY FEED - Bottom section
           ───────────────────────────────────────────────────────────────── */
        .po-activity {
          min-width: 0;
          overflow: hidden;
          padding: 5px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .po-activity-header {
          margin-bottom: 3px;
        }
        .po-activity-title {
          font-size: 7px;
          color: rgba(255,255,255,0.6);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .po-activity-rows {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .po-activity-row {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 1px 0;
          animation: poRowSlide 0.3s ease backwards;
          min-width: 0;
        }
        .po-activity-check {
          font-size: 8px;
          color: #34d399;
          flex-shrink: 0;
          width: 10px;
          text-align: center;
        }
        .po-activity-text {
          flex: 1;
          font-size: 7px;
          font-weight: 700;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .po-activity-time {
          font-size: 6px;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          flex-shrink: 0;
          white-space: nowrap;
        }

        /* ═══════════════════════════════════════════════════════════════
           ENERGY CONNECTION - Holo card to PO dashboard transition
           ═══════════════════════════════════════════════════════════════ */

        /* Energy beams radiating from bottom-right corner */
        .energy-beam-container {
          position: absolute;
          bottom: 15%;
          right: 8%;
          width: 200px;
          height: 200px;
          pointer-events: none;
        }
        .energy-beam {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 300%;
          height: 2px;
          transform-origin: right center;
          background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.6), rgba(167, 139, 250, 0.4), transparent);
          animation: energyBeamSweep 1.2s ease-out forwards;
        }
        .energy-beam-1 { transform: rotate(-15deg); animation-delay: 0s; }
        .energy-beam-2 { transform: rotate(-35deg); animation-delay: 0.1s; height: 1.5px; }
        .energy-beam-3 { transform: rotate(-55deg); animation-delay: 0.2s; height: 1px; }
        @keyframes energyBeamSweep {
          0% { width: 0; opacity: 0; }
          20% { opacity: 1; }
          100% { width: 400%; opacity: 0; }
        }

        /* Floating energy particles */
        .energy-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px rgba(52, 211, 153, 0.8), 0 0 16px rgba(52, 211, 153, 0.4);
          animation: energyParticleFloat 1.5s ease-out forwards;
        }
        .ep-1 { bottom: 20%; right: 12%; animation-delay: 0s; }
        .ep-2 { bottom: 25%; right: 18%; animation-delay: 0.08s; }
        .ep-3 { bottom: 18%; right: 22%; animation-delay: 0.16s; }
        .ep-4 { bottom: 30%; right: 15%; animation-delay: 0.24s; }
        .ep-5 { bottom: 22%; right: 25%; animation-delay: 0.32s; background: #a78bfa; box-shadow: 0 0 8px rgba(167, 139, 250, 0.8), 0 0 16px rgba(167, 139, 250, 0.4); }
        .ep-6 { bottom: 35%; right: 20%; animation-delay: 0.4s; }
        .ep-7 { bottom: 28%; right: 28%; animation-delay: 0.48s; background: #22d3ee; box-shadow: 0 0 8px rgba(34, 211, 238, 0.8), 0 0 16px rgba(34, 211, 238, 0.4); }
        .ep-8 { bottom: 15%; right: 30%; animation-delay: 0.56s; }
        @keyframes energyParticleFloat {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            transform: translate(-20px, -10px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-150px, -80px) scale(0.3);
            opacity: 0;
          }
        }

        /* Central activation pulse ring */
        .energy-pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid rgba(52, 211, 153, 0.5);
          transform: translate(-50%, -50%) scale(0);
          animation: energyPulseExpand 1s ease-out forwards;
          animation-delay: 0.3s;
        }
        @keyframes energyPulseExpand {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
            border-width: 3px;
          }
          100% {
            transform: translate(-50%, -50%) scale(8);
            opacity: 0;
            border-width: 0.5px;
          }
        }

        /* Data stream SVG paths */
        .data-stream-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: dataStreamDraw 1.2s ease-out forwards;
        }
        .ds-1 { animation-delay: 0.1s; }
        .ds-2 { animation-delay: 0.25s; }
        .ds-3 { animation-delay: 0.4s; }
        @keyframes dataStreamDraw {
          0% { stroke-dashoffset: 400; opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }

        /* ═══════════════════════════════════════════════════════════════
           PO DASHBOARD - MOBILE OVERRIDES
           Stack to single column, compact sizing, no overflow
           ═══════════════════════════════════════════════════════════════ */
        @media (max-width: 639px) {
          .po-dashboard {
            padding: 6px;
            padding-top: 28px;
            gap: 6px;
          }

          /* KPI grid - stays 3 columns but more compact */
          .po-kpi-grid {
            gap: 4px;
          }
          .po-kpi-card {
            padding: 5px 3px;
          }
          .po-kpi-label {
            font-size: 5px;
            margin-bottom: 2px;
          }
          .po-kpi-value {
            font-size: 12px;
            margin-bottom: 2px;
          }
          .po-kpi-delta {
            font-size: 4px;
          }
          .po-status-pill {
            font-size: 4px;
            padding: 1px 3px;
          }

          /* Chart - compact */
          .po-chart-card {
            padding: 4px 6px;
            min-height: 50px;
          }
          .po-chart-title {
            font-size: 7px;
          }
          .po-chart-toggle {
            font-size: 5px;
            gap: 2px;
          }
          .po-toggle-active {
            padding: 1px 3px;
          }
          .po-chart-annotation {
            font-size: 4px;
            padding: 1px 2px;
          }

          /* Bottom grid - stack to single column */
          .po-bottom-grid {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          .po-panel {
            padding: 5px 6px;
            min-height: 60px;
          }
          .po-panel-title {
            font-size: 6px;
          }
          .po-panel-live {
            font-size: 4px;
            gap: 2px;
          }
          .po-live-dot {
            width: 3px;
            height: 3px;
          }
          .po-auto-list {
            gap: 2px;
          }
          .po-auto-row {
            padding: 2px 3px;
          }
          .po-auto-dot {
            width: 3px;
            height: 3px;
          }
          .po-auto-name {
            font-size: 6px;
          }
          .po-auto-saved {
            font-size: 5px;
          }
          .po-fixed-list {
            gap: 3px;
          }
          .po-fixed-label {
            font-size: 6px;
          }
          .po-fixed-saved {
            font-size: 6px;
          }
          .po-fixed-bar {
            height: 2px;
          }

          /* Activity feed - compact */
          .po-activity {
            padding: 4px 6px;
          }
          .po-activity-title {
            font-size: 5px;
          }
          .po-activity-rows {
            gap: 1px;
          }
          .po-activity-check {
            font-size: 6px;
            width: 8px;
          }
          .po-activity-text {
            font-size: 5px;
          }
          .po-activity-time {
            font-size: 4px;
          }
        }
      `}</style>
    </div>
  );
}
