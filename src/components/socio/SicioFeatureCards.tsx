"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { features } from "@/content/copy.lt";
import { easing, interactiveCardMotion, tiltMotion } from "@/content/socioMotion";

// Premium Icon: Sliders/Tuning for "100% pagal jus" (Card 1)
function SlidersIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Outer glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }}
        animate={{ opacity: isHovered ? 0.8 : 0.3 }}
        transition={{ duration: 0.3 }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#ringGradient1)"
          strokeWidth="1"
          opacity={isHovered ? 0.6 : 0.35}
        />
        {/* Inner glow ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="rgba(124, 58, 237, 0.15)"
          strokeWidth="8"
          filter="url(#innerGlow)"
        />
        {/* Three sliders */}
        <g opacity={isHovered ? 0.7 : 0.5}>
          {/* Slider 1 - left */}
          <line x1="30" y1="30" x2="30" y2="70" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <motion.circle
            cx="30"
            cy={isHovered ? "40" : "45"}
            r="4"
            fill="rgba(124, 58, 237, 0.8)"
            stroke="white"
            strokeWidth="1"
          />
          {/* Slider 2 - center */}
          <line x1="50" y1="30" x2="50" y2="70" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <motion.circle
            cx="50"
            cy={isHovered ? "55" : "50"}
            r="4"
            fill="rgba(124, 58, 237, 0.8)"
            stroke="white"
            strokeWidth="1"
          />
          {/* Slider 3 - right */}
          <line x1="70" y1="30" x2="70" y2="70" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <motion.circle
            cx="70"
            cy={isHovered ? "35" : "40"}
            r="4"
            fill="rgba(124, 58, 237, 0.8)"
            stroke="white"
            strokeWidth="1"
          />
        </g>
        {/* Spark highlight */}
        <motion.circle
          cx="75"
          cy="28"
          r="2"
          fill="white"
          animate={{ opacity: isHovered ? [0.4, 1, 0.4] : 0.3 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Gradients and filters */}
        <defs>
          <linearGradient id="ringGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
            <stop offset="50%" stopColor="rgba(124, 58, 237, 0.6)" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
          </filter>
        </defs>
      </motion.svg>
    </div>
  );
}

// Premium Icon: Shield + Lock for "Duomenys saugūs" (Card 2)
function ShieldLockIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Outer glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }}
        animate={{ opacity: isHovered ? 0.8 : 0.3 }}
        transition={{ duration: 0.3 }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#ringGradient2)"
          strokeWidth="1"
          opacity={isHovered ? 0.6 : 0.35}
        />
        {/* Shield shape */}
        <motion.path
          d="M50 20 L72 30 L72 50 Q72 70 50 80 Q28 70 28 50 L28 30 Z"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity={isHovered ? 0.7 : 0.5}
        />
        {/* Lock body */}
        <rect
          x="42"
          y="48"
          width="16"
          height="14"
          rx="2"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity={isHovered ? 0.7 : 0.5}
        />
        {/* Lock shackle */}
        <path
          d="M45 48 L45 43 Q45 38 50 38 Q55 38 55 43 L55 48"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isHovered ? 0.7 : 0.5}
        />
        {/* Lock keyhole */}
        <circle cx="50" cy="54" r="2" fill="rgba(124, 58, 237, 0.8)" />
        {/* Connection nodes */}
        <g opacity={isHovered ? 0.6 : 0.35}>
          <circle cx="25" cy="35" r="2.5" fill="rgba(124, 58, 237, 0.6)" stroke="white" strokeWidth="0.5" />
          <line x1="27" y1="36" x2="30" y2="38" stroke="white" strokeWidth="0.5" strokeDasharray="2 1" />
          <circle cx="75" cy="35" r="2.5" fill="rgba(124, 58, 237, 0.6)" stroke="white" strokeWidth="0.5" />
          <line x1="73" y1="36" x2="70" y2="38" stroke="white" strokeWidth="0.5" strokeDasharray="2 1" />
          <circle cx="50" cy="85" r="2.5" fill="rgba(124, 58, 237, 0.6)" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="82" x2="50" y2="78" stroke="white" strokeWidth="0.5" strokeDasharray="2 1" />
        </g>
        <defs>
          <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
            <stop offset="50%" stopColor="rgba(124, 58, 237, 0.6)" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}

