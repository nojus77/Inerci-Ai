"use client";

/**
 * Step1AuditIllustration.tsx
 *
 * Premium animated illustration for Step 1 "Problemų Identifikavimas"
 * Communicates: Process review, Priority planning, ROI calculation
 *
 * LAYERS & ANIMATIONS:
 * 1. Background glows - static ambient lighting
 * 2. Floating particles - continuous drift animation (adjustable via PARTICLE_COUNT)
 * 3. Process board - scroll parallax (adjust PARALLAX_INTENSITY)
 * 4. Board nodes - sequential pulse animation (adjust NODE_PULSE_DELAY)
 * 5. Scanning line - repeating analysis animation (adjust SCAN_DURATION)
 * 6. Consultant silhouette - slight parallax offset from board
 * 7. AUDITAS bubble - fade in with delay, subtle float
 *
 * CUSTOMIZATION:
 * - PARALLAX_INTENSITY: 0-1, how much elements move on scroll
 * - SCAN_DURATION: seconds for scanning line animation
 * - NODE_PULSE_DELAY: seconds between node pulses
 * - PARTICLE_COUNT: number of floating particles
 */

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// Animation configuration
const PARALLAX_INTENSITY = 0.15;
const SCAN_DURATION = 4; // Slower, more subtle scan
const PARTICLE_COUNT = 6; // Reduced for less clutter

// Process map nodes representing workflow analysis
const PROCESS_NODES = [
  { id: 1, x: 15, y: 25, label: "Užklausa", isBottleneck: false },
  { id: 2, x: 35, y: 20, label: "Apdorojimas", isBottleneck: false },
  { id: 3, x: 55, y: 30, label: "Tikrinimas", isBottleneck: true },
  { id: 4, x: 75, y: 25, label: "Patvirtinimas", isBottleneck: false },
  { id: 5, x: 45, y: 50, label: "Ataskaita", isBottleneck: false },
  { id: 6, x: 65, y: 55, label: "Archyvas", isBottleneck: false },
];

// Connection paths between nodes
const NODE_CONNECTIONS = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 2, to: 5 },
  { from: 5, to: 6 },
  { from: 3, to: 5 },
];

