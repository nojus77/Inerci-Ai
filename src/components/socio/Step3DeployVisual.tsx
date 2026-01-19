"use client";

import { motion } from "framer-motion";

export default function Step3DeployVisual() {
  return (
    <div className="relative w-full h-full min-h-[280px] bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] rounded-2xl overflow-hidden p-6">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-blue-500/15 rounded-full blur-2xl" />
      <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-indigo-500/15 rounded-full blur-2xl" />

      {/* Connection lines SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280">
        {/* Lines from tools to AI core */}
        <motion.line
          x1="70" y1="70" x2="170" y2="120"
          stroke="url(#connectGradient1)"
          strokeWidth="2"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.line
          x1="330" y1="70" x2="230" y2="120"
          stroke="url(#connectGradient2)"
          strokeWidth="2"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.7 }}
        />
        <motion.line
          x1="70" y1="210" x2="170" y2="160"
          stroke="url(#connectGradient3)"
          strokeWidth="2"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.9 }}
        />
        <motion.line
          x1="330" y1="210" x2="230" y2="160"
          stroke="url(#connectGradient4)"
          strokeWidth="2"
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1, delay: 1.1 }}
        />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="connectGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="connectGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="connectGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="connectGradient4" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Central AI Core */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 backdrop-blur-md border border-purple-400/40 flex flex-col items-center justify-center z-20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-purple-400/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl border border-purple-400/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />

        {/* AI Icon */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </motion.div>
        <span className="text-[10px] text-purple-300/90 font-semibold mt-1">AI CORE</span>
      </motion.div>

      {/* Tool panels */}
      {/* CRM - Top Left */}
      <motion.div
        className="absolute top-6 left-4 w-16 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm border border-green-400/30 flex flex-col items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-[8px] text-green-300/80 font-medium mt-0.5">CRM</span>
        {/* Status indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Email - Top Right */}
      <motion.div
        className="absolute top-6 right-4 w-16 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 backdrop-blur-sm border border-blue-400/30 flex flex-col items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-[8px] text-blue-300/80 font-medium mt-0.5">EMAIL</span>
        {/* Status indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
      </motion.div>

      {/* Sheets - Bottom Left */}
      <motion.div
        className="absolute bottom-6 left-4 w-16 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 backdrop-blur-sm border border-amber-400/30 flex flex-col items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-[8px] text-amber-300/80 font-medium mt-0.5">SHEETS</span>
        {/* Status indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
      </motion.div>

      {/* Calendar - Bottom Right */}
      <motion.div
        className="absolute bottom-6 right-4 w-16 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 backdrop-blur-sm border border-pink-400/30 flex flex-col items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.0 }}
      >
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[8px] text-pink-300/80 font-medium mt-0.5">CALENDAR</span>
        {/* Status indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-400"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
        />
      </motion.div>

      {/* Data flow particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/60"
          style={{
            left: `${20 + i * 15}%`,
            top: '50%',
          }}
          animate={{
            x: [0, 80 - i * 10, 0],
            y: [0, -20 + i * 10, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Checklist Panel - Auditas (exact copy from Step1) */}
      <motion.div
        className="absolute top-2 left-1/2 -translate-x-1/2 w-auto rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 p-2 z-30"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
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
    </div>
  );
}