// Premium Icon: Lightning + Motion for "3× greičiau" (Card 3)
function SpeedBoltIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Outer glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }}
        animate={{ opacity: isHovered ? 0.8 : 0.3 }}
        transition={{ duration: 0.3 }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#ringGradient3)"
          strokeWidth="1"
          opacity={isHovered ? 0.6 : 0.35}
        />
        {/* Motion arcs behind bolt */}
        <motion.path
          d="M25 40 Q30 50 25 60"
          fill="none"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={isHovered ? 0.5 : 0.25}
          animate={{ x: isHovered ? -3 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.path
          d="M30 35 Q37 50 30 65"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isHovered ? 0.6 : 0.3}
          animate={{ x: isHovered ? -2 : 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        />
        {/* Lightning bolt */}
        <motion.path
          d="M55 22 L42 48 L52 48 L45 78 L68 45 L55 45 L62 22 Z"
          fill="rgba(124, 58, 237, 0.3)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity={isHovered ? 0.8 : 0.6}
          animate={{
            filter: isHovered ? "drop-shadow(0 0 6px rgba(124, 58, 237, 0.6))" : "none"
          }}
          transition={{ duration: 0.3 }}
        />
        {/* Spark at tip */}
        <motion.circle
          cx="45"
          cy="78"
          r="2"
          fill="white"
          animate={{ opacity: isHovered ? [0.5, 1, 0.5] : 0.4, scale: isHovered ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <defs>
          <linearGradient id="ringGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
            <stop offset="50%" stopColor="rgba(124, 58, 237, 0.6)" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}

// Premium Icon: Hub + Connected Apps for "Viskas vienoje vietoje" (Card 4 - wide)
function HubConnectedIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }}
        animate={{ opacity: isHovered ? 0.8 : 0.3 }}
        transition={{ duration: 0.3 }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#ringGradient4)"
          strokeWidth="1"
          opacity={isHovered ? 0.6 : 0.35}
        />
        {/* Central hub */}
        <motion.circle
          cx="50"
          cy="50"
          r="10"
          fill="rgba(124, 58, 237, 0.4)"
          stroke="white"
          strokeWidth="1.5"
          opacity={isHovered ? 0.8 : 0.6}
        />
        {/* Inner dot */}
        <circle cx="50" cy="50" r="3" fill="white" opacity={isHovered ? 0.8 : 0.5} />
        {/* Connection lines (spoke pattern) */}
        <g opacity={isHovered ? 0.6 : 0.4}>
          <line x1="50" y1="40" x2="50" y2="25" stroke="white" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="58" y1="55" x2="72" y2="65" stroke="white" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="42" y1="55" x2="28" y2="65" stroke="white" strokeWidth="1" strokeDasharray="3 2" />
        </g>
        {/* App rectangles */}
        <g opacity={isHovered ? 0.7 : 0.5}>
          {/* Top app */}
          <rect x="42" y="15" width="16" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="45" y1="19" x2="55" y2="19" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="45" y1="23" x2="51" y2="23" stroke="white" strokeWidth="1" opacity="0.5" />
          {/* Bottom-right app */}
          <rect x="68" y="62" width="16" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="71" y1="66" x2="81" y2="66" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="71" y1="70" x2="77" y2="70" stroke="white" strokeWidth="1" opacity="0.5" />
          {/* Bottom-left app */}
          <rect x="16" y="62" width="16" height="12" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="19" y1="66" x2="29" y2="66" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="19" y1="70" x2="25" y2="70" stroke="white" strokeWidth="1" opacity="0.5" />
        </g>
        {/* Flowing network path (subtle) */}
        <motion.path
          d="M20 80 Q35 75 50 78 Q65 81 80 76"
          fill="none"
          stroke="rgba(124, 58, 237, 0.3)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={isHovered ? 0.5 : 0.2}
        />
        <defs>
          <linearGradient id="ringGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
            <stop offset="50%" stopColor="rgba(124, 58, 237, 0.6)" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}

// Premium Icon: Growth Graph for "5× greičiau auga" (Card 5 - wide)
function GrowthGraphIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Outer glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }}
        animate={{ opacity: isHovered ? 0.8 : 0.3 }}
        transition={{ duration: 0.3 }}
      />
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#ringGradient5)"
          strokeWidth="1"
          opacity={isHovered ? 0.6 : 0.35}
        />
        {/* Rising graph line */}
        <motion.path
          d="M25 70 L40 55 L55 60 L75 30"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isHovered ? 0.7 : 0.5}
        />
        {/* Data nodes */}
        <g opacity={isHovered ? 0.8 : 0.6}>
          <circle cx="25" cy="70" r="3" fill="rgba(124, 58, 237, 0.6)" stroke="white" strokeWidth="1" />
          <circle cx="40" cy="55" r="3" fill="rgba(124, 58, 237, 0.6)" stroke="white" strokeWidth="1" />
          <circle cx="55" cy="60" r="3" fill="rgba(124, 58, 237, 0.6)" stroke="white" strokeWidth="1" />
          <motion.circle
            cx="75"
            cy="30"
            r="4"
            fill="rgba(124, 58, 237, 0.8)"
            stroke="white"
            strokeWidth="1.5"
            animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </g>
        {/* Upward arrow */}
        <g opacity={isHovered ? 0.7 : 0.45}>
          <motion.path
            d="M75 30 L75 22 M75 22 L70 27 M75 22 L80 27"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: isHovered ? -2 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </g>
        {/* Subtle grid lines */}
        <g opacity="0.15">
          <line x1="20" y1="75" x2="80" y2="75" stroke="white" strokeWidth="0.5" />
          <line x1="20" y1="55" x2="80" y2="55" stroke="white" strokeWidth="0.5" />
          <line x1="20" y1="35" x2="80" y2="35" stroke="white" strokeWidth="0.5" />
        </g>
        <defs>
          <linearGradient id="ringGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
            <stop offset="50%" stopColor="rgba(124, 58, 237, 0.6)" />
            <stop offset="100%" stopColor="white" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}