export default function Step1AuditIllustration() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-driven animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax transforms
  const boardY = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const boardX = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  const consultantY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const consultantX = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[280px] bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] rounded-2xl overflow-hidden"
    >
      {/* Background ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
      </div>

      {/* Floating particles layer - static, no animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(PARTICLE_COUNT)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-400/30"
            style={{
              left: `${10 + (i * 12) % 80}%`,
              top: `${15 + (i * 17) % 70}%`,
            }}
          />
        ))}
      </div>

      {/* Process Board with parallax */}
      <motion.div
        className="absolute left-[8%] top-[12%] w-[55%] h-[65%]"
        style={{ x: boardX, y: boardY }}
      >
        {/* Board frame */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm border border-white/10 shadow-xl overflow-hidden">
          {/* Board header */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-white/10 flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
            <span className="ml-2 text-[6px] text-white/40 font-medium tracking-wider">PROCESŲ SCHEMA</span>
          </div>

          {/* SVG Process Map */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {/* Connection gradient - brighter for better visibility */}
              <linearGradient id="connectionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
              </linearGradient>

              {/* Bottleneck glow */}
              <filter id="bottleneckGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Scanning line gradient */}
              <linearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Connection lines - brighter stroke */}
            {NODE_CONNECTIONS.map((conn, i) => {
              const from = PROCESS_NODES.find(n => n.id === conn.from)!;
              const to = PROCESS_NODES.find(n => n.id === conn.to)!;
              return (
                <motion.line
                  key={`conn-${i}`}
                  x1={from.x}
                  y1={from.y + 8}
                  x2={to.x}
                  y2={to.y + 8}
                  stroke="url(#connectionGrad)"
                  strokeWidth="0.8"
                  strokeDasharray="3 1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                />
              );
            })}

            {/* Scanning line animation */}
            <motion.rect
              x="0"
              y="0"
              width="100"
              height="3"
              fill="url(#scanGrad)"
              initial={{ y: 10 }}
              animate={{ y: [10, 70, 10] }}
              transition={{
                duration: SCAN_DURATION,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
            />
          </svg>

          {/* Process nodes - brighter labels */}
          {PROCESS_NODES.map((node, i) => (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            >
              {/* Node circle */}
              <motion.div
                className={`relative w-6 h-6 rounded-lg flex items-center justify-center ${
                  node.isBottleneck
                    ? "bg-gradient-to-br from-red-500/50 to-orange-500/40 border-red-400/60"
                    : "bg-gradient-to-br from-purple-500/40 to-indigo-500/30 border-purple-400/40"
                } border backdrop-blur-sm`}
                animate={
                  node.isBottleneck
                    ? {
                        boxShadow: [
                          "0 0 0 0 rgba(239, 68, 68, 0)",
                          "0 0 12px 4px rgba(239, 68, 68, 0.4)",
                          "0 0 0 0 rgba(239, 68, 68, 0)",
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {node.isBottleneck && (
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {!node.isBottleneck && (
                  <div className="w-2 h-2 rounded-full bg-purple-400/70" />
                )}
              </motion.div>

              {/* Node label - brighter */}
              <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 text-[5px] font-medium whitespace-nowrap ${
                node.isBottleneck ? "text-red-300" : "text-white/70"
              }`}>
                {node.label}
              </span>

              {/* Bottleneck indicator */}
              {node.isBottleneck && (
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-red-500/40 border border-red-400/50"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                >
                  <span className="text-[5px] text-red-300 font-semibold">PROBLEMA</span>
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* ROI indicator panel */}
          <motion.div
            className="absolute bottom-2 right-2 px-2 py-1.5 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-400/30 backdrop-blur-sm"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8 }}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div className="flex flex-col">
                <span className="text-[5px] text-green-300/60">Potenciali nauda</span>
                <span className="text-[8px] text-green-400 font-bold">+127% efektyvumas</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Consultant silhouette with parallax - shrunk ~12% and lower opacity */}
      <motion.div
        className="absolute right-[6%] bottom-[6%] w-[30%] h-[65%] opacity-75"
        style={{ x: consultantX, y: consultantY }}
      >
        {/* Consultant figure - gradient silhouette */}
        <svg viewBox="0 0 100 150" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
          <defs>
            {/* Person silhouette - teal/cyan tones, slightly muted */}
            <linearGradient id="personGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.25" />
            </linearGradient>
            {/* Laptop - slate/cool gray - more opaque */}
            <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.7" />
            </linearGradient>
            {/* Desk - warm brown/amber tones */}
            <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a16207" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.35" />
            </linearGradient>
            {/* Screen glow - blue for tech feel */}
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Person silhouette - pushed down, partially cropped */}
          <g transform="translate(15, 45)">
            {/* Head */}
            <ellipse cx="35" cy="15" rx="12" ry="14" fill="url(#personGrad)" />

            {/* Body/torso */}
            <path
              d="M20 30 Q35 25 50 30 L55 70 Q35 75 15 70 Z"
              fill="url(#personGrad)"
            />

            {/* Arms reaching to laptop */}
            <path
              d="M20 35 Q5 50 15 70 L25 65 Q20 50 25 40 Z"
              fill="url(#personGrad)"
            />
            <path
              d="M50 35 Q65 50 55 70 L45 65 Q50 50 45 40 Z"
              fill="url(#personGrad)"
            />
          </g>

          {/* Desk */}
          <rect x="5" y="105" width="90" height="4" rx="1" fill="url(#deskGrad)" />

          {/* Laptop - rendered after person so it appears in front */}
          <g transform="translate(20, 75)">
            {/* Laptop base */}
            <rect x="0" y="25" width="60" height="5" rx="1" fill="url(#laptopGrad)" />

            {/* Laptop screen */}
            <rect x="5" y="0" width="50" height="25" rx="2" fill="url(#laptopGrad)" />

            {/* Screen content - static glow */}
            <rect
              x="8"
              y="3"
              width="44"
              height="19"
              rx="1"
              fill="url(#screenGrad)"
              opacity="0.8"
            />

            {/* Screen content lines - static */}
            <g>
              <rect x="12" y="7" width="20" height="1.5" rx="0.5" fill="#fff" opacity="0.4" />
              <rect x="12" y="11" width="15" height="1.5" rx="0.5" fill="#fff" opacity="0.3" />
              <rect x="12" y="15" width="25" height="1.5" rx="0.5" fill="#fff" opacity="0.35" />
            </g>
          </g>
        </svg>

      </motion.div>

      {/* AUDITAS bubble panel - moved inward, matched styling */}
      <motion.div
        className="absolute top-4 right-6 w-auto rounded-lg bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm border border-white/15 p-2 z-30"
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
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

      {/* Priority indicator - bottom left, simplified and smaller */}
      <motion.div
        className="absolute bottom-3 left-3 px-1.5 py-1 rounded-md bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm border border-white/15"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-2.5 rounded-sm bg-purple-400"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: i < 2 ? 0.9 : 0.3 }}
                transition={{ delay: 2 + i * 0.2 }}
              />
            ))}
          </div>
          <span className="text-[6px] text-white/50">Aukšta</span>
        </div>
      </motion.div>
    </div>
  );
}
