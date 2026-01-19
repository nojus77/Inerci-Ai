"use client";

import { motion } from "framer-motion";
import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";

// DEBUG MODE: Set to true to see thick solid lines for debugging
const DEBUG_LINES = false;

interface LineData {
  from: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

// Flow paths: from -> through bottleneck -> to
// Each path connects two different cards through the center
interface FlowPath {
  from: string;
  to: string;
  color: string;
  startDelay: number;
  // Coordinates will be computed
  x1: number;
  y1: number;
  xMid: number;
  yMid: number;
  x2: number;
  y2: number;
}

// Define the flow connections (which cards connect through bottleneck)
// Each has a staggered start delay for calmer visual
const FLOW_CONNECTIONS = [
  { from: "sheets", to: "crm", startDelay: 0 },
  { from: "api", to: "calendar", startDelay: 0.8 },
  { from: "slack", to: "email", startDelay: 1.6 },
  { from: "excel", to: "api", startDelay: 2.4 },
  { from: "crm", to: "slack", startDelay: 3.2 },
  { from: "email", to: "sheets", startDelay: 4.0 },
  { from: "calendar", to: "excel", startDelay: 4.8 },
] as const;

const NODE_COLORS: Record<string, string> = {
  crm: "#22c55e",
  email: "#3b82f6",
  sheets: "#f59e0b",
  calendar: "#ec4899",
  slack: "#a855f7",
  api: "#06b6d4",
  excel: "#10b981", // emerald/green for Excel
};

const REQUIRED_NODES = ["crm", "email", "sheets", "calendar", "slack", "api", "excel", "bottleneck"] as const;
const OUTER_NODES = ["crm", "email", "sheets", "calendar", "slack", "api", "excel"] as const;

// Dot animation configs - slower, calmer with bigger gaps between dots
const DOT_CONFIGS = [
  { dur: "4.5s", delay: "0s", size: 4 },
  { dur: "5s", delay: "2.5s", size: 3 },
];

export default function Step1AuditVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LineData[]>([]);
  const [flowPaths, setFlowPaths] = useState<FlowPath[]>([]);
  const [missingNodes, setMissingNodes] = useState<string[]>([]);
  const [renderCount, setRenderCount] = useState(0);

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      console.error("[Step1AuditVisual] Container ref is null");
      return;
    }

    const containerRect = container.getBoundingClientRect();

    // Update container size for SVG dimensions
    setContainerSize({
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    // Collect all nodes
    const nodeData: Record<string, { el: HTMLElement; rect: DOMRect; x: number; y: number }> = {};
    const missing: string[] = [];

    REQUIRED_NODES.forEach((key) => {
      const el = container.querySelector<HTMLElement>(`[data-node="${key}"]`);
      if (!el) {
        missing.push(key);
        return;
      }

      const rect = el.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      if (rect.width === 0 || rect.height === 0) {
        missing.push(key);
        return;
      }

      nodeData[key] = { el, rect, x, y };
    });

    setMissingNodes(missing);

    // Log missing nodes as errors
    if (missing.length > 0) {
      console.error("[Step1AuditVisual] Missing nodes:", missing);
    }

    // Check bottleneck
    const bottleneck = nodeData["bottleneck"];
    if (!bottleneck) {
      console.error("[Step1AuditVisual] Cannot render lines: bottleneck missing");
      return;
    }

    // Build simple lines (for the dashed stroke appearance)
    const newLines: LineData[] = [];
    OUTER_NODES.forEach((key) => {
      const node = nodeData[key];
      if (!node) return;

      newLines.push({
        from: key,
        x1: node.x,
        y1: node.y,
        x2: bottleneck.x,
        y2: bottleneck.y,
        color: NODE_COLORS[key],
      });
    });

    // Build flow paths (for animated dots going from->bottleneck->to)
    const newFlowPaths: FlowPath[] = [];
    FLOW_CONNECTIONS.forEach(({ from, to, startDelay }) => {
      const fromNode = nodeData[from];
      const toNode = nodeData[to];
      if (!fromNode || !toNode) return;

      newFlowPaths.push({
        from,
        to,
        color: NODE_COLORS[from],
        startDelay,
        x1: fromNode.x,
        y1: fromNode.y,
        xMid: bottleneck.x,
        yMid: bottleneck.y,
        x2: toNode.x,
        y2: toNode.y,
      });
    });

    // Debug log (only when DEBUG_LINES is true)
    if (DEBUG_LINES && newLines.length > 0) {
      console.table(newLines.map(l => ({
        from: l.from,
        x1: Math.round(l.x1),
        y1: Math.round(l.y1),
        x2: Math.round(l.x2),
        y2: Math.round(l.y2),
        valid: Number.isFinite(l.x1) && Number.isFinite(l.y1) && Number.isFinite(l.x2) && Number.isFinite(l.y2)
      })));
    }

    setLines(newLines);
    setFlowPaths(newFlowPaths);
    setRenderCount((c) => c + 1);
  }, []);

  // Use layout effect for initial computation, then follow-up with delayed retries
  useLayoutEffect(() => {
    // Double RAF to ensure layout is stable
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        computeLines();
      });
    });
  }, [computeLines]);

  // Delayed retries and resize handling
  useEffect(() => {
    // After initial animations (delay 0.2-0.8s)
    const t1 = setTimeout(computeLines, 300);
    const t2 = setTimeout(computeLines, 800);
    const t3 = setTimeout(computeLines, 1500);

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      computeLines();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", computeLines);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver.disconnect();
      window.removeEventListener("resize", computeLines);
    };
  }, [computeLines]);

  // Container dimensions for SVG (updated in computeLines)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[280px] bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-6"
      style={{ overflow: "visible" }}
    >
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-violet-500/10 rounded-full blur-2xl" />

      {/* Debug overlay for missing nodes */}
      {missingNodes.length > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs p-2 rounded z-50">
          MISSING: {missingNodes.join(", ")}
        </div>
      )}

      {/* SVG Overlay - z-index 15 to be between background and tiles */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={containerSize.width || "100%"}
        height={containerSize.height || "100%"}
        style={{ zIndex: 15, overflow: "visible" }}
      >
        <defs>
          {/* Define gradients using userSpaceOnUse with actual coordinates - works for ANY angle including 0° and 90° */}
          {lines.map((line) => {
            // Strict validation - skip if any coordinate is not finite
            if (!Number.isFinite(line.x1) || !Number.isFinite(line.y1) ||
                !Number.isFinite(line.x2) || !Number.isFinite(line.y2)) {
              console.error(`[Step1AuditVisual] Skipping gradient for ${line.from}: non-finite coords`);
              return null;
            }
            return (
              <linearGradient
                key={`grad-${line.from}`}
                id={`grad-${line.from}`}
                gradientUnits="userSpaceOnUse"
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
              >
                <stop offset="0%" stopColor={line.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={line.color} stopOpacity="0.4" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Render static dashed lines (card -> bottleneck) */}
        {containerSize.width > 0 && lines.map((line) => {
          // Strict validation - ALL coordinates must be finite numbers
          const isValid = Number.isFinite(line.x1) && Number.isFinite(line.y1) &&
                         Number.isFinite(line.x2) && Number.isFinite(line.y2);

          if (!isValid) {
            console.error(`[Step1AuditVisual] Skipping line ${line.from}: non-finite coords`, line);
            return null;
          }

          const pathD = `M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;

          return (
            <path
              key={`line-${line.from}`}
              d={pathD}
              fill="none"
              stroke={`url(#grad-${line.from})`}
              strokeWidth={2}
              strokeOpacity={1}
              strokeLinecap="round"
              strokeDasharray="8 6"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Render flow paths for animated dots (from -> bottleneck -> to) */}
        {containerSize.width > 0 && flowPaths.map((flow) => {
          // Strict validation
          const isValid = Number.isFinite(flow.x1) && Number.isFinite(flow.y1) &&
                         Number.isFinite(flow.xMid) && Number.isFinite(flow.yMid) &&
                         Number.isFinite(flow.x2) && Number.isFinite(flow.y2);

          if (!isValid) return null;

          const flowPathId = `flow-${flow.from}-${flow.to}`;
          // Path goes: from card -> bottleneck -> to card
          const flowPathD = `M ${flow.x1} ${flow.y1} L ${flow.xMid} ${flow.yMid} L ${flow.x2} ${flow.y2}`;

          return (
            <g key={flowPathId}>
              {/* Hidden path for dot animation */}
              <path
                id={flowPathId}
                d={flowPathD}
                fill="none"
                stroke="none"
              />

              {/* Animated dots with staggered start times per flow */}
              {DOT_CONFIGS.map((config, i) => {
                // Combine flow's start delay with dot config delay
                const totalDelay = flow.startDelay + parseFloat(config.delay);
                const baseOpacity = 0.9 - i * 0.15;
                return (
                  <circle
                    key={`dot-${flow.from}-${flow.to}-${i}`}
                    r={config.size}
                    fill={flow.color}
                    opacity={0}
                  >
                    <animateMotion
                      dur={config.dur}
                      begin={`${totalDelay}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${flowPathId}`} />
                    </animateMotion>
                    {/* Opacity: fade in -> full at center (INERCI) -> fade out */}
                    <animate
                      attributeName="opacity"
                      values={`0;${baseOpacity};${baseOpacity + 0.1};${baseOpacity};0`}
                      keyTimes="0;0.08;0.5;0.92;1"
                      dur={config.dur}
                      begin={`${totalDelay}s`}
                      repeatCount="indefinite"
                    />
                    {/* Pulse slightly bigger when passing through center */}
                    <animate
                      attributeName="r"
                      values={`${config.size};${config.size};${config.size + 1.5};${config.size};${config.size}`}
                      keyTimes="0;0.4;0.5;0.6;1"
                      dur={config.dur}
                      begin={`${totalDelay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              })}
            </g>
          );
        })}

        {/* DEBUG: Visual indicators when debug mode is on */}
        {DEBUG_LINES && (
          <>
            <rect
              x="1"
              y="1"
              width={containerSize.width - 2 || "100%"}
              height={containerSize.height - 2 || "100%"}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeDasharray="10 5"
            />
            {lines.map((line) => (
              <g key={`debug-${line.from}`}>
                <circle cx={line.x1} cy={line.y1} r="6" fill={line.color} stroke="#fff" strokeWidth="2" />
                <circle cx={line.x2} cy={line.y2} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />
                <text x={line.x1} y={line.y1 - 10} fill={line.color} fontSize="9" textAnchor="middle" fontWeight="bold">
                  {line.from.toUpperCase()}
                </text>
              </g>
            ))}
          </>
        )}
      </svg>

      {/* Central INERCI Hub - unified connector */}
      <div
        data-node="bottleneck"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-16 rounded-2xl bg-gradient-to-br from-purple-500/40 to-indigo-500/30 backdrop-blur-md border-2 border-purple-400/60 flex flex-col items-center justify-center z-20 shadow-lg shadow-purple-500/20"
      >
        {/* Pulsing rings - purple theme */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-purple-400/40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl border border-indigo-400/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
        />

        {/* Brand name first */}
        <span className="text-[11px] text-white font-extrabold relative z-10 tracking-wider">
          INERCI
        </span>
        {/* Hub/Connection icon below */}
        <svg
          className="w-4 h-4 text-purple-300/80 relative z-10 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      </div>

      {/* CRM - Top Left */}
      <div
        data-node="crm"
        className="absolute top-4 left-2 w-14 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm border border-green-400/30 flex flex-col items-center justify-center z-20"
      >
        <svg
          className="w-4 h-4 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span className="text-[7px] text-green-300/80 font-medium">CRM</span>
      </div>

      {/* Email - Top Center */}
      <div
        data-node="email"
        className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 backdrop-blur-sm border border-blue-400/30 flex flex-col items-center justify-center z-20"
      >
        <svg
          className="w-4 h-4 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span className="text-[7px] text-blue-300/80 font-medium">EMAIL</span>
      </div>

      {/* Sheets - Bottom Left */}
      <div
        data-node="sheets"
        className="absolute bottom-4 left-2 w-14 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 backdrop-blur-sm border border-amber-400/30 flex flex-col items-center justify-center z-20"
      >
        <svg
          className="w-4 h-4 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <span className="text-[7px] text-amber-300/80 font-medium">SHEETS</span>
      </div>

      {/* Calendar - Bottom Right */}
      <div
        data-node="calendar"
        className="absolute bottom-4 right-2 w-14 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 backdrop-blur-sm border border-pink-400/30 flex flex-col items-center justify-center z-20"
      >
        <svg
          className="w-4 h-4 text-pink-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-[7px] text-pink-300/80 font-medium">CALENDAR</span>
      </div>

      {/* Slack - Middle Left */}
      <div
        data-node="slack"
        className="absolute top-1/2 -translate-y-1/2 left-2 w-12 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 backdrop-blur-sm border border-purple-400/30 flex flex-col items-center justify-center z-20"
      >
        <svg
          className="w-3.5 h-3.5 text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-[6px] text-purple-300/80 font-medium">SLACK</span>
      </div>

      {/* API - Middle Right */}
      <div
        data-node="api"
        className="absolute top-1/2 -translate-y-1/2 right-2 w-12 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 backdrop-blur-sm border border-cyan-400/30 flex flex-col items-center justify-center z-20"
      >
        <svg
          className="w-3.5 h-3.5 text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span className="text-[6px] text-cyan-300/80 font-medium">API</span>
      </div>

      {/* Excel - Bottom Center */}
      <div
        data-node="excel"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 backdrop-blur-sm border border-emerald-400/30 flex flex-col items-center justify-center z-20"
      >
        <svg
          className="w-4 h-4 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="text-[7px] text-emerald-300/80 font-medium">EXCEL</span>
      </div>

      {/* Checklist Panel - Auditas */}
      <motion.div
        className="absolute -top-2 -right-2 w-auto rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 p-2 z-30"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <svg
            className="w-3 h-3 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-[8px] text-white/60 font-medium">AUDITAS</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-red-400/50 bg-red-400/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-2 h-2 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <span className="text-[7px] text-white/60 whitespace-nowrap">
              Sąskaitų rūšiavimas
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-red-400/50 bg-red-400/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-2 h-2 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <span className="text-[7px] text-white/60 whitespace-nowrap">
              Neoptimizuotas CRM
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-amber-400/50 bg-amber-400/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-2 h-2 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-[7px] text-white/60 whitespace-nowrap">
              48h Švaistomo laiko/sav.
            </span>
          </div>
        </div>
      </motion.div>

      {/* Debug info - only show when DEBUG_LINES is true */}
      {DEBUG_LINES && (
        <div className="absolute bottom-1 left-1 text-[8px] text-white/80 z-50 bg-black/80 p-2 rounded max-w-[250px]">
          <div className="font-bold mb-1">Debug Panel</div>
          <div>Lines: {lines.length}</div>
          <div>Container: {containerSize.width}x{containerSize.height}</div>
          <div className="mt-1 border-t border-white/20 pt-1">Coords:</div>
          {lines.map(l => (
            <div key={l.from} style={{ color: l.color }}>
              {l.from}: ({Math.round(l.x1)},{Math.round(l.y1)}) → ({Math.round(l.x2)},{Math.round(l.y2)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
