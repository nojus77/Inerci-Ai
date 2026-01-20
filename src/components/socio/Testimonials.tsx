"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { testimonials as testimonialsData } from "@/content/copy.lt";
import { scrollReveal, staggerContainer, staggerItem } from "@/content/socioMotion";

export default function Testimonials() {
  return (
    <section className="py-20 md:py-32 bg-foreground/[0.02]">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <motion.div {...scrollReveal} className="text-center mb-16 md:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            {testimonialsData.sectionLabel}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            {testimonialsData.sectionTitle}
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          {...staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonialsData.items.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={staggerItem.initial}
              whileInView={staggerItem.whileInView}
              viewport={{ once: true }}
              transition={{
                ...staggerItem.transition,
                delay: index * 0.15,
              }}
              whileHover={{ y: -5 }}
              className="glass-card p-6 md:p-8 relative group flex flex-col h-full"
            >
              {/* Quote mark */}
              <div className="absolute -top-3 -left-2 text-6xl text-primary/20 font-serif leading-none">
                &ldquo;
              </div>

              {/* Quote */}
              <p className="text-foreground/80 text-sm md:text-base leading-relaxed mb-6 relative z-10 flex-grow whitespace-pre-line">
                {testimonial.quote}
              </p>

              {/* Author - pushed to bottom */}
              <div className="flex items-center gap-3 mt-auto">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={`${testimonial.avatar}?v=2`}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-foreground/50">{testimonial.role}</p>
                </div>
              </div>

              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