// Chart graphic for "Everything in view" card
function MiniChart({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-full h-24 mt-4">
      {/* Dots indicator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
      </div>
      {/* Chart line */}
      <svg viewBox="0 0 200 80" className="w-full h-full mt-2">
        <motion.path
          d="M0 60 Q20 55, 40 50 T80 45 T120 35 T160 40 T200 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/40"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isHovered ? 1 : 0.8 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <motion.circle
          cx="200"
          cy="30"
          r="4"
          className="text-white/60 fill-current"
          animate={{ scale: isHovered ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
        />
      </svg>
    </div>
  );
}

// Chat bubbles for "Scale with ease" card
function ChatBubbles({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative w-full h-full flex flex-col items-start justify-center gap-2">
      {/* Person 1 (male) - asks */}
      <motion.div
        className="flex items-center gap-2"
        animate={{ x: isHovered ? 0 : 5, opacity: isHovered ? 1 : 0.7 }}
        transition={{ duration: 0.3, delay: 0 }}
      >
        <span className="px-3 py-1.5 text-xs bg-white/10 rounded-full text-white/70">Padarei?</span>
        <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
          <Image src="/socio/chat-male.png" alt="User" fill className="object-cover" />
        </div>
      </motion.div>
      {/* Person 2 (female/Inerci) - responds */}
      <motion.div
        className="flex items-center gap-2 ml-6"
        animate={{ x: isHovered ? 0 : 5, opacity: isHovered ? 1 : 0.7 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
          <Image src="/socio/chat-female.png" alt="Inerci" fill className="object-cover" />
        </div>
        <span className="px-3 py-1.5 text-xs bg-white/10 rounded-full text-white/70 whitespace-nowrap">Inerci padarė.</span>
      </motion.div>
      {/* Person 1 (male) - same person as first, reacts */}
      <motion.div
        className="flex items-center gap-2"
        animate={{ x: isHovered ? 0 : 5, opacity: isHovered ? 1 : 0.7 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <span className="px-3 py-1.5 text-xs bg-white/10 rounded-full text-white/70">Nice!</span>
        <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
          <Image src="/socio/chat-male.png" alt="User" fill className="object-cover" />
        </div>
      </motion.div>
    </div>
  );
}

// Premium Feature card component with 3D tilt and glow
function FeatureCard({
  title,
  description,
  heroIcon,
  bottomGraphic,
  bigBold,
  isWide = false,
  delay = 0,
  index = 0,
  cardKey,
}: {
  title: string;
  description: string;
  heroIcon?: React.ReactNode;
  bottomGraphic?: React.ReactNode;
  bigBold?: string;
  isWide?: boolean;
  delay?: number;
  index?: number;
  cardKey?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth tilt - more responsive for dramatic effect
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [tiltMotion.rotationFactor, -tiltMotion.rotationFactor]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-tiltMotion.rotationFactor, tiltMotion.rotationFactor]),
    springConfig
  );

  // Subtle floating animation offset based on card index
  const floatY = useMotionValue(0);
  const floatYSpring = useSpring(floatY, { stiffness: 100, damping: 20 });

  // Check reduced motion preference and mobile
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    setIsMobile(window.innerWidth < 768);

    const motionHandler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    const resizeHandler = () => setIsMobile(window.innerWidth < 768);

    mediaQuery.addEventListener("change", motionHandler);
    window.addEventListener("resize", resizeHandler);

    return () => {
      mediaQuery.removeEventListener("change", motionHandler);
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  // Subtle floating animation
  useEffect(() => {
    if (prefersReducedMotion || isMobile) return;

    let animationId: number;
    const floatAnimation = () => {
      const time = Date.now() / 1000;
      // Each card has slightly different phase based on index
      const phase = index * 0.7;
      const value = Math.sin(time * 0.4 + phase) * 4;
      floatY.set(value);
      animationId = requestAnimationFrame(floatAnimation);
    };

    animationId = requestAnimationFrame(floatAnimation);
    return () => cancelAnimationFrame(animationId);
  }, [index, prefersReducedMotion, isMobile, floatY]);

  // Handle mouse move for tilt (throttled)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || isMobile || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized values from -0.5 to 0.5
      const x = (e.clientX - centerX) / rect.width;
      const y = (e.clientY - centerY) / rect.height;

      mouseX.set(x);
      mouseY.set(y);
    },
    [prefersReducedMotion, isMobile, mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const shouldAnimate3D = !prefersReducedMotion && !isMobile;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.7,
        ease: easing.standard,
        delay,
        scale: { type: "spring", stiffness: 200, damping: 20 },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group h-full"
      style={{
        perspective: shouldAnimate3D ? `${tiltMotion.perspective}px` : undefined,
        y: shouldAnimate3D ? floatYSpring : undefined,
      }}
    >
      {/* Outer glow on hover - stronger effect */}
      <motion.div
        className="absolute -inset-4 rounded-3xl blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${interactiveCardMotion.glowColor}50 0%, transparent 70%)`,
        }}
        animate={{
          opacity: isHovered ? interactiveCardMotion.glowIntensity.hover : interactiveCardMotion.glowIntensity.idle,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      {/* Card with 3D transform */}
      <motion.div
        className="relative h-full rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(30, 40, 60, 0.6) 0%, rgba(20, 28, 45, 0.8) 100%)",
          rotateX: shouldAnimate3D ? rotateX : 0,
          rotateY: shouldAnimate3D ? rotateY : 0,
          transformStyle: shouldAnimate3D ? "preserve-3d" : undefined,
        }}
        animate={{
          scale: isHovered ? interactiveCardMotion.hoverScale : 1,
        }}
        transition={interactiveCardMotion.tiltSpring}
      >
        {/* Animated border */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: "1px solid",
          }}
          animate={{
            borderColor: isHovered
              ? `${interactiveCardMotion.glowColor}60`
              : "rgba(80, 100, 140, 0.25)",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Top accent line with glow */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
          style={{
            width: isWide ? "120px" : "80px",
            background: `linear-gradient(90deg, transparent 0%, ${interactiveCardMotion.glowColor} 50%, transparent 100%)`,
          }}
          animate={{
            opacity: isHovered ? 0.8 : 0.4,
            boxShadow: isHovered
              ? `0 0 20px ${interactiveCardMotion.glowColor}60`
              : "none",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Inner glow - stronger on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${interactiveCardMotion.glowColor}20 0%, transparent 60%)`,
          }}
          animate={{
            opacity: isHovered ? 1.2 : 0.4,
          }}
          transition={{ duration: 0.25 }}
        />

        {/* Shimmer sweep on hover - more visible */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          initial={false}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)",
            }}
            animate={{
              x: isHovered ? ["0%", "200%"] : "0%",
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
          />
        </motion.div>

        {/* Content - increased depth for 3D pop */}
        <div
          className={`relative z-10 p-6 md:p-8 h-full flex flex-col ${
            isWide ? "md:flex-row md:items-start md:gap-8" : "items-center text-center"
          }`}
          style={{ transform: shouldAnimate3D ? "translateZ(40px)" : undefined }}
        >
          {/* Hero icon area (top cards) */}
          {heroIcon && (
            <motion.div
              className="flex justify-center mb-4"
              animate={{
                y: isHovered ? -5 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {heroIcon}
            </motion.div>
          )}

          {/* Text content */}
          <div className={isWide ? "flex-1" : "flex flex-col flex-1"}>
            {/* Big bold stat for wide cards - except scalable which shows it in corner */}
            {isWide && bigBold && cardKey !== "scalable" && (
              <motion.div
                className="mb-4"
                animate={{ scale: isHovered ? 1.02 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl md:text-2xl font-bold text-white/90 tracking-tight">
                  {bigBold}
                </span>
              </motion.div>
            )}

            <motion.h3
              className="text-lg md:text-xl font-semibold text-white mb-3 whitespace-nowrap"
              animate={{
                color: isHovered ? "#ffffff" : "rgba(255,255,255,0.95)",
              }}
              transition={{ duration: 0.3 }}
            >
              {cardKey === "scalable" ? (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span>{title}</span>
                  <motion.span
                    className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-[#ac9cfc] to-primary bg-clip-text text-transparent relative -top-0.5"
                    animate={{ scale: isHovered ? 1.05 : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "inline-block" }}
                  >
                    {bigBold}
                  </motion.span>
                  <span>{(features.cards.scalable as { titleLine2?: string }).titleLine2 || ""}</span>
                </span>
              ) : (
                title
              )}
            </motion.h3>
            <p className={`text-sm md:text-base text-white/50 leading-relaxed ${!isWide ? "mt-6" : ""}`}>
              {cardKey === "fast" && bigBold ? (
                <span className="flex flex-col items-center text-center">
                  <span className="flex items-center justify-center gap-1 whitespace-nowrap">
                    <span>{(features.cards.fast as { descriptionLine1?: string }).descriptionLine1}</span>
                    <motion.span
                      className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-[#ac9cfc] to-primary bg-clip-text text-transparent relative -top-0.5"
                      animate={{ scale: isHovered ? 1.05 : 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: "inline-block" }}
                    >
                      {bigBold}
                    </motion.span>
                  </span>
                  <span className="block mt-1">
                    {(features.cards.fast as { descriptionLine2?: string }).descriptionLine2}
                  </span>
                </span>
              ) : cardKey === "transparent" ? (
                <span className="flex flex-col">
                  <span className="block whitespace-nowrap">
                    {(features.cards.transparent as { descriptionLine1?: string }).descriptionLine1}
                  </span>
                  <span className="block mt-1">
                    {(features.cards.transparent as { descriptionLine2?: string }).descriptionLine2}
                  </span>
                </span>
              ) : cardKey === "scalable" ? (
                <span className="flex flex-col">
                  <span className="block">{(features.cards.scalable as { descriptionLine1?: string }).descriptionLine1}</span>
                  <span className="block">{(features.cards.scalable as { descriptionLine2?: string }).descriptionLine2}</span>
                  <span className="block">{(features.cards.scalable as { descriptionLine3?: string }).descriptionLine3}</span>
                </span>
              ) : (
                description
              )}
            </p>
          </div>

          {/* Bottom graphic for wide cards */}
          {isWide && bottomGraphic && (
            <div className={`hidden md:flex flex-shrink-0 ${
              cardKey === "transparent"
                ? "w-32 items-center justify-start self-center -ml-12"
                : cardKey === "scalable"
                ? "w-64 items-center justify-end self-center"
                : "w-48 items-end"
            }`}>
              {bottomGraphic}
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SicioFeatureCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Top row cards with hero icons
  const topCards = [
    {
      key: "custom",
      title: features.cards.custom.title,
      description: features.cards.custom.description,
      heroIcon: <SlidersIcon isHovered={hoveredCard === "custom"} />,
    },
    {
      key: "secure",
      title: features.cards.secure.title,
      description: features.cards.secure.description,
      heroIcon: <ShieldLockIcon isHovered={hoveredCard === "secure"} />,
    },
    {
      key: "fast",
      title: features.cards.fast.title,
      description: "", // Rendered separately with styled 3×
      bigBold: features.cards.fast.bigBold,
      heroIcon: <SpeedBoltIcon isHovered={hoveredCard === "fast"} />,
    },
  ];

  // Bottom row wide cards with graphics
  const bottomCards = [
    {
      key: "transparent",
      bigBold: features.cards.transparent.bigBold,
      title: features.cards.transparent.title,
      description: "", // Rendered separately with two lines
      bottomGraphic: <HubConnectedIcon isHovered={hoveredCard === "transparent"} />,
    },
    {
      key: "scalable",
      bigBold: features.cards.scalable.bigBold,
      title: (features.cards.scalable as { titleLine1?: string }).titleLine1 || "",
      description: features.cards.scalable.description,
      bottomGraphic: <ChatBubbles isHovered={hoveredCard === "scalable"} />,
    },
  ];

  return (
    <div className="w-full">
      {/* Top row - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {topCards.map((card, index) => (
          <div
            key={card.key}
            onMouseEnter={() => setHoveredCard(card.key)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <FeatureCard
              title={card.title}
              description={card.description}
              heroIcon={card.heroIcon}
              bigBold={(card as { bigBold?: string }).bigBold}
              delay={index * 0.1}
              index={index}
              cardKey={card.key}
            />
          </div>
        ))}
      </div>

      {/* Bottom row - 2 wider cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {bottomCards.map((card, index) => (
          <div
            key={card.key}
            onMouseEnter={() => setHoveredCard(card.key)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <FeatureCard
              title={card.title}
              description={card.description}
              bottomGraphic={card.bottomGraphic}
              bigBold={card.bigBold}
              isWide={true}
              delay={0.3 + index * 0.1}
              index={3 + index}
              cardKey={card.key}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
