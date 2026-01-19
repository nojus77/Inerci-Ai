"use client";

/**
 * Step1Visual.tsx - Futuristic Audit Scanner
 *
 * Premium animated visual for Step 1 "Problemų Identifikavimas"
 * Tells the story: Scan workflows → Detect bottlenecks → Output audit findings
 *
 * Features:
 * - Process map with workflow nodes (left-to-right graph)
 * - Diagonal scanning beam that triggers node detection
 * - Audit findings panel that highlights when scanner hits nodes
 * - Outcome pill showing potential savings (bridge to Step 2)
 * - Faint tool icons (foreshadowing Step 3 integrations)
 * - Mouse parallax tilt + internal shift (desktop only)
 * - Respects prefers-reduced-motion
 */

import { motion, useMotionValue, useTransform, useSpring, useAnimationFrame } from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";

// ============ CONFIGURATION ============
const SCAN_DURATION = 3.5; // Seconds for scan sweep
const PROCESS_DURATION = 1.2; // Seconds for "processing" after scan
const RESULT_DURATION = 2.5; // Seconds to show result before reset
const PARALLAX_MAX_TILT = 5; // Max degrees tilt
const PARALLAX_MAX_SHIFT = 8; // Max pixels internal shift

// Process workflow nodes - arranged as left-to-right graph
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

// Connections between nodes
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

// Audit findings that sync with scanner
const AUDIT_FINDINGS = [
  { id: 1, text: "Sąskaitų rūšiavimas", severity: "high", nodeId: 3 },
  { id: 2, text: "Neoptimizuotas CRM", severity: "high", nodeId: 2 },
  { id: 3, text: "48h Švaistomo laiko/sav.", severity: "medium", nodeId: 7 },
];

// Faint tool icons for foreshadowing Step 3
const FAINT_TOOLS = [
  { id: "email", x: 8, y: 75, icon: "email" },
  { id: "crm", x: 22, y: 82, icon: "crm" },
  { id: "sheets", x: 78, y: 82, icon: "sheets" },
  { id: "calendar", x: 92, y: 75, icon: "calendar" },
];

