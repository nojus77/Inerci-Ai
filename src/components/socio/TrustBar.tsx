"use client";

import { motion } from "framer-motion";
import { trustBar } from "@/content/copy.lt";
import { scrollReveal, staggerContainer, staggerItem } from "@/content/socioMotion";

export default function TrustBar() {
  return (
    <motion.section
      {...scrollReveal}
      className="py-12 md:py-16 border-y border-white/10"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm text-foreground/50 mb-8"
        >
          {trustBar.title}
        </motion.p>

        <motion.div
          {...staggerContainer}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
        >
          {trustBar.items.map((logo, index) => (
            <motion.div
              key={logo.name}
              {...staggerItem}
              transition={{ ...staggerItem.transition, delay: index * 0.1 }}
              className="flex items-center gap-2 text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                {logo.icon === "shield" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                {logo.icon === "lock" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {logo.icon === "bolt" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {logo.icon === "check" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{logo.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
