"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { hero } from "@/content/copy.lt";
import {
  heroMotion,
  flipWordsMotion,
  buttonMotion,
  duration,
  easing,
} from "@/content/socioMotion";
import HeroKpi from "@/components/HeroKpi";
import { useCalModal } from "@/components/cal/CalContext";

function FlipWords({ words }: { words: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, duration.flipWord * 1000);
    return () => clearInterval(interval);
  }, [words.length]);

  // Find the longest word to set consistent width
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");

  return (
    <span className="relative inline-block">
      {/* Invisible longest word to maintain consistent width */}
      <span className="invisible">{longestWord}</span>
      {/* Actual animated word positioned absolutely, centered */}
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
            opacity: { duration: 0.4 },
            filter: { duration: 0.4 }
          }}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #93c5fd 0%, #818cf8 30%, #6366f1 60%, #a5b4fc 100%)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "shimmer 3s ease-in-out infinite",
          }}
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Hero() {
  const { openCalModal } = useCalModal();

  const handleAuditClick = () => {
    openCalModal();
  };

  return (
    <section className="relative min-h-screen flex items-start justify-center pt-32 md:pt-40 pb-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Particles are now global - see layout.tsx */}

      <motion.div
        initial={heroMotion.container.initial}
        animate={heroMotion.container.animate}
        transition={heroMotion.container.transition}
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        {/* Main Headline */}
        <motion.h1
          initial={heroMotion.headline.initial}
          animate={heroMotion.headline.animate}
          transition={heroMotion.headline.transition}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight"
        >
          {hero.headline}{" "}
          <FlipWords words={hero.flipWords} />
        </motion.h1>

        {/* Description - visually secondary: smaller, lighter, tighter */}
        <motion.p
          initial={heroMotion.description.initial}
          animate={heroMotion.description.animate}
          transition={heroMotion.description.transition}
          className="mt-5 md:mt-6 text-sm md:text-base text-foreground/50 font-normal max-w-2xl mx-auto leading-snug whitespace-nowrap"
        >
          {hero.description}
        </motion.p>

        {/* CTA Button - centered */}
        <motion.div
          initial={heroMotion.buttons.initial}
          animate={heroMotion.buttons.animate}
          transition={heroMotion.buttons.transition}
          className="mt-40 md:mt-52 flex items-center justify-center"
        >
          <motion.button
            onClick={handleAuditClick}
            className="relative inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-primary-foreground overflow-hidden group cursor-pointer"
            whileHover={buttonMotion.hover}
            whileTap={buttonMotion.tap}
            transition={buttonMotion.transition}
          >
            {/* Default: gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-[#ac9cfc] to-primary transition-opacity duration-300 group-hover:opacity-0" />
            {/* Hover: solid blue background */}
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 flex items-center gap-2">
              {hero.bookCall}
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </motion.button>
        </motion.div>

        {/* Hero KPI - Below CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easing.standard, delay: 0.7 }}
          className="mt-8 md:mt-10 flex justify-center"
        >
          <HeroKpi
            hoursTotal={3461}
            eurPerHour={13}
            initialDuration={5}
            hoursDuration={3}
            eurosDuration={1.5}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
