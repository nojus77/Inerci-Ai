"use client";

/**
 * Exit-Intent Modal
 *
 * Shows a consultation offer when desktop users move to leave the page.
 * Easy to remove: just delete this component import from layout.tsx
 *
 * Rules:
 * - Desktop only (pointer: fine, width >= 1024)
 * - Once per session (sessionStorage)
 * - Not if user clicked main CTA already
 * - Not within first 20s of page load
 * - Triggers when mouse exits toward top (y <= 8)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Lazy load Cal.com embed only when modal opens
const Cal = dynamic(() => import("@calcom/embed-react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

// Session storage keys
const SESSION_KEY_SHOWN = "inerci_exit_modal_shown";
const SESSION_KEY_CTA_CLICKED = "inerci_cta_clicked";

// Cal.com config (same as main modal)
const CAL_LINK = "inerci-ai/nemokamas-automatizacijos-auditas";
const CAL_NAMESPACE = "exit-intent-modal";
const CAL_ORIGIN = "https://app.cal.eu";

interface ExitIntentModalProps {
  enabled?: boolean;
}

export default function ExitIntentModal({ enabled = true }: ExitIntentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [calLoaded, setCalLoaded] = useState(false);
  const pageLoadTime = useRef<number>(0);
  const hasTriggered = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Don't show on admin pages
  const isAdminPage = pathname?.startsWith("/admin");

  // Check if we should even attempt to show the modal
  const shouldAttemptTrigger = useCallback(() => {
    if (typeof window === "undefined") return false;

    // Never show on admin pages
    if (isAdminPage) return false;

    // Desktop only: fine pointer and width >= 1024
    const isDesktop =
      window.matchMedia("(pointer: fine)").matches &&
      window.innerWidth >= 1024;
    if (!isDesktop) return false;

    // Already shown this session
    if (sessionStorage.getItem(SESSION_KEY_SHOWN) === "1") return false;

    // User already clicked main CTA
    if (sessionStorage.getItem(SESSION_KEY_CTA_CLICKED) === "1") return false;

    // Within first 20 seconds
    if (Date.now() - pageLoadTime.current < 20000) return false;

    return true;
  }, [isAdminPage]);

  // Handle mouse leave toward top
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (hasTriggered.current) return;
    if (!shouldAttemptTrigger()) return;

    // Only trigger if leaving toward top edge
    if (e.clientY > 8) return;

    // Trigger!
    hasTriggered.current = true;
    sessionStorage.setItem(SESSION_KEY_SHOWN, "1");
    setIsOpen(true);

    if (process.env.NODE_ENV === "development") {
      console.log("[ExitIntentModal] Triggered - mouse left toward top");
    }
  }, [shouldAttemptTrigger]);

  // Setup event listeners
  useEffect(() => {
    if (!enabled) return;

    pageLoadTime.current = Date.now();
    setShouldRender(true);

    // Add listener to document
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, handleMouseLeave]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Focus the modal for accessibility
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Initialize Cal API when modal opens
  useEffect(() => {
    if (!isOpen || calLoaded) return;

    const initCal = async () => {
      try {
        const { getCalApi } = await import("@calcom/embed-react");
        const cal = await getCalApi({ namespace: CAL_NAMESPACE });
        cal("ui", {
          theme: "dark",
          styles: {
            branding: {
              brandColor: "#7C3AED",
            },
          },
          hideEventTypeDetails: false,
        });
        setCalLoaded(true);
      } catch (err) {
        console.error("[ExitIntentModal] Failed to init Cal API:", err);
      }
    };

    initCal();
  }, [isOpen, calLoaded]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  // Show booking calendar view
  const [showBooking, setShowBooking] = useState(false);

  const handleBookClick = useCallback(() => {
    setShowBooking(true);
    // Also mark CTA as clicked so main exit intent won't show again
    sessionStorage.setItem(SESSION_KEY_CTA_CLICKED, "1");
  }, []);

  // Don't render anything if not enabled, not mounted, or on admin pages
  if (!enabled || !shouldRender || isAdminPage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Single backdrop layer with blur */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-[520px] rounded-2xl overflow-hidden shadow-2xl outline-none"
            style={{
              background: "linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.98) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 25px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.1)",
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              aria-label="Uždaryti"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!showBooking ? (
              /* Initial offer view */
              <div className="p-8 md:p-10">
                {/* Decorative gradient orb */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }}
                />

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                    Nemokama konsultacija
                  </span>
                </div>

                {/* Headline */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                  Nepaleisk{" "}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-violet-200 to-cyan-200 whitespace-nowrap"
                    style={{ filter: "drop-shadow(0 0 8px rgba(167, 139, 250, 0.3))" }}
                  >
                    nemokamos
                  </span>{" "}
                  konsultacijos
                </h2>

                {/* Subtext */}
                <p className="text-white/60 text-sm md:text-base mb-6 leading-relaxed">
                  Per 15 min parodysim, kur{" "}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-violet-200 to-cyan-200 whitespace-nowrap"
                    style={{ filter: "drop-shadow(0 0 8px rgba(167, 139, 250, 0.3))" }}
                  >
                    dirbtinis intelektas
                  </span>{" "}
                  gali{" "}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-violet-200 to-cyan-200 whitespace-nowrap"
                    style={{ filter: "drop-shadow(0 0 8px rgba(167, 139, 250, 0.3))" }}
                  >
                    sutaupyti laiką ir pinigus
                  </span>{" "}
                  tavo versle.
                </p>

                {/* Bullet points */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                      ⚡
                    </span>
                    <span className="text-white/80 text-sm">Greitas procesų auditas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                      💰
                    </span>
                    <span className="text-white/80 text-sm">Aiškus sutaupymo apskaičiavimas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                      ✓
                    </span>
                    <span
                      className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 font-semibold text-sm whitespace-nowrap"
                      style={{ filter: "drop-shadow(0 0 12px rgba(167, 139, 250, 0.5))" }}
                    >
                      0 įsipareigojimų
                    </span>
                  </li>
                </ul>

                {/* CTA buttons */}
                <div className="flex flex-col gap-3">
                  {/* Primary CTA */}
                  <motion.button
                    onClick={handleBookClick}
                    className="relative w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                    }}
                  >
                    {/* Hover shimmer */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                      }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Pabandyti konsultaciją
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </motion.button>

                  {/* Secondary dismiss */}
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Kitą kartą
                  </button>
                </div>
              </div>
            ) : (
              /* Booking calendar view */
              <div className="w-full" style={{ height: "clamp(520px, calc(100vh - 150px), 680px)" }}>
                <Cal
                  namespace={CAL_NAMESPACE}
                  calLink={CAL_LINK}
                  calOrigin={CAL_ORIGIN}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export function to mark CTA as clicked (call this from other CTAs)
export function markCtaClicked() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY_CTA_CLICKED, "1");
  }
}
