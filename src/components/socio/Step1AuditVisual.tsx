"use client";

/**
 * Step1AuditVisual.tsx - Integration Hub Visual (Performance Optimized)
 *
 * OPTIMIZATIONS:
 * - Removed useAnimationFrame - using CSS animations and SVG animateMotion
 * - IntersectionObserver to pause animations when offscreen
 * - Reduced backdrop-blur to single layer on main hub
 * - Debounced resize observer (150ms)
 * - React.memo for card components
 * - Static stats display instead of live updating
 */

import { motion } from "framer-motion";
import { useRef, useState, useCallback, useEffect, useLayoutEffect, memo } from "react";

const DEBUG_LINES = false;

interface LineData {
  from: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface FlowPath {
  from: string;
  to: string;
  color: string;
  startDelay: number;
  x1: number;
  y1: number;
  xMid: number;
  yMid: number;
  x2: number;
  y2: number;
}

const FLOW_CONNECTIONS = [
  { from: "sheets", to: "crm", startDelay: 0 },
  { from: "api", to: "calendar", startDelay: 0.3 },
  { from: "slack", to: "email", startDelay: 0.6 },
  { from: "excel", to: "api", startDelay: 0.9 },
  { from: "crm", to: "slack", startDelay: 1.2 },
  { from: "email", to: "sheets", startDelay: 1.5 },
  { from: "calendar", to: "excel", startDelay: 1.8 },
] as const;

const NODE_COLORS: Record<string, string> = {
  crm: "#22c55e",
  email: "#3b82f6",
  sheets: "#f59e0b",
  calendar: "#ec4899",
  slack: "#a855f7",
  api: "#06b6d4",
  excel: "#10b981",
};

const REQUIRED_NODES = ["crm", "email", "sheets", "calendar", "slack", "api", "excel", "bottleneck"] as const;
const OUTER_NODES = ["crm", "email", "sheets", "calendar", "slack", "api", "excel"] as const;

// Reduced to single dot per path for performance
const DOT_CONFIG = { dur: 2.2, size: 4 };

// Stats card with live counters (uses setInterval instead of RAF for performance)
const LiveIntegrationCard = memo(function LiveIntegrationCard() {
  const [lastEventSeconds, setLastEventSeconds] = useState(2);
  const [eventsProcessed, setEventsProcessed] = useState(12847);
  const [actionsPerMin, setActionsPerMin] = useState(35);
  const [savedHours, setSavedHours] = useState(8.4);

  // Simple interval-based timer for counters - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Update last event timer
      setLastEventSeconds((prev) => {
        if (prev >= 8 || (prev > 2 && Math.random() < 0.15)) {
          return 1;
        }
        return prev + 1;
      });

      // Increment events processed by 1-3
      setEventsProcessed((prev) => prev + Math.floor(Math.random() * 3) + 1);

      // Randomly fluctuate actions per minute between 28-42
      if (Math.random() < 0.3) {
        setActionsPerMin(Math.floor(Math.random() * 15) + 28);
      }

      // Slowly increment saved hours (0.1 every ~3 seconds)
      if (Math.random() < 0.35) {
        setSavedHours((prev) => Math.round((prev + 0.1) * 10) / 10);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute top-1 right-1 md:top-2 md:right-2 w-[105px] md:w-[155px] rounded-lg z-30 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
      initial={{ x: 20, opacity: 0, scale: 0.95 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1.2 }}
    >
      <div className="px-1 md:px-2 py-0.5 md:py-1.5 border-b border-white/5 flex items-center gap-0.5 md:gap-1">
        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
        <span className="text-[5px] md:text-[8px] text-white/80 font-extrabold tracking-wide">LIVE</span>
        <span className="text-[4px] md:text-[7px] text-white/30 mx-0.5">|</span>
        <span className="text-[4px] md:text-[7px] text-white/80 font-bold truncate">Integracijos veikia 😉</span>
      </div>
      <div className="px-1 md:px-2 py-0.5 md:py-1.5 space-y-0.5 md:space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[5px] md:text-[8px] text-white/85 font-bold">Įvykiai:</span>
          <span className="text-[6px] md:text-[9px] text-white font-extrabold tabular-nums">
            {eventsProcessed.toLocaleString("lt-LT")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[5px] md:text-[8px] text-white/85 font-bold">Autom.:</span>
          <span className="text-[6px] md:text-[9px] text-green-400 font-extrabold">7</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[5px] md:text-[8px] text-white/85 font-bold">Įrankiai:</span>
          <span className="text-[6px] md:text-[9px] text-purple-400 font-extrabold">6</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[5px] md:text-[8px] text-white/85 font-bold">Veiks./min:</span>
          <span className="text-[6px] md:text-[9px] text-cyan-400 font-extrabold tabular-nums">{actionsPerMin}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[5px] md:text-[8px] text-white/85 font-bold">Sutaupyta:</span>
          <span className="text-[6px] md:text-[9px] text-emerald-400 font-extrabold tabular-nums">+{savedHours.toFixed(1)}h</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[5px] md:text-[8px] text-white/85 font-bold">Pask. įvykis:</span>
          <span className="text-[6px] md:text-[9px] text-white/70 font-bold tabular-nums">
            {lastEventSeconds}s
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default function Step1AuditVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LineData[]>([]);
  const [flowPaths, setFlowPaths] = useState<FlowPath[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isInView, setIsInView] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // IntersectionObserver to pause SVG animations when offscreen
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

  // Calculate the point where a line from center to target intersects the rectangle edge
  const getEdgePoint = (
    centerX: number,
    centerY: number,
    targetX: number,
    targetY: number,
    halfWidth: number,
    halfHeight: number
  ) => {
    const dx = targetX - centerX;
    const dy = targetY - centerY;

    if (dx === 0 && dy === 0) return { x: centerX, y: centerY };

    // Calculate intersection with rectangle edges
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Determine which edge the line intersects
    const scaleX = halfWidth / absDx;
    const scaleY = halfHeight / absDy;
    const scale = Math.min(scaleX, scaleY);

    return {
      x: centerX + dx * scale,
      y: centerY + dy * scale,
    };
  };

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    // Update container size for SVG dimensions
    setContainerSize({
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    const nodeData: Record<string, { x: number; y: number; halfWidth: number; halfHeight: number }> = {};

    REQUIRED_NODES.forEach((key) => {
      const el = container.querySelector<HTMLElement>(`[data-node="${key}"]`);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      nodeData[key] = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
        halfWidth: rect.width / 2,
        halfHeight: rect.height / 2,
      };
    });

    const bottleneck = nodeData["bottleneck"];
    if (!bottleneck) return;

    const newLines: LineData[] = [];
    OUTER_NODES.forEach((key) => {
      const node = nodeData[key];
      if (!node) return;

      // Calculate edge points for both the outer node and bottleneck
      const outerEdge = getEdgePoint(node.x, node.y, bottleneck.x, bottleneck.y, node.halfWidth, node.halfHeight);
      const bottleneckEdge = getEdgePoint(bottleneck.x, bottleneck.y, node.x, node.y, bottleneck.halfWidth, bottleneck.halfHeight);

      newLines.push({
        from: key,
        x1: outerEdge.x,
        y1: outerEdge.y,
        x2: bottleneckEdge.x,
        y2: bottleneckEdge.y,
        color: NODE_COLORS[key],
      });
    });

    const newFlowPaths: FlowPath[] = [];
    FLOW_CONNECTIONS.forEach(({ from, to, startDelay }) => {
      const fromNode = nodeData[from];
      const toNode = nodeData[to];
      if (!fromNode || !toNode) return;

      // Calculate edge points for flow paths
      const fromEdge = getEdgePoint(fromNode.x, fromNode.y, bottleneck.x, bottleneck.y, fromNode.halfWidth, fromNode.halfHeight);
      const toEdge = getEdgePoint(toNode.x, toNode.y, bottleneck.x, bottleneck.y, toNode.halfWidth, toNode.halfHeight);

      newFlowPaths.push({
        from,
        to,
        color: NODE_COLORS[from],
        startDelay,
        x1: fromEdge.x,
        y1: fromEdge.y,
        xMid: bottleneck.x,
        yMid: bottleneck.y,
        x2: toEdge.x,
        y2: toEdge.y,
      });
    });

    if (DEBUG_LINES && newLines.length > 0) {
      console.table(newLines.map(l => ({
        from: l.from,
        x1: Math.round(l.x1),
        y1: Math.round(l.y1),
        x2: Math.round(l.x2),
        y2: Math.round(l.y2),
      })));
    }

    setLines(newLines);
    setFlowPaths(newFlowPaths);
  }, []);

  // Debounced resize handler
  const debouncedComputeLines = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(computeLines, 150);
  }, [computeLines]);

  // Use layout effect with double RAF for initial computation (ensures layout is stable)
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        computeLines();
      });
    });
  }, [computeLines]);

  // Delayed retries and resize handling
  useEffect(() => {
    const t1 = setTimeout(computeLines, 300);
    const t2 = setTimeout(computeLines, 800);
    const t3 = setTimeout(computeLines, 1500);

    const resizeObserver = new ResizeObserver(debouncedComputeLines);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", debouncedComputeLines);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver.disconnect();
      window.removeEventListener("resize", debouncedComputeLines);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [computeLines, debouncedComputeLines]);

  // Re-compute when visibility changes
  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(computeLines, 100);
      return () => clearTimeout(timer);
    }
  }, [isInView, computeLines]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[280px] bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-6"
      style={{ overflow: "visible" }}
    >
      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        .animate-pulse-slow { animation: pulse-slow 1.5s ease-in-out infinite; }
      `}</style>

      {/* Background glow effects - static */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

      {/* SVG Overlay */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={containerSize.width || "100%"}
        height={containerSize.height || "100%"}
        style={{ zIndex: 15, overflow: "visible" }}
      >
        <defs>
          {lines.map((line) => {
            if (!Number.isFinite(line.x1) || !Number.isFinite(line.y1) ||
                !Number.isFinite(line.x2) || !Number.isFinite(line.y2)) return null;
            return (
              <linearGradient
                key={`grad-${line.from}`}
                id={`grad-${line.from}`}
                gradientUnits="userSpaceOnUse"
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
              >
                <stop offset="0%" stopColor={line.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={line.color} stopOpacity="0.4" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Static dashed lines */}
        {containerSize.width > 0 && lines.map((line) => {
          if (!Number.isFinite(line.x1) || !Number.isFinite(line.y1) ||
              !Number.isFinite(line.x2) || !Number.isFinite(line.y2)) return null;
          return (
            <path
              key={`line-${line.from}`}
              d={`M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`}
              fill="none"
              stroke={`url(#grad-${line.from})`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="8 6"
            />
          );
        })}

        {/* Animated dots - only render when in view */}
        {isInView && containerSize.width > 0 && flowPaths.map((flow) => {
          if (!Number.isFinite(flow.x1) || !Number.isFinite(flow.y1) ||
              !Number.isFinite(flow.xMid) || !Number.isFinite(flow.yMid) ||
              !Number.isFinite(flow.x2) || !Number.isFinite(flow.y2)) return null;

          const flowPathId = `flow-${flow.from}-${flow.to}`;
          const flowPathD = `M ${flow.x1} ${flow.y1} L ${flow.xMid} ${flow.yMid} L ${flow.x2} ${flow.y2}`;
          const dur = `${DOT_CONFIG.dur}s`;

          return (
            <g key={flowPathId}>
              <path id={flowPathId} d={flowPathD} fill="none" stroke="none" />
              <circle r={DOT_CONFIG.size} fill={flow.color} opacity={0}>
                <animateMotion dur={dur} begin={`${flow.startDelay}s`} repeatCount="indefinite">
                  <mpath href={`#${flowPathId}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;0.9;0.9;0"
                  keyTimes="0;0.08;0.92;1"
                  dur={dur}
                  begin={`${flow.startDelay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Central INERCI Hub - single backdrop-blur */}
      <div
        data-node="bottleneck"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-16 rounded-2xl bg-gradient-to-br from-purple-500/40 to-indigo-500/30 backdrop-blur-md border-2 border-purple-400/60 flex flex-col items-center justify-center z-20 shadow-lg shadow-purple-500/20"
      >
        <span className="text-[11px] text-white font-extrabold tracking-wider">INERCI</span>
        <svg className="w-4 h-4 text-purple-300/80 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>

      {/* Integration cards - no backdrop-blur, just gradient backgrounds */}
      <div
        data-node="crm"
        className="absolute top-4 left-2 w-16 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-400/30 flex flex-col items-center justify-center gap-1 z-20"
      >
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-[9px] text-green-300 font-extrabold">CRM</span>
      </div>

      <div
        data-node="email"
        className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-400/30 flex flex-col items-center justify-center gap-1 z-20"
      >
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-[9px] text-blue-300 font-extrabold">EMAIL</span>
      </div>

      <div
        data-node="sheets"
        className="absolute bottom-4 left-2 w-16 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-400/30 flex flex-col items-center justify-center gap-1 z-20"
      >
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-[9px] text-amber-300 font-extrabold">SHEETS</span>
      </div>

      <div
        data-node="calendar"
        className="absolute bottom-4 right-2 w-16 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-400/30 flex flex-col items-center justify-center gap-1 z-20"
      >
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[9px] text-pink-300 font-extrabold">CALENDAR</span>
      </div>

      <div
        data-node="slack"
        className="absolute top-1/2 -translate-y-1/2 left-2 w-14 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-400/30 flex flex-col items-center justify-center gap-1 z-20"
      >
        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-[9px] text-purple-300 font-extrabold">SLACK</span>
      </div>

      <div
        data-node="api"
        className="absolute top-1/2 -translate-y-1/2 right-2 w-14 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-400/30 flex flex-col items-center justify-center gap-1 z-20"
      >
        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-[9px] text-cyan-300 font-extrabold">API</span>
      </div>

      <div
        data-node="excel"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-400/30 flex flex-col items-center justify-center gap-1 z-20"
      >
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-[9px] text-emerald-300 font-extrabold">EXCEL</span>
      </div>

      <LiveIntegrationCard />
    </div>
  );
}
