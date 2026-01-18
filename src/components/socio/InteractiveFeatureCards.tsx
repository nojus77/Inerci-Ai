"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useDragControls,
} from "framer-motion";
import { features } from "@/content/copy.lt";
import { interactiveCardMotion, tiltMotion, easing } from "@/content/socioMotion";

// Feature icons matching socio reference
const featureIcons: Record<string, React.ReactNode> = {
  custom: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  secure: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
    </svg>
  ),
  fast: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  transparent: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  scalable: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

// Individual tilt card with drag support
function TiltCard({
  children,
  className,
  isActive,
  onActivate,
  cardKey,
}: {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  onActivate: () => void;
  cardKey: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  // Motion values for tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring-based rotation for smooth tilt
  const springConfig = interactiveCardMotion.tiltSpring;
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [tiltMotion.rotationFactor, -tiltMotion.rotationFactor]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-tiltMotion.rotationFactor, tiltMotion.rotationFactor]),
    springConfig
  );

  // Glow intensity based on state
  const glowOpacity = isDragging
    ? interactiveCardMotion.glowIntensity.active
    : isActive
    ? interactiveCardMotion.glowIntensity.hover
    : interactiveCardMotion.glowIntensity.idle;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || isDragging) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Drag handle - only the top bar area initiates drag
  const handleDragHandlePointerDown = (e: React.PointerEvent) => {
    onActivate();
    dragControls.start(e);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        transformStyle: "preserve-3d",
        perspective: tiltMotion.perspective,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={onActivate}
      // Drag configuration
      drag
      dragControls={dragControls}
      dragListener={false} // Only drag from handle
      dragElastic={interactiveCardMotion.dragElastic}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      whileDrag={{ scale: interactiveCardMotion.activeScale, zIndex: 50 }}
      whileHover={{ scale: isDragging ? interactiveCardMotion.activeScale : interactiveCardMotion.hoverScale }}
      transition={interactiveCardMotion.dragSpring}
    >
      <motion.div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glow border effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 30px ${interactiveCardMotion.glowColor}`,
            opacity: glowOpacity,
          }}
          animate={{ opacity: glowOpacity }}
          transition={{ duration: 0.3 }}
        />

        {/* Card border */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: `1px solid ${interactiveCardMotion.glowColor}`,
            opacity: glowOpacity + 0.2,
          }}
        />

        {/* Card content */}
        <div className="relative z-10 h-full bg-background/80 backdrop-blur-xl rounded-2xl border border-white/10">
          {/* Drag handle zone - top strip */}
          <div
            className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing z-20"
            onPointerDown={handleDragHandlePointerDown}
          >
            {/* Visual indicator for drag zone */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/20" />
          </div>

          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main component - Grid of interactive cards
export default function InteractiveFeatureCards() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const topCards = [
    { key: "custom", data: features.cards.custom, icon: featureIcons.custom },
    { key: "secure", data: features.cards.secure, icon: featureIcons.secure },
    { key: "fast", data: features.cards.fast, icon: featureIcons.fast },
  ];

  const bottomCards = [
    { key: "transparent", data: features.cards.transparent, icon: featureIcons.transparent },
    { key: "scalable", data: features.cards.scalable, icon: featureIcons.scalable },
  ];

  return (
    <div className="w-full">
      {/* Top row - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {topCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              ease: easing.standard,
              delay: index * 0.1,
            }}
          >
            <TiltCard
              cardKey={card.key}
              isActive={activeCard === card.key}
              onActivate={() => setActiveCard(card.key)}
              className="h-full min-h-[280px]"
            >
              <div className="p-6 pt-14 h-full flex flex-col">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#ac9cfc]/20 flex items-center justify-center text-[#ac9cfc] mb-4">
                  {card.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {card.key === "custom" ? "100% Custom" : (card.data as { title?: string }).title}
                </h3>

                {/* Description */}
                <p className="text-foreground/60 text-sm leading-relaxed flex-grow">
                  {card.key === "fast"
                    ? `${(card.data as { descriptionLine1?: string }).descriptionLine1} ${(card.data as { bigBold?: string }).bigBold} ${(card.data as { descriptionLine2?: string }).descriptionLine2}`
                    : (card.data as { description?: string }).description}
                </p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* Bottom row - 2 cards centered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {bottomCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              ease: easing.standard,
              delay: 0.3 + index * 0.1,
            }}
          >
            <TiltCard
              cardKey={card.key}
              isActive={activeCard === card.key}
              onActivate={() => setActiveCard(card.key)}
              className="h-full min-h-[280px]"
            >
              <div className="p-6 pt-14 h-full flex flex-col">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-[#ac9cfc]/20 flex items-center justify-center text-[#ac9cfc] mb-4">
                  {card.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {card.key === "scalable"
                    ? (card.data as { titleLine1?: string }).titleLine1
                    : (card.data as { title?: string }).title}
                </h3>

                {/* Description */}
                <p className="text-foreground/60 text-sm leading-relaxed flex-grow">
                  {card.data.description}
                </p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
