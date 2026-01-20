"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Cal, { getCalApi } from "@calcom/embed-react";
import { cta } from "@/content/copy.lt";
import { ctaMotion, easing } from "@/content/socioMotion";

// Cal.com configuration
const CAL_LINK = "inerci-ai/nemokamas-automatizacijos-auditas";
const CAL_NAMESPACE = "cta-inline";
const CAL_ORIGIN = "https://app.cal.eu";

// Custom mobile header content
const mobileBookingHeader = {
  eyebrow: "NEMOKAMA",
  title: "Automatizacijos auditas",
  description: "Per 30 min. greitai parodysim, kur AI gali sutaupyti laiką ir pinigus tavo versle.",
  meta: [
    { icon: "clock", text: "30 min" },
    { icon: "video", text: "Google Meet" },
    { icon: "globe", text: "Europe/Vilnius" },
  ],
};

export default function CTA() {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for Cal config
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize Cal API with UI config
  // Mobile: hide event details - we show our own custom header
  // Desktop: show full details
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
        hideEventTypeDetails: isMobile,
      });
    })();
  }, [isMobile]);

  return (
    <section id="cta" className="pt-12 pb-8 md:pt-16 md:pb-12">
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <motion.div
          {...ctaMotion.container}
          className="relative glass-card p-4 md:p-6 text-center overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10">
            {/* Desktop: Original CTA header */}
            <div className="hidden md:block">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: easing.standard }}
                className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-1"
              >
                {cta.title}
              </motion.h2>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl lg:text-4xl font-bold tracking-tight text-primary mb-4 relative inline-block overflow-hidden"
              >
                <motion.span
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  {cta.subtitle}
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                  />
                </motion.span>
              </motion.h3>
            </div>

            {/* Mobile: Custom compact booking header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: easing.standard }}
              className="md:hidden text-left mb-4"
            >
              {/* Eyebrow */}
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider text-primary bg-primary/15 rounded-full mb-2">
                {mobileBookingHeader.eyebrow}
              </span>

              {/* Title */}
              <h2 className="text-lg font-bold text-foreground mb-1.5">
                {mobileBookingHeader.title}
              </h2>

              {/* Description */}
              <p className="text-xs text-foreground/60 leading-relaxed mb-3">
                {mobileBookingHeader.description}
              </p>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-[10px] text-foreground/50">
                {mobileBookingHeader.meta.map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {item.icon === "clock" && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    )}
                    {item.icon === "video" && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {item.icon === "globe" && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                    )}
                    {item.text}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Cal.com Embed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: easing.standard, delay: 0.3 }}
              className="w-full rounded-2xl overflow-hidden cal-embed-wrapper"
            >
              <Cal
                namespace={CAL_NAMESPACE}
                calLink={CAL_LINK}
                calOrigin={CAL_ORIGIN}
                style={{ width: "100%", height: "100%" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
