"use client";

import { motion } from "framer-motion";
import { features } from "@/content/copy.lt";
import { scrollReveal } from "@/content/socioMotion";
import SicioFeatureCards from "./SicioFeatureCards";

export default function Features() {
  return (
    <section id="features" className="pt-0 pb-12 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <motion.div
          {...scrollReveal}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            {features.title}
            <br />
            <span className="text-foreground/50">{features.subtitle}</span>
          </h2>
        </motion.div>

        {/* Sicio-style Feature Cards */}
        <SicioFeatureCards />
      </div>
    </section>
  );
}
