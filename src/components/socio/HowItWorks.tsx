"use client";

import { motion } from "framer-motion";
import { services, hero } from "@/content/copy.lt";
import { servicesMotion, scrollReveal, easing, buttonMotion } from "@/content/socioMotion";
import { useCalModal } from "@/components/cal/CalContext";
import Step1Visual from "@/components/socio/Step1Visual";
import Step1AuditVisual from "@/components/socio/Step1AuditVisual";
import Step2Visual from "@/components/socio/Step2Visual";
import Step3DeployVisual from "@/components/socio/Step3DeployVisual";
import ScrollConnector from "@/components/socio/ScrollConnector";

const serviceKeys = ["voiceAgent", "platform", "consulting"] as const;

export default function HowItWorks() {
  const { openCalModal } = useCalModal();

  return (
    <section id="services" className="py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <motion.div {...scrollReveal} className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Kaip{" "}
            <span className="relative inline-block">
              <span
                className="relative z-10"
                style={{
                  background: "linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #fff 100%)",
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              >
                Inerci
              </span>
              {/* Subtle glow behind */}
              <motion.span
                className="absolute inset-0 blur-lg opacity-40 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </span>{" "}
            padės sutaupyti
          </h2>
        </motion.div>

        {/* Services */}
        <div className="space-y-0">
          {serviceKeys.map((key, index) => {
            const service = services[key];
            const isReversed = index % 2 === 1;
            const isLast = index === serviceKeys.length - 1;

            return (
              <div key={key}>
                {/* Connector from previous section */}
                {index > 0 && (
                  <ScrollConnector isReversed={index % 2 === 0} />
                )}

                <motion.div
                {...servicesMotion.section}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                  isReversed ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <motion.div
                  {...servicesMotion.content}
                  className={isReversed ? "lg:order-2" : "lg:order-1"}
                >
                  {/* Step number */}
                  <span
                    className="text-6xl md:text-7xl font-bold mb-4 block text-center md:text-left"
                    style={{
                      background: "linear-gradient(180deg, rgba(139, 92, 246, 0.6) 0%, rgba(139, 92, 246, 0.1) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {service.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed mb-10">
                    {"descriptionLine1" in service ? (
                      <>
                        {(service as { descriptionLine1: string }).descriptionLine1}
                        <br />
                        {(service as { descriptionLine2: string }).descriptionLine2}
                      </>
                    ) : (
                      (service as { description: string }).description
                    )}
                  </p>

                  {/* Small print for platform */}
                  {"smallPrint" in service && (service as { smallPrint?: string }).smallPrint && (
                    <p className="text-xs text-foreground/50 italic mb-6">
                      {(service as { smallPrint: string }).smallPrint}
                    </p>
                  )}

                  {/* Features list */}
                  <ul className="space-y-3">
                    {service.features.map((feature, featureIndex) => (
                      <motion.li
                        key={feature.text}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 0.3 + featureIndex * 0.1,
                          duration: 0.4,
                          ease: easing.standard,
                        }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3 h-3 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-foreground/80 text-sm">
                          {feature.text}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button for consulting (3rd section) */}
                  {key === "consulting" && (
                    <motion.button
                      onClick={openCalModal}
                      className="mt-6 relative inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-primary-foreground overflow-hidden group cursor-pointer"
                      whileHover={buttonMotion.hover}
                      whileTap={buttonMotion.tap}
                      transition={buttonMotion.transition}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-[#ac9cfc] to-primary transition-opacity duration-300 group-hover:opacity-0" />
                      <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center gap-2">
                        {hero.bookCall}
                        <svg
                          className="w-4 h-4 transition-transform group-hover:translate-x-1"
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
                  )}
                </motion.div>

                {/* Image or Custom Visual */}
                <motion.div
                  {...servicesMotion.image}
                  className={`relative ${isReversed ? "lg:order-1" : "lg:order-2"} ${key === "consulting" ? "order-first lg:order-2" : ""}`}
                >
                  {key === "voiceAgent" ? (
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                      <Step1Visual />
                    </div>
                  ) : key === "platform" ? (
                    /* Step 2: Drag-to-scrub Before/After prototype preview */
                    <Step2Visual />
                  ) : (
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                      <Step1AuditVisual />
                    </div>
                  )}

                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
                </motion.div>
              </motion.div>

              {/* Spacing after each section */}
              <div className="h-24 md:h-32" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
