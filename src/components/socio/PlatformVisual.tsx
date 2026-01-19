"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface PlatformVisualProps {
  imageSrc: string;
  altText: string;
}

export default function PlatformVisual({ imageSrc, altText }: PlatformVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [interactions, setInteractions] = useState(0);
  const [savedHours, setSavedHours] = useState(8.4);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const lastIncrementRef = useRef(0);

  // Track mouse movement and increment counters
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });

    // Increment counters based on movement (throttled)
    const now = Date.now();
    if (now - lastIncrementRef.current > 100) {
      lastIncrementRef.current = now;
      setInteractions((prev) => prev + 1);
      // Increment saved hours slowly
      if (Math.random() < 0.3) {
        setSavedHours((prev) => Math.round((prev + 0.1) * 10) / 10);
      }
    }
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  // Calculate tilt based on mouse position
  const tiltX = (mousePosition.y - 0.5) * -8;
  const tiltY = (mousePosition.x - 0.5) * 8;

  return (
    <div className="relative aspect-[4/3]">
      {/* Back card (3rd layer) - shows blurred dashboard hint */}
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-hidden border border-white/[0.12]"
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
        animate={{
          x: isHovering ? 28 : 24,
          y: isHovering ? 28 : 24,
          rotate: isHovering ? 4 : 3,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover opacity-30 blur-[2px] saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/90 via-[#16213e]/80 to-[#0f0f23]/90" />
      </motion.div>

      {/* Middle card (2nd layer) - shows slightly clearer dashboard */}
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-hidden border border-white/[0.15]"
        style={{
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
        animate={{
          x: isHovering ? 16 : 12,
          y: isHovering ? 16 : 12,
          rotate: isHovering ? 2 : 1.5,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover opacity-50 blur-[1px] saturate-75"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/70 via-[#16213e]/60 to-[#0f0f23]/70" />
      </motion.div>

      {/* Main card (front) - interactive */}
      <motion.div
        ref={containerRef}
        className="relative h-full rounded-2xl overflow-hidden glass-card cursor-pointer"
        style={{
          boxShadow: "0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
        animate={{
          rotateX: tiltX,
          rotateY: tiltY,
          scale: isHovering ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={imageSrc}
          alt={altText}
          fill
          className="object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/10" />

        {/* Interactive spotlight effect following mouse */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: isHovering
              ? `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)`
              : "none",
          }}
          transition={{ duration: 0.1 }}
        />

        {/* Live stats overlay - appears on hover */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              className="absolute bottom-3 left-3 right-3 rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 100%)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/70 font-medium">Veiksmai</span>
                  <motion.span
                    key={interactions}
                    initial={{ scale: 1.2, color: "#a78bfa" }}
                    animate={{ scale: 1, color: "#22d3ee" }}
                    className="text-[11px] font-bold tabular-nums"
                  >
                    {interactions}
                  </motion.span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/70 font-medium">Sutaupyta valandų</span>
                  <motion.span
                    key={savedHours}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-[11px] text-emerald-400 font-bold tabular-nums"
                  >
                    +{savedHours}h
                  </motion.span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                    initial={{ width: "60%" }}
                    animate={{ width: `${Math.min(60 + interactions * 0.5, 95)}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-white/50">
                  <span>Automatizacija</span>
                  <span className="tabular-nums">{Math.min(60 + Math.floor(interactions * 0.5), 95)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse indicator when hovering */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span className="text-[9px] text-white/80 font-medium">Live</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
