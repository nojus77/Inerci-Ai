"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { motion, AnimatePresence } from "framer-motion";

// Cal.com EU region origin
const CAL_ORIGIN = "https://app.cal.eu";

interface CalModalProps {
  open: boolean;
  onClose: () => void;
  calLink: string;
  namespace: string;
}

export default function CalModal({ open, onClose, calLink, namespace }: CalModalProps) {
  // Initialize Cal API with UI config and booking event listener
  useEffect(() => {
    if (!open) return;

    (async function initCal() {
      const cal = await getCalApi({ namespace });
      cal("ui", {
        theme: "dark",
        styles: {
          branding: {
            brandColor: "#7C3AED",
          },
        },
        hideEventTypeDetails: false,
      });

      // Track successful bookings in Google Analytics
      cal("on", {
        action: "bookingSuccessful",
        callback: () => {
          if (typeof window !== "undefined" && typeof window.gtag === "function") {
            window.gtag("event", "booking_completed", {
              event_category: "conversion",
              event_label: "cal_booking",
            });
          }
        },
      });
    })();
  }, [open, namespace]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2 md:p-4 pt-16 md:pt-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal container - wider for 3-column layout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-[1100px] bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              height: "clamp(500px, calc(100vh - 80px), 760px)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Cal.com embed - EU region, default booking layout */}
            <div className="w-full h-full">
              <Cal
                namespace={namespace}
                calLink={calLink}
                calOrigin={CAL_ORIGIN}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
