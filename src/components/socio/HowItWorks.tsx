"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { services } from "@/content/copy.lt";
import { servicesMotion, scrollReveal, easing } from "@/content/socioMotion";

const serviceKeys = ["voiceAgent", "platform", "consulting"] as const;

const serviceImages: Record<string, string> = {
  voiceAgent: "/socio/ai-consulting.webp",
  platform: "/socio/platform.webp",
  consulting: "/socio/ai-consulting.webp",
};

export default function HowItWorks() {
  return (
    <section id="services" className="py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <motion.div {...scrollReveal} className="text-center mb-16 md:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            Mūsų paslaugos
          </span>
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
        <div className="space-y-24 md:space-y-32">
          {serviceKeys.map((key, index) => {
            const service = services[key];
            const isReversed = index % 2 === 1;

            return (
              <motion.div
                key={key}
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
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {service.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Small print for platform */}
                  {"smallPrint" in service && service.smallPrint && (
                    <p className="text-xs text-foreground/50 italic mb-6">
                      {service.smallPrint}
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
                </motion.div>

                {/* Image */}
                <motion.div
                  {...servicesMotion.image}
                  className={`relative ${isReversed ? "lg:order-1" : "lg:order-2"}`}
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden glass-card">
                    <Image
                      src={serviceImages[key]}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/10" />
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
