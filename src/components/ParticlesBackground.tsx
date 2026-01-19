"use client";

/**
 * Canvas-based particle background
 * - Renders drifting dots with mouse parallax
 * - Respects prefers-reduced-motion
 * - IntersectionObserver to pause when not visible (saves CPU)
 * - Full viewport coverage with proper DPR handling
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  phase: number;
}

interface ParticlesBackgroundProps {
  particleCount?: number;
  baseColor?: [number, number, number];
  minOpacity?: number;
  debug?: boolean;
}
export default function ParticlesBackground({
  particleCount = 100,
  baseColor = [150, 130, 230],
  minOpacity = 0.15,
  debug = false,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInView, setIsInView] = useState(true);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // IntersectionObserver to pause animation when not visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.01 } // Trigger when even 1% is visible
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Initialize particles distributed across viewport
  const initParticles = useCallback(
    (width: number, height: number) => {
      // Scale count based on screen size (mobile gets fewer)
      const scaledCount = Math.min(
        particleCount,
        Math.max(40, Math.floor((width * height) / 15000))
      );

      const particles: Particle[] = [];
      for (let i = 0; i < scaledCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          radius: Math.random() * 2 + 1, // 1-3px
          opacity: Math.random() * 0.35 + 0.25, // 0.25-0.6
          phase: Math.random() * Math.PI * 2,
        });
      }
      particlesRef.current = particles;
    },
    [particleCount]
  );

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Main animation loop - pauses when not in view
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Resize handler - ensures canvas matches viewport exactly
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      // Set canvas size accounting for device pixel ratio
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Scale context for crisp rendering
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Reinitialize particles if needed
      if (particlesRef.current.length === 0) {
        initParticles(width, height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    if (particlesRef.current.length === 0) {
      initParticles(width, height);
    }

    let time = 0;
    let isRunning = true;

    const draw = () => {
      if (!isRunning) return;

      // Skip animation frame if not in view (but still schedule next check)
      if (!isInView) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Debug: draw background to confirm canvas is rendering
      if (debug) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.03)";
        ctx.fillRect(0, 0, width, height);
      }

      // Mouse parallax offset
      const parallaxX = (mouseRef.current.x - 0.5) * 20;
      const parallaxY = (mouseRef.current.y - 0.5) * 20;

      time += 0.016;

      for (const particle of particlesRef.current) {
        // Update position (skip if reduced motion)
        if (!prefersReducedMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around edges
          if (particle.x < -20) particle.x = width + 20;
          if (particle.x > width + 20) particle.x = -20;
          if (particle.y < -20) particle.y = height + 20;
          if (particle.y > height + 20) particle.y = -20;
        }

        // Apply parallax based on particle size (larger = more parallax)
        const drawX = particle.x + parallaxX * (particle.radius / 3);
        const drawY = particle.y + parallaxY * (particle.radius / 3);

        // Subtle breathing effect
        const breathe = prefersReducedMotion
          ? 1
          : 0.85 + 0.15 * Math.sin(time * 0.8 + particle.phase);

        // Calculate final opacity with minimum clamp
        const finalOpacity = Math.max(minOpacity, particle.opacity * breathe);

        // Debug: boost opacity to confirm rendering
        const renderOpacity = debug ? Math.min(1, finalOpacity * 3) : finalOpacity;

        // Draw particle
        ctx.beginPath();
        ctx.arc(drawX, drawY, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${renderOpacity})`;
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    // Start animation
    if (prefersReducedMotion) {
      draw(); // Draw once for reduced motion
    } else {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      isRunning = false;
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles, prefersReducedMotion, baseColor, minOpacity, debug, isInView]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          // Debug: show canvas border
          ...(debug && { border: "3px solid lime" }),
        }}
        aria-hidden="true"
      />
    </div>
  );
}
