"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faq } from "@/content/copy.lt";
import { faqMotion, scrollReveal, easing } from "@/content/socioMotion";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="mx-auto max-w-4xl px-6">
        {/* FAQ Items */}
        <div className="space-y-4">
          {faq.questions.map((item, index) => (
            <motion.div
              key={index}
              initial={faqMotion.item.initial}
              whileInView={faqMotion.item.whileInView}
              viewport={faqMotion.item.viewport}
              transition={{
                ...faqMotion.item.transition,
                delay: index * 0.1,
              }}
              className="glass-card overflow-hidden"
            >
              {/* Question Button */}
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left group"
              >
                <span className="font-semibold text-foreground pr-4 group-hover:text-primary transition-colors duration-200">
                  {item.question}
                </span>
                <motion.div
                  animate={openIndex === index ? faqMotion.icon.open : faqMotion.icon.closed}
                  transition={faqMotion.icon.transition}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 text-foreground/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </motion.div>
              </button>

              {/* Answer */}
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: easing.smooth }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                      <div className="h-px bg-foreground/10 mb-4" />
                      <p className="text-foreground/70 text-sm md:text-base leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
