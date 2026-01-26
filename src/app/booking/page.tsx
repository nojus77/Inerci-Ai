"use client";

import { useEffect } from "react";
import Link from "next/link";
import Cal, { getCalApi } from "@calcom/embed-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

// Cal.com configuration
const CAL_LINK = "inerci-ai/nemokamas-automatizacijos-auditas";
const CAL_NAMESPACE = "booking-page";
const CAL_ORIGIN = "https://app.cal.eu";

export default function BookingPage() {
  // Initialize Cal API with UI config
  useEffect(() => {
    (async function initCal() {
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
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="md" animate={false} />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Grįžti
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-12 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Title section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Užsiregistruok nemokamam{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  background: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #6366f1 100%)",
                  WebkitBackgroundClip: "text",
                }}
              >
                AI auditui
              </span>
            </h1>
            <p className="text-foreground/60 text-base md:text-lg max-w-2xl mx-auto">
              Per 15 min. parodysim, kur dirbtinis intelektas gali sutaupyti laiką ir pinigus tavo versle.
            </p>
          </motion.div>

          {/* Cal.com embed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="relative rounded-2xl overflow-hidden border border-white/10"
            style={{
              background: "rgba(10, 10, 20, 0.6)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 60px rgba(124, 58, 237, 0.08)",
            }}
          >
            <div style={{ height: "clamp(550px, calc(100vh - 220px), 700px)" }}>
              <Cal
                namespace={CAL_NAMESPACE}
                calLink={CAL_LINK}
                calOrigin={CAL_ORIGIN}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