export default function Step1Visual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [highlightedFinding, setHighlightedFinding] = useState<number | null>(null);
  const [scanPhase, setScanPhase] = useState<"scanning" | "processing" | "result">("scanning");
  const [showOutcome, setShowOutcome] = useState(false);
  const [foundIssuesCount, setFoundIssuesCount] = useState(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Mouse position for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring for tilt
  const springConfig = { stiffness: 150, damping: 20 };
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [PARALLAX_MAX_TILT, -PARALLAX_MAX_TILT]), springConfig);
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-PARALLAX_MAX_TILT, PARALLAX_MAX_TILT]), springConfig);

  // Internal parallax shift
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
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Scanner animation progress (0-1)
  const scanProgress = useMotionValue(0);
  const lastPhaseRef = useRef<"scanning" | "processing" | "result">("scanning");
  const issuesFoundRef = useRef(0);

  // Total cycle time
  const TOTAL_CYCLE = SCAN_DURATION + PROCESS_DURATION + RESULT_DURATION;

  // Animate scanner using frame loop with three phases
  useAnimationFrame((time) => {
    if (reducedMotion) {
      scanProgress.set(0.5);
      return;
    }

    const cycleTime = TOTAL_CYCLE * 1000;
    const t = (time % cycleTime) / 1000;

    // Phase 1: Scanning (0 to SCAN_DURATION)
    if (t < SCAN_DURATION) {
      if (lastPhaseRef.current !== "scanning") {
        lastPhaseRef.current = "scanning";
        setScanPhase("scanning");
        setShowOutcome(false);
        issuesFoundRef.current = 0;
        setFoundIssuesCount(0);
      }

      const progress = t / SCAN_DURATION;
      // Ease out for more deliberate scan feel
      const eased = 1 - Math.pow(1 - progress, 2.5);
      scanProgress.set(eased);

      // Check which node the scanner is passing (5% to 95% range)
      const scanY = 5 + eased * 90;
      const scanX = eased * 100;

      type WorkflowNode = (typeof WORKFLOW_NODES)[number];
      let closestNode: WorkflowNode | null = null;
      let minDist = Infinity;

      for (const node of WORKFLOW_NODES) {
        const nodeScanY = node.y;
        const dist = Math.abs(scanY - nodeScanY) + Math.abs(scanX - node.x) * 0.3;
        if (dist < 15 && dist < minDist) {
          minDist = dist;
          closestNode = node;
        }
      }

      if (closestNode !== null && closestNode.id !== activeNodeId) {
        const nodeId = closestNode.id;
        setActiveNodeId(nodeId);
        const finding = AUDIT_FINDINGS.find((f) => f.nodeId === nodeId);
        if (finding) {
          setHighlightedFinding(finding.id);
          issuesFoundRef.current += 1;
          setFoundIssuesCount(issuesFoundRef.current);
        }
      }
    }
    // Phase 2: Processing (SCAN_DURATION to SCAN_DURATION + PROCESS_DURATION)
    else if (t < SCAN_DURATION + PROCESS_DURATION) {
      if (lastPhaseRef.current !== "processing") {
        lastPhaseRef.current = "processing";
        setScanPhase("processing");
        setActiveNodeId(null);
      }
      // Keep scanner at end position but fade it out
      scanProgress.set(1);
    }
    // Phase 3: Result (remaining time)
    else {
      if (lastPhaseRef.current !== "result") {
        lastPhaseRef.current = "result";
        setScanPhase("result");
        setHighlightedFinding(null);
        setShowOutcome(true);
      }
      scanProgress.set(1);
    }
  });

  // Scanner beam transforms - SVG now starts below header, so use full range
  const scannerY = useTransform(scanProgress, [0, 1], ["5%", "95%"]);
  // Scanner visible during scanning phase, fades during processing
  const scannerOpacity = useTransform(scanProgress, [0, 0.05, 0.9, 1], [0, 0.85, 0.85, 0]);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tilt wrapper */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX: reducedMotion ? 0 : tiltX,
          rotateY: reducedMotion ? 0 : tiltY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Background ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-[80px]"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
              x: shiftX,
              y: shiftY,
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-[60px]"
            style={{
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
              x: useTransform(shiftX, (v) => v * -0.5),
              y: useTransform(shiftY, (v) => v * -0.5),
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full blur-[50px]"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Star particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[2px] h-[2px] rounded-full bg-white/20"
              style={{
                left: `${8 + (i * 7.5) % 85}%`,
                top: `${12 + (i * 11) % 75}%`,
              }}
              animate={reducedMotion ? {} : {
                opacity: [0.15, 0.4, 0.15],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Main glass panel */}
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
          {/* Panel header - z-index above scanner */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-white/5 flex items-center px-3 gap-1.5 z-20">
            <div className="w-2 h-2 rounded-full bg-red-400/50" />
            <div className="w-2 h-2 rounded-full bg-amber-400/50" />
            <div className="w-2 h-2 rounded-full bg-green-400/50" />
            <span className="ml-3 text-[9px] text-white/30 font-medium tracking-widest uppercase">
              Procesų Analizė
            </span>
          </div>

          {/* SVG Layer - connections and nodes - positioned below header */}
          <svg
            className="absolute top-7 left-0 right-0 bottom-0 w-full"
            style={{ height: 'calc(100% - 28px)' }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Connection gradient */}
              <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
              </linearGradient>

              {/* Scanner beam gradient */}
              <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="20%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.9" />
                <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>

              {/* Scanner glow */}
              <filter id="scanGlow" x="-50%" y="-200%" width="200%" height="500%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Node glow for bottleneck */}
              <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
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

            {/* Scanner beam */}
            {!reducedMotion && (
              <motion.g style={{ y: scannerY, opacity: scannerOpacity }}>
                {/* Main beam line */}
                <motion.rect
                  x="0"
                  y="0"
                  width="100"
                  height="0.8"
                  fill="url(#scanBeamGrad)"
                  filter="url(#scanGlow)"
                />
                {/* Leading edge highlight */}
                <rect
                  x="0"
                  y="0.3"
                  width="100"
                  height="0.2"
                  fill="#a78bfa"
                  opacity="0.9"
                />
                {/* Soft trailing glow */}
                <rect
                  x="0"
                  y="-3"
                  width="100"
                  height="4"
                  fill="url(#scanBeamGrad)"
                  opacity="0.3"
                />
              </motion.g>
            )}
          </svg>

          {/* Workflow nodes */}
          {WORKFLOW_NODES.map((node, i) => {
            const isActive = activeNodeId === node.id;
            const isBottleneck = node.isBottleneck;

            return (
              <motion.div
                key={node.id}
                className="absolute"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y + 8}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isActive ? 25 : 20,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
              >
                {/* Node circle */}
                <motion.div
                  className={`relative w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center border backdrop-blur-sm ${
                    isBottleneck
                      ? "bg-gradient-to-br from-red-500/40 to-orange-500/30 border-red-400/50"
                      : "bg-gradient-to-br from-purple-500/30 to-indigo-500/20 border-purple-400/30"
                  }`}
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.15, 1],
                          boxShadow: isBottleneck
                            ? [
                                "0 0 0 0 rgba(239, 68, 68, 0)",
                                "0 0 16px 6px rgba(239, 68, 68, 0.5)",
                                "0 0 8px 2px rgba(239, 68, 68, 0.3)",
                              ]
                            : [
                                "0 0 0 0 rgba(139, 92, 246, 0)",
                                "0 0 16px 6px rgba(139, 92, 246, 0.5)",
                                "0 0 8px 2px rgba(139, 92, 246, 0.3)",
                              ],
                        }
                      : isBottleneck && !reducedMotion
                      ? {
                          boxShadow: [
                            "0 0 0 0 rgba(239, 68, 68, 0)",
                            "0 0 10px 3px rgba(239, 68, 68, 0.3)",
                            "0 0 0 0 rgba(239, 68, 68, 0)",
                          ],
                        }
                      : {}
                  }
                  transition={
                    isActive
                      ? { duration: 0.4 }
                      : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  }
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
                </motion.div>

                {/* Node label */}
                <span
                  className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[6px] md:text-[7px] font-medium whitespace-nowrap ${
                    isBottleneck ? "text-red-300/80" : "text-white/50"
                  }`}
                >
                  {node.label}
                </span>

                {/* Detection flag on active bottleneck */}
                {isActive && isBottleneck && (
                  <motion.div
                    className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-red-500/50 border border-red-400/60"
                    initial={{ opacity: 0, y: 5, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.8 }}
                  >
                    <span className="text-[6px] text-red-200 font-semibold">PROBLEMA</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Faint tool icons (foreshadowing Step 3) */}
          {FAINT_TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="absolute opacity-20 hover:opacity-30 transition-opacity"
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

          {/* Outcome pill - bridges to Step 2 */}
          <motion.div
            className="absolute bottom-2 md:bottom-3 left-3 md:left-4 px-2.5 py-2 rounded-lg overflow-hidden"
            style={{
              background: showOutcome
                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)"
                : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)",
              border: showOutcome ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(34, 197, 94, 0.15)",
              backdropFilter: "blur(8px)",
              boxShadow: showOutcome ? "0 4px 20px rgba(34, 197, 94, 0.25)" : "none",
            }}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{
              opacity: showOutcome ? 1 : 0.5,
              scale: showOutcome ? 1 : 0.95,
              y: showOutcome ? 0 : 5,
            }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1], // Bouncy spring
              delay: showOutcome ? 0 : 0,
            }}
          >
            {/* Processing indicator during processing phase */}
            {scanPhase === "processing" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}

            <div className="flex items-center gap-2 relative z-10">
              <motion.div
                animate={showOutcome ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[8px] text-green-300/60 font-medium">
                  {scanPhase === "processing" ? "Analizuojama..." : "Potenciali nauda"}
                </span>
                <motion.span
                  className="text-[10px] md:text-[11px] text-green-400 font-bold"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: showOutcome ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {showOutcome ? "+48h / savaitę" : "—"}
                </motion.span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* AUDITAS Panel - top right */}
        <motion.div
          className="absolute top-2 right-2 md:top-4 md:right-4 rounded-lg p-2 z-30"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <motion.div
              animate={
                scanPhase === "scanning" && !reducedMotion
                  ? { rotate: [0, 360] }
                  : scanPhase === "processing"
                  ? { scale: [1, 1.1, 1] }
                  : {}
              }
              transition={
                scanPhase === "scanning"
                  ? { duration: 4, repeat: Infinity, ease: "linear" }
                  : { duration: 0.5, repeat: Infinity }
              }
            >
              <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.div>
            <span className="text-[8px] text-white/50 font-medium tracking-wide">
              {scanPhase === "scanning" ? "SKANUOJAMA..." : scanPhase === "processing" ? "APDOROJAMA..." : "AUDITAS"}
            </span>
            {scanPhase === "scanning" && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-purple-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>

          <div className="space-y-1.5">
            {AUDIT_FINDINGS.map((finding) => {
              const isHighlighted = highlightedFinding === finding.id;
              const severityColor = finding.severity === "high" ? "red" : "amber";

              return (
                <motion.div
                  key={finding.id}
                  className="flex items-center gap-1.5"
                  animate={
                    isHighlighted
                      ? {
                          scale: [1, 1.05, 1],
                          x: [0, 2, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={`w-3 h-3 rounded flex items-center justify-center flex-shrink-0 ${
                      severityColor === "red"
                        ? "border border-red-400/50 bg-red-400/20"
                        : "border border-amber-400/50 bg-amber-400/20"
                    }`}
                    animate={
                      isHighlighted
                        ? {
                            boxShadow:
                              severityColor === "red"
                                ? ["0 0 0 0 rgba(239, 68, 68, 0)", "0 0 8px 2px rgba(239, 68, 68, 0.5)", "0 0 4px 1px rgba(239, 68, 68, 0.3)"]
                                : ["0 0 0 0 rgba(251, 191, 36, 0)", "0 0 8px 2px rgba(251, 191, 36, 0.5)", "0 0 4px 1px rgba(251, 191, 36, 0.3)"],
                          }
                        : {}
                    }
                    transition={{ duration: 0.3 }}
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
                  </motion.div>
                  <motion.span
                    className="text-[7px] text-white/50 whitespace-nowrap"
                    animate={isHighlighted ? { color: "rgba(255,255,255,0.8)" } : { color: "rgba(255,255,255,0.5)" }}
                    transition={{ duration: 0.2 }}
                  >
                    {finding.text}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
