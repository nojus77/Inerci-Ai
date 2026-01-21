"use client";

/**
 * Step1Visual.tsx - Futuristic Audit Scanner (Performance Optimized)
 *
 * OPTIMIZATIONS:
 * - CSS keyframes instead of useAnimationFrame
 * - IntersectionObserver to pause animations when offscreen
 * - Reduced backdrop-blur usage
 * - React.memo for sub-components
 * - Removed continuous JS loops
 */

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";

// ============ CONFIGURATION ============
const SCAN_DURATION = 7; // Full cycle duration in seconds (scan + process + result)
const PARALLAX_MAX_TILT = 5;
const PARALLAX_MAX_SHIFT = 8;

// Process workflow nodes
const WORKFLOW_NODES = [
  { id: 1, x: 12, y: 25, label: "Užklausa", lane: 0 },
  { id: 2, x: 30, y: 18, label: "Apdorojimas", lane: 0 },
  { id: 3, x: 50, y: 28, label: "Tikrinimas", lane: 0, isBottleneck: true },
  { id: 4, x: 70, y: 20, label: "Patvirtinimas", lane: 0 },
  { id: 5, x: 88, y: 25, label: "Archyvas", lane: 0 },
  { id: 6, x: 25, y: 52, label: "Duomenys", lane: 1 },
  { id: 7, x: 50, y: 58, label: "Ataskaita", lane: 1 },
  { id: 8, x: 75, y: 52, label: "Siuntimas", lane: 1 },
];

const NODE_CONNECTIONS = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 2, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 3, to: 7 },
];

const AUDIT_FINDINGS = [
  { id: 1, text: "Sąskaitų rūšiavimas", severity: "high", nodeId: 3 },
  { id: 2, text: "Neoptimizuotas CRM", severity: "high", nodeId: 2 },
  { id: 3, text: "48h Švaistomo laiko/sav.", severity: "medium", nodeId: 7 },
];

const FAINT_TOOLS = [
  { id: "email", x: 8, y: 75, icon: "email" },
  { id: "crm", x: 22, y: 82, icon: "crm" },
  { id: "sheets", x: 78, y: 82, icon: "sheets" },
  { id: "calendar", x: 92, y: 75, icon: "calendar" },
];

// Memoized workflow node component
const WorkflowNode = memo(function WorkflowNode({
  node,
  isInView,
  reducedMotion,
  index,
}: {
  node: typeof WORKFLOW_NODES[number];
  isInView: boolean;
  reducedMotion: boolean;
  index: number;
}) {
  const isBottleneck = node.isBottleneck;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${node.x}%`,
        top: `${node.y + 8}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 20,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.06 }}
    >
      <div
        className={`relative w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center border ${
          isBottleneck
            ? "bg-gradient-to-br from-red-500/40 to-orange-500/30 border-red-400/50"
            : "bg-gradient-to-br from-purple-500/30 to-indigo-500/20 border-purple-400/30"
        } ${isBottleneck && isInView && !reducedMotion ? "animate-bottleneck-pulse" : ""}`}
      >
        {isBottleneck ? (
          <svg
            className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ) : (
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-400/60" />
        )}
      </div>
      <span
        className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[6px] md:text-[7px] font-medium whitespace-nowrap ${
          isBottleneck ? "text-red-300/80" : "text-white/50"
        }`}
      >
        {node.label}
      </span>
    </motion.div>
  );
});

// Memoized audit finding component
const AuditFinding = memo(function AuditFinding({
  finding,
}: {
  finding: typeof AUDIT_FINDINGS[number];
}) {
  const severityColor = finding.severity === "high" ? "red" : "amber";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-3 h-3 rounded flex items-center justify-center flex-shrink-0 ${
          severityColor === "red"
            ? "border border-red-400/50 bg-red-400/20"
            : "border border-amber-400/50 bg-amber-400/20"
        }`}
      >
        {severityColor === "red" ? (
          <svg className="w-2 h-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-2 h-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <span className="text-[7px] text-white/50 whitespace-nowrap">{finding.text}</span>
    </div>
  );
});

