"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Cal, { getCalApi } from "@calcom/embed-react";
import { cta } from "@/content/copy.lt";
import { ctaMotion, easing } from "@/content/socioMotion";
import BenefitPills from "@/components/BenefitPills";

// Cal.com configuration
const CAL_LINK = "inerci-ai/nemokamas-automatizacijos-auditas";
const CAL_NAMESPACE = "cta-inline";
const CAL_ORIGIN = "https://app.cal.eu";

export default function CTA() {
  // Initialize Cal API with UI config - no layout override, use default booking flow
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
    })();
  }, []);

  return (
    <section id="cta" className="pt-12 pb-8 md:pt-16 md:pb-12">
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <motion.div
          {...ctaMotion.container}
          className="relative glass-card p-5 md:p-6 text-center overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: easing.standard }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-1"
            >
              {cta.title}
            </motion.h2>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-primary mb-4 relative inline-block overflow-hidden"
            >
              <motion.span
                animate={{
                  opacity: [1, 0.6, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                {cta.subtitle}
                {/* Shine effect */}
                <motion.span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                  }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 2,
                  }}
                />
              </motion.span>
            </motion.h3>

            {/* Features as premium micro-badges */}
            <BenefitPills features={cta.features} className="mb-5" />

            {/* Inline Cal.com Embed - clean 3-column booking layout */}
            {/* Mobile: no height constraint, content flows naturally in page scroll */}
            {/* Desktop: fixed height for contained layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: easing.standard, delay: 0.5 }}
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
