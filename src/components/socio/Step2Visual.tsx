"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, type MotionValue } from "framer-motion";

// Lerp helper
function lerp(start: number, end: number, p: number): number {
  return start + (end - start) * p;
}

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
        {/* ========== TOP-LEFT: Broken KPIs strip ========== */}
        <div
          className="absolute top-10 left-2 flex gap-1.5"
          style={{ transform: "rotate(-1deg)" }}
        >
          {/* KPI 1 */}
          <div
            className="px-2 py-1.5 rounded-lg"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[7px] text-white/50">Atsakymų</span>
            </div>
            <span className="text-[11px] font-bold text-red-400">12%</span>
          </div>
          {/* KPI 2 */}
          <div
            className="px-2 py-1.5 rounded-lg"
            style={{
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-[7px] text-white/50">Vėluoja</span>
            </div>
            <span className="text-[11px] font-bold text-orange-400">14</span>
          </div>
          {/* KPI 3 */}
          <div
            className="px-2 py-1.5 rounded-lg"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[7px] text-white/50">Dublikatų</span>
            </div>
            <span className="text-[11px] font-bold text-red-400">27</span>
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

        {/* ========== BROKEN CHART with "Nėra aiškumo" ========== */}
        <div
          className="absolute bottom-3 left-3 w-[130px] h-[45px] rounded-lg p-2"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] text-white/30">Efektyvumas</span>
            <span className="text-[6px] text-red-400/70 font-medium">Nėra aiškumo</span>
          </div>
          <svg viewBox="0 0 100 20" className="w-full h-[18px]">
            {/* Noisy flat line */}
            <path
              d="M 0 12 L 10 14 L 20 11 L 30 15 L 40 10 L 50 13 L 60 11 L 70 14 L 80 12 L 90 15 L 100 13"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
            />
            {/* Small question mark */}
            <text x="88" y="8" fill="rgba(255,255,255,0.2)" fontSize="8">?</text>
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

// After state: Premium unified dashboard
function AfterState({ opacity, progress }: { opacity: number; progress: number }) {
  if (opacity < 0.01) return null;

  const automations = Math.round(lerp(0, 96, progress));
  const hours = lerp(0, 10.9, progress).toFixed(1);
  const followUps = Math.round(lerp(0, 95, progress));

  return (
    <div
      className="absolute inset-0 p-3 pt-10 pointer-events-none"
      style={{ opacity }}
    >
      <div className="h-full flex flex-col">
        {/* Top nav - positioned below the header badge area */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {["Apžvalga", "Dispatch", "Sąskaitos", "CRM"].map((item, i) => (
              <span
                key={item}
                className={`text-[9px] font-medium transition-colors ${
                  i === 0 ? "text-white/90" : "text-white/40"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full live-pulse">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 6px rgba(52, 211, 153, 0.8)" }}
            />
            <span className="text-[8px] text-emerald-400 font-semibold">LIVE</span>
          </div>
        </div>

        {/* KPI chips */}
        <div className="flex gap-2 mb-3">
          <div
            className="flex-1 p-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(167, 139, 250, 0.05) 100%)",
              border: "1px solid rgba(167, 139, 250, 0.2)",
            }}
          >
            <div className="text-[8px] text-white/50 mb-0.5">Automatizacijos</div>
            <div className="text-[14px] font-bold text-white tabular-nums">{automations}</div>
          </div>
          <div
            className="flex-1 p-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.05) 100%)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
            }}
          >
            <div className="text-[8px] text-white/50 mb-0.5">Sutaupyta</div>
            <div className="text-[14px] font-bold text-emerald-400 tabular-nums">+{hours}h</div>
          </div>
          <div
            className="flex-1 p-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(34, 211, 238, 0.05) 100%)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
            }}
          >
            <div className="text-[8px] text-white/50 mb-0.5">Follow-ups</div>
            <div className="text-[14px] font-bold text-cyan-400 tabular-nums">{followUps}%</div>
          </div>
        </div>

        {/* Main chart area */}
        <div className="flex-1 flex gap-2">
          {/* Line chart */}
          <div
            className="flex-[2] rounded-xl p-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="text-[8px] text-white/40 mb-2">Efektyvumas</div>
            <svg viewBox="0 0 200 60" className="w-full h-[45px]">
              <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(167, 139, 250, 0.4)" />
                  <stop offset="100%" stopColor="rgba(167, 139, 250, 0)" />
                </linearGradient>
              </defs>
              <path
                d="M 0 50 Q 25 48, 50 42 T 100 30 T 150 18 T 200 8"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
              />
              <path
                d="M 0 50 Q 25 48, 50 42 T 100 30 T 150 18 T 200 8 L 200 60 L 0 60 Z"
                fill="url(#chartGrad)"
              />
              {/* Data points */}
              {[[50, 42], [100, 30], [150, 18], [200, 8]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="#a78bfa" />
              ))}
            </svg>
          </div>

          {/* Bar chart */}
          <div
            className="flex-1 rounded-xl p-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="text-[8px] text-white/40 mb-2">Veiksmai</div>
            <div className="flex items-end gap-1 h-[45px]">
              {[45, 72, 58, 85, 62].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(180deg, ${i === 3 ? '#a78bfa' : 'rgba(167, 139, 250, 0.5)'} 0%, ${i === 3 ? '#7c3aed' : 'rgba(124, 58, 237, 0.3)'} 100%)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[8px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              <span className="text-white/50">Visi procesai veikia</span>
            </div>
          </div>
          <div className="text-[8px] text-white/30">Atnaujinta prieš 2s</div>
        </div>
      </div>
    </div>
  );
}

// Transition elements (warnings becoming checks, etc.)
function TransitionElements({ progress }: { progress: number }) {
  // Warnings fade out from 0.15 to 0.4
  const warningOpacity = Math.max(0, Math.min(1, (0.4 - progress) / 0.25));
  // Checks fade in from 0.35 to 0.6, then fade out from 0.7 to 0.9
  const checkFadeIn = Math.max(0, Math.min(1, (progress - 0.35) / 0.25));
  const checkFadeOut = Math.max(0, Math.min(1, (0.9 - progress) / 0.2));
  const checkOpacity = Math.min(checkFadeIn, checkFadeOut);

  if (progress < 0.15 || progress > 0.9) return null;

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

// Helper: Calculate overlay opacity based on progress (piecewise linear)
// Fade in: 0.38→0.41, visible: 0.41→0.67, fade out: 0.67→0.70
// ~4 seconds total (32% of 12.5s transformation)
function getOverlayOpacity(progress: number): number {
  if (progress < 0.38 || progress > 0.70) return 0;
  if (progress < 0.41) return (progress - 0.38) / 0.03; // fade in
  if (progress < 0.67) return 1; // fully visible
  return (0.70 - progress) / 0.03; // fade out
}

// Mid-transition automation overlay
function AutomationOverlay({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, getOverlayOpacity);
  const dimAmount = useTransform(progress, (p) => getOverlayOpacity(p) > 0 ? 0.8 : 1);

  return (
    <>
      {/* Dim layer for underlying content */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-15"
        style={{
          background: "rgba(0, 0, 0, 0.25)",
          opacity: useTransform(opacity, (o) => o > 0 ? 1 : 0),
        }}
      />

      {/* Main overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
        style={{ opacity }}
      >
        {/* Glass container */}
        <div
          className="relative px-6 py-5 rounded-2xl max-w-[85%] text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(10, 10, 25, 0.95) 100%)",
            border: "1px solid rgba(167, 139, 250, 0.2)",
            boxShadow: `
              0 0 40px rgba(124, 58, 237, 0.15),
              0 0 80px rgba(34, 211, 238, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `,
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Animated glow ring behind content */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="automation-ring" />
          </div>

          {/* Robot nodes visual */}
          <div className="relative mb-4 flex items-center justify-center gap-6">
            {/* Node 1 */}
            <div className="automation-node">
              <div className="w-8 h-8 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full automation-node-glow" style={{ background: "rgba(167, 139, 250, 0.2)" }} />
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                {/* Antenna */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-2 bg-gradient-to-t from-violet-400 to-transparent" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-violet-400 automation-antenna-pulse" />
              </div>
            </div>

            {/* Connecting line 1 */}
            <svg className="w-8 h-1 overflow-visible" viewBox="0 0 32 4">
              <line x1="0" y1="2" x2="32" y2="2" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="1" strokeDasharray="4 2" />
              <circle className="automation-data-dot" cx="0" cy="2" r="2" fill="#a78bfa" />
            </svg>

            {/* Node 2 (center - main) */}
            <div className="automation-node">
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full automation-node-glow-main" style={{ background: "rgba(34, 211, 238, 0.25)" }} />
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="3" />
                    <path d="M12 8v3" />
                  </svg>
                </div>
                {/* Antenna */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-px h-2.5 bg-gradient-to-t from-cyan-400 to-transparent" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 automation-antenna-pulse-main" />
              </div>
            </div>

            {/* Connecting line 2 */}
            <svg className="w-8 h-1 overflow-visible" viewBox="0 0 32 4">
              <line x1="0" y1="2" x2="32" y2="2" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="1" strokeDasharray="4 2" />
              <circle className="automation-data-dot-reverse" cx="32" cy="2" r="2" fill="#22d3ee" />
            </svg>

            {/* Node 3 */}
            <div className="automation-node">
              <div className="w-8 h-8 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full automation-node-glow" style={{ background: "rgba(34, 211, 238, 0.2)" }} />
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                {/* Antenna */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-2 bg-gradient-to-t from-cyan-400 to-transparent" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 automation-antenna-pulse" />
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="relative mb-2">
            <span
              className="text-[15px] md:text-[17px] font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 10px rgba(167, 139, 250, 0.5))" }}
            >
              INERCI
            </span>
            <span className="text-[13px] md:text-[15px] font-semibold text-white/90 ml-1.5">
              automatizacijų diegimas
            </span>
          </div>

          {/* Subline */}
          <p className="relative text-[9px] md:text-[10px] text-white/50 leading-relaxed max-w-[240px] mx-auto mb-4">
            Optimizuojame procesus. Jungiamės prie įrankių. Paleidžiame automatizacijas.
          </p>

          {/* Progress bar with shimmer */}
          <div className="relative w-full max-w-[180px] mx-auto h-1 rounded-full overflow-hidden bg-white/10">
            <div className="automation-progress-shimmer" />
          </div>
        </div>
      </motion.div>

      {/* CSS Keyframes */}
      <style jsx global>{`
        /* Pulsing glow for outer nodes */
        .automation-node-glow {
          animation: nodeGlow 2s ease-in-out infinite;
        }
        .automation-node-glow-main {
          animation: nodeGlowMain 1.5s ease-in-out infinite;
        }
        @keyframes nodeGlow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        @keyframes nodeGlowMain {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 1; }
        }

        /* Antenna pulse */
        .automation-antenna-pulse {
          animation: antennaPulse 1.5s ease-in-out infinite;
        }
        .automation-antenna-pulse-main {
          animation: antennaPulseMain 1s ease-in-out infinite;
        }
        @keyframes antennaPulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 4px rgba(167, 139, 250, 0.5); }
          50% { opacity: 1; box-shadow: 0 0 8px rgba(167, 139, 250, 0.9); }
        }
        @keyframes antennaPulseMain {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 6px rgba(34, 211, 238, 0.6); }
          50% { opacity: 1; box-shadow: 0 0 12px rgba(34, 211, 238, 1); }
        }

        /* Data dots moving along lines */
        .automation-data-dot {
          animation: dataDotMove 1.2s linear infinite;
        }
        .automation-data-dot-reverse {
          animation: dataDotMoveReverse 1.2s linear infinite;
        }
        @keyframes dataDotMove {
          0% { cx: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { cx: 32; opacity: 0; }
        }
        @keyframes dataDotMoveReverse {
          0% { cx: 32; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { cx: 0; opacity: 0; }
        }

        /* Rotating ring */
        .automation-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 200%;
          transform: translate(-50%, -50%);
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(167, 139, 250, 0.1) 60deg,
            transparent 120deg,
            rgba(34, 211, 238, 0.1) 180deg,
            transparent 240deg,
            rgba(167, 139, 250, 0.1) 300deg,
            transparent 360deg
          );
          animation: ringRotate 8s linear infinite;
          opacity: 0.6;
        }
        @keyframes ringRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* Progress shimmer */
        .automation-progress-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(167, 139, 250, 0.6) 25%,
            rgba(34, 211, 238, 0.8) 50%,
            rgba(167, 139, 250, 0.6) 75%,
            transparent 100%
          );
          animation: progressShimmer 1.5s ease-in-out infinite;
        }
        @keyframes progressShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
  const smoothProgress = useSpring(progress, { stiffness: 120, damping: 20 });

  const [displayProgress, setDisplayProgress] = useState(0);
  const [rawProgress, setRawProgress] = useState(0);
  const [isInView, setIsInView] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  // Automatic endless loop: 0 -> 1 (animate) -> pause 5s -> instant reset to 0 -> repeat
  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const animateForward = () => {
      intervalId = setInterval(() => {
        const current = progress.get();

        if (current >= 1) {
          // Reached 100%, stop and pause for 5 seconds
          clearInterval(intervalId);
          timeoutId = setTimeout(() => {
            // Instant reset to 0 - jump both progress and smoothProgress
            progress.jump(0);
            smoothProgress.jump(0);
            // Start animating forward again after a brief moment
            timeoutId = setTimeout(animateForward, 100);
          }, 5000); // 5 second pause at "after" state
        } else {
          // Animate forward (slower: ~12s total transformation)
          progress.set(Math.min(1, current + 0.002));
        }
      }, 25);
    };

    // Start with a delay (1.5s to show "before" state)
    timeoutId = setTimeout(animateForward, 1500);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isInView, prefersReducedMotion, progress, smoothProgress]);

  // Calculate opacities for states
  const beforeOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);
  const afterOpacity = useTransform(smoothProgress, [0.5, 1], [0, 1]);

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

        {/* Transition elements */}
        {!prefersReducedMotion && <TransitionElements progress={finalProgress} />}

        {/* Automation overlay - shows during mid-transition */}
        {!prefersReducedMotion && <AutomationOverlay progress={progress} />}

        {/* After state */}
        <AfterState opacity={prefersReducedMotion ? 1 : afterOp} progress={finalProgress} />

        {/* Scanline */}
        {!prefersReducedMotion && snappyProgress > 0.01 && snappyProgress < 0.99 && (
          <Scanline progress={snappyProgress} />
        )}

        {/* Progress bar */}
        <ProgressBar progress={snappyProgress} />

        {/* Header badge - always visible above all content */}
        <div
          className="absolute top-1 left-2.5 flex items-center gap-2 z-40 px-2 py-1.5 rounded-lg"
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
          <span className="text-[9px] font-bold text-white/90">Transformacija</span>
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
      `}</style>
    </div>
  );
}