export default function Step1Visual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // IntersectionObserver to pause animations when offscreen
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Mouse position for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20 };
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [PARALLAX_MAX_TILT, -PARALLAX_MAX_TILT]), springConfig);
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-PARALLAX_MAX_TILT, PARALLAX_MAX_TILT]), springConfig);
  const shiftX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-PARALLAX_MAX_SHIFT, PARALLAX_MAX_SHIFT]), springConfig);
  const shiftY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-PARALLAX_MAX_SHIFT, PARALLAX_MAX_SHIFT]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || reducedMotion) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY, reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Memoize node positions for connections
  const nodePositions = useMemo(() => {
    const positions: Record<number, { x: number; y: number }> = {};
    WORKFLOW_NODES.forEach((node) => {
      positions[node.id] = { x: node.x, y: node.y };
    });
    return positions;
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden cursor-default"
      style={{
        background: "linear-gradient(135deg, #0a0a14 0%, #12121f 50%, #0a0a14 100%)",
        perspective: "1000px",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* CSS for animations - only active when in view */}
      <style jsx>{`
        @keyframes scanner-sweep {
          0%, 100% { transform: translateY(5%); opacity: 0; }
          5% { opacity: 0.85; }
          45% { transform: translateY(95%); opacity: 0.85; }
          50% { transform: translateY(95%); opacity: 0; }
        }
        @keyframes bottleneck-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          50% { box-shadow: 0 0 10px 3px rgba(239, 68, 68, 0.3); }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-scanner { animation: scanner-sweep ${SCAN_DURATION}s ease-in-out infinite; }
        .animate-bottleneck-pulse { animation: bottleneck-pulse 2.5s ease-in-out infinite; }
        .animate-star { animation: star-twinkle 3s ease-in-out infinite; }
        .animate-rotate { animation: rotate-slow 4s linear infinite; }
        .paused { animation-play-state: paused; }
      `}</style>

      {/* Tilt wrapper */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX: reducedMotion ? 0 : tiltX,
          rotateY: reducedMotion ? 0 : tiltY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Background ambient glows - static, no animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-[80px]"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
              x: shiftX,
              y: shiftY,
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-[60px]"
            style={{
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Star particles - CSS animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-[2px] h-[2px] rounded-full bg-white/20 ${isInView && !reducedMotion ? "animate-star" : ""}`}
              style={{
                left: `${8 + (i * 10) % 85}%`,
                top: `${12 + (i * 12) % 75}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Main glass panel - single backdrop-blur */}
        <motion.div
          className="absolute inset-3 md:inset-4 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)",
            x: useTransform(shiftX, (v) => v * 0.5),
            y: useTransform(shiftY, (v) => v * 0.5),
          }}
        >
          {/* Panel header */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-white/5 flex items-center px-3 gap-1.5 z-20">
            <div className="w-2 h-2 rounded-full bg-red-400/50" />
            <div className="w-2 h-2 rounded-full bg-amber-400/50" />
            <div className="w-2 h-2 rounded-full bg-green-400/50" />
            <span className="ml-3 text-[9px] text-white/30 font-medium tracking-widest uppercase">
              Procesų Analizė
            </span>
          </div>

          {/* SVG Layer - connections and scanner */}
          <svg
            className="absolute top-7 left-0 right-0 bottom-0 w-full"
            style={{ height: 'calc(100% - 28px)' }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="20%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.9" />
                <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
              <filter id="scanGlow" x="-50%" y="-200%" width="200%" height="500%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines */}
            {NODE_CONNECTIONS.map((conn, i) => {
              const from = nodePositions[conn.from];
              const to = nodePositions[conn.to];
              if (!from || !to) return null;

              return (
                <motion.line
                  key={`conn-${i}`}
                  x1={from.x}
                  y1={from.y + 8}
                  x2={to.x}
                  y2={to.y + 8}
                  stroke="url(#connGrad)"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.08 }}
                />
              );
            })}

            {/* Scanner beam - CSS animation */}
            {!reducedMotion && isInView && (
              <g className="animate-scanner">
                <rect x="0" y="0" width="100" height="0.8" fill="url(#scanBeamGrad)" filter="url(#scanGlow)" />
                <rect x="0" y="0.3" width="100" height="0.2" fill="#a78bfa" opacity="0.9" />
                <rect x="0" y="-3" width="100" height="4" fill="url(#scanBeamGrad)" opacity="0.3" />
              </g>
            )}
          </svg>

          {/* Workflow nodes - memoized */}
          {WORKFLOW_NODES.map((node, i) => (
            <WorkflowNode
              key={node.id}
              node={node}
              isInView={isInView}
              reducedMotion={reducedMotion}
              index={i}
            />
          ))}

          {/* Faint tool icons */}
          {FAINT_TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="absolute opacity-20"
              style={{
                left: `${tool.x}%`,
                top: `${tool.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {tool.icon === "email" && (
                <svg className="w-3 h-3 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              {tool.icon === "crm" && (
                <svg className="w-3 h-3 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {tool.icon === "sheets" && (
                <svg className="w-3 h-3 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {tool.icon === "calendar" && (
                <svg className="w-3 h-3 text-pink-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          ))}

          {/* Outcome pill - static result display */}
          <div
            className="absolute bottom-2 md:bottom-3 left-3 md:left-4 px-2.5 py-2 rounded-lg"
            style={{
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[8px] text-green-300/60 font-medium">Potenciali nauda</span>
                <span className="text-[10px] md:text-[11px] text-green-400 font-bold">+48h / savaitę</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AUDITAS Panel - single blur layer */}
        <motion.div
          className="absolute top-2 right-2 md:top-4 md:right-4 rounded-lg p-2 z-30"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[8px] text-white/50 font-medium tracking-wide">AUDITAS</span>
          </div>

          <div className="space-y-1.5">
            {AUDIT_FINDINGS.map((finding) => (
              <AuditFinding key={finding.id} finding={finding} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
