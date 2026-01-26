"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { navigation } from "@/content/copy.lt";
import { markCtaClicked } from "@/components/ExitIntentModal";
import Logo from "@/components/Logo";

// Nav items with section IDs
const navItems = [
  { label: "Sprendimai", href: "#features", sectionId: "features" },
  { label: "Paslaugos", href: "#services", sectionId: "services" },
];

// Spring config for premium feel
const springConfig = {
  stiffness: 400,
  damping: 30,
  mass: 1,
};

const softSpring = {
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

export default function PillNavbar() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [isCtaPressed, setIsCtaPressed] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const router = useRouter();

  const handleCallClick = () => {
    markCtaClicked();
    router.push("/booking");
  };

  // IntersectionObserver for active section detection
  useEffect(() => {
    const sections = navItems.map((item) => document.getElementById(item.sectionId)).filter(Boolean);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    sections.forEach((section) => {
      if (section) observerRef.current?.observe(section);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
        className="fixed top-4 md:top-6 left-0 right-0 z-50 px-4 md:px-6"
      >
        <div
          className="mx-auto"
          style={{ width: "min(1100px, calc(100% - 24px))" }}
        >
          {/* Pill Container */}
          <div
            className="relative h-[60px] md:h-[72px] rounded-full overflow-hidden"
            style={{
              background: "rgba(8, 12, 24, 0.65)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: `
                0 4px 24px rgba(0, 0, 0, 0.25),
                0 1px 3px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.08)
              `,
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Inner highlight */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
              }}
            />

            {/* Content */}
            <div className="relative h-full flex items-center justify-between px-5 md:px-8">
              {/* Logo */}
              <motion.a
                href="#"
                className="z-10 flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springConfig}
              >
                <Logo size="lg" animate={false} />
              </motion.a>

              {/* Divider between logo and nav */}
              <div className="hidden md:block w-px h-6 bg-gradient-to-b from-transparent via-white/30 to-transparent absolute left-[115px]" />

              {/* Desktop Nav Links - each in separate bubble, positioned left */}
              <div className="hidden md:flex items-center gap-2 absolute left-[140px]">
                {navItems.map((item) => {
                  const isActive = activeSection === item.sectionId;
                  const isHovered = hoveredNavItem === item.sectionId;

                  return (
                    <motion.a
                      key={item.sectionId}
                      href={item.href}
                      className="relative px-4 py-2 text-sm font-normal rounded-full overflow-hidden"
                      onMouseEnter={() => setHoveredNavItem(item.sectionId)}
                      onMouseLeave={() => setHoveredNavItem(null)}
                      animate={{
                        color: isActive || isHovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)",
                        backgroundColor: isActive || isHovered ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      }}
                      style={{
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                      whileHover={{ y: -1 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    >
                      {/* Very subtle shimmer sweep */}
                      <motion.div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)",
                        }}
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                          repeatDelay: 2,
                        }}
                      />
                      <span className="relative z-10">{item.label}</span>
                    </motion.a>
                  );
                })}
              </div>

              {/* Desktop CTA Button */}
              <motion.button
                onClick={handleCallClick}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white relative overflow-hidden z-10 cursor-pointer"
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => {
                  setIsCtaHovered(false);
                  setIsCtaPressed(false);
                }}
                onMouseDown={() => setIsCtaPressed(true)}
                onMouseUp={() => setIsCtaPressed(false)}
                animate={{
                  y: isCtaHovered ? -2 : 0,
                  scale: isCtaPressed ? 0.97 : 1,
                }}
                transition={springConfig}
                style={{
                  boxShadow: isCtaHovered
                    ? "0 8px 24px rgba(124, 58, 237, 0.35), 0 4px 12px rgba(59, 130, 246, 0.25)"
                    : "0 4px 16px rgba(124, 58, 237, 0.2), 0 2px 8px rgba(59, 130, 246, 0.15)",
                }}
              >
                {/* Gradient background */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #6366F1 100%)",
                    backgroundSize: "200% 200%",
                  }}
                  animate={{
                    backgroundPosition: isCtaHovered ? "100% 100%" : "0% 0%",
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {/* Shimmer overlay on hover */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                  }}
                  animate={{
                    x: isCtaHovered ? ["0%", "200%"] : "-100%",
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                />

                {/* Inner glow */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
                  }}
                />

                {/* Text */}
                <span className="relative z-10">{navigation.bookCall}</span>

                {/* Arrow */}
                <motion.svg
                  className="w-4 h-4 relative z-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  animate={{ x: isCtaHovered ? 4 : 0 }}
                  transition={springConfig}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                className="md:hidden p-2 text-white/80 z-10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <AnimatePresence mode="wait">
                    {mobileMenuOpen ? (
                      <motion.path
                        key="close"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        exit={{ pathLength: 0 }}
                        transition={{ duration: 0.2 }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <motion.g
                        key="menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16" />
                      </motion.g>
                    )}
                  </AnimatePresence>
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="fixed top-[84px] left-4 right-4 z-50 md:hidden rounded-2xl overflow-hidden"
              style={{
                background: "rgba(8, 12, 24, 0.9)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div className="p-4 space-y-1">
                {navItems.map((item, index) => {
                  const isActive = activeSection === item.sectionId;

                  return (
                    <motion.a
                      key={item.sectionId}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors relative"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
                        background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      }}
                    >
                      {isActive && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                          style={{
                            background: "linear-gradient(180deg, #3B82F6, #7C3AED)",
                          }}
                        />
                      )}
                      {item.label}
                    </motion.a>
                  );
                })}

                {/* Mobile CTA */}
                <motion.button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleCallClick();
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.05 + 0.1, duration: 0.2 }}
                  className="flex items-center justify-center gap-2 mt-4 px-5 py-3.5 rounded-xl text-base font-semibold text-white relative overflow-hidden w-full cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #7C3AED)",
                    boxShadow: "0 4px 16px rgba(124, 58, 237, 0.25)",
                  }}
                >
                  <span>{navigation.bookCall}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
