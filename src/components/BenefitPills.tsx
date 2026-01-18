"use client";

import { motion } from "framer-motion";

interface BenefitPillsProps {
  features: string[];
  className?: string;
}

// Small check dot icon - very subtle
function CheckDot() {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.8) 0%, rgba(139, 92, 246, 0.6) 100%)",
        boxShadow: "0 0 4px rgba(124, 58, 237, 0.4)",
      }}
    />
  );
}

export default function BenefitPills({ features, className = "" }: BenefitPillsProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.4,
            delay: 0.3 + index * 0.08,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          whileHover={{
            y: -1,
            transition: { duration: 0.2 },
          }}
          className="group relative"
        >
          {/* Hover glow effect */}
          <div
            className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-md"
            style={{
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)",
            }}
          />

          {/* Pill container */}
          <div
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-200"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
            }}
          >
            {/* Inner highlight on hover */}
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
              }}
            />

            <CheckDot />
            <span className="relative text-xs font-medium text-foreground/70 group-hover:text-foreground/85 transition-colors duration-200 whitespace-nowrap">
              {feature}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
