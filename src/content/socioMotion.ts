// Animation configuration extracted from the reference site
// Easing curves and timing values

export const easing = {
  // Standard easing from reference: [0.25, 0.1, 0.25, 1]
  standard: [0.25, 0.1, 0.25, 1] as const,
  // Smooth easing: [0.4, 0, 0.2, 1]
  smooth: [0.4, 0, 0.2, 1] as const,
  // Spring-like easing for buttons
  spring: { type: "spring", stiffness: 400, damping: 30 } as const,
  // Bounce for interactive elements
  bounce: { type: "spring", stiffness: 300, damping: 20 } as const,
};

export const duration = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
  slowest: 1.0,
  // Flip words duration
  flipWord: 3, // seconds per word
};

export const delay = {
  stagger: 0.1,
  staggerSlow: 0.15,
  initial: 0.1,
  cascade: 0.05,
};

// Navbar animations
export const navbarMotion = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, ease: easing.smooth },
};

// Hero section animations
export const heroMotion = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: easing.smooth },
  },
  headline: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: easing.standard, delay: 0.1 },
  },
  description: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: easing.standard, delay: 0.3 },
  },
  buttons: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: easing.standard, delay: 0.5 },
  },
};

// Flip words animation
export const flipWordsMotion = {
  enter: {
    initial: { opacity: 0, y: 20, rotateX: -90 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    exit: { opacity: 0, y: -20, rotateX: 90 },
    transition: { duration: 0.5, ease: easing.standard },
  },
};

// Feature cards animations
export const featureCardMotion = {
  container: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
  card: {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: easing.standard },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.3, ease: easing.smooth },
  },
};

// Services section animations
export const servicesMotion = {
  section: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6 },
  },
  content: {
    initial: { opacity: 0, x: -30 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: easing.standard },
  },
  image: {
    initial: { opacity: 0, x: 30 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: easing.standard, delay: 0.2 },
  },
};

// FAQ accordion animations
export const faqMotion = {
  item: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, ease: easing.standard },
  },
  content: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.3, ease: easing.smooth },
  },
  icon: {
    open: { rotate: 45 },
    closed: { rotate: 0 },
    transition: { duration: 0.3, ease: easing.smooth },
  },
};

// CTA section animations
export const ctaMotion = {
  container: {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: easing.standard },
  },
  features: {
    initial: { opacity: 0, x: -20 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, ease: easing.standard },
  },
};

// Button hover/tap states
export const buttonMotion = {
  hover: { scale: 1.02, filter: "hue-rotate(15deg) brightness(1.1)" },
  tap: { scale: 0.98 },
  transition: { duration: 0.2, ease: easing.smooth },
};

// Glass card tilt effect (from module 9674 TiltCard)
export const tiltMotion = {
  // rotationFactor: increased for stronger effect
  rotationFactor: 25,
  // perspective: lower value = more dramatic 3D effect
  perspective: 800,
  // Spring options for smooth tilt return
  springOptions: { stiffness: 200, damping: 20 },
};

// Interactive feature card drag config (from reference bundles)
export const interactiveCardMotion = {
  // dragElastic: r = .35 from reference framer-motion bundle
  dragElastic: 0.35,
  // Spring for snap-back: stiffness: 500, damping: 25
  dragSpring: {
    type: "spring" as const,
    stiffness: 500,
    damping: 25,
    mass: 1,
  },
  // Tilt spring (more responsive for mouse follow)
  tiltSpring: {
    type: "spring" as const,
    stiffness: 200,
    damping: 20,
  },
  // Card hover scale - increased
  hoverScale: 1.04,
  // Active/dragging scale
  activeScale: 1.08,
  // Glow color from reference: #ac9cfc
  glowColor: "#ac9cfc",
  // Border glow intensities - increased
  glowIntensity: {
    idle: 0.15,
    hover: 0.7,
    active: 1.0,
  },
};

// Scroll reveal for sections
export const scrollReveal = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: easing.standard },
};

// Stagger children animation
export const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1, delayChildren: 0.1 },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: easing.standard },
};
